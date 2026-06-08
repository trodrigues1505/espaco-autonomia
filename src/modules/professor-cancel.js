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

  // Preenche resumo da aula no modal
  const infoEl = document.getElementById('modal-cancel-info')
  if (infoEl && infoObj) {
    const dt   = new Date(infoObj.data_hora)
    const hora = dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    const dia  = dt.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' })
    const nomes = { hatha: 'Hatha Yoga', acro: 'Acro Yoga', raja: 'Raja Yoga' }
    const nConf = infoObj.confirmados || 0
    infoEl.innerHTML = `
      <div style="margin-bottom:8px"><strong>${nomes[infoObj.modalidade] || infoObj.modalidade}</strong> — ${dia}, ${hora}</div>
      ${nConf > 0
        ? `<div style="background:#fceaea;border:1px solid #f5c1c1;border-radius:6px;padding:8px 12px;font-size:12px;color:#8a1a1a">⚠ <strong>${nConf} aluno(s) confirmado(s)</strong> — o saldo será estornado e eles verão a aula como cancelada na grade.</div>`
        : `<div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.3);border-radius:6px;padding:8px 12px;font-size:12px;color:#7a5a10">ℹ Nenhum aluno confirmado. Um aviso aparecerá na grade para todos os alunos.</div>`
      }`
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
    // 1. Marca a ocorrência como cancelada
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

    // 2. Estorna saldo dos alunos confirmados (RPC server-side)
    //    Se a função ainda não existir no banco, o erro é silenciado
    await window._sb
      .rpc('estornar_confirmacoes_ocorrencia', {
        p_ocorrencia_id: _cancelAulaId,
        p_motivo:        justificativa,
      })
      .then(r => { if (r.error) console.warn('estornar_confirmacoes_ocorrencia:', r.error.message) })

    window.toast('✓ Aula cancelada. Alunos serão notificados.')
    fecharModalCancelarAula()
    window.navigate?.('prof-aulas')

  } catch (e) {
    window.toast('Erro: ' + e.message)
    if (btn) { btn.textContent = 'Cancelar Aula'; btn.disabled = false }
  }
}

// ── Inicialização ────────────────────────────────────────────
export function initProfessorCancel() {
  // Fecha ao clicar no overlay
  document.getElementById('modal-cancel-aula')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) fecharModalCancelarAula()
    })
}

// Expõe para onclick inline no HTML
window.abrirModalCancelarAula    = abrirModalCancelarAula
window.fecharModalCancelarAula   = fecharModalCancelarAula
window.confirmarCancelamentoAula = confirmarCancelamentoAula

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
