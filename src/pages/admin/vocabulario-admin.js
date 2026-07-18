/**
 * src/pages/admin/vocabulario.js
 * Gestão do vocabulário — termos que ficam clicáveis automaticamente em
 * qualquer texto do app (ver src/modules/vocabulario.js).
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'
import { invalidarCacheVocabulario } from '../../modules/vocabulario.js'

function _normalizarDiacriticos(str) {
  return String(str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export async function renderVocabularioAdmin(container, page) {
  const sb = window._sb

  const { data: termos, error } = await sb
    .from('vocabulario')
    .select('*')
    .order('termo', { ascending: true })

  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Vocabulário</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Vocabulário</div>
      <button onclick="abrirFormVocab()"
        style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;
               border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;
               display:flex;align-items:center;gap:5px">
        <i class="ti ti-plus"></i> Novo termo
      </button>
    </div>
    <div class="content">
      <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:9px 13px;font-size:12px;color:var(--verde);margin-bottom:14px;display:flex;align-items:center;gap:8px">
        <i class="ti ti-info-circle"></i>
        <span>Termos ficam clicáveis automaticamente em qualquer texto do app. Reconhecimento ignora maiúscula/minúscula e diacríticos — "Sankalpa", "sankalpa" e "saṅkalpa" contam como o mesmo termo.</span>
      </div>

      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 2fr 90px;padding:8px 18px;
                    background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;
                    letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Termo</span><span>Definição</span><span>Ação</span>
        </div>
        ${(termos||[]).length === 0
          ? '<div style="padding:24px 18px;font-size:13px;color:var(--txt2)">Nenhum termo cadastrado ainda.</div>'
          : termos.map(t => `
            <div style="display:grid;grid-template-columns:1fr 2fr 90px;align-items:center;gap:10px;
                        padding:11px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <span style="font-weight:500;color:var(--txt)">${t.termo}</span>
              <span style="color:var(--txt2);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.definicao}</span>
              <div style="display:flex;gap:4px">
                <button onclick="editarVocab('${t.id}')"
                  style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                <button onclick="excluirVocab('${t.id}','${(t.termo||'').replace(/'/g,"\\'")}')"
                  style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
              </div>
            </div>`).join('')
        }
      </div>
    </div>

    <div id="modal-vocab" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                   z-index:200;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:480px;max-width:100%">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)" id="vocab-modal-titulo">Novo Termo</div>
          <button onclick="document.getElementById('modal-vocab').style.display='none'"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <input type="hidden" id="voc-id">
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Termo (forma de exibição)</label>
            <input id="voc-termo" placeholder="ex: Sankalpa"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Definição</label>
            <textarea id="voc-definicao" rows="5" placeholder="O que significa este termo..."
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;resize:vertical"></textarea>
          </div>
        </div>
        <div style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="document.getElementById('modal-vocab').style.display='none'"
            style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button onclick="salvarVocab()"
            style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500">
            <i class="ti ti-check"></i> Salvar
          </button>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  window.abrirFormVocab = function() {
    window._editVocabId = null
    document.getElementById('vocab-modal-titulo').textContent = 'Novo Termo'
    document.getElementById('voc-termo').value = ''
    document.getElementById('voc-definicao').value = ''
    document.getElementById('modal-vocab').style.display = 'flex'
  }

  window.editarVocab = async function(id) {
    const { data: t } = await sb.from('vocabulario').select('*').eq('id', id).single()
    if (!t) { toast('Termo não encontrado'); return }
    window._editVocabId = id
    document.getElementById('vocab-modal-titulo').textContent = `Editar — ${t.termo}`
    document.getElementById('voc-termo').value = t.termo
    document.getElementById('voc-definicao').value = t.definicao
    document.getElementById('modal-vocab').style.display = 'flex'
  }

  window.salvarVocab = async function() {
    const termo = document.getElementById('voc-termo').value.trim()
    const definicao = document.getElementById('voc-definicao').value.trim()
    if (!termo) { toast('Informe o termo'); return }
    if (!definicao) { toast('Informe a definição'); return }

    const payload = {
      termo,
      termo_normalizado: _normalizarDiacriticos(termo),
      definicao,
    }
    let err
    if (window._editVocabId) {
      ;({ error: err } = await sb.from('vocabulario').update(payload).eq('id', window._editVocabId))
    } else {
      ;({ error: err } = await sb.from('vocabulario').insert(payload))
    }
    if (err) { toast('Erro: ' + err.message); return }
    invalidarCacheVocabulario()
    toast('✓ Termo salvo!')
    document.getElementById('modal-vocab').style.display = 'none'
    navigate('vocabulario-admin')
  }

  window.excluirVocab = async function(id, termo) {
    if (!confirm(`Excluir "${termo}"? Esta ação não pode ser desfeita.`)) return
    const { error: err } = await sb.from('vocabulario').delete().eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    invalidarCacheVocabulario()
    toast('✓ Termo excluído.')
    navigate('vocabulario-admin')
  }
}
