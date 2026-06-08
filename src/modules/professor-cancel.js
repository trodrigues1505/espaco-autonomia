/**
 * src/modules/professor-cancel.js
 * Responsabilidade: cancelamento de aula pelo professor.
 *
 * Fluxo:
 *  1. Professor clica em "Cancelar" em qualquer aula futura
 *  2. Modal abre mostrando dados da aula + campo de justificativa obrigatório
 *  3. Ao confirmar:
 *     a. Atualiza ocorrencia: cancelada=true, motivo_cancelamento, cancelada_por
 *     b. Chama RPC estornar_confirmacoes_ocorrencia (devolve saldo dos alunos)
 *     c. Toast + recarrega página
 *
 * Depende de: window._sb, window._perfil, window.toast, window.navigate
 */

let _cancelAulaId   = null
let _cancelAulaInfo = null

// ── Abre modal ───────────────────────────────────────────────
export function abrirModalCancelarAula(ocorrenciaId, infoObj) {
  _cancelAulaId   = ocorrenciaId
  _cancelAulaInfo = infoObj

  const infoEl = document.getElementById('modal-cancel-info')
  if (infoEl && infoObj) {
    const dt   = new Date(infoObj.data_hora)
    const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const dia  = dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
    const nomes = { hatha: 'Hatha Yoga', acro: 'Acro Yoga', raja: 'Raja Yoga' }
    infoEl.innerHTML = `
      <strong>${nomes[infoObj.modalidade] || infoObj.modalidade}</strong> —
      ${dia}, ${hora}
      <span style="margin-left:8px;font-size:11px;color:var(--txt2)">
        ${infoObj.confirmados || 0} aluno(s) confirmado(s)
      </span>`
  }

  document.getElementById('input-cancel-justif').value = ''
  document.getElementById('modal-cancel-aula').classList.add('open')
}

// ── Fecha modal ──────────────────────────────────────────────
export function fecharModalCancelarAula() {
  document.getElementById('modal-cancel-aula').classList.remove('open')
  _cancelAulaId   = null
  _cancelAulaInfo = null
}

// ── Confirma cancelamento ────────────────────────────────────
export async function confirmarCancelamentoAula() {
  if (!_cancelAulaId) return

  const justificativa = document.getElementById('input-cancel-justif').value.trim()
  if (justificativa.length < 10) {
    window.toast('Informe um motivo com pelo menos 10 caracteres.')
    document.getElementById('input-cancel-justif').focus()
    return
  }

  const btn = document.querySelector('#modal-cancel-aula .btn-danger')
  if (btn) { btn.textContent = 'Cancelando…'; btn.disabled = true }

  try {
    const { error } = await window._sb
      .from('ocorrencias')
      .update({
        cancelada:            true,
        cancelada_em:         new Date().toISOString(),
        cancelada_por:        window._perfil?.id,
        motivo_cancelamento:  justificativa,
      })
      .eq('id', _cancelAulaId)

    if (error) throw new Error(error.message)

    // Estorna saldo dos alunos confirmados (RPC server-side)
    await window._sb
      .rpc('estornar_confirmacoes_ocorrencia', {
        p_ocorrencia_id: _cancelAulaId,
        p_motivo:        justificativa,
      })
      .then(r => { if (r.error) console.warn('estornar_confirmacoes_ocorrencia:', r.error.message) })

    window.toast('✓ Aula cancelada. Alunos serão notificados.')
    fecharModalCancelarAula()
    const destino = window._cancelReturnPage || 'prof-aulas'
    window._cancelReturnPage = null
    window.navigate?.(destino)

  } catch (e) {
    window.toast('Erro: ' + e.message)
    if (btn) { btn.textContent = 'Cancelar Aula'; btn.disabled = false }
  }
}

// ── Inicialização ────────────────────────────────────────────
export function initProfessorCancel() {
  document.getElementById('modal-cancel-aula')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) fecharModalCancelarAula()
    })
}

// Expõe para onclick inline no HTML
window.abrirModalCancelarAula    = abrirModalCancelarAula
window.fecharModalCancelarAula   = fecharModalCancelarAula
window.confirmarCancelamentoAula = confirmarCancelamentoAula

// ── Cancelamento pela grade/admin ────────────────────────────
window.cancelarOcorrenciaGrade = async function(ocId, infoObj) {
  const perfil = window._perfil
  if (perfil?.tipo !== 'admin' && infoObj?.professor_id !== perfil?.id) {
    window.toast('Você não tem permissão para cancelar esta aula.')
    return
  }
  abrirModalCancelarAula(ocId, infoObj)
  if (perfil?.tipo === 'admin') {
    window._cancelReturnPage = window._currentPage || 'grade'
  }
}    
