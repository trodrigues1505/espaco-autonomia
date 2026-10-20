// supabase/functions/asaas-webhook/index.ts
// Recebe eventos de cobrança do Asaas e mantém a tabela pagamentos em dia.
//
// Deploy:  supabase functions deploy asaas-webhook --no-verify-jwt
//   (o Asaas não envia JWT do Supabase; a autenticação é o token abaixo)
//
// Secrets:  ASAAS_WEBHOOK_TOKEN (use um valor longo e aleatório: openssl rand -hex 32,
//           o MESMO cadastrado no painel do Asaas) · SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (automáticos)
//
// Segurança: token comparado em tempo constante; sem CORS (só o servidor do Asaas chama);
// campos validados; um evento ATRASADO não rebaixa uma cobrança já paga; erros internos não vazam.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const EVENTOS_TRATADOS = new Set([
  'PAYMENT_RECEIVED', 'PAYMENT_CONFIRMED', 'PAYMENT_OVERDUE', 'PAYMENT_DELETED', 'PAYMENT_REFUNDED',
])
const STATUS_PAGOS = new Set(['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH', 'REFUNDED'])
const STATUS_ABERTOS = new Set(['PENDING', 'OVERDUE'])
const MAX_CORPO = 100_000

const resp = (corpo: unknown, status = 200) =>
  new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })

/** Comparação em tempo constante (não vaza, pelo tempo de resposta, quantos caracteres batem). */
function iguais(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a), eb = new TextEncoder().encode(b)
  let dif = ea.length ^ eb.length
  const n = Math.max(ea.length, eb.length)
  for (let i = 0; i < n; i++) dif |= (ea[i] ?? 0) ^ (eb[i] ?? 0)
  return dif === 0
}

const ehTexto = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max
const ID_ASAAS = /^[A-Za-z0-9_-]{3,64}$/
const DATA = /^\d{4}-\d{2}-\d{2}$/
const STATUS = /^[A-Z_]{3,40}$/

serve(async (req) => {
  if (req.method !== 'POST') return resp({ error: 'Método não permitido' }, 405)

  // ── Autenticação ──
  const esperado = Deno.env.get('ASAAS_WEBHOOK_TOKEN')
  if (!esperado) { console.error('ASAAS_WEBHOOK_TOKEN não configurado'); return resp({ error: 'Webhook não configurado' }, 500) }
  const recebido = req.headers.get('asaas-access-token') ?? ''
  if (!iguais(recebido, esperado)) { console.warn('Webhook com token inválido'); return resp({ error: 'Unauthorized' }, 401) }

  // ── Entrada ──
  const bruto = await req.text()
  if (bruto.length > MAX_CORPO) return resp({ error: 'Payload grande demais' }, 413)
  let body: any
  try { body = JSON.parse(bruto) } catch { return resp({ error: 'JSON inválido' }, 400) }

  const evento = body?.event, payment = body?.payment
  if (!ehTexto(evento, 60) || !payment || typeof payment !== 'object' || !ehTexto(payment.id, 64) || !ID_ASAAS.test(payment.id))
    return resp({ error: 'Payload sem event ou payment.id válidos' }, 400)
  console.log('Webhook recebido:', evento, payment.id)

  if (!EVENTOS_TRATADOS.has(evento)) return resp({ ok: true, ignorado: evento })

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  try {
    if (evento === 'PAYMENT_DELETED') {
      const { error } = await sb.from('pagamentos').delete().eq('asaas_id', payment.id)
      if (error) throw error
      return resp({ ok: true, acao: 'deletado' })
    }

    if (!payment.dueDate) { console.warn('Payment sem dueDate, ignorando:', payment.id); return resp({ ok: true, ignorado: 'sem dueDate' }) }
    if (typeof payment.dueDate !== 'string' || !DATA.test(payment.dueDate)) return resp({ error: 'dueDate inválido' }, 400)
    const valor = payment.value === undefined || payment.value === null ? 0 : Number(payment.value)
    if (!Number.isFinite(valor) || valor < 0) return resp({ error: 'value inválido' }, 400)
    const status = payment.status ?? (evento === 'PAYMENT_REFUNDED' ? 'REFUNDED' : 'PENDING')
    if (typeof status !== 'string' || !STATUS.test(status)) return resp({ error: 'status inválido' }, 400)
    let pagoEm: string | null = null
    if (payment.paymentDate) {
      const d = new Date(payment.paymentDate)
      if (Number.isNaN(d.getTime())) return resp({ error: 'paymentDate inválido' }, 400)
      pagoEm = d.toISOString()
    }
    const customer = ehTexto(payment.customer, 64) && ID_ASAAS.test(payment.customer) ? payment.customer : null

    // Eventos podem chegar fora de ordem: um "vencida" atrasado não pode desfazer um "paga".
    const { data: atual } = await sb.from('pagamentos').select('status').eq('asaas_id', payment.id).maybeSingle()
    if (atual && STATUS_PAGOS.has(atual.status) && STATUS_ABERTOS.has(status)) {
      console.warn('Evento fora de ordem ignorado:', payment.id, atual.status, '->', status)
      return resp({ ok: true, ignorado: 'status regrediria' })
    }

    // aluno pelo vínculo Asaas (se houver mais de um perfil com o mesmo vínculo, não adivinha)
    let alunoId: string | null = null
    if (customer) {
      const { data: perfis } = await sb.from('perfis').select('id').eq('asaas_customer_id', customer).limit(2)
      if (perfis?.length === 1) alunoId = perfis[0].id
      else if ((perfis?.length ?? 0) > 1) console.warn('asaas_customer_id repetido em mais de um perfil:', customer)
    }

    const { error } = await sb.from('pagamentos').upsert({
      asaas_id: payment.id,
      asaas_customer: customer,
      aluno_id: alunoId,
      valor,
      status,
      vencimento: payment.dueDate,
      pago_em: pagoEm,
      descricao: typeof payment.description === 'string' ? payment.description.slice(0, 500) : null,
      mes_ref: payment.dueDate.slice(0, 7) + '-01',
    }, { onConflict: 'asaas_id' })
    if (error) throw error

    return resp({ ok: true, acao: 'upsert', asaas_id: payment.id })
  } catch (e) {
    console.error('Erro ao processar webhook:', e)
    return resp({ error: 'Erro interno' }, 500)      // 500 faz o Asaas reenviar; detalhes só no log
  }
})
