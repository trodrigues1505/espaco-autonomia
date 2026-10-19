// supabase/functions/asaas-proxy/index.ts
// Proxy para a API do Asaas. Só admin autenticado pode usar.
//
// Deploy:  supabase functions deploy asaas-proxy --no-verify-jwt
// (--no-verify-jwt é necessário porque o preflight CORS não leva token;
//  a autenticação é feita aqui dentro, via getUser + perfis.tipo).
//
// Secrets opcionais (supabase secrets set ...):
//   ASAAS_API_KEY     → se definido, a chave NÃO vem mais do navegador.
//   ALLOWED_ORIGINS   → origens permitidas, separadas por vírgula.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? 'https://trodrigues1505.github.io')
  .split(',').map(s => s.trim()).filter(Boolean)

// Só os recursos que o app realmente usa (pagamentos.js e config.js).
const PATH_OK = /^\/(payments|customers)(\/[A-Za-z0-9_-]+)?(\?[A-Za-z0-9_=&.:%+-]*)?$|^\/finance\/balance$/

function cors(req: Request) {
  const origin = req.headers.get('Origin') ?? ''
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(origin) ? origin : ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors(req) },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(req) })
  if (req.method !== 'POST') return json(req, { error: 'method_not_allowed' }, 405)

  // 1) Autenticação: token do usuário + perfil admin
  const auth = req.headers.get('Authorization') ?? ''
  if (!auth.startsWith('Bearer ')) return json(req, { error: 'unauthorized' }, 401)

  const sb = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: auth } } },
  )
  const { data: { user }, error: errUser } = await sb.auth.getUser()
  if (errUser || !user) return json(req, { error: 'unauthorized' }, 401)

  const { data: perfil } = await sb.from('perfis').select('tipo').eq('id', user.id).maybeSingle()
  if (perfil?.tipo !== 'admin') return json(req, { error: 'forbidden' }, 403)

  // 2) Entrada validada
  let body: { apiKey?: string; path?: string; offset?: number }
  try { body = await req.json() } catch { return json(req, { error: 'invalid_json' }, 400) }

  const offset = Number.isInteger(body.offset) && body.offset! >= 0 ? body.offset : 0
  const path = body.path ?? `/customers?limit=100&offset=${offset}`
  if (!PATH_OK.test(path) || path.includes('..')) return json(req, { error: 'path_not_allowed' }, 400)

  const apiKey = Deno.env.get('ASAAS_API_KEY') ?? body.apiKey
  if (!apiKey) return json(req, { error: 'missing_api_key' }, 400)

  // 3) Chamada ao Asaas — propaga o status real (antes sempre devolvia 200)
  const resp = await fetch(`https://api.asaas.com/v3${path}`, { headers: { access_token: apiKey } })
  const text = await resp.text()
  return new Response(text, {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('Content-Type') ?? 'application/json', ...cors(req) },
  })
})
