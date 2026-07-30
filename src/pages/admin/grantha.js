/**
 * src/pages/admin/grantha.js
 * Grantha Mandir — biblioteca de textos clássicos e artigos.
 *
 * Obras clássicas (tipo='obra_classica') têm estrutura em versos, geridos
 * na tabela grantha_versos (capítulo/número/devanāgarī/transliteração/tradução).
 * Artigos (tipo='artigo') usam o campo 'conteudo' direto, sem versos.
 */

import { toast } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

const CATEGORIAS = [
  { valor: 'yoga_classico', label: 'Yoga Clássico' },
  { valor: 'upanishads',    label: 'Upaniṣads' },
  { valor: 'vedas',         label: 'Vedas' },
  { valor: 'hatha_yoga',    label: 'Hatha Yoga' },
  { valor: 'outro',         label: 'Outro' },
]

function _catLabel(v) { return CATEGORIAS.find(c => c.valor === v)?.label || v || '—' }
function _esc(str) { return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;') }

export async function renderGranthaAdmin(container, page) {
  const sb = window._sb

  const { data: granthas, error } = await sb.from('grantha_mandir').select('*').order('titulo')
  if (error) {
    container.innerHTML = `<div class="topbar"><div class="topbar-t">Grantha Mandir</div></div>
      <div class="content"><p style="color:#c0392b">Erro: ${error.message}</p></div>`
    return
  }

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Grantha Mandir</div>
      <button onclick="abrirFormGrantha()"
        style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;
               font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;display:flex;align-items:center;gap:5px">
        <i class="ti ti-plus"></i> Nova obra/artigo
      </button>
    </div>
    <div class="content">
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden">
        <div style="display:grid;grid-template-columns:1fr 110px 130px 140px;padding:8px 18px;
                    background:rgba(242,236,206,.45);font-size:10px;text-transform:uppercase;
                    letter-spacing:.7px;color:var(--txt2);font-weight:500;gap:10px">
          <span>Título</span><span>Tipo</span><span>Categoria</span><span>Ação</span>
        </div>
        ${(granthas||[]).length === 0
          ? '<div style="padding:24px 18px;font-size:13px;color:var(--txt2)">Nenhuma obra ou artigo cadastrado ainda.</div>'
          : granthas.map(g => `
            <div style="display:grid;grid-template-columns:1fr 110px 130px 140px;align-items:center;gap:10px;
                        padding:11px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <div>
                <div style="font-weight:500;color:var(--txt)">${g.titulo}</div>
                ${g.autor ? `<div style="font-size:10px;color:var(--txt2)">${g.autor}${g.periodo ? ' · '+g.periodo : ''}</div>` : ''}
              </div>
              <span style="font-size:11px;color:var(--txt2)">${g.tipo === 'obra_classica' ? 'Obra clássica' : 'Artigo'}</span>
              <span style="font-size:11px;color:var(--txt2)">${_catLabel(g.categoria)}</span>
              <div style="display:flex;gap:4px">
                ${g.tipo === 'obra_classica'
                  ? `<button onclick="abrirVersos('${g.id}','${_esc(g.titulo).replace(/'/g,"\\'")}')"
                       style="padding:3px 8px;background:rgba(31,56,31,.08);color:var(--verde);border:none;border-radius:4px;font-size:10px;cursor:pointer" title="Gerenciar versos">📜</button>`
                  : ''}
                <button onclick="editarGrantha('${g.id}')"
                  style="padding:3px 8px;background:#e8f4e8;color:#1a5a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✎</button>
                <button onclick="excluirGrantha('${g.id}','${_esc(g.titulo).replace(/'/g,"\\'")}')"
                  style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
              </div>
            </div>`).join('')
        }
      </div>
    </div>

    <!-- Modal metadados (novo/editar) -->
    <div id="modal-grantha" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                     z-index:200;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto">
      <div style="background:#fff;border-radius:12px;width:520px;max-width:100%;margin:auto">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)" id="grantha-modal-titulo">Nova obra/artigo</div>
          <button onclick="document.getElementById('modal-grantha').style.display='none'"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <input type="hidden" id="gr-id">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Tipo</label>
              <select id="gr-tipo" onchange="toggleTipoGrantha()"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
                <option value="obra_classica">Obra clássica (em versos)</option>
                <option value="artigo">Artigo (texto corrido)</option>
              </select>
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Categoria</label>
              <select id="gr-categoria"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
                ${CATEGORIAS.map(c => `<option value="${c.valor}">${c.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Título</label>
            <input id="gr-titulo" placeholder="ex: Yoga Sūtra de Patañjali"
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Autor</label>
              <input id="gr-autor" placeholder="ex: Patañjali"
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
            </div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Período</label>
              <input id="gr-periodo" placeholder="ex: séc. II a.C. – IV d.C."
                style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Capa (link de imagem, opcional)</label>
            <input id="gr-capa" placeholder="https://i.imgur.com/..."
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Descrição curta</label>
            <textarea id="gr-descricao" rows="2" placeholder="Uma ou duas frases sobre a obra..."
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;resize:vertical"></textarea>
          </div>
          <div id="gr-conteudo-wrap" style="display:none;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Conteúdo do artigo</label>
            <textarea id="gr-conteudo" rows="10" placeholder="Texto completo do artigo..."
              style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;resize:vertical"></textarea>
          </div>
        </div>
        <div style="padding:0 20px 20px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="document.getElementById('modal-grantha').style.display='none'"
            style="padding:8px 16px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button onclick="salvarGrantha()"
            style="padding:8px 16px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:500">
            <i class="ti ti-check"></i> Salvar
          </button>
        </div>
      </div>
    </div>

    <!-- Modal versos -->
    <div id="modal-versos" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);
                                    z-index:200;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto">
      <div style="background:#fff;border-radius:12px;width:680px;max-width:100%;margin:auto">
        <div style="background:var(--verde);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)" id="versos-modal-titulo">Versos</div>
          <button onclick="document.getElementById('modal-versos').style.display='none'"
            style="background:none;border:none;color:var(--bege);font-size:22px;cursor:pointer;line-height:1">×</button>
        </div>
        <div style="padding:20px">
          <div style="background:rgba(31,56,31,.04);border:1px solid rgba(31,56,31,.12);border-radius:6px;padding:10px 14px;margin-bottom:14px">
            <div style="font-size:11px;font-weight:500;color:var(--verde);margin-bottom:6px">Importar versos em lote (JSON)</div>
            <div style="font-size:10px;color:var(--txt2);margin-bottom:8px">
              Formato: <code>[{"capitulo":"Samādhipāda","capitulo_ordem":1,"numero":1,"numero_fim":null,"texto_devanagari":"...","transliteracao":"...","traducao":"..."}]</code>
            </div>
            <textarea id="versos-json-textarea" rows="5" placeholder="Cole o array JSON aqui..."
              style="width:100%;border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:11px;font-family:monospace;outline:none;resize:vertical;box-sizing:border-box;margin-bottom:8px"></textarea>
            <button onclick="importarVersosJson()"
              style="padding:6px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
              <i class="ti ti-upload"></i> Importar versos
            </button>
            <span id="versos-import-status" style="font-size:11px;color:var(--txt2);margin-left:8px"></span>
          </div>

          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500;margin-bottom:8px">
            Versos cadastrados (<span id="versos-count">0</span>)
          </div>
          <div id="versos-lista-container" style="max-height:360px;overflow-y:auto"></div>
        </div>
      </div>
    </div>
  `

  uiAnimar(container)

  window.toggleTipoGrantha = function() {
    const tipo = document.getElementById('gr-tipo').value
    document.getElementById('gr-conteudo-wrap').style.display = tipo === 'artigo' ? 'flex' : 'none'
  }

  window.abrirFormGrantha = function() {
    window._editGranthaId = null
    document.getElementById('grantha-modal-titulo').textContent = 'Nova obra/artigo'
    document.getElementById('gr-tipo').value = 'obra_classica'
    document.getElementById('gr-categoria').value = 'yoga_classico'
    document.getElementById('gr-titulo').value = ''
    document.getElementById('gr-autor').value = ''
    document.getElementById('gr-periodo').value = ''
    document.getElementById('gr-capa').value = ''
    document.getElementById('gr-descricao').value = ''
    document.getElementById('gr-conteudo').value = ''
    toggleTipoGrantha()
    document.getElementById('modal-grantha').style.display = 'flex'
  }

  window.editarGrantha = async function(id) {
    const { data: g } = await sb.from('grantha_mandir').select('*').eq('id', id).single()
    if (!g) { toast('Não encontrado'); return }
    window._editGranthaId = id
    document.getElementById('grantha-modal-titulo').textContent = `Editar — ${g.titulo}`
    document.getElementById('gr-tipo').value = g.tipo
    document.getElementById('gr-categoria').value = g.categoria || 'outro'
    document.getElementById('gr-titulo').value = g.titulo || ''
    document.getElementById('gr-autor').value = g.autor || ''
    document.getElementById('gr-periodo').value = g.periodo || ''
    document.getElementById('gr-capa').value = g.capa_url || ''
    document.getElementById('gr-descricao').value = g.descricao || ''
    document.getElementById('gr-conteudo').value = g.conteudo || ''
    toggleTipoGrantha()
    document.getElementById('modal-grantha').style.display = 'flex'
  }

  window.salvarGrantha = async function() {
    const tipo = document.getElementById('gr-tipo').value
    const titulo = document.getElementById('gr-titulo').value.trim()
    if (!titulo) { toast('Informe o título'); return }
    const payload = {
      tipo,
      titulo,
      autor: document.getElementById('gr-autor').value.trim() || null,
      categoria: document.getElementById('gr-categoria').value || null,
      periodo: document.getElementById('gr-periodo').value.trim() || null,
      capa_url: document.getElementById('gr-capa').value.trim() || null,
      descricao: document.getElementById('gr-descricao').value.trim() || null,
      conteudo: tipo === 'artigo' ? (document.getElementById('gr-conteudo').value.trim() || null) : null,
    }
    let err
    if (window._editGranthaId) {
      ;({ error: err } = await sb.from('grantha_mandir').update(payload).eq('id', window._editGranthaId))
    } else {
      ;({ error: err } = await sb.from('grantha_mandir').insert(payload))
    }
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Salvo!')
    document.getElementById('modal-grantha').style.display = 'none'
    navigate('grantha-admin')
  }

  window.excluirGrantha = async function(id, titulo) {
    if (!confirm(`Excluir "${titulo}" e todos os seus versos? Esta ação não pode ser desfeita.`)) return
    const { error: err } = await sb.from('grantha_mandir').delete().eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    toast('✓ Excluído.')
    navigate('grantha-admin')
  }

  // ── Gestão de versos ─────────────────────────────────────────
  window.abrirVersos = async function(granthaId, titulo) {
    window._versosGranthaId = granthaId
    document.getElementById('versos-modal-titulo').textContent = `Versos — ${titulo}`
    document.getElementById('versos-json-textarea').value = ''
    document.getElementById('versos-import-status').textContent = ''
    document.getElementById('modal-versos').style.display = 'flex'
    await _carregarListaVersos()
  }

  async function _carregarListaVersos() {
    const { data: versos } = await sb.from('grantha_versos')
      .select('*').eq('grantha_id', window._versosGranthaId).order('ordem', { ascending: true })
    document.getElementById('versos-count').textContent = (versos || []).length
    const cont = document.getElementById('versos-lista-container')
    if (!versos?.length) {
      cont.innerHTML = '<div style="font-size:12px;color:var(--txt2);padding:8px 0">Nenhum verso cadastrado ainda.</div>'
      return
    }
    cont.innerHTML = versos.map(v => `
      <div style="display:grid;grid-template-columns:1fr 60px;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
        <div>
          <div style="font-weight:500;color:var(--txt)">${v.capitulo} ${v.numero}${v.numero_fim ? '–'+v.numero_fim : ''}</div>
          <div style="font-size:10px;color:var(--txt2);font-style:italic">${v.transliteracao}</div>
        </div>
        <button onclick="excluirVerso('${v.id}')"
          style="padding:3px 8px;background:#fceaea;color:#8a1a1a;border:none;border-radius:4px;font-size:10px;cursor:pointer">✕</button>
      </div>`).join('')
  }

  window.excluirVerso = async function(id) {
    if (!confirm('Excluir este verso?')) return
    const { error: err } = await sb.from('grantha_versos').delete().eq('id', id)
    if (err) { toast('Erro: ' + err.message); return }
    await _carregarListaVersos()
  }

  window.importarVersosJson = async function() {
    const raw = document.getElementById('versos-json-textarea').value.trim()
    const status = document.getElementById('versos-import-status')
    if (!raw) { toast('Cole o JSON primeiro'); return }
    let itens
    try {
      itens = JSON.parse(raw)
      if (!Array.isArray(itens)) throw new Error('não é um array')
    } catch (e) {
      status.innerHTML = `<span style="color:#c0392b">JSON inválido: ${e.message}</span>`
      return
    }

    const { data: existentes } = await sb.from('grantha_versos')
      .select('ordem').eq('grantha_id', window._versosGranthaId).order('ordem', { ascending: false }).limit(1)
    let proximaOrdem = (existentes?.[0]?.ordem || 0) + 1

    const registros = itens.map(v => ({
      grantha_id: window._versosGranthaId,
      capitulo: v.capitulo,
      capitulo_ordem: v.capitulo_ordem,
      numero: v.numero,
      numero_fim: v.numero_fim || null,
      texto_devanagari: v.texto_devanagari,
      transliteracao: v.transliteracao,
      traducao: v.traducao,
      ordem: proximaOrdem++,
    }))

    const { error: err } = await sb.from('grantha_versos').insert(registros)
    if (err) { status.innerHTML = `<span style="color:#c0392b">Erro: ${err.message}</span>`; return }
    status.innerHTML = `<span style="color:#1a5a1a">✓ ${registros.length} verso(s) importado(s)</span>`
    document.getElementById('versos-json-textarea').value = ''
    await _carregarListaVersos()
  }
}
