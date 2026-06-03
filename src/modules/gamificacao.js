/**
 * src/modules/gamificacao.js
 * Responsabilidade: saldo de aulas, pontos prāṇa e conquistas.
 * Depende de: sb (lib/supabase.js), toast (modules/utils.js)
 */

import { sb } from '../lib/supabase.js'

// ── Saldo ────────────────────────────────────────────────────
export async function getSaldoAluno(alunoId) {
  const { data } = await sb
    .from('saldo_disponivel')
    .select('*')
    .eq('aluno_id', alunoId)
    .single()
  return data
}

export async function getPagamentosAluno(alunoId) {
  const { data } = await sb
    .from('pagamentos')
    .select('*')
    .eq('aluno_id', alunoId)
    .order('vencimento', { ascending: false })
    .limit(6)
  return data || []
}

// ── Gamificação ──────────────────────────────────────────────
export async function getGamificacao(alunoId) {
  let { data } = await sb
    .from('gamificacao')
    .select('*')
    .eq('aluno_id', alunoId)
    .single()

  if (!data) {
    const { data: novo } = await sb
      .from('gamificacao')
      .insert({ aluno_id: alunoId })
      .select()
      .single()
    data = novo
  }
  return data
}

// ── Conquistas ───────────────────────────────────────────────
export async function getConquistas(alunoId) {
  const { data: todas  } = await sb.from('conquistas').select('*').order('pontos')
  const { data: minhas } = await sb
    .from('aluno_conquistas')
    .select('conquista_cod, desbloqueado_em')
    .eq('aluno_id', alunoId)

  const set = new Set((minhas || []).map(c => c.conquista_cod))
  return (todas || []).map(c => ({
    ...c,
    desbloqueada: set.has(c.codigo),
    quando: minhas?.find(m => m.conquista_cod === c.codigo)?.desbloqueado_em,
  }))
}

export async function verificarConquistas(alunoId) {
  const { data: saldo } = await sb
    .from('saldo_disponivel')
    .select('total_usadas')
    .eq('aluno_id', alunoId)
    .single()

  const totalAulas = saldo?.total_usadas || 0
  const { data: gam } = await sb
    .from('gamificacao')
    .select('*')
    .eq('aluno_id', alunoId)
    .single()

  const candidatas = []
  if (totalAulas >= 1)          candidatas.push('primeira_aula')
  if (totalAulas >= 5)          candidatas.push('aulas_5')
  if (totalAulas >= 10)         candidatas.push('aulas_10')
  if (totalAulas >= 25)         candidatas.push('aulas_25')
  if (totalAulas >= 50)         candidatas.push('aulas_50')
  if (gam?.streak_atual >= 4)   candidatas.push('streak_4')
  if (gam?.streak_atual >= 12)  candidatas.push('streak_12')
  if (gam?.streak_atual >= 24)  candidatas.push('streak_24')

  for (const cod of candidatas) {
    const { error } = await sb
      .from('aluno_conquistas')
      .insert({ aluno_id: alunoId, conquista_cod: cod })
      .select()

    if (!error) {
      const { data: conquista } = await sb
        .from('conquistas')
        .select('*')
        .eq('codigo', cod)
        .single()
      if (conquista) mostrarToastConquista(conquista)
    }
  }
}

// ── Toast de conquista ───────────────────────────────────────
export function mostrarToastConquista(conquista) {
  const t = document.createElement('div')
  t.style.cssText = [
    'position:fixed;top:20px;right:20px',
    'background:#fff;border:2px solid var(--dourado)',
    'border-radius:12px;padding:14px 18px',
    'z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.15)',
    'max-width:280px;animation:slideIn .3s ease',
  ].join(';')
  t.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px">
      <div style="font-size:28px">${conquista.icone}</div>
      <div>
        <div style="font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--dourado);font-weight:500">Conquista desbloqueada!</div>
        <div style="font-weight:500;font-size:13px;color:var(--verde);margin-top:2px">${conquista.nome}</div>
        <div style="font-size:11px;color:var(--txt2)">${conquista.descricao} · +${conquista.pontos} pts</div>
      </div>
    </div>`
  document.body.appendChild(t)
  setTimeout(() => {
    t.style.opacity = '0'
    t.style.transition = 'opacity .3s'
    setTimeout(() => t.remove(), 300)
  }, 4000)
}
