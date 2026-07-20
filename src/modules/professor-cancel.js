/**
 * src/modules/professor-cancel.js
 * Responsabilidade: cancelamento de aula (individual e em massa),
 * pelo professor ou pelo admin (para qualquer professor).
 *
 * Colunas reais da tabela ocorrencias:
 *   id, aula_id, data_hora, vagas_override, cancelada,
 *   motivo_cancel, eh_feriado, nome_feriado, criado_em
 *
 * Depende de: window._sb, window._perfil, window.toast, window.navigate
 */

let _cancelAulaId    = null   // modo individual
let _cancelAulaInfo  = null
let _cancelEmMassa   = false  // true quando o modal está em modo "N aulas"

// ── Abre modal — cancelamento de UMA aula ─────────────────────
export function abrirModalCancelarAula(ocorrenciaId, infoObj) {
  _cancelAulaId   = ocorrenciaId
  _cancelEmMassa  = false
  _cancelAulaInfo = infoObj

  const btn = document.querySelector('#modal-cancel-aula .btn-danger')
  if (btn) { btn.textContent = 'Cancelar Aula'; btn.disabled = false }

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

// ── Abre modal — cancelamento EM MASSA (N aulas) ──────────────
// infosArray: array de objetos { id, data_hora, modalidade, confirmados }
export function abrirModalCancelarEmMassa(infosArray) {
  if (!infosArray || infosArray.length === 0) {
    window.toast('Selecione ao menos uma aula.')
    return
  }
  _cancelAulaId   = null
  _cancelEmMassa  = true
  _cancelAulaInfo = infosArray

  const btn = document.querySelector('#modal-cancel-aula .btn-danger')
  if (btn) { btn.textContent = `Cancelar ${infosArray.length} Aula(s)`; btn.disabled = false }

  const nomes = { hatha: 'Hatha Yoga', acro: 'Acro Yoga', raja: 'Raja Yoga' }
  const infoEl = document.getElementById('modal-cancel-info')
  if (infoEl) {
    infoEl.innerHTML = `
      <div style="font-weight:500;margin-bottom:6px">${infosArray.length} aula(s) selecionada(s):</div>
      <div style="max-height:140px;overflow-y:auto;display:flex;flex-direction:column;gap:4px">
        ${infosArray.map(i => {
          const dt = new Date(i.data_hora)
          return `<div style="font-size:11px">
            ${nomes[i.modalidade] || i.modalidade} —
            ${dt.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}
            ${dt.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}
            <span style="color:var(--txt2)">(${i.confirmados||0} confirmado(s))</span>
          </div>`
        }).join('')}
      </div>`
  }

  document.getElementById('input-cancel-justif').value = ''
  document.getElementById('modal-cancel-aula').classList.add('open')
}

// ── Fecha modal ──────────────────────────────────────────────
export function fecharModalCancelarAula() {
  document.getElementById('modal-cancel-aula').classList.remove('open')
  _cancelAulaId   = null
  _cancelAulaInfo = null
  _cancelEmMassa  = false
}

// ── Confirma cancelamento (roteia individual vs. massa) ───────
export async function confirmarCancelamentoAula() {
  if (_cancelEmMassa) return _confirmarCancelamentoEmMassa()
  return _confirmarCancelamentoIndividual()
}

async function _confirmarCancelamentoIndividual() {
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
      .update({ cancelada: true, motivo_cancel: justificativa })
      .eq('id', _cancelAulaId)

    if (error) throw new Error(error.message)

    await window._sb
      .rpc('estornar_confirmacoes_ocorrencia', {
        p_ocorrencia_id: _cancelAulaId,
        p_motivo:        justificativa,
      })
      .then(r => { if (r.error) console.warn('estornar_confirmacoes_ocorrencia:', r.error.message) })

    window.toast('✓ Aula cancelada.')
    if (btn) { btn.textContent = 'Cancelar Aula'; btn.disabled = false }
    fecharModalCancelarAula()
    const destino = window._cancelReturnPage || 'prof-aulas'
    window._cancelReturnPage = null
    window.navigate?.(destino)

  } catch (e) {
    window.toast('Erro: ' + e.message)
    if (btn) { btn.textContent = 'Cancelar Aula'; btn.disabled = false }
  }
}

async function _confirmarCancelamentoEmMassa() {
  const infos = _cancelAulaInfo
  if (!infos || infos.length === 0) return

  const justificativa = document.getElementById('input-cancel-justif').value.trim()
  if (justificativa.length < 10) {
    window.toast('Informe um motivo com pelo menos 10 caracteres.')
    document.getElementById('input-cancel-justif').focus()
    return
  }

  const btn = document.querySelector('#modal-cancel-aula .btn-danger')
  if (btn) { btn.textContent = 'Cancelando…'; btn.disabled = true }

  let ok = 0, falhas = 0

  for (const info of infos) {
    try {
      const { error } = await window._sb
        .from('ocorrencias')
        .update({ cancelada: true, motivo_cancel: justificativa })
        .eq('id', info.id)

      if (error) throw new Error(error.message)

      await window._sb
        .rpc('estornar_confirmacoes_ocorrencia', {
          p_ocorrencia_id: info.id,
          p_motivo:        justificativa,
        })
        .then(r => { if (r.error) console.warn('estornar_confirmacoes_ocorrencia:', info.id, r.error.message) })

      ok++
    } catch (e) {
      falhas++
      console.warn('Falha ao cancelar', info.id, e.message)
    }
  }

  if (falhas === 0) {
    window.toast(`✓ ${ok} aula(s) cancelada(s).`)
  } else {
    window.toast(`⚠ ${ok} cancelada(s), ${falhas} falharam. Veja o console.`)
  }

  if (btn) { btn.textContent = 'Cancelar Aula'; btn.disabled = false }
  window._ocsSelecionadas?.clear()
  fecharModalCancelarAula()
  const destino = window._cancelReturnPage || window._currentPage || 'prof-aulas'
  window._cancelReturnPage = null
  window.navigate?.(destino)
}

// ── Inicialização ────────────────────────────────────────────
export function initProfessorCancel() {
  document.getElementById('modal-cancel-aula')
    ?.addEventListener('click', e => {
      if (e.target === e.currentTarget) fecharModalCancelarAula()
    })
}

// Expõe para onclick inline no HTML
window.abrirModalCancelarAula      = abrirModalCancelarAula
window.abrirModalCancelarEmMassa   = abrirModalCancelarEmMassa
window.fecharModalCancelarAula     = fecharModalCancelarAula
window.confirmarCancelamentoAula   = confirmarCancelamentoAula

// ── Cancelamento individual pela grade/admin ──────────────────
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

// ── Seleção múltipla — usada pela grade (admin) e pela lista do professor ──
window._ocsSelecionadas = window._ocsSelecionadas || new Set()

window._toggleOcSelecionada = function(ocId) {
  if (window._ocsSelecionadas.has(ocId)) window._ocsSelecionadas.delete(ocId)
  else window._ocsSelecionadas.add(ocId)
  window._atualizarBarraSelecao?.()
}

// Dispara o modal de cancelamento em massa a partir do cache de ocorrências
// (window._ocsCache, populado pela própria página — grade.js ou aulas.js)
window._abrirCancelamentoEmMassa = function() {
  const ids = [...window._ocsSelecionadas]
  const cache = window._ocsCache || {}
  const infos = ids.map(id => cache[id]).filter(Boolean)
  if (infos.length !== ids.length) {
    window.toast('Alguma aula selecionada não foi encontrada. Atualize a página.')
    return
  }
  window._cancelReturnPage = window._currentPage
  abrirModalCancelarEmMassa(infos)
}    
