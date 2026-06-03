/**
 * src/modules/lgpd.js
 * Responsabilidade: consentimento LGPD (Lei 13.709/2018).
 *
 * Fluxo:
 *  1. Se o usuário ainda não consentiu → exibe banner informativo
 *  2. Após login, o aceite é gravado no banco (tabela `consentimentos`)
 *     vinculado ao user_id — rastreável e auditável (LGPD Art. 8° §6)
 *  3. "Só essenciais" aceita apenas dados de funcionamento,
 *     sem gamificação/analytics
 *
 * NÃO usa localStorage como única fonte de verdade —
 * o registro definitivo está no Supabase.
 */

import { sb } from '../lib/supabase.js'

const VERSAO_POLITICA = 'v1'
const KEY_LOCAL       = 'lgpd_consent_v1'      // apenas cache local

// ── Inicialização ────────────────────────────────────────────
export function initLGPD() {
  const consentLocal = localStorage.getItem(KEY_LOCAL)
  if (!consentLocal) {
    // Aguarda o PWA banner sumir antes de exibir
    setTimeout(() => {
      document.getElementById('lgpd-banner')?.classList.add('show')
    }, 1500)
  }
}

// ── Ações do banner ──────────────────────────────────────────
export function lgpdAceitar() {
  _salvarLocal('accepted')
  _esconderBanner()
  // Grava no banco se já estiver logado
  _gravarConsentimentoBanco('accepted')
}

export function lgpdRejeitar() {
  _salvarLocal('essential_only')
  _esconderBanner()
  _gravarConsentimentoBanco('essential_only')
}

/** Chamado após login — garante que o aceite está no banco */
export async function sincronizarConsentimentoAposLogin(userId) {
  const consentLocal = localStorage.getItem(KEY_LOCAL)
  if (!consentLocal) return  // usuário ainda não viu o banner

  // Verifica se já existe registro no banco
  const { data } = await sb
    .from('consentimentos')
    .select('id')
    .eq('aluno_id', userId)
    .eq('versao', VERSAO_POLITICA)
    .single()
    .then(r => r)

  if (!data) {
    await _gravarConsentimentoBanco(consentLocal, userId)
  }
}

/** Retorna o nível de consentimento atual */
export function nivelConsentimento() {
  return localStorage.getItem(KEY_LOCAL) || null
}

// ── Privado ──────────────────────────────────────────────────
function _salvarLocal(nivel) {
  localStorage.setItem(KEY_LOCAL, nivel)
  localStorage.setItem('lgpd_consent_date', new Date().toISOString())
}

function _esconderBanner() {
  document.getElementById('lgpd-banner')?.classList.remove('show')
}

async function _gravarConsentimentoBanco(nivel, userId) {
  const uid = userId || window._perfil?.id
  if (!uid) return   // não logado ainda — será chamado novamente após login

  await sb.from('consentimentos').upsert({
    aluno_id:   uid,
    versao:     VERSAO_POLITICA,
    nivel:      nivel,             // 'accepted' | 'essential_only'
    aceito_em:  new Date().toISOString(),
    user_agent: navigator.userAgent,
    idioma:     navigator.language || 'pt-BR',
  }, { onConflict: 'aluno_id,versao' })
}

// Expõe para onclick inline no HTML
window.lgpdAceitar  = lgpdAceitar
window.lgpdRejeitar = lgpdRejeitar
