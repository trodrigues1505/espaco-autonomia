/**
 * src/modules/lgpd.js
 * Consentimento LGPD (Lei 13.709/2018) — Art. 8° §6
 * Grava no banco (tabela consentimentos) e em localStorage como cache.
 *
 * Fluxo:
 *  1) Antes do login: o clique no banner fica só no localStorage (ainda não há usuário).
 *  2) Após o login (auth.js → iniciarApp): sincronizarConsentimentoAposLogin() leva
 *     o registro ao banco, preservando o horário REAL do clique (prova de consentimento).
 *  3) No logout: lgpdLimparLocal() apaga o cache, para que outra pessoa que use o
 *     mesmo aparelho veja o aviso e não herde o consentimento de quem saiu.
 *
 * Pré-requisito: rodar supabase/consentimentos.sql no SQL Editor do Supabase.
 */

import { sb } from '../lib/supabase.js'

// v2 = Política de Privacidade 1.0 (19/10/2026). Subir a versão força nova ciência de todos.
const VERSAO = 'v2'
const KEY    = 'lgpd_consent_v2'

// ── Banner ───────────────────────────────────────────────────
export function initLGPD() {
  if (!localStorage.getItem(KEY)) {
    setTimeout(() => {
      // Se nesse meio-tempo o consentimento foi restaurado do banco, não exibe.
      if (!localStorage.getItem(KEY)) document.getElementById('lgpd-banner')?.classList.add('show')
    }, 2000)
  }
}

export async function lgpdAceitar()  { await _registrar('accepted') }
export async function lgpdRejeitar() { await _registrar('essential_only') }

async function _registrar(nivel) {
  const quando = new Date().toISOString()
  _salvarLocal(nivel, quando)
  document.getElementById('lgpd-banner')?.classList.remove('show')
  await _gravarBanco(nivel, undefined, quando)   // sem usuário logado, só retorna
}

// ── Chamado após login ───────────────────────────────────────
export async function sincronizarConsentimentoAposLogin(userId) {
  if (!userId) return
  const local = _lerLocal()

  const { data, error } = await sb
    .from('consentimentos')
    .select('nivel, aceito_em')
    .eq('aluno_id', userId)
    .eq('versao', VERSAO)
    .maybeSingle()

  if (error) { console.warn('lgpd sync:', error.message); return }

  if (data && !local) {
    // Já consentiu em outro aparelho: restaura o cache e não mostra o banner de novo.
    _salvarLocal(data.nivel, data.aceito_em)
    document.getElementById('lgpd-banner')?.classList.remove('show')
    return
  }

  if (!data && local) {
    // Consentiu antes do login: grava com o horário real do clique.
    await _gravarBanco(local.nivel, userId, local.data)
  }
}

// ── Chamado no logout ────────────────────────────────────────
export function lgpdLimparLocal() {
  try { localStorage.removeItem(KEY) } catch { /* modo privado */ }
}

// ── Privado ──────────────────────────────────────────────────
function _salvarLocal(nivel, quando) {
  localStorage.setItem(KEY, JSON.stringify({ nivel, data: quando || new Date().toISOString() }))
}

function _lerLocal() {
  try { return JSON.parse(localStorage.getItem(KEY)) } catch { return null }
}

async function _gravarBanco(nivel, userId, quando) {
  const uid = userId || window._perfil?.id
  if (!uid) return

  const { error } = await sb.from('consentimentos').upsert({
    aluno_id:   uid,
    versao:     VERSAO,
    nivel,
    aceito_em:  quando || new Date().toISOString(),
    user_agent: navigator.userAgent,
    idioma:     navigator.language || 'pt-BR',
  }, { onConflict: 'aluno_id,versao' })

  if (error) console.warn('lgpd gravar banco:', error.message)
}

window.lgpdAceitar  = lgpdAceitar
window.lgpdRejeitar = lgpdRejeitar
