/**
 * src/modules/auth.js
 */

import { sb } from '../lib/supabase.js'
import { buildMenu, homePorPerfil, initMobileMenu } from './navigation.js'
import { verificarContrato } from './contrato.js'
import { initProfessorCancel } from './professor-cancel.js'
import { toast, PLANO_NOMES } from './utils.js'

// ── Onboarding ───────────────────────────────────────────────
export async function mostrarOnboarding(user, nomeGoogle, fotoGoogle) {
  const { data: planos } = await sb
    .from('planos')
    .select('*, modalidades:plano_modalidades(modalidade)')
    .order('preco_1x')

  const NOMES = { hatha: 'Hatha Yoga', acro: 'Acro Yoga', raja: 'Raja Yoga' }
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
        <div style="font-family:'Cormorant Garamond',serif;font-size:24px;font-weight:500;color:var(--bege)">Espaço Autonomia</div>
        <div style="font-size:12px;color:rgba(242,236,206,.7);margin-top:4px">Complete seus dados para começar</div>
      </div>
      <div style="padding:24px">
        <input type="hidden" id="onb-foto" value="${fotoGoogle || ''}">
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:12px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Nome completo</label>
          <input id="onb-nome" value="${nomeGoogle}" style="border:1px solid var(--borda);border-radius:6px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;margin-bottom:16px">
          <label style="font-size:10px;text-transform:uppercase;letter-spacing:.7px;color:var(--txt2);font-weight:500">Telefone / WhatsApp</label>
          <input id="onb-tel" placeholder="(11) 99999-9999" style="border:1px solid var(--borda);border-radius:6px;padding:9px 12px;font-size:13px;font-family:'DM Sans',sans-serif;outline:none;width:100%">
        </div>
        <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:500;color:var(--verde);margin-bottom:10px">Escolha seu plano</div>
        <div style="display:flex;flex-direction:column;gap:8px">
          ${opcoes.map(o => `
            <label style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border:2px solid var(--borda);border-radius:8px;cursor:pointer" id="label-${o.key}">
              <div style="display:flex;align-items:center;gap:10px">
                <input type="radio" name="onb-plano" value="${o.key}"
                  data-plano="${o.plano.tipo}" data-opcao="${o.opcao}" data-preco="${o.preco}"
                  style="accent-color:var(--verde)" onchange="highlightPlano('${o.key}')">
                <div>
                  <div style="font-weight:500;font-size:13px">${o.plano.nome} · ${o.label}</div>
                  <div style="font-size:11px;color:var(--txt2)">${(o.plano.modalidades||[]).map(m=>NOMES[m.modalidade]||m.modalidade).join(' · ')}</div>
                </div>
              </div>
              <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--verde)">R$${o.preco}<span style="font-size:11px;font-weight:400;color:var(--txt2)">/mês</span></div>
            </label>`).join('')}
        </div>
        <button onclick="finalizarOnboarding('${user.id}','${user.email}')"
          style="width:100%;padding:12px;background:var(--verde);color:var(--bege);border:none;border-radius:8px;font-size:14px;font-family:'DM Sans',sans-serif;cursor:pointer;margin-top:20px;font-weight:500">
          Começar →
        </button>
      </div>
    </div>`
  document.body.appendChild(onbDiv)
}

window.highlightPlano = function (key) {
  document.querySelectorAll('[id^="label-"]').forEach(el => { el.style.borderColor = 'var(--borda)'; el.style.background = '#fff' })
  const lbl = document.getElementById('label-' + key)
  if (lbl) { lbl.style.borderColor = 'var(--verde)'; lbl.style.background = 'rgba(31,56,31,.04)' }
}

window.finalizarOnboarding = async function (userId, email) {
  const nome     = document.getElementById('onb-nome').value.trim()
  const tel      = document.getElementById('onb-tel').value.trim()
  const foto     = document.getElementById('onb-foto')?.value.trim() || null
  const planoSel = document.querySelector('input[name="onb-plano"]:checked')
  if (!nome)     { toast('Informe seu nome');   return }
  if (!planoSel) { toast('Selecione um plano'); return }
  const btn = document.querySelector('#onboarding button')
  if (btn) { btn.textContent = 'Salvando...'; btn.disabled = true }
  try {
    const { error: errP } = await sb.from('perfis').upsert({
      id: userId, nome, email, telefone: tel || null, tipo: 'aluno', ativo: true,
      foto_url: foto || null,
    })
    if (errP) throw new Error('Erro no perfil: ' + errP.message)
    const { error: errM } = await sb.from('matriculas').insert({
      aluno_id: userId, plano_tipo: planoSel.dataset.plano,
      opcao_aulas: Number(planoSel.dataset.opcao), valor_mensal: Number(planoSel.dataset.preco),
    })
    if (errM) throw new Error('Erro na matrícula: ' + errM.message)
    document.getElementById('onboarding')?.remove()
    await iniciarApp(userId)
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
  const { error } = await sb.auth.signInWithPassword({ email, password: senha })
  if (error) {
    err.textContent = error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message
    err.style.display = 'block'
    btn.classList.remove('login-loading')
    document.getElementById('btn-login-txt').textContent = 'Entrar'
  }
}

window.fazerLogout = async function () {
  await sb.auth.signOut()
}

window.loginGoogle = function () {
  sb.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.href.split('?')[0] },
  })
}

// ── iniciarApp ───────────────────────────────────────────────
export async function iniciarApp(user) {
  try {
    const { data: perfil, error: errPerfil } = await sb
      .from('perfis').select('*').eq('id', user.id).single()

    if (!perfil || errPerfil?.code === 'PGRST116') {
      document.getElementById('login-screen').style.display = 'none'
      const fotoGoogle = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      await mostrarOnboarding(user, user.user_metadata?.full_name || '', fotoGoogle)
      return
    }
    if (errPerfil) throw new Error(errPerfil.message)

    // Backfill: contas criadas antes da captura de foto do Google ficaram com foto_url nulo.
    // Se ainda estiver vazio e o provider tiver avatar, preenche silenciosamente agora.
    if (!perfil.foto_url) {
      const fotoGoogle = user.user_metadata?.avatar_url || user.user_metadata?.picture || null
      if (fotoGoogle) {
        const { data: atualizado } = await sb
          .from('perfis').update({ foto_url: fotoGoogle }).eq('id', perfil.id)
          .select().maybeSingle()
        if (atualizado) perfil.foto_url = atualizado.foto_url
      }
    }

    window._perfil = perfil

    document.getElementById('login-screen').style.display = 'none'
    document.getElementById('app-shell').style.display    = 'block'
    document.getElementById('sb-nome').textContent        = perfil.nome
    document.getElementById('sb-role-label').textContent  =
      { admin: 'Admin', professor: 'Professor', aluno: 'Aluno', visitante: 'Visitante' }[perfil.tipo] || perfil.tipo

    // Para alunos: busca matrícula + dados do plano para montar o menu de benefícios
    if (perfil.tipo === 'aluno') {
      const { data: mat } = await sb
        .from('matriculas')
        .select('plano_tipo')
        .eq('aluno_id', perfil.id)
        .eq('ativa', true)
        .maybeSingle()

      if (mat?.plano_tipo) {
        document.getElementById('sb-plano').textContent = PLANO_NOMES[mat.plano_tipo] || ''
        window._plano = mat.plano_tipo

        const { data: planoData } = await sb
          .from('planos')
          .select('sangha,kala_sadhya,asana_marga,yoga_adhyayana,jnana_marga,sadhana_purna,atma_vijnana,shruti,naada_mandir')
          .eq('tipo', mat.plano_tipo)
          .maybeSingle()

        window._planoData = planoData || null
      } else {
        window._planoData = null
      }
    }

    // Para visitantes: sem matrícula, sem planoData — só Sangha e Āsana Mārga
    if (perfil.tipo === 'visitante') {
      window._plano     = null
      window._planoData = null
      document.getElementById('sb-plano').textContent = 'Visitante'
    }

    buildMenu(perfil.tipo)
    initMobileMenu()
    initProfessorCancel()

    if (perfil.tipo === 'aluno') {
      await verificarContrato(perfil.id, perfil.nome)
      const mesAtual = new Date().toISOString().slice(0, 7) + '-01'
      await sb.rpc('creditar_aulas_mes', { p_aluno_id: perfil.id, p_mes_ref: mesAtual })
    }

    window.navigate(homePorPerfil(perfil.tipo))

  } catch (e) {
    console.error('iniciarApp ERRO:', e)
    document.getElementById('login-screen').style.display = 'block'
    document.getElementById('app-shell').style.display    = 'none'
  }
}

// ── initSession ──────────────────────────────────────────────
let _appIniciado = false

export function initSession() {
  if (window.location.hash.includes('##')) {
    const clean = window.location.hash.replace(/^#+/, '#')
    window.history.replaceState(null, '', window.location.pathname + clean)
    window.location.reload()
    return
  }

  const params = new URLSearchParams(window.location.hash.slice(1))
  if (params.get('error')) {
    window.history.replaceState(null, '', window.location.pathname)
    document.getElementById('login-screen').style.display = 'block'
    const el = document.getElementById('login-err')
    if (el) { el.textContent = 'Link expirado. Faça login novamente.'; el.style.display = 'block' }
    return
  }

  sb.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT') {
      _appIniciado = false
      window._perfil = null
      window._planoData = null
      document.getElementById('app-shell').style.display    = 'none'
      document.getElementById('login-screen').style.display = 'block'
      return
    }
    if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN') && session?.user) {
      if (!_appIniciado) {
        _appIniciado = true
        iniciarApp(session.user)
      }
    }
    if ((event === 'INITIAL_SESSION') && !session) {
      document.getElementById('login-screen').style.display = 'block'
    }
  })
}

// ── Listeners ────────────────────────────────────────────────
document.getElementById('login-senha')
  ?.addEventListener('keydown', e => { if (e.key === 'Enter') window.fazerLogin() })
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('btn-google')?.addEventListener('click', window.loginGoogle)
})
