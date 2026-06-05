/**
 * src/modules/auth.js
 * Responsabilidade: autenticação (email/senha + Google OAuth),
 * onboarding de novos alunos, inicialização do app pós-login.
 * Depende de: sb, buildMenu, navigate, verificarContrato,
 *             sincronizarConsentimentoLGPD, toast, NOMES
 */

import { sb } from '../lib/supabase.js'
import { buildMenu, homePorPerfil, initMobileMenu } from './navigation.js'
import { verificarContrato } from './contrato.js'
import { sincronizarConsentimentoAposLogin } from './lgpd.js'
import { initProfessorCancel } from './professor-cancel.js'
import { toast, NOMES, PLANO_NOMES } from './utils.js'

// ── Onboarding — novo aluno via Google ───────────────────────
export async function mostrarOnboarding(user, nomeGoogle) {
  const { data: planos } = await sb
    .from('planos')
    .select('*, modalidades:plano_modalidades(modalidade)')
    .order('preco_1x')

  const opcoes = []
  for (const p of (planos || [])) {
    if (p.preco_1x)    opcoes.push({ plano: p, opcao: 1,  label: '1× por semana', preco: p.preco_1x,    key: p.tipo + '_1x'    })
    if (p.preco_2x)    opcoes.push({ plano: p, opcao: 2,  label: '2× por semana', preco: p.preco_2x,    key: p.tipo + '_2x'    })
    if (p.preco_livre) opcoes.push({ plano: p, opcao: 99, label: 'Uso livre',      preco: p.preco_livre, key: p.tipo + '_livre'  })
  }

  const onbDiv = document.createElement('div')
  onbDiv.id = 'onboarding'
  onbDiv.style.cssText = 'position:fixed;inset:0;background:var(--verde);display:flex;align-items:center;justify-content:center;z-index:200;overflow-y:auto;padding:20px'
  onbDiv.innerHTML = `
    <div style="background:#fff;border-radius:16px;width:500px;max-width:95vw;overflow:hidden">
      <div style="background:var(--verde);padding:28px 24px;text-align:center">
        <img src="./assets/Logo Vertical (2).png" alt="Espaço Autonomia" style="width:120px;height:auto;margin-bottom:12px">
        <div style="font-size:12px;color:rgba(242,236,206,.7);margin-top:4px">Complete seus dados para começar</div>
      </div>
      <div style="padding:24px">
        <div id="onb-step1">
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde);margin-bottom:16px">Seus dados</div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Nome completo</label>
            <input id="onb-nome" value="${nomeGoogle}" placeholder="Seu nome completo"
              style="border:1px solid var(--borda);border-radius:6px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
            <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Telefone / WhatsApp</label>
            <input id="onb-tel" placeholder="(11) 99999-9999"
              style="border:1px solid var(--borda);border-radius:6px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
          </div>
          <div style="font-family:'Cormorant Garamond',serif;font-size:18px;font-weight:500;color:var(--verde);margin:16px 0 12px">Escolha seu plano</div>
          <div style="display:flex;flex-direction:column;gap:8px" id="onb-planos">
            ${opcoes.map(o => `
              <label style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:2px solid var(--borda);border-radius:8px;cursor:pointer;transition:all .15s" id="label-${o.key}">
                <div style="display:flex;align-items:center;gap:10px">
                  <input type="radio" name="onb-plano" value="${o.key}"
                    data-plano="${o.plano.tipo}" data-opcao="${o.opcao}" data-preco="${o.preco}"
                    style="accent-color:var(--verde);width:16px;height:16px"
                    onchange="highlightPlano('${o.key}')">
                  <div>
                    <div style="font-weight:500;font-size:13px">${o.plano.nome} · ${o.label}</div>
                    <div style="font-size:11px;color:var(--txt2);margin-top:2px">
                      ${(o.plano.modalidades || []).map(m => NOMES[m.modalidade] || m.modalidade).join(' · ')}
                    </div>
                  </div>
                </div>
                <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--verde)">
                  R$${o.preco}<span style="font-size:11px;font-weight:400;color:var(--txt2)">/mês</span>
                </div>
              </label>`).join('')}
          </div>
          <button onclick="finalizarOnboarding('${user.id}','${user.email}')"
            style="width:100%;padding:12px;background:var(--verde);color:var(--bege);border:none;border-radius:8px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:20px;font-weight:500">
            Começar →
          </button>
        </div>
      </div>
    </div>`
  document.body.appendChild(onbDiv)
}

window.highlightPlano = function (key) {
  document.querySelectorAll('[id^="label-"]').forEach(el => {
    el.style.borderColor = 'var(--borda)'
    el.style.background  = '#fff'
  })
  const lbl = document.getElementById('label-' + key)
  if (lbl) { lbl.style.borderColor = 'var(--verde)'; lbl.style.background = 'rgba(31,56,31,.04)' }
}

window.finalizarOnboarding = async function (userId, email) {
  const nome  = document.getElementById('onb-nome').value.trim()
  const tel   = document.getElementById('onb-tel').value.trim()
  const planoSel = document.querySelector('input[name="onb-plano"]:checked')

  if (!nome)     { toast('Informe seu nome');     return }
  if (!planoSel) { toast('Selecione um plano');   return }

  const planoTipo   = planoSel.dataset.plano
  const opcaoAulas  = Number(planoSel.dataset.opcao)
  const valorMensal = Number(planoSel.dataset.preco)

  const btn = document.querySelector('#onboarding button[onclick*="finalizarOnboarding"]')
  if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true }

  try {
    const { error: errP } = await sb.from('perfis').upsert({
      id: userId, nome, email, telefone: tel || null, tipo: 'aluno', ativo: true,
    })
    if (errP) throw new Error('Erro no perfil: ' + errP.message)

    const { error: errM } = await sb.from('matriculas').insert({
      aluno_id: userId, plano_tipo: planoTipo, opcao_aulas: opcaoAulas, valor_mensal: valorMensal,
    })
    if (errM) throw new Error('Erro na matrícula: ' + errM.message)

    document.getElementById('onboarding')?.remove()
      await iniciarApp()
  } catch (e) {
    toast(e.message)
    if (btn) { btn.textContent = 'Começar →'; btn.disabled = false }
  }
}

// ── Login / Logout ───────────────────────────────────────────
window.fazerLogin = async function () {
  const email = document.getElementById('login-email').value.trim()
  const senha = document.getElementById('login-senha').value
  const btn   = document.getElementById('btn-login')
  const err   = document.getElementById('login-err')

  err.style.display = 'none'
  btn.classList.add('login-loading')
  document.getElementById('btn-login-txt').innerHTML = '<span class="spinner"></span>'

  try {
    const { error } = await sb.auth.signInWithPassword({ email, password: senha })
    if (error) throw error
    await iniciarApp()
  } catch (e) {
    err.textContent = e.message === 'Invalid login credentials'
      ? 'E-mail ou senha incorretos.' : e.message
    err.style.display = 'block'
    btn.classList.remove('login-loading')
    document.getElementById('btn-login-txt').textContent = 'Entrar'
  }
}

window.fazerLogout = async function () {
  await sb.auth.signOut()
  document.getElementById('app-shell').style.display  = 'none'
  document.getElementById('login-screen').style.display = 'block'
  document.getElementById('login-senha').value = ''
}

function loginGoogle() {
  if (!window._sb) { alert('Aguarde, carregando...'); return }
  window._sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href.split('?')[0] },
  }).then(r => { if (r.error) alert('Erro: ' + r.error.message) })
}
window.loginGoogle = loginGoogle

// ── Inicializar app ──────────────────────────────────────────
export async function iniciarApp() {
  try {
    // 1. Pega sessão atual
    const { data: { session } } = await sb.auth.getSession()
    if (!session?.user) {
      document.getElementById('login-screen').style.display = 'block'
      return
    }
    const user = session.user

    // 2. Busca perfil no banco
    const { data: perfil, error: errPerfil } = await sb
      .from('perfis')
      .select('*')
      .eq('id', user.id)
      .single()

    // 3. Perfil não existe → onboarding (novo aluno via Google)
    if (!perfil || errPerfil?.code === 'PGRST116') {
      document.getElementById('login-screen').style.display = 'none'
      document.getElementById('app-shell').style.display    = 'none'
      await mostrarOnboarding(user, user.user_metadata?.full_name || '')
      return
    }

    if (errPerfil) throw new Error('Erro ao buscar perfil: ' + errPerfil.message)

    window._perfil = perfil

    // 4. Monta shell
    document.getElementById('login-screen').style.display  = 'none'
    document.getElementById('app-shell').style.display     = 'block'
    document.getElementById('sb-nome').textContent         = perfil.nome
    document.getElementById('sb-role-label').textContent   =
      { admin: 'Admin', professor: 'Professor', aluno: 'Aluno' }[perfil.tipo] || perfil.tipo

    // 5. Plano do aluno na sidebar
    if (perfil.tipo === 'aluno') {
      const { data: mat } = await sb
        .from('matriculas')
        .select('plano_tipo')
        .eq('aluno_id', perfil.id)
        .eq('ativa', true)
        .single()
      if (mat) {
        document.getElementById('sb-plano').textContent = PLANO_NOMES[mat.plano_tipo] || ''
        window._plano = mat.plano_tipo
      }
    }

    buildMenu(perfil.tipo)
    initMobileMenu()
    initProfessorCancel()

    // 6. LGPD + contrato
    await sincronizarConsentimentoAposLogin(perfil.id)

    if (perfil.tipo === 'aluno') {
      await verificarContrato(perfil.id, perfil.nome)
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01'
      await sb.rpc('creditar_aulas_mes', { p_aluno_id: perfil.id, p_mes_ref: mesAtual })
    }

    // 7. Navega para home do perfil
    window.navigate(homePorPerfil(perfil.tipo))

  } catch (e) {
    console.error('iniciarApp ERRO:', e.message, e.stack)
    document.getElementById('login-screen').style.display = 'block'
    const err = document.getElementById('login-err')
    if (err) { err.textContent = 'Erro ao iniciar: ' + e.message; err.style.display = 'block' }
  }
}


// ── Sessão ao carregar ───────────────────────────────────────
export async function initSession() {
  // Fix ## duplo na URL do Supabase OAuth
  if (window.location.hash.includes('##')) {
    const clean = window.location.hash.replace(/^#+/, '#')
    window.history.replaceState(null, '', window.location.pathname + clean)
    window.location.reload()
    return
  }

  // Erro no hash (link expirado etc.)
  const params = new URLSearchParams(window.location.hash.slice(1))
  if (params.get('error')) {
    window.history.replaceState(null, '', window.location.pathname)
    document.getElementById('login-screen').style.display = 'block'
    const el = document.getElementById('login-err')
    if (el) { el.textContent = 'Link expirado ou inválido. Faça login novamente.'; el.style.display = 'block' }
    return
  }

  let appMontado = false

  // Escuta mudanças de sessão (login/logout em tempo real)
  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      appMontado = false
      document.getElementById('app-shell').style.display    = 'none'
      document.getElementById('login-screen').style.display = 'block'
      return
    }
    // Só reinicia no login explícito, não em TOKEN_REFRESHED nem INITIAL_SESSION
    if (event === 'SIGNED_IN' && !appMontado) {
      appMontado = true
      await iniciarApp()
    }
  })

  // Verifica sessão já existente ao carregar a página
  document.getElementById('login-screen').style.display = 'none'
  document.getElementById('app-shell').style.display    = 'none'
  await iniciarApp()
  appMontado = true
}

// ── Enter no campo de senha ──────────────────────────────────
document.getElementById('login-senha')
  ?.addEventListener('keydown', e => { if (e.key === 'Enter') window.fazerLogin() })

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-google')?.addEventListener('click', loginGoogle)
})
