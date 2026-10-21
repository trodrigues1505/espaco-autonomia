# ferramentas/

| Ferramenta | Para quê | Quando |
|---|---|---|
| `verifica-handlers.mjs` | falha se algum `onclick="…"` voltar a ser escrito (a CSP o bloqueia; o botão fica morto sem erro) | todo push (CI) e antes de publicar |
| `verifica-segredos.mjs` | falha se houver CPF, RG, chave do Asaas/Groq/`sk-` ou JWT `service_role` no código | todo push (CI) |
| `verifica-csp.mjs` | confere a CSP do `index.html` com a lista de hosts de imagem do código | todo push (CI) |
| `verifica-sintaxe.mjs` | confere a sintaxe de todos os módulos (precisa de `npm install --no-save acorn@8`) | todo push (CI) |
| `limpar-historico.sh` | remove CPF/RG de TODO o histórico do git (testado: 459 commits → 0) | uma vez; leia o cabeçalho |
| `vendor/` (`build.mjs`) | regenera `vendor/` (supabase-js, pdf.js, fontes, ícones) a partir de versões fixas; `npm run audit`, `npm run checar` | ao atualizar uma biblioteca ou ao usar um ícone novo |

Rode as quatro verificações juntas, na raiz do projeto:

    node ferramentas/verifica-handlers.mjs && node ferramentas/verifica-segredos.mjs && node ferramentas/verifica-csp.mjs

O design (tokens, componentes, regras) está em `docs/DESIGN-SYSTEM.md`.
