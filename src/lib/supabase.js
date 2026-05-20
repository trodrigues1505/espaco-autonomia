// src/lib/supabase.js
// ─────────────────────────────────────────────────────────────
// Cliente Supabase — substitua as duas constantes abaixo com
// os valores do seu projeto em https://supabase.com/dashboard
// Project Settings → API
// ─────────────────────────────────────────────────────────────

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL  = 'https://SEU_PROJETO.supabase.co'     // ← substitua
const SUPABASE_ANON = 'SUA_ANON_PUBLIC_KEY'                  // ← substitua

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON)

// ─────────────────────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────────────────────

export async function login(email, senha) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: senha })
  if (error) throw error
  return data
}

export async function logout() {
  await supabase.auth.signOut()
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: perfil } = await supabase
    .from('perfis')
    .select('*')
    .eq('id', user.id)
    .single()
  return perfil
}

// ─────────────────────────────────────────────────────────────
// CONFIGURAÇÕES
// ─────────────────────────────────────────────────────────────

export async function getConfig(chave) {
  const { data } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', chave)
    .single()
  return data?.valor
}

export async function setConfig(chave, valor) {
  const { error } = await supabase
    .from('configuracoes')
    .update({ valor: String(valor), atualizado_em: new Date().toISOString() })
    .eq('chave', chave)
  if (error) throw error
}

export async function getAllConfig() {
  const { data } = await supabase.from('configuracoes').select('*')
  return Object.fromEntries((data || []).map(r => [r.chave, r.valor]))
}

// ─────────────────────────────────────────────────────────────
// AULAS
// ─────────────────────────────────────────────────────────────

export async function getAulas({ tipo, modalidade, ativa = true } = {}) {
  let q = supabase
    .from('aulas')
    .select(`
      *,
      professor:perfis!professor_id(id, nome),
      horarios:aulas_horarios(*)
    `)
  if (ativa !== null) q = q.eq('ativa', ativa)
  if (tipo)       q = q.eq('tipo', tipo)
  if (modalidade) q = q.eq('modalidade', modalidade)
  const { data, error } = await q.order('criado_em')
  if (error) throw error
  return data
}

export async function criarAula(dados) {
  const { horarios, ...aula } = dados
  const { data: novaAula, error } = await supabase
    .from('aulas').insert(aula).select().single()
  if (error) throw error

  if (horarios?.length) {
    const rows = horarios.map(h => ({ ...h, aula_id: novaAula.id }))
    const { error: errH } = await supabase.from('aulas_horarios').insert(rows)
    if (errH) throw errH
  }
  return novaAula
}

export async function toggleAula(id, ativa) {
  const { error } = await supabase.from('aulas').update({ ativa }).eq('id', id)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────
// OCORRÊNCIAS
// ─────────────────────────────────────────────────────────────

export async function getOcorrencias({ de, ate, modalidade, incluirCanceladas = false } = {}) {
  let q = supabase
    .from('ocorrencias_vagas')   // view
    .select('*')
  if (de)  q = q.gte('data_hora', de)
  if (ate) q = q.lte('data_hora', ate)
  if (modalidade) q = q.eq('modalidade', modalidade)
  if (!incluirCanceladas) q = q.eq('cancelada', false)
  const { data, error } = await q.order('data_hora')
  if (error) throw error
  return data
}

export async function getOcorrenciasHoje() {
  const inicio = new Date(); inicio.setHours(0,0,0,0)
  const fim    = new Date(); fim.setHours(23,59,59,999)
  return getOcorrencias({ de: inicio.toISOString(), ate: fim.toISOString() })
}

export async function gerarOcorrencias(aulaId, de, ate) {
  // Busca aula e horários
  const { data: aula } = await supabase
    .from('aulas')
    .select('*, horarios:aulas_horarios(*)')
    .eq('id', aulaId).single()

  const diasMap = { seg:1, ter:2, qua:3, qui:4, sex:5, sab:6, dom:0 }
  const feriados = await getFeriados(de, ate)
  const feriadosDatas = new Set(feriados.map(f => f.data))

  const ocorrencias = []
  const cursor = new Date(de)
  const fimDate = new Date(ate)

  while (cursor <= fimDate) {
    const diaSemana = cursor.getDay() // 0=dom
    for (const h of aula.horarios) {
      if (diasMap[h.dia_semana] === diaSemana) {
        const [hora, min] = h.hora_inicio.split(':')
        const dt = new Date(cursor)
        dt.setHours(Number(hora), Number(min), 0, 0)
        const dataStr = dt.toISOString().slice(0,10)
        const feriadoNome = feriadosDatas.has(dataStr)
          ? feriados.find(f => f.data === dataStr)?.nome : null
        ocorrencias.push({
          aula_id: aulaId,
          data_hora: dt.toISOString(),
          eh_feriado: !!feriadoNome,
          nome_feriado: feriadoNome || null,
        })
      }
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  if (ocorrencias.length) {
    const { error } = await supabase
      .from('ocorrencias')
      .upsert(ocorrencias, { onConflict: 'aula_id,data_hora' })
    if (error) throw error
  }
  return ocorrencias.length
}

export async function cancelarOcorrencia(id, motivo) {
  const { error } = await supabase
    .from('ocorrencias')
    .update({ cancelada: true, motivo_cancel: motivo })
    .eq('id', id)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────
// CONFIRMAÇÕES
// ─────────────────────────────────────────────────────────────

export async function confirmarPresenca(ocorrenciaId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.rpc('confirmar_presenca', {
    p_aluno_id: user.id,
    p_ocorrencia_id: ocorrenciaId,
  })
  if (error) throw error
  return data  // { ok: true/false, mensagem/motivo }
}

export async function cancelarConfirmacao(ocorrenciaId) {
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.rpc('cancelar_confirmacao', {
    p_aluno_id: user.id,
    p_ocorrencia_id: ocorrenciaId,
  })
  if (error) throw error
  return data
}

export async function getConfirmacoesOcorrencia(ocorrenciaId) {
  const { data, error } = await supabase
    .from('confirmacoes')
    .select('*, aluno:perfis!aluno_id(id, nome, email)')
    .eq('ocorrencia_id', ocorrenciaId)
    .in('status', ['confirmado','presente','ausente'])
    .order('confirmado_em')
  if (error) throw error
  return data
}

export async function getMinhasConfirmacoes(de, ate) {
  const { data: { user } } = await supabase.auth.getUser()
  let q = supabase
    .from('confirmacoes')
    .select('*, ocorrencia:ocorrencias(*, aula:aulas(modalidade, professor:perfis!professor_id(nome)))')
    .eq('aluno_id', user.id)
    .in('status', ['confirmado','presente'])
  if (de) q = q.gte('ocorrencias.data_hora', de)
  if (ate) q = q.lte('ocorrencias.data_hora', ate)
  const { data, error } = await q.order('criado_em', { ascending: false })
  if (error) throw error
  return data
}

export async function marcarPresenca(confirmacaoId, presente) {
  const { error } = await supabase
    .from('confirmacoes')
    .update({
      status: presente ? 'presente' : 'ausente',
      presenca_em: new Date().toISOString(),
    })
    .eq('id', confirmacaoId)
  if (error) throw error
}

// ─────────────────────────────────────────────────────────────
// ALUNOS & MATRÍCULAS
// ─────────────────────────────────────────────────────────────

export async function getAlunos() {
  const { data, error } = await supabase
    .from('alunos_plano_ativo')   // view
    .select('*')
    .order('nome')
  if (error) throw error
  return data
}

export async function getAluno(id) {
  const { data, error } = await supabase
    .from('alunos_plano_ativo')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function matricularAluno({ alunoId, planoTipo, opcaoAulas, valorMensal }) {
  // Desativa matrícula anterior
  await supabase
    .from('matriculas')
    .update({ ativa: false, fim: new Date().toISOString().slice(0,10) })
    .eq('aluno_id', alunoId).eq('ativa', true)

  const { data, error } = await supabase
    .from('matriculas')
    .insert({ aluno_id: alunoId, plano_tipo: planoTipo, opcao_aulas: opcaoAulas, valor_mensal: valorMensal })
    .select().single()
  if (error) throw error
  return data
}

// ─────────────────────────────────────────────────────────────
// PLANOS
// ─────────────────────────────────────────────────────────────

export async function getPlanos() {
  const { data: planos } = await supabase.from('planos').select('*').order('preco_1x')
  const { data: mods }   = await supabase.from('plano_modalidades').select('*')
  return (planos || []).map(p => ({
    ...p,
    modalidades: (mods || []).filter(m => m.plano_tipo === p.tipo).map(m => m.modalidade),
  }))
}

// ─────────────────────────────────────────────────────────────
// FERIADOS
// ─────────────────────────────────────────────────────────────

export async function getFeriados(de, ate) {
  const deStr = typeof de === 'string' ? de : de?.toISOString().slice(0,10)
  const ateStr = typeof ate === 'string' ? ate : ate?.toISOString().slice(0,10)
  let q = supabase.from('feriados').select('*')
  if (deStr)  q = q.gte('data', deStr)
  if (ateStr) q = q.lte('data', ateStr)
  const { data } = await q.order('data')
  return data || []
}

export async function getProximosFeriados(dias = 30) {
  const hoje = new Date()
  const ate  = new Date(); ate.setDate(ate.getDate() + dias)
  return getFeriados(hoje.toISOString().slice(0,10), ate.toISOString().slice(0,10))
}

// ─────────────────────────────────────────────────────────────
// REAL-TIME (subscriptions)
// ─────────────────────────────────────────────────────────────

export function subsConfirmacoes(ocorrenciaId, callback) {
  return supabase
    .channel(`confirmacoes:${ocorrenciaId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'confirmacoes',
      filter: `ocorrencia_id=eq.${ocorrenciaId}`,
    }, callback)
    .subscribe()
}

export function subsOcorrenciasHoje(callback) {
  const hoje = new Date().toISOString().slice(0,10)
  return supabase
    .channel('ocorrencias_hoje')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'ocorrencias',
      filter: `data_hora=gte.${hoje}T00:00:00`,
    }, callback)
    .subscribe()
}
