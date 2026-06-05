/**
 * src/modules/lgpd.js
 * Consentimento LGPD (Lei 13.709/2018) — Art. 8° §6
 * Grava no banco (tabela consentimentos) e em localStorage como cache.
 *
 * Pré-requisito: rodar supabase/consentimentos.sql no SQL Editor do Supabase.
 */

import { sb } from '../lib/supabase.js'

const VERSAO = 'v1'
const KEY    = 'lgpd_consent_v1'

// ── Banner ───────────────────────────────────────────────────
export function initLGPD() {
  if (!localStorage.getItem(KEY)) {
    setTimeout(() => document.getElementById('lgpd-banner')?.classList.add('show'), 2000)
  }
}

export async function lgpdAceitar() {
  _salvarLocal('accepted')
  document.getElementById('lgpd-banner')?.classList.remove('show')
  await _gravarBanco('accepted')
}

export async function lgpdRejeitar() {
  _salvarLocal('essential_only')
  document.getElementById('lgpd-banner')?.classList.remove('show')
  await _gravarBanco('essential_only')
}

// ── Chamado após login ────────────────────────────────────────
export async function sincronizarConsentimentoAposLogin(userId) {
  const local = _lerLocal()
  if (!local) return  // usuário ainda não viu o banner

  // Verifica se já existe no banco
  const { data } = await sb
    .from('consentimentos')
    .select('id')
    .eq('aluno_id', userId)
    .eq('versao', VERSAO)
    .maybeSingle()

  if (!data) {
    await _gravarBanco(local.nivel, userId)
  }
}

// ── Privado ───────────────────────────────────────────────────
function _salvarLocal(nivel) {
  localStorage.setItem(KEY, JSON.stringify({ nivel, data: new Date().toISOString() }))
}

function _lerLocal() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

async function _gravarBanco(nivel, userId) {
  const uid = userId || window._perfil?.id
  if (!uid) return

  const { error } = await sb.from('consentimentos').upsert({
    aluno_id:   uid,
    versao:     VERSAO,
    nivel,
    aceito_em:  new Date().toISOString(),
    user_agent: navigator.userAgent,
    idioma:     navigator.language || 'pt-BR',
  }, { onConflict: 'aluno_id,versao' })

  if (error) console.warn('lgpd gravar banco:', error.message)
}

window.lgpdAceitar  = lgpdAceitar
window.lgpdRejeitar = lgpdRejeitar
