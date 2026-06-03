/**
 * src/pages/aluno/conquistas.js
 * Responsabilidade: Conquistas e pontos prāṇa do aluno.
 * Depende de: sb, toast, NOMES, dot, badge, card, fmtDt, inputStyle
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'

export async function renderConquistas(container) {

    const userId = window._perfil.id
    const [conquistas, gam] = await Promise.all([getConquistas(userId), getGamificacao(userId)])
    const nivel = calcularNivel(gam?.prana_points||0)
    const proxNivel = nivel < 5 ? NIVEL_PONTOS[nivel+1] : null
    const progresso = proxNivel ? Math.round((gam?.prana_points||0)/proxNivel*100) : 100

    container.innerHTML = `
      <div class="topbar"><div class="topbar-t">Conquistas</div></div>
      <div class="content">
        <div style="background:var(--verde);border-radius:var(--r);padding:20px;margin-bottom:16px;color:var(--bege);text-align:center">
          <div style="font-size:40px;margin-bottom:6px">${NIVEL_LABELS[nivel]}</div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:500">${gam?.prana_points||0} Prana Points</div>
          ${proxNivel?`<div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:6px">Próximo: ${NIVEL_LABELS[nivel+1]} · faltam ${proxNivel-(gam?.prana_points||0)} pts</div><div style="background:rgba(242,236,206,.2);border-radius:20px;height:6px;margin:8px auto 0;width:80%;overflow:hidden"><div style="background:var(--dourado);height:6px;border-radius:20px;width:${progresso}%"></div></div>`:'<div style="color:var(--dourado);margin-top:6px">🎉 Nível máximo!</div>'}
          <div style="display:flex;justify-content:center;gap:24px;margin-top:14px;font-size:12px">
            <div><div style="font-size:10px;opacity:.7">Sequência atual</div><div style="font-size:20px">${gam?.streak_atual||0}🔥</div></div>
            <div><div style="font-size:10px;opacity:.7">Recorde</div><div style="font-size:20px">${gam?.streak_max||0}</div></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px">
          ${conquistas.map(c=>`<div style="background:#fff;border:${c.desbloqueada?'2px solid var(--dourado)':'1px solid var(--borda)'};border-radius:var(--r);padding:13px;display:flex;align-items:center;gap:10px;${!c.desbloqueada?'opacity:.45':''}">
            <div style="font-size:26px;flex-shrink:0">${c.icone}</div>
            <div>
              <div style="font-weight:500;font-size:12px;color:var(--verde)">${c.nome}</div>
              <div style="font-size:10px;color:var(--txt2);margin-top:1px">${c.descricao}</div>
              <div style="font-size:10px;color:var(--dourado);margin-top:2px;font-weight:500">+${c.pontos} pts${c.desbloqueada&&c.quando?' · '+new Date(c.quando).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}):''}</div>
            </div>
          </div>`).join('')}
        </div>
      </div>
    `
  }
