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
    _appIniciado = false
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
export let _appIniciado = false

export async function iniciarApp() {
  try {
    let user = null

    // Tenta ler do token local antes de ir à rede
    try {
      const tokenKey = Object.keys(localStorage).find(k => k.includes('auth-token'))
      if (tokenKey) {
        const tokenData = JSON.parse(localStorage.getItem(tokenKey) || '{}')
        user = tokenData?.user || tokenData
      }
    } catch (e) { /* silencia erros de localStorage */ }

    if (!user?.id) {
      user = await Promise.race([
        sb.auth.getSession().then(r => r.data?.session?.user),
        new Promise(resolve => setTimeout(() => resolve(null), 3000)),
      ])
    }

    if (!user) return

    // Busca perfil no banco
    let perfil = null
    try {
      const prResult = await Promise.race([
        sb.from('perfis').select('*').eq('id', user.id).single(),
        new Promise(resolve => setTimeout(() => resolve({ data: null, error: { message: 'timeout' } }), 5000)),
      ])
      perfil = prResult.data
    } catch (e) { /* silencia */ }

    // Fallback para não bloquear o app se o perfil ainda não existe
    if (!perfil) {
      perfil = {
        id:    user.id,
        nome:  user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
        email: user.email,
        tipo:  'admin',
        ativo: true,
      }
      sb.from('perfis').upsert(perfil).catch(() => {})
    }

    // Onboarding para aluno novo (sem perfil no banco)
    if (!perfil && perfil.tipo !== 'aluno') {
      const nomeGoogle = user.user_metadata?.full_name || ''
      document.getElementById('login-screen').style.display  = 'none'
      document.getElementById('app-shell').style.display     = 'none'
      await mostrarOnboarding(user, nomeGoogle)
      return
    }

    window._perfil = perfil

    // Atualiza sidebar
    document.getElementById('login-screen').style.display  = 'none'
    document.getElementById('app-shell').style.display     = 'block'
    document.getElementById('sb-nome').textContent         = perfil.nome
    document.getElementById('sb-role-label').textContent   = { admin: 'Admin', professor: 'Professor', aluno: 'Aluno' }[perfil.tipo] || perfil.tipo

    // Plano do aluno na sidebar
    if (perfil.tipo === 'aluno') {
      const { data: mat } = await sb.from('matriculas').select('plano_tipo').eq('aluno_id', perfil.id).eq('ativa', true).single()
      if (mat) {
        document.getElementById('sb-plano').textContent = PLANO_NOMES[mat.plano_tipo] || ''
        window._plano = mat.plano_tipo
      }
    }

    buildMenu(perfil.tipo)
    initMobileMenu()
    initProfessorCancel()

    // LGPD — sincroniza consentimento com banco após login
    await sincronizarConsentimentoAposLogin(perfil.id)

    // Contrato obrigatório para alunos
    if (perfil.tipo === 'aluno') {
      await verificarContrato(perfil.id, perfil.nome)
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01'
      await sb.rpc('creditar_aulas_mes', { p_aluno_id: perfil.id, p_mes_ref: mesAtual }).catch(() => {})
    }

    window.navigate(homePorPerfil(perfil.tipo))

  } catch (e) {
    console.error('iniciarApp ERRO:', e.message, e.stack)
    document.getElementById('main-area').innerHTML =
      `<div style="padding:30px;color:#c0392b;font-family:monospace;font-size:12px">Erro: ${e.message}<br><br>${e.stack}</div>`
  }
}

// ── Sessão ao carregar ───────────────────────────────────────
export async function initSession() {
  // Trata hash da URL (tokens OAuth + bug ## duplo do Supabase)
  const rawHash   = window.location.hash
  const cleanHash = rawHash.replace(/^#+/, '#')
  const params    = new URLSearchParams(cleanHash.slice(1))
  const hashError = params.get('error')
  const hashToken = params.get('access_token')

  if (hashError) {
    window.history.replaceState(null, '', window.location.pathname)
    if (hashError === 'access_denied' && params.get('error_description')?.includes('expired')) {
      document.getElementById('login-screen').style.display = 'block'
      setTimeout(() => {
        const el = document.getElementById('login-err')
        if (el) { el.textContent = 'Link expirado. Faça login novamente.'; el.style.display = 'block' }
      }, 500)
    }
    return
  }

  if (hashToken && rawHash.includes('##')) {
    window.history.replaceState(null, '', window.location.pathname + '#' + cleanHash.slice(1))
    window.location.reload()
    return
  }

  sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_OUT') {
      _appIniciado = false
      document.getElementById('app-shell').style.display    = 'none'
      document.getElementById('login-screen').style.display = 'block'
      return
    }
    if (session && ['SIGNED_IN', 'TOKEN_REFRESHED', 'INITIAL_SESSION'].includes(event)) {
      if (_appIniciado) return
      _appIniciado = true
      document.getElementById('login-screen').style.display = 'none'
      await iniciarApp()
    }
  })

  try {
    const { data: { session } } = await sb.auth.getSession()
    if (session) {
      if (_appIniciado) return
      _appIniciado = true
      document.getElementById('login-screen').style.display = 'none'
      await iniciarApp()
    } else {
      document.getElementById('login-screen').style.display = 'block'
    }
  } catch (e) {
    console.error('initSession:', e.message)
    document.getElementById('login-screen').style.display = 'block'
  }
}

// ── Enter no campo de senha ──────────────────────────────────
document.getElementById('login-senha')
  ?.addEventListener('keydown', e => { if (e.key === 'Enter') window.fazerLogin() })

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-google')?.addEventListener('click', loginGoogle)
})
