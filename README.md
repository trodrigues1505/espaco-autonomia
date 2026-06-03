# Espaço Autonomia — App

Stack 100% gratuita: **Supabase** (banco + auth + API) · **HTML/CSS/JS puro** (sem build) · **Vercel** (hospedagem)

---

## Estrutura de arquivos

```
espaco-autonomia/
│
├── index.html                  ← Shell HTML: só estrutura + imports
├── manifest.json               ← PWA config
├── sw.js                       ← Service Worker (cache offline)
│
├── assets/
│   └── logo.png                ← Logo horizontal (264×133 px)
│
├── supabase/
│   └── schema.sql              ← Rode no SQL Editor do Supabase
│
└── src/
    ├── styles/
    │   └── main.css            ← Todos os estilos (variáveis CSS, componentes)
    │
    ├── lib/
    │   └── supabase.js         ← Cliente Supabase (único lugar com credenciais)
    │
    ├── modules/                ← Lógica transversal (não são páginas)
    │   ├── utils.js            ← Constantes, helpers de UI, toast, formatação
    │   ├── navigation.js       ← Menus por perfil, buildMenu, setActiveNav
    │   ├── auth.js             ← Login, logout, Google OAuth, iniciarApp, sessão
    │   ├── contrato.js         ← Termo de adesão (LGPD Art. 8° §6)
    │   ├── gamificacao.js      ← Saldo, pontos prāṇa, conquistas
    │   ├── lgpd.js             ← Banner de consentimento LGPD, sync com banco
    │   ├── professor-cancel.js ← Modal de cancelamento de aula com justificativa
    │   └── pwa.js              ← Service Worker, banner de instalação
    │
    └── pages/                  ← Uma pasta por perfil, um arquivo por página
        ├── index.js            ← Roteador central: navigate() + renderPage()
        │
        ├── admin/
        │   ├── dashboard.js    ← Stats, aulas do dia, feriados
        │   ├── config.js       ← Configurações do sistema
        │   ├── criar_aulas.js  ← Criar aulas fixas e avulsas
        │   ├── alunos.js       ← Gestão de alunos
        │   ├── presencas.js    ← Presenças e chamadas
        │   ├── professores.js  ← Gestão de professores
        │   ├── planos.js       ← Planos e preços
        │   ├── pagamentos.js   ← Painel de pagamentos
        │   └── grade.js        ← Grade semanal (admin)
        │
        ├── professor/
        │   ├── home.js         ← Dashboard + chamada
        │   └── aulas.js        ← Minhas aulas + cancelar
        │
        └── aluno/
            ├── home.js         ← Início + saldo + gamificação
            ├── grade.js        ← Grade de aulas (confirmar/cancelar)
            ├── minhas.js       ← Minhas aulas confirmadas
            ├── plano.js        ← Meu plano
            └── conquistas.js   ← Conquistas e pontos
```

---

## Adicionar uma nova página

1. Crie `src/pages/<perfil>/nome.js`
2. Exporte uma função `export async function renderNome(container) { ... }`
3. Importe em `src/pages/index.js` e adicione uma linha no `rotaMap`
4. Adicione o item de menu em `src/modules/navigation.js` → `MENUS`

---

## Setup inicial

### 1. Supabase

1. Crie o projeto em [supabase.com](https://supabase.com) → região **South America (São Paulo)**
2. SQL Editor → cole `supabase/schema.sql` → Run
3. Authentication → Settings → desative confirmação de e-mail durante testes
4. Edite `src/lib/supabase.js` com sua URL e chave anon

```js
const SUPABASE_URL  = 'https://xxxx.supabase.co'
const SUPABASE_ANON = 'eyJhbGci...'
```

### 2. Criar admin

```sql
-- Após criar o usuário em Authentication → Users:
INSERT INTO perfis (id, nome, email, tipo)
VALUES ('UUID_DO_USUARIO', 'Regiane Rocha', 'regiane@espacoautonomia.com.br', 'admin');
```

### 3. Gerar ocorrências (aulas fixas → agenda)

```sql
SELECT gerar_ocorrencias_periodo('2026-06-01', '2026-09-01');
```

### 4. Deploy no Vercel

```bash
npx vercel   # conecta ao GitHub e faz deploy automático
```

Ou arraste a pasta em [vercel.com/new](https://vercel.com/new).

---

## LGPD

O app é compatível com a Lei 13.709/2018:

| Requisito | Implementação |
|-----------|--------------|
| Consentimento informado | Banner `lgpd.js` na primeira visita |
| Prova de aceite (Art. 8° §6) | Tabela `consentimentos` com `user_id`, `versao`, `aceito_em`, `user_agent`, `idioma` |
| Termo de adesão | Modal `contrato.js` com checkbox explícito, salvo na tabela `contratos` |
| Dados mínimos | Apenas nome, e-mail, telefone, presenças e plano |
| Exclusão de dados | Admin pode excluir perfil; Supabase propaga via `ON DELETE CASCADE` |

---

## Cancelamento de aula pelo professor

- Botão **Cancelar** aparece em *Minhas Aulas* e no *Dashboard* do professor
- Modal exige justificativa (mínimo 10 caracteres)
- Ao confirmar: `ocorrencias.cancelada = true` + `motivo_cancelamento` + RPC `estornar_confirmacoes_ocorrencia`
- Histórico completo auditável na tabela `ocorrencias`

---

## Stack gratuita

| Serviço | O que faz | Plano gratuito |
|---------|-----------|----------------|
| [Supabase](https://supabase.com) | Banco PostgreSQL + Auth + API REST | 500 MB, 50k usuários |
| [Vercel](https://vercel.com) | Hospedagem do frontend | Ilimitado (estático) |
| [Resend](https://resend.com) | E-mails transacionais | 3.000/mês |
| [BrasilAPI](https://brasilapi.com.br) | Feriados nacionais | Gratuito |
