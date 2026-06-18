/**
 * src/pages/professor/repasse.js
 * Previsão de repasse do professor logado
 */

import { toast } from '../../modules/utils.js'

function fmtR(v) {
  return 'R$ ' + (v||0).toFixed(2).replace('.', ',')
}

function nomeMes(ym) {
  const [y, m] = ym.split('-')
  const nomes = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
  return nomes[Number(m)-1] + '/' + y
}

export async function renderProfRepasse(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  // usa sempre o perfil do professor logado
  const profId = perfil.id
  const profNome = perfil.nome

  const agora = new Date()
  if (!window._prMes) window._prMes = agora.toISOString().slice(0, 7)
  const mesSel = window._prMes

  const mesesDisponiveis = []
  for (let i = 0; i < 13; i++) {
    const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1)
    mesesDisponiveis.push(d.toISOString().slice(0, 7))
  }

  let linhas = []
  let errRpc = null
  const { data, error } = await sb.rpc('previsao_repasse_professor', {
    p_professor_id: profId,
    p_mes: mesSel,
  })
  linhas = data || []
  errRpc = error
  if (errRpc) console.error('RPC previsao_repasse_professor:', errRpc)

  // agrupa por professor da aula
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

  container.innerHTML = `
    <div class="topbar">
      <div class="topbar-t">Meu Repasse</div>
      <div style="font-size:11px;color:var(--txt2)">${profNome}</div>
    </div>
    <div class="content">

      <!-- aviso de estimativa -->
      <div style="background:rgba(232,188,79,.1);border:1px solid rgba(232,188,79,.35);border-radius:6px;padding:10px 14px;display:flex;align-items:center;gap:8px;font-size:12px;color:#7a5a10;margin-bottom:16px">
        <i class="ti ti-info-circle" style="font-size:16px;color:var(--dourado);flex-shrink:0"></i>
        <span><strong>Estimativa.</strong> O valor final é calculado no fechamento do mês, considerando todas as presenças confirmadas até o dia do pagamento.</span>
      </div>

      <!-- seletor de mês -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--txt2);font-weight:500">Mês:</span>
        ${mesesDisponiveis.map(m => `
          <button onclick="window._prMes='${m}';navigate('prof-repasse')"
            style="padding:4px 12px;border-radius:20px;font-size:11px;cursor:pointer;font-family:'DM Sans',sans-serif;border:1px solid ${mesSel===m?'var(--verde)':'var(--borda)'};background:${mesSel===m?'var(--verde)':'#fff'};color:${mesSel===m?'var(--bege)':'var(--txt2)'}">
            ${nomeMes(m)}${m===agora.toISOString().slice(0,7)?' · atual':''}
          </button>`).join('')}
      </div>

      ${errRpc
        ? `<div style="background:#fceaea;border:1px solid #f5c1c1;border-radius:8px;padding:16px;font-size:13px;color:#8a1a1a">
             Erro ao carregar dados: ${errRpc.message}
           </div>`
        : `
        <!-- cards de resumo -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:18px">
          <div style="background:var(--verde);border-radius:var(--r);padding:16px 18px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.7);margin-bottom:6px">Repasse estimado</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--bege)">${fmtR(totalRepasse)}</div>
            <div style="font-size:11px;color:rgba(242,236,206,.6);margin-top:3px">${nomeMes(mesSel)}</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Alunos com presença</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--verde)">${new Set(linhas.filter(l=>l.aulas_confirmadas>0).map(l=>l.aluno_id)).size}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:3px">de ${new Set(linhas.map(l=>l.aluno_id)).size} alunos</div>
          </div>
          <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px">
            <div style="font-size:10px;text-transform:uppercase;letter-spacing:.8px;color:var(--txt2);margin-bottom:6px">Total de aulas</div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:28px;font-weight:500;color:var(--verde)">${totalAulas}</div>
            <div style="font-size:10px;color:var(--txt2);margin-top:3px">confirmadas com presença</div>
          </div>
        </div>

        ${linhas.length === 0
          ? `<div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:32px;text-align:center;font-size:13px;color:var(--txt2)">
               Nenhum dado para ${nomeMes(mesSel)}.
             </div>`
          : `
          ${Object.values(porProfAula).map(grupo => {
            const ehProprio = grupo.professor_id === profId
            return `
            <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:14px">
              <div style="padding:12px 18px;background:${ehProprio?'rgba(31,56,31,.06)':'rgba(232,188,79,.08)'};border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
                <div>
                  <div style="font-size:13px;font-weight:500;color:var(--txt)">
                    ${ehProprio
                      ? `Minhas aulas`
                      : `Aulas de <strong>${grupo.professor_nome}</strong> que ministrei`
                    }
                  </div>
                  <div style="font-size:11px;color:var(--txt2);margin-top:2px">${grupo.aulas} aula(s) · ${grupo.alunos.length} aluno(s)</div>
                </div>
                <div style="text-align:right">
                  <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500;color:var(--verde)">${fmtR(grupo.repasse)}</div>
                  <div style="font-size:10px;color:var(--txt2)">repasse estimado</div>
                </div>
              </div>

              <div style="padding:0 18px">
                <div style="display:grid;grid-template-columns:1fr 80px 80px 80px 90px 80px;padding:8px 0;border-bottom:1px solid rgba(212,200,158,.3);font-size:10px;text-transform:uppercase;letter-spacing:.6px;color:var(--txt2);font-weight:500;gap:8px">
                  <span>Aluno</span><span>Mensal</span><span>Desconto</span><span>Líquido</span><span>Aulas</span><span>Repasse</span>
                </div>
                ${grupo.alunos.map(l => {
                  const totalDesc = (l.desconto_fixo||0) + (l.desconto_avulso||0)
                  return `<div style="display:grid;grid-template-columns:1fr 80px 80px 80px 90px 80px;align-items:center;padding:9px 0;border-bottom:1px solid rgba(212,200,158,.2);font-size:12px;gap:8px">
                    <span style="font-weight:500">${l.aluno_nome}</span>
                    <span style="color:var(--txt2)">${fmtR(l.valor_mensal)}</span>
                    <span style="color:${totalDesc>0?'#e67e22':'var(--txt2)'}">${totalDesc>0?'-'+fmtR(totalDesc):'—'}</span>
                    <span style="font-weight:500;color:var(--verde)">${fmtR(l.valor_liquido)}</span>
                    <span style="color:var(--txt2)">${l.aulas_confirmadas} aula(s)</span>
                    <span style="font-weight:500;color:var(--verde)">${fmtR(l.repasse)}</span>
                  </div>`
                }).join('')}
              </div>

              <div style="padding:10px 18px;background:rgba(242,236,206,.3);display:flex;justify-content:flex-end;align-items:center;gap:6px">
                <span style="font-size:11px;color:var(--txt2)">Subtotal</span>
                <span style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde)">${fmtR(grupo.repasse)}</span>
              </div>
            </div>`
          }).join('')}

          <!-- total final -->
          <div style="background:var(--verde);border-radius:var(--r);padding:16px 20px;display:flex;align-items:center;justify-content:space-between">
            <div>
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:.8px;color:rgba(242,236,206,.7)">Total estimado — ${nomeMes(mesSel)}</div>
              <div style="font-size:11px;color:rgba(242,236,206,.5);margin-top:2px">Valor sujeito a alteração até o fechamento do mês</div>
            </div>
            <div style="font-family:'Cormorant Garamond',serif;font-size:32px;font-weight:500;color:var(--bege)">${fmtR(totalRepasse)}</div>
          </div>

          <div style="margin-top:10px;font-size:11px;color:var(--txt2);text-align:center;padding:8px">
            Cálculo: 50% da mensalidade por aluno vinculado · R$12,50 por aula avulsa ministrada · R$12,50 descontado por aula avulsa de outro professor
          </div>
          `
        }
        `
      }
    </div>
  `
}
