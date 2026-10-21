/**
 * src/pages/admin/previsao-professor.js
 * Previsão de repasse — quanto cada professor vai receber no mês
 */

import '../../acoes/pages-admin-previsao-professor.js'   // handlers (antes: eventos inline; ver ferramentas/verifica-handlers.mjs)
import { toast, esc } from '../../modules/utils.js'
import { renderHistoricoRepasse, abrirModalRegistrarRepasse } from './repasse-pago.js'
import { uiAnimar } from '../../modules/ui.js'
// Correção: esta tela nunca integrou o painel de notificações, mesmo estando listada
// em admin_repasse_pendente.paginas (notificacoes.js). Por isso o aviso de "repasse
// não registrado" aparecia no dashboard mas nunca aqui, onde a ação deveria acontecer.
import { carregarNotificacoes, renderPainelNotif, initNotifHandlers,
         calcularBadgesMenu, aplicarBadgesMenu } from '../../modules/notificacoes.js'

function fmtR(v) {
  return 'R$ ' + (v||0).toFixed(2).replace('.', ',')
}

function nomeMes(ym) {
  const [y, m] = ym.split('-')
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return nomes[Number(m)-1] + '/' + y
}

export async function renderPrevisaoProfessor(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  const agora = new Date()
  if (!window._ppMes) window._ppMes = agora.toISOString().slice(0, 7)
  const mesSel = window._ppMes
  if (!window._ppProfId) window._ppProfId = ''
  const profSelId = window._ppProfId

  const mesesDisponiveis = []
  for (let i = 0; i < 13; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    mesesDisponiveis.push(d.toISOString().slice(0, 7))
  }

  const [{ data: professores }, notifs] = await Promise.all([
    sb.from('perfis').select('id, nome').eq('tipo', 'professor').order('nome'),
    carregarNotificacoes(perfil, 'previsao-professor'),
  ])

  let profIdEfetivo = profSelId
  if (!profIdEfetivo && professores?.length === 1) {
    profIdEfetivo = professores[0].id
    window._ppProfId = profIdEfetivo
  }

  let linhas = []
  let errRpc = null
  if (profIdEfetivo) {
    const { data, error } = await sb.rpc('previsao_repasse_professor', {
      p_professor_id: profIdEfetivo,
      p_mes: mesSel,
    })
    linhas = data || []
    errRpc = error
    if (errRpc) console.error('RPC previsao_repasse_professor:', errRpc)
  }

  const porProfAula = {}
  for (const l of linhas) {
    const k = l.professor_id_aula
    if (!porProfAula[k]) {
      porProfAula[k] = {
        professor_nome: l.professor_nome_aula,
        professor_id:   l.professor_id_aula,
        aulas:          0,
        repasse:        0,
        alunos:         [],
      }
    }
    porProfAula[k].aulas   += l.aulas_confirmadas
    porProfAula[k].repasse += Number(l.repasse || 0)
    porProfAula[k].alunos.push(l)
  }

  const totalRepasse = linhas.reduce((s, l) => s + Number(l.repasse || 0), 0)
  const totalAulas   = linhas.reduce((s, l) => s + (l.aulas_confirmadas || 0), 0)
  const profSelecionado = professores?.find(p => p.id === profIdEfetivo)

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Previsão de Repasse</div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <select data-h-change="pages-admin-previsao-professor.3"
          style="border:1px solid var(--borda);border-radius:6px;padding:6px 10px;font-size:12px;font-family:'DM Sans',sans-serif;outline:none;background:var(--superficie);color:var(--txt)">
          <option value="">— Selecionar professor —</option>
          ${(professores||[]).map(p=>
            `<option value="${p.id}" ${profIdEfetivo===p.id?'selected':''}>${esc(p.nome)}</option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="content">
      ${renderPainelNotif(notifs)}

      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <span class="t-mut fw-500">Mês:</span>
        ${mesesDisponiveis.map(m => `
          <button data-h-click="pages-admin-previsao-professor.1" data-a-click="${esc(JSON.stringify([String(m)]))}"
            style="padding:4px 12px;border-radius:20px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${mesSel===m?'var(--verde)':'var(--borda)'};background:${mesSel===m?'var(--verde)':'var(--superficie)'};color:${mesSel===m?'var(--bege)':'var(--txt2)'}">
            ${nomeMes(m)}${m===agora.toISOString().slice(0,7)?' · atual':''}
          </button>`).join('')}
      </div>

      ${!profIdEfetivo
        ? `<div style="text-align:center;padding:48px;font-size:13px;color:var(--txt2)">Selecione um professor para ver a previsão.</div>`
        : errRpc
          ? `<div style="background:var(--err-bg);border:1px solid var(--err-borda);border-radius:8px;padding:16px;font-size:13px;color:var(--err-fg)">
               Erro ao carregar dados: ${esc(errRpc.message)}
             </div>`
          : `
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">
          <div style="background:var(--verde);border-radius:var(--r);padding:16px 18px">
            <div style="font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.7);margin-bottom:6px">Repasse Total</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--bege)">${fmtR(totalRepasse)}</div>
            <div style="font-size:12px;color:rgba(242,236,206,.6);margin-top:3px">${nomeMes(mesSel)} · ${esc(profSelecionado?.nome||'')}</div>
          </div>
          <div class="card card-lg">
            <div class="t-label mb-6">Alunos com presença</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--titulo)">${new Set(linhas.map(l=>l.aluno_id)).size}</div>
            <div class="t-mut mt-3">alunos vinculados</div>
          </div>
          <div class="card card-lg">
            <div class="t-label mb-6">Total de aulas</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--titulo)">${totalAulas}</div>
            <div class="t-mut mt-3">confirmadas com presença</div>
          </div>
        </div>

        ${linhas.length === 0
          ? `<div style="background:var(--superficie);border:1px solid var(--borda);border-radius:var(--r);padding:32px;text-align:center;font-size:13px;color:var(--txt2)">
               Nenhuma presença confirmada para ${esc(profSelecionado?.nome||'este professor')} em ${nomeMes(mesSel)}.
               <br><span style="font-size:12px;margin-top:6px;display:block">O repasse é calculado com base nas presenças confirmadas no mês.</span>
             </div>`
          : `
          ${Object.values(porProfAula).map(grupo => {
            // is_avulso vem da RPC — true significa aulas dadas para alunos de outro professor
            const ehAvulso = !!grupo.alunos[0]?.is_avulso
            return `
            <div class="card-scroll mb-14">
              <div style="padding:12px 18px;background:${!ehAvulso?'rgba(31,56,31,.06)':'rgba(232,188,79,.08)'};border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div class="fs-13 fw-500 c-txt">
                    ${!ehAvulso
                      ? `Aulas do próprio professor`
                      : `Aulas ministradas por ${esc(profSelecionado?.nome||'')} para alunos de <strong>${esc(grupo.professor_nome)}</strong>`
                    }
                  </div>
                  <div class="t-mut mt-2">${grupo.aulas} aula(s) · ${grupo.alunos.length} aluno(s)</div>
                </div>
                <div class="ta-right">
                  <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--titulo)">${fmtR(grupo.repasse)}</div>
                  <div class="t-mut">${ehAvulso ? 'R$ 12,50 por aula avulsa' : 'repasse proporcional'}</div>
                </div>
              </div>
              <div style="padding:0 18px">
                <div style="display:grid;grid-template-columns:1fr 80px 80px 80px 90px 80px;padding:8px 0;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500;gap:8px">
                  <span>Aluno</span><span>Mensal</span><span>Desconto</span><span>Líquido</span><span>Aulas</span><span>Repasse</span>
                </div>
                ${grupo.alunos.map(l => {
                  const totalDesc = (l.desconto_fixo||0) + (l.desconto_avulso||0)
                  return `<div style="display:grid;grid-template-columns:1fr 80px 80px 80px 90px 80px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(212,200,158,.2);font-size:12px;gap:8px">
                    <span class="fw-500">${esc(l.aluno_nome)}</span>
                    <span class="c-txt2">${fmtR(l.valor_mensal)}</span>
                    <span style="color:${totalDesc>0?'var(--warn-vivo)':'var(--txt2)'}">${totalDesc>0?'-'+fmtR(totalDesc):'—'}</span>
                    <span class="fw-500 c-titulo">${fmtR(l.valor_liquido)}</span>
                    <span class="c-txt2">${l.aulas_confirmadas} aula(s)</span>
                    <span class="fw-500 c-titulo">${fmtR(l.repasse)}</span>
                  </div>`
                }).join('')}
              </div>
              <div style="padding:10px 18px;background:rgba(242,236,206,.3);display:flex;justify-content:flex-end;align-items:center;gap:6px">
                <span class="t-mut">Subtotal</span>
                <span style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--titulo)">${fmtR(grupo.repasse)}</span>
              </div>
            </div>`
          }).join('')}

          <div style="background:var(--verde);border-radius:var(--r);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;gap:16px">
            <div>
              <div style="font-size:12px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.7)">Total a pagar para ${esc(profSelecionado?.nome||'professor')}</div>
              <div style="font-size:12px;color:rgba(242,236,206,.5);margin-top:2px">${nomeMes(mesSel)} · baseado em ${totalAulas} presença(s) confirmada(s)</div>
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
              <div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;color:var(--bege)">${fmtR(totalRepasse)}</div>
              <button data-h-click="pages-admin-previsao-professor.2" data-a-click="${esc(JSON.stringify([(totalRepasse)]))}" data-prof="${esc(profIdEfetivo)}" data-nome="${esc(profSelecionado?.nome||'')}" data-mes="${esc(mesSel)}"
                style="padding:8px 16px;background:var(--bege);color:var(--verde);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;font-weight:600;white-space:nowrap">
                <i class="ti ti-coin" aria-hidden="true"></i> Registrar pagamento
              </button>
            </div>
          </div>

          <div style="margin-top:10px;font-size:12px;color:var(--txt2);text-align:center;padding:8px">
            Cálculo: 50% do valor líquido do aluno × (aulas confirmadas com este professor ÷ total de aulas do aluno no mês)
          </div>
          `
        }
        `
      }

    </div>
  `

  if (profIdEfetivo) {
    const contentDiv = container.querySelector('.content')
    if (contentDiv) {
      await renderHistoricoRepasse(contentDiv, profIdEfetivo, true)
    }
  }
  uiAnimar(container)
  initNotifHandlers(notifs, perfil.id)
  aplicarBadgesMenu(calcularBadgesMenu(notifs))
  window.abrirModalRegistrarRepasse = abrirModalRegistrarRepasse
}    
