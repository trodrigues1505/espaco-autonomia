// supabase/functions/anthropic-proxy/index.ts
// Proxy para a API da Groq (o nome "anthropic" é histórico: o formato de resposta imita o da Anthropic,
// que é o que jnana.js / asana.js / adhyayana.js esperam).
//
// Deploy:  supabase functions deploy anthropic-proxy --no-verify-jwt
//   (--no-verify-jwt porque o preflight CORS não leva token; a autenticação é feita AQUI DENTRO.
//    Sem isso a chave anônima pública do app passaria pelo gateway.)
//
// Secrets:  GROQ_API_KEY (obrigatório) · ALLOWED_ORIGINS (opcional, separados por vírgula)
//
// Segurança: só ADMIN autenticado; tamanho e quantidade de mensagens limitados; max_tokens limitado;
// limite de requisições por usuário GLOBAL (RPC ia_registrar_uso; rode supabase/07_ia_limite.sql); timeout; erros sem vazar detalhes.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const MODELO = 'openai/gpt-oss-120b'
const LIMITES = {
  maxTokens: 4000,                 // as páginas usam no máximo 3000
  mensagens: 6,
  charsPorMensagem: 60_000,
  charsSystem: 8_000,
  corpoBytes: 400_000,
  porJanela: 20,                   // limite LOCAL (só usado se a RPC do banco não existir)...
  janelaMs: 10 * 60_000,           // ...a cada 10 minutos, por instância da função
}

const ORIGENS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://trodrigues1505.github.io')
  .split(',').map(s => s.trim()).filter(Boolean)

function cors(req: Request) {
  const origem = req.headers.get('Origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ORIGENS.includes(origem) ? origem : ORIGENS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}
function json(req: Request, corpo: unknown, status = 200, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(corpo), {
    status, headers: { 'Content-Type': 'application/json', ...cors(req), ...extra },
  })
}

const usos = new Map<string, number[]>()
function excedeuLimite(uid: string): boolean {
  const agora = Date.now()
  const recentes = (usos.get(uid) ?? []).filter(t => agora - t < LIMITES.janelaMs)
  if (recentes.length >= LIMITES.porJanela) { usos.set(uid, recentes); return true }
  recentes.push(agora); usos.set(uid, recentes)
  return false
}

type Msg = { role: 'user' | 'assistant'; content: string }
function validar(corpo: unknown): { ok: true; system: string; messages: Msg[]; maxTokens: number } | { ok: false; erro: string } {
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) return { ok: false, erro: 'Corpo inválido' }
  const c = corpo as Record<string, unknown>
  const system = c.system ?? ''
  if (typeof system !== 'string' || system.length > LIMITES.charsSystem) return { ok: false, erro: 'system inválido ou grande demais' }
  if (!Array.isArray(c.messages) || c.messages.length < 1 || c.messages.length > LIMITES.mensagens) return { ok: false, erro: 'messages inválido' }
  const messages: Msg[] = []
  for (const m of c.messages) {
    if (!m || typeof m !== 'object') return { ok: false, erro: 'mensagem inválida' }
    const { role, content } = m as Record<string, unknown>
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim() || content.length > LIMITES.charsPorMensagem)
      return { ok: false, erro: 'mensagem inválida ou grande demais' }
    messages.push({ role, content })            // reconstruído: nenhum campo extra do cliente passa adiante
  }
  let maxTokens = 1000
  if (c.max_tokens !== undefined) {
    if (typeof c.max_tokens !== 'number' || !Number.isFinite(c.max_tokens) || c.max_tokens < 1) return { ok: false, erro: 'max_tokens inválido' }
    maxTokens = Math.min(Math.floor(c.max_tokens), LIMITES.maxTokens)
  }
  return { ok: true, system, messages, maxTokens }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) })
  if (req.method !== 'POST') return json(req, { error: 'Método não permitido' }, 405)

  const chave = Deno.env.get('GROQ_API_KEY')
  if (!chave) { console.error('GROQ_API_KEY não configurada'); return json(req, { error: 'Serviço de IA não configurado' }, 500) }

  // 1) Autenticação: token do usuário + perfil admin
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json(req, { error: 'Não autenticado' }, 401)
  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } })
  const { data: { user }, error: erroUser } = await sb.auth.getUser()
  if (erroUser || !user) return json(req, { error: 'Não autenticado' }, 401)
  const { data: perfil } = await sb.from('perfis').select('tipo').eq('id', user.id).maybeSingle()
  if (perfil?.tipo !== 'admin') return json(req, { error: 'Acesso restrito a administradores' }, 403)

  // 2) Limite de uso: GLOBAL e atômico no banco (supabase/07_ia_limite.sql: 20 chamadas / 10 min por admin).
  //    Se a função SQL não existir (SQL 07 não aplicado), cai no limite local por instância e registra o erro.
  const { data: uso, error: erroUso } = await sb.rpc('ia_registrar_uso')
  if (erroUso) {
    console.error('ia_registrar_uso indisponível; usando limite local:', erroUso.message)
    if (excedeuLimite(user.id)) return json(req, { error: 'Muitas requisições. Aguarde alguns minutos.' }, 429, { 'Retry-After': '300' })
  } else {
    const r = Array.isArray(uso) ? uso[0] : uso
    if (!r?.permitido) {
      return json(req, { error: 'Muitas requisições. Aguarde alguns minutos.' }, 429, { 'Retry-After': String(r?.retry_apos_seg ?? 300) })
    }
  }

  // 3) Entrada
  const bruto = await req.text()
  if (bruto.length > LIMITES.corpoBytes) return json(req, { error: 'Requisição grande demais' }, 413)
  let corpo: unknown
  try { corpo = JSON.parse(bruto) } catch { return json(req, { error: 'JSON inválido' }, 400) }
  const v = validar(corpo)
  if (!v.ok) return json(req, { error: v.erro }, 400)

  // 4) Groq (com timeout)
  const ctl = new AbortController()
  const temporizador = setTimeout(() => ctl.abort(), Number(Deno.env.get('GROQ_TIMEOUT_MS') ?? 55_000))
  try {
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST', signal: ctl.signal,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + chave },
      body: JSON.stringify({
        model: MODELO, max_tokens: v.maxTokens,
        messages: [{ role: 'system', content: v.system }, ...v.messages],
      }),
    })
    const dados = await resp.json().catch(() => ({}))
    if (!resp.ok) {
      const msg = String(dados?.error?.message ?? 'erro').slice(0, 300)
      console.error('Groq respondeu', resp.status, msg)
      return json(req, { error: `Groq ${resp.status}: ${msg}`, content: [{ type: 'text', text: '' }] },
        resp.status === 429 ? 429 : 502)
    }
    return json(req, { content: [{ type: 'text', text: dados.choices?.[0]?.message?.content || '' }] })
  } catch (e) {
    if ((e as Error).name === 'AbortError') return json(req, { error: 'A IA demorou demais para responder' }, 504)
    console.error('Erro no proxy de IA:', e)
    return json(req, { error: 'Erro ao consultar a IA' }, 502)
  } finally {
    clearTimeout(temporizador)
  }
})
