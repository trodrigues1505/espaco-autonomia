# Design system do Espaço Autonomia

Referência de como montar telas **sem estilo inline repetido**. Fonte da verdade: `src/styles/main.css` (tokens e base) e `src/styles/componentes.css` (componentes).

## Regras que não se negociam

1. **Nenhuma cor em hexadecimal** em estilos. Use os tokens (abaixo); eles têm valor claro e escuro. Um `#fff` no código quebra o modo escuro.
2. **Nenhum `onclick="…"`** (a CSP bloqueia). Veja `ferramentas/verifica-handlers.mjs` para o padrão de eventos.
3. **Texto mínimo de 12px.** Rótulos, selos e legendas inclusive.
4. **Alvos de toque de 44px** em telas de toque (já garantido por `@media (pointer: coarse)` para botões e campos; caixas de seleção têm 24px, mínimo AA).
5. **Imagens só de hosts aprovados** (`HOSTS_IMAGEM` em `src/modules/utils.js` + `img-src` do `index.html`; `ferramentas/verifica-csp.mjs` confere).
6. **Ícones:** Tabler (`<i class="ti ti-nome">`). Ícone novo exige `npm run build` em `ferramentas/vendor/` (o subconjunto é recalculado). Emoji só como identidade da marca (níveis, benefícios).

## Tokens de cor (`main.css`, `:root` e bloco escuro)

| Token | Para quê |
|---|---|
| `--superficie`, `--superficie-2`, `--fundo`, `--neutro-bg` | fundos de cartão, painel interno, página, barra vazia |
| `--titulo`, `--txt`, `--txt2` | título, texto, texto secundário |
| `--verde`, `--verde-med`, `--verde-cl`, `--verde-texto` | marca; `--verde-texto` = verde usado como TEXTO (fica claro no escuro) |
| `--dourado`, `--dourado-texto` | destaque; `--dourado-texto` = dourado como texto sobre fundo claro |
| `--ok-bg/-fg/-borda`, `--err-bg/-fg/-vivo/-borda`, `--warn-bg/-fg/-vivo`, `--info-fg` | estados: sucesso, erro, alerta, informação |
| `--borda`, `--r`, `--rs`, `--sombra-suave`, `--t-fast`, `--t-mid` | borda, raios, sombra e tempos de transição |

## Componentes (`componentes.css`)

| Classe | Uso |
|---|---|
| `btn-pri` | Ação principal da tela (um por contexto): salvar, confirmar, criar. |
| `btn-sec` | Ação secundária: cancelar, voltar, filtrar. `btn-lg` = versão maior (8px 16px). |
| `btn-danger-sm` | Ação destrutiva pequena em linha de lista (excluir, remover). |
| `btn-ok-sm` | Confirmação pequena em linha de lista (aprovar, marcar presente). |
| `btn-ghost` | Botão discreto, com borda leve. |
| `btn-pill` | Filtro/etiqueta clicável arredondada. |
| `btn-x` | Botão de fechar (×) em cabeçalho verde; combine com `fs-20`/`fs-22`. |
| `card` | Cartão: unidade lógica de informação. `card card-lg` = mais respiro. |
| `card-scroll` | Cartão cuja lista pode rolar na horizontal (tabelas largas). |
| `panel` | Painel interno de fundo suave dentro de um cartão. |
| `input` | Campo de texto/seleção, com foco visível. `input input-sm` = mais compacto. |
| `badge` | Selo neutro arredondado. |
| `t-label` | Rótulo em caixa-alta (um único padrão: 12px, peso 500, espaçamento .7px). |
| `t-mut` | Texto secundário (12px, cor `--txt2`). |
| `t-serif` | Título em Cormorant Garamond; combine com `fs-16/18/22/26/28`. |
| `stack-3` | Coluna flex com espaçamento 3px. |
| `stack-4` | Coluna flex com espaçamento 4px. |
| `row-6` | Linha flex centralizada, espaçamento 6px. |
| `row-8` | Linha flex centralizada, espaçamento 8px. |
| `row-10` | Linha flex centralizada, espaçamento 10px. |
| `row-4` | Linha flex, espaçamento 4px. |
| `grid-2` | Duas colunas (uma só no celular). |
| `modal-foot` | Rodapé de modal: botões à direita. |
| `accent` | Cor de destaque de checkbox/radio. |

Utilitários: `c-bege`, `c-err`, `c-titulo`, `c-txt`, `c-txt2`, `cursor-pointer`, `d-block`, `ff-serif`, `fs-12`, `fs-13`, `fs-16`, `fs-18`, `fs-20`, `fs-22`, `fs-26`, `fs-28`, `fw-500`, `lh-1`, `mb-10`, `mb-12`, `mb-14`, `mb-16`, `mb-4`, `mb-5`, `mb-6`, `mb-8`, `mt-1`, `mt-2`, `mt-3`, `mt-8`, `p-20`, `ta-center`, `ta-right`, `w-full`.

**Estados:** todos os `btn-*` têm hover, ativo e desabilitado; `input` tem foco visível; `card` sobe 1px ao passar o mouse. Qualquer `input/select/textarea` mostra foco por teclado (regra global).

## Listas em "tabela" no celular

Cabeçalho (grade com colunas em px, caixa-alta) + linhas com as mesmas colunas viram **cartões de 2 colunas** em telas ≤ 768px, com o texto do cabeçalho como rótulo de cada célula (`src/modules/lista-responsiva.js`, sem marcar nada à mão). A 1ª célula ocupa a linha inteira; a última, se tiver botão, vira uma faixa de ações. No desktop nada muda.

## Como criar uma tela nova

- Cartão: `<div class="card">`; título: `<div class="t-serif fs-18">`; texto de apoio: `t-mut`; rótulo: `t-label`.
- Botões: `btn-pri` (um por contexto) e `btn-sec`; exclusão em lista: `btn-danger-sm`.
- Estilo que só você usa uma vez pode ficar inline, **com tokens** (nunca hex).
- Se um estilo inline se repetir 3 vezes ou mais, crie a classe em `componentes.css`.

## Cuidados ao mover estilo inline para classe

- O `main.css` tem seletores `[style*="…"]` (grades responsivas, hover de cartão, ajustes do escuro). Estilo que contenha esses trechos tem que **permanecer inline** ou a regra precisa ser portada.
- Elementos cujo `display` o JavaScript lê ou alterna (`style.display === 'none'`) devem manter o `display` inline.
- Não selecione elementos por `[onclick]` nem por `[style…]` no JavaScript; use `data-acao="…"`.
