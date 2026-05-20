# Espaço Autonomia — App

Stack 100% gratuita: **Supabase** (banco + auth + API) + **HTML/CSS/JS** puro (sem build).

---

## Stack gratuita completa

| Serviço | O que faz | Plano gratuito |
|---------|-----------|----------------|
| [Supabase](https://supabase.com) | Banco PostgreSQL + Auth + API REST + Realtime | 500 MB banco, 50k usuários, ilimitado |
| [Vercel](https://vercel.com) | Hospedagem do frontend | Ilimitado para projetos estáticos |
| [Resend](https://resend.com) | E-mails transacionais (lembretes, avisos) | 3.000 e-mails/mês |
| [BrasilAPI](https://brasilapi.com.br) | Feriados nacionais via API | Totalmente gratuito |

---

## 1. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Escolha nome: `espaco-autonomia`, senha forte, região: **South America (São Paulo)**
3. Aguarde ~2 minutos

---

## 2. Rodar o schema

1. No painel Supabase → **SQL Editor** → **New query**
2. Cole o conteúdo de `supabase/schema.sql`
3. Clique **Run** (F5)
4. Verifique: **Table Editor** deve mostrar todas as tabelas

---

## 3. Configurar autenticação

No Supabase → **Authentication → Settings**:

```
Site URL: http://localhost:3000          (dev)
           https://seu-dominio.vercel.app (prod)

Email confirmations: DESATIVAR durante testes
```

### Criar primeiro admin manualmente:

```sql
-- No SQL Editor, após criar o usuário pelo painel Authentication → Users:
insert into perfis (id, nome, email, tipo)
values (
  'UUID_DO_USUARIO_CRIADO',   -- copie de Authentication → Users
  'Regiane Rocha',
  'regiane@espacoautonomia.com.br',
  'admin'
);
```

---

## 4. Configurar variáveis

Edite `src/lib/supabase.js` e substitua:

```js
const SUPABASE_URL  = 'https://xxxx.supabase.co'    // Project Settings → API → URL
const SUPABASE_ANON = 'eyJhbGci...'                  // Project Settings → API → anon public
```

---

## 5. Gerar ocorrências da semana

Após criar as aulas fixas, rode no SQL Editor para gerar ocorrências dos próximos 90 dias:

```sql
-- Exemplo: gerar para todas as aulas fixas ativas
select gerar_ocorrencias_periodo('2026-05-20', '2026-08-20');
```

Ou via JavaScript:
```js
import { gerarOcorrencias } from './src/lib/supabase.js'
// para cada aula_id:
await gerarOcorrencias(aulaId, '2026-05-20', '2026-08-20')
```

---

## 6. Deploy no Vercel (gratuito)

```bash
npm install -g vercel
vercel                    # segue o wizard, conecta ao GitHub
```

Ou arraste a pasta no [vercel.com/new](https://vercel.com/new).

---

## 7. Lembretes automáticos (opcional — Supabase Edge Functions)

Crie uma Edge Function gratuita para disparar lembretes por e-mail via Resend:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Criar função
supabase functions new lembrete-aula
```

```typescript
// supabase/functions/lembrete-aula/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@2'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async () => {
  const em2h = new Date(Date.now() + 2 * 60 * 60 * 1000)
  const em2h5 = new Date(Date.now() + 2.1 * 60 * 60 * 1000)

  const { data: ocorrencias } = await supabase
    .from('ocorrencias_vagas')
    .select('*, confirmacoes(aluno:perfis!aluno_id(nome, email))')
    .gte('data_hora', em2h.toISOString())
    .lte('data_hora', em2h5.toISOString())
    .eq('cancelada', false)

  for (const oc of ocorrencias || []) {
    for (const conf of oc.confirmacoes || []) {
      await resend.emails.send({
        from: 'Espaço Autonomia <noreply@espacoautonomia.com.br>',
        to: conf.aluno.email,
        subject: `Lembrete: ${oc.modalidade} em 2 horas`,
        html: `<p>Olá ${conf.aluno.nome}! Sua aula de <strong>${oc.modalidade}</strong> começa em 2 horas. Nos vemos lá! 🌿</p>`,
      })
    }
  }
  return new Response('ok')
})
```

Agende no Supabase → **Cron Jobs**:
```
*/30 * * * *    -- roda a cada 30 minutos
```

---

## Estrutura de arquivos

```
espaco-autonomia/
├── supabase/
│   └── schema.sql          ← rode no SQL Editor
├── src/
│   ├── lib/
│   │   └── supabase.js     ← todas as funções de banco
│   ├── pages/
│   │   ├── admin/          ← painéis admin
│   │   ├── professor/      ← painéis professor
│   │   └── aluno/          ← painéis aluno
│   └── components/         ← componentes reutilizáveis
├── index.html              ← entry point (login)
└── README.md
```

---

## Fluxo de confirmação de presença

```
Aluno abre grade
    → chama pode_confirmar() no banco
        → verifica: matrícula ativa? plano inclui modalidade? prazo ok? vagas?
    → se ok: chama confirmar_presenca() (RPC)
        → upsert na tabela confirmacoes
    → realtime atualiza contador para admin/professor
```

---

## Segurança (RLS resumido)

- **Aluno**: vê e confirma apenas suas próprias aulas
- **Professor**: vê todas as aulas e confirmações, edita chamada
- **Admin**: acesso total
- Funções `confirmar_presenca` e `cancelar_confirmacao` rodam com `security definer` (validação server-side, não burlável pelo cliente)
