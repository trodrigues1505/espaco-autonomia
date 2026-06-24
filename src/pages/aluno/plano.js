/**
 * src/pages/aluno/plano.js
 * Meu plano — detalhes, saldo e edição de perfil
 */

import { sb }         from '../../lib/supabase.js'
import { toast, NOMES, CORES, dot, badge, card, modal, fi, inputStyle, fmtDt, prazoLabel,
          PLANO_BADGES, PLANO_NOMES, PLANO_VALORES, PLANO_OPCOES, DIAS_LABEL, HORARIOS,
          calcularNivel, NIVEL_LABELS } from '../../modules/utils.js'
import { uiAnimar } from '../../modules/ui.js'

// Descrições fixas de cada benefício
const FEAT_DESCRICOES = {
  sangha: {
    titulo: 'Sangha — Grupo WhatsApp',
    texto: 'Acesso ao grupo exclusivo de alunos do seu plano no WhatsApp. É o espaço de comunidade onde compartilhamos avisos, trocas e o espírito do Espaço Autonomia.',
    temLink: true,
  },
  kala_sadhya: {
    titulo: 'Kala Sadhya — Agenda Flex',
    texto: 'Com o Kala Sadhya você pode trocar o dia e horário das suas aulas dentro do mês, sem custo adicional. Basta cancelar sua aula com antecedência e confirmar presença em outra turma disponível na grade. A flexibilidade é uma prática também.',
    temLink: false,
  },
  asana_marga: {
    titulo: 'Asana Marga — App de Prática',
    texto: 'Acesso ao aplicativo de prática guiada para realizar sua sadhana em casa. Sequências, respirações e meditações disponíveis a qualquer hora.',
    temLink: false,
  },
  yoga_adhyayana: {
    titulo: 'Yoga Adhyayana — Estudo Teórico',
    texto: 'Material de apoio teórico sobre filosofia e história do Yoga. Conteúdo enviado periodicamente para aprofundar o estudo além das aulas.',
    temLink: false,
  },
  jnana_marga: {
    titulo: 'Jnana Marga — Estudo Literário',
    texto: 'Indicações e estudos de textos clássicos do Yoga como o Hatha Yoga Pradipika, Yoga Sutras e Bhagavad Gita. Uma jornada de leitura contemplativa.',
    temLink: false,
  },
  sadhana_purna: {
    titulo: 'Sadhana Purna — Avaliação de Progresso',
    texto: 'Avaliação periódica do seu desenvolvimento na prática. Conversas e registros sobre sua evolução física, mental e espiritual ao longo da jornada.',
    temLink: false,
  },
  atma_vijnana: {
    titulo: 'Atma Vijnana — Anamnese Personalizada',
    texto: 'Uma conversa inicial aprofundada para mapear seu histórico, objetivos e limitações. A prática começa pelo autoconhecimento.',
    temLink: false,
  },
  shruti: {
    titulo: 'Shruti — Áudio Diário',
    texto: 'Receba diariamente um áudio curto com mantras, pranayamas ou reflexões para integrar o Yoga ao cotidiano.',
    temLink: false,
  },
  naada_mandir: {
    titulo: 'Naada Mandir — Biblioteca de Mantras',
    texto: 'Acesso à biblioteca de áudios com mantras para prática, estudo e meditação. Do Om ao Gayatri, do Mrityunjaya ao Shanti Path.',
    temLink: false,
  },
}

export async function renderAlunoPlano(container, page) {
  const sb = window._sb
  const perfil = window._perfil

  const [matRes, planosRes, saldoRes] = await Promise.all([
    sb.from('matriculas').select('*, plano:planos(*)').eq('aluno_id', perfil.id).eq('ativa',true).single(),
    sb.from('planos').select('*').order('preco_1x'),
    sb.from('saldo_disponivel').select('saldo_total').eq('aluno_id', perfil.id).single(),
  ])

  const mat    = matRes.data
  const plano  = mat?.plano
  const todos  = planosRes.data || []
  const saldo  = saldoRes.data?.saldo_total ?? null
  const ehLivre = mat?.plano_tipo === 'vishnu_livre' || mat?.opcao_aulas === 99

  // descontos
  const descontoFixo   = mat?.desconto_fixo || 0
  const descAvulsoAtivo = mat && mat.desconto_avulso_meses > mat.desconto_avulso_usado
  const descontoAvulso = descAvulsoAtivo ? (mat.desconto_avulso_valor || 0) : 0
  const totalDesconto  = descontoFixo + descontoAvulso
  const valorLiquido   = mat ? Math.max(0, (mat.valor_mensal || 0) - totalDesconto) : 0

  const vencimento    = mat?.fim ? new Date(mat.fim+'T12:00') : null
  const diasRestantes = vencimento ? Math.ceil((vencimento-new Date())/(1000*60*60*24)) : null

  const { data: pgAluno } = await sb.from('pagamentos').select('*').eq('aluno_id', perfil.id).order('vencimento',{ascending:false}).limit(6)
  const pgAtual   = (pgAluno||[]).find(p=>p.mes_ref?.slice(0,7)===new Date().toISOString().slice(0,7))
  const pgStatusOk = !pgAluno?.length || pgAtual?.status==='RECEIVED' || pgAtual?.status==='CONFIRMED'

  const pgStatusLabel = {RECEIVED:'Pago ✓',CONFIRMED:'Confirmado ✓',OVERDUE:'Em atraso ⚠',PENDING:'Aguardando pagamento',CANCELLED:'Cancelado',REFUNDED:'Devolvido'}
  const pgStatusColor = {RECEIVED:'#1a5a1a',CONFIRMED:'#1a5a1a',OVERDUE:'#c0392b',PENDING:'#e67e22',CANCELLED:'#5a5a4a',REFUNDED:'#5a5a4a'}

  // lista de benefícios ativos no plano
  const beneficiosAtivos = Object.keys(FEAT_DESCRICOES).filter(f => plano?.[f])

  container.innerHTML = `
    <div class="topbar"><div class="topbar-t">Meu Plano</div></div>
    <div class="content">

      <!-- Perfil -->
      <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);padding:16px 18px;margin-bottom:14px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">Meus Dados</div>
          <button onclick="abrirEditarPerfil()" style="padding:5px 12px;background:transparent;border:1px solid var(--borda);border-radius:5px;font-size:11px;cursor:pointer;color:var(--txt2);font-family:'DM Sans',sans-serif">✎ Editar</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;gap:8px;font-size:13px">
            <span style="color:var(--txt2);min-width:70px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;padding-top:1px">Nome</span>
            <span id="perfil-nome-display" style="font-weight:500">${perfil.nome}</span>
          </div>
          <div style="display:flex;gap:8px;font-size:13px">
            <span style="color:var(--txt2);min-width:70px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;padding-top:1px">E-mail</span>
            <span style="color:var(--txt2)">${perfil.email}</span>
          </div>
          ${perfil.telefone
            ? `<div style="display:flex;gap:8px;font-size:13px">
                <span style="color:var(--txt2);min-width:70px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;padding-top:1px">Telefone</span>
                <span id="perfil-tel-display">${perfil.telefone}</span>
               </div>`
            : `<div style="display:flex;gap:8px;font-size:13px">
                <span style="color:var(--txt2);min-width:70px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;padding-top:1px">Telefone</span>
                <span id="perfil-tel-display" style="color:#c0392b;font-size:12px">Não cadastrado</span>
               </div>`
          }
        </div>
      </div>

      ${!mat
        ? `<div style="text-align:center;padding:40px;font-size:13px;color:var(--txt2)">Nenhuma matrícula ativa. Entre em contato com o Espaço Autonomia.</div>`
        : `
        <!-- Card do plano -->
        <div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:16px">
          <div style="padding:18px;background:var(--verde)">
            <div style="font-family:'Cormorant Garamond',serif;font-size:22px;font-weight:500;color:var(--bege)">Plano ${plano?.nome||mat.plano_tipo}</div>
            <div style="margin-top:8px">
              ${totalDesconto > 0
                ? `<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap">
                    <span style="font-size:16px;font-family:'Cormorant Garamond',serif;color:rgba(242,236,206,.5);text-decoration:line-through">R$${mat.valor_mensal}</span>
                    <span style="font-size:28px;font-family:'Cormorant Garamond',serif;font-weight:600;color:var(--dourado)">R$${valorLiquido.toFixed(2).replace('.',',')}<span style="font-size:13px;font-weight:400;opacity:.8">/mês</span></span>
                  </div>
                  <div style="font-size:11px;color:rgba(242,236,206,.7);margin-top:3px">
                    🏷 ${descontoFixo > 0 ? 'Desconto fixo: R$' + descontoFixo.toFixed(2) : ''}
                    ${descontoAvulso > 0 ? (descontoFixo>0?' + ':'') + 'Desconto avulso: R$' + descontoAvulso.toFixed(2) + ' (' + (mat.desconto_avulso_meses - mat.desconto_avulso_usado) + ' mês(es) restante(s))' : ''}
                  </div>`
                : `<div style="font-size:24px;font-family:'Cormorant Garamond',serif;font-weight:600;color:var(--dourado)">R$${mat.valor_mensal}<span style="font-size:13px;font-weight:400;opacity:.8">/mês</span></div>`
              }
            </div>
            ${vencimento
              ? `<div style="font-size:12px;color:rgba(242,236,206,.7);margin-top:6px">Vencimento: ${vencimento.toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})} ${diasRestantes!==null?'· '+diasRestantes+' dias restantes':''}</div>`
              : ''
            }
          </div>

          <!-- Benefícios -->
          <div style="padding:16px 18px">
            <div style="font-size:11px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);margin-bottom:10px">Seus Benefícios</div>
            ${beneficiosAtivos.length === 0
              ? `<div style="font-size:12px;color:var(--txt2)">Nenhum benefício especial neste plano.</div>`
              : beneficiosAtivos.map(f => {
                  const b = FEAT_DESCRICOES[f]
                  const linkSangha = f === 'sangha' && plano?.whatsapp_sangha
                  return `<div style="border:1px solid var(--borda);border-radius:8px;margin-bottom:8px;overflow:hidden">
                    <button onclick="toggleBeneficio('${f}')" style="width:100%;display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:none;border:none;cursor:pointer;text-align:left;font-family:'DM Sans',sans-serif">
                      <div style="display:flex;align-items:center;gap:8px">
                        <span style="color:var(--verde);font-weight:500;font-size:12px">✓</span>
                        <span style="font-size:12px;font-weight:500;color:var(--txt)">${b.titulo}</span>
                      </div>
                      <span id="chevron-${f}" style="font-size:10px;color:var(--txt2);transition:transform .2s">▼</span>
                    </button>
                    <div id="desc-${f}" style="display:none;padding:0 14px 12px;font-size:12px;color:var(--txt2);line-height:1.6;border-top:1px solid rgba(212,200,158,.3)">
                      <div style="padding-top:10px">${b.texto}</div>
                      ${linkSangha
                        ? `<a href="${plano.whatsapp_sangha}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;margin-top:12px;padding:8px 16px;background:#25d366;color:#fff;border-radius:6px;text-decoration:none;font-size:12px;font-weight:500;font-family:'DM Sans',sans-serif">
                            📱 Entrar no grupo WhatsApp
                           </a>`
                        : ''
                      }
                    </div>
                  </div>`
                }).join('')
            }

            <!-- Benefícios não incluídos -->
            ${Object.keys(FEAT_DESCRICOES).filter(f => !plano?.[f]).length > 0
              ? `<details style="margin-top:8px">
                  <summary style="font-size:11px;color:var(--txt2);cursor:pointer;list-style:none;display:flex;align-items:center;gap:4px">
                    <span>▶</span> Ver benefícios não incluídos no seu plano
                  </summary>
                  <div style="margin-top:6px">
                    ${Object.keys(FEAT_DESCRICOES).filter(f => !plano?.[f]).map(f =>
                      `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:11px;color:#ccc;text-decoration:line-through">
                        <span>—</span>${FEAT_DESCRICOES[f].titulo}
                       </div>`
                    ).join('')}
                  </div>
                </details>`
              : ''
            }
          </div>
        </div>

        ${mat.plano_tipo !== 'vishnu_livre'
          ? `<div style="background:rgba(232,188,79,.08);border:1px solid rgba(232,188,79,.3);border-radius:var(--r);padding:16px 18px;margin-bottom:16px">
              <div style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde);margin-bottom:6px">Quer mais?</div>
              <div style="font-size:12px;color:var(--txt2);margin-bottom:12px">Faça upgrade e acesse mais modalidades e benefícios.</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                ${todos.filter(p=>p.tipo!==mat.plano_tipo&&(p.preco_1x||0)>(plano?.preco_1x||0)).map(p=>`
                  <button style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
                    Upgrade para ${p.nome} · R$${p.preco_1x}/mês
                  </button>`).join('')}
              </div>
            </div>`
          : ''
        }
        `
      }

      <!-- Histórico de pagamentos -->
      ${(pgAluno||[]).length
        ? `<div style="background:#fff;border:1px solid var(--borda);border-radius:var(--r);overflow:hidden;margin-bottom:14px">
            <div style="padding:13px 18px;border-bottom:1px solid var(--borda);display:flex;align-items:center;justify-content:space-between">
              <span style="font-family:'Cormorant Garamond',serif;font-size:16px;font-weight:500;color:var(--verde)">Histórico de Pagamentos</span>
              ${pgAtual?`<span style="background:${pgStatusOk?'#e8f4e8':'#fceaea'};color:${pgStatusOk?'#1a5a1a':'#8a1a1a'};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500">${pgStatusLabel[pgAtual?.status]||pgAtual?.status||'—'}</span>`:''}
            </div>
            ${(pgAluno||[]).map(p=>`<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 18px;border-bottom:1px solid rgba(212,200,158,.3);font-size:12px">
              <div>
                <div style="font-weight:500">${p.mes_ref?new Date(p.mes_ref+'T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'—'}</div>
                <div style="font-size:10px;color:var(--txt2);margin-top:1px">Venc: ${p.vencimento?new Date(p.vencimento+'T12:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'2-digit'}):'-'}</div>
              </div>
              <div style="text-align:right">
                <div style="font-weight:500">R$${(p.valor||0).toFixed(2).replace('.',',')}</div>
                <div style="font-size:10px;color:${pgStatusColor[p.status]||'#888'};margin-top:1px">${pgStatusLabel[p.status]||p.status}</div>
              </div>
            </div>`).join('')}
          </div>`
        : ''
      }

    </div>

    <!-- Modal editar perfil -->
    <div id="modal-editar-perfil" style="display:none;position:fixed;inset:0;background:rgba(31,56,31,.6);z-index:200;align-items:center;justify-content:center;padding:16px">
      <div style="background:#fff;border-radius:12px;width:400px;max-width:100%;overflow:hidden">
        <div style="background:var(--verde);padding:16px 20px">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--bege)">Editar Meus Dados</div>
        </div>
        <div style="padding:20px;display:flex;flex-direction:column;gap:12px">
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Nome completo</label>
            <input id="edit-perfil-nome" type="text" value="${perfil.nome.replace(/"/g,'&quot;')}" style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Telefone / WhatsApp</label>
            <input id="edit-perfil-tel" type="tel" value="${perfil.telefone||''}" placeholder="(11) 99999-9999" style="border:1px solid var(--borda);border-radius:6px;padding:8px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none">
          </div>
          <div style="font-size:11px;color:var(--txt2);background:rgba(242,236,206,.4);border-radius:6px;padding:8px 12px">
            O e-mail não pode ser alterado pois é usado para o login com Google.
          </div>
        </div>
        <div style="padding:0 20px 16px;display:flex;justify-content:flex-end;gap:8px">
          <button onclick="document.getElementById('modal-editar-perfil').style.display='none'" style="padding:7px 14px;background:transparent;border:1px solid var(--borda);border-radius:6px;font-size:12px;cursor:pointer">Cancelar</button>
          <button onclick="salvarEdicaoPerfil()" style="padding:7px 14px;background:var(--verde);color:var(--bege);border:none;border-radius:6px;font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">Salvar</button>
        </div>
      </div>
    </div>
  `

  window.toggleBeneficio = function(f) {
    const desc = document.getElementById('desc-' + f)
    const chevron = document.getElementById('chevron-' + f)
    if (!desc) return
    const aberto = desc.style.display !== 'none'
    desc.style.display = aberto ? 'none' : 'block'
    if (chevron) chevron.style.transform = aberto ? '' : 'rotate(180deg)'
  }

  window.abrirEditarPerfil = function() {
    document.getElementById('modal-editar-perfil').style.display = 'flex'
  }

  window.salvarEdicaoPerfil = async function() {
    const nome = document.getElementById('edit-perfil-nome').value.trim()
    const tel  = document.getElementById('edit-perfil-tel').value.trim()
    if (!nome) { toast('O nome não pode ficar vazio'); return }

    const { error } = await sb.from('perfis').update({
      nome,
      telefone: tel || null,
    }).eq('id', perfil.id)

    if (error) { toast('Erro ao salvar: ' + error.message); return }

    window._perfil.nome     = nome
    window._perfil.telefone = tel || null
    document.getElementById('sb-nome').textContent = nome
    document.getElementById('perfil-nome-display').textContent = nome
    const telDisplay = document.getElementById('perfil-tel-display')
    if (telDisplay) telDisplay.textContent = tel || 'Não cadastrado'

    document.getElementById('modal-editar-perfil').style.display = 'none'
    toast('✓ Dados atualizados!')
  }
          uiAnimar(container)
}       
