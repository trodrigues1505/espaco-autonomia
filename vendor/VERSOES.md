# vendor/ — bibliotecas hospedadas localmente

Geradas em 2026-10-20. Nenhum recurso de terceiro é carregado em tempo de execução (exceto conteúdo do usuário: imagens, vídeos, WhatsApp).
Regra de versão: pacotes com no mínimo 14 dias de publicação.

| Arquivo(s) | Origem | Versão | Observação |
|---|---|---|---|
| supabase-js.js | @supabase/supabase-js (npm) | 2.117.2 (publicada 2026-09-25) | bundle ESM único (esbuild --bundle --minify) |
| pdfjs/ | pdfjs-dist (npm) | 4.7.76 | mesma versão que o app usava via cdnjs; Apache-2.0 |
| tabler/ | @tabler/icons-webfont (npm) | 3.31.0 (2025-03-04) | SUBCONJUNTO: 110 ícones usados no código; MIT |
| fonts/ | @fontsource/dm-sans e @fontsource/cormorant-garamond | 5.3.0 | latin + latin-ext (diacríticos do sânscrito); SIL OFL 1.1 |

## Como regenerar os ícones
Se uma tela nova usar um ícone Tabler que não está em vendor/tabler/, ele aparece em branco. Rode novamente o script de
subconjunto (lista os nomes `ti-*` do código e reduz a fonte) ou substitua vendor/tabler/ pelo CSS e fonte completos do pacote @tabler/icons-webfont.

## Hashes SHA-256

- `LICENCAS-supabase-js.txt` — 9 KB — `3cc87732251d6ff5ca1c0c9cfacd28ece184035be0d5d2e6737e2065472f9c1d`
- `supabase-js.js` — 217 KB — `c2cca96c251ee79d071f0d13153fa08e634fcd0c0ad4d923b800cd98a43ead6e`
- `fonts/LICENCA-fontes.txt` — 8 KB — `ce95415cb63889d86237e9c0384491b41c0c4f1119d3896fb539bfe99c8e289b`
- `fonts/cormorant-garamond-latin-400-italic.woff2` — 23 KB — `e48e58027030df56869b795ca6f19b7012158275f7ad7cde1900b4a0b68d02e2`
- `fonts/cormorant-garamond-latin-400-normal.woff2` — 22 KB — `8048ac209bec741e1c29cd0cfac5aac1c0c2ba8c3ddbd4a58fa9bd92ef5c63c2`
- `fonts/cormorant-garamond-latin-500-normal.woff2` — 22 KB — `8197bf53615ddc8c423f444c7f0eec63b7fa0ba093fcfbec60dfdd28429b0fc8`
- `fonts/cormorant-garamond-latin-600-normal.woff2` — 22 KB — `ae062b6d5ae308e7edf61b28b07b9984bbb6e961b1f34d9b2c2f4389c33f21ea`
- `fonts/cormorant-garamond-latin-ext-400-italic.woff2` — 19 KB — `96ec6109d044a8f2b279937499923fc0435db3e6bd91ce4cb1fd806d566378b9`
- `fonts/cormorant-garamond-latin-ext-400-normal.woff2` — 19 KB — `375a088756d1cb10eb91a9a7de18ad5e9858689abe76496dd78e560fef0bbebb`
- `fonts/cormorant-garamond-latin-ext-500-normal.woff2` — 19 KB — `3de1b0f23516d8ff77cc1a5af88b6c19037a375ec52729a8a5633998f58aa609`
- `fonts/cormorant-garamond-latin-ext-600-normal.woff2` — 19 KB — `4993f7f4feb5e31d94f54e3b11428337a06f0c8c8d9ffef331aabd7e6a81b4c8`
- `fonts/dm-sans-latin-300-normal.woff2` — 13 KB — `80f13c410ec41f210a5553e7f420f8a51f459180019274df0b3faea314916f90`
- `fonts/dm-sans-latin-400-normal.woff2` — 13 KB — `4ab51eb2cd7305d177187908d6397474d4520663f6c6e572feb0a64f4fa80006`
- `fonts/dm-sans-latin-500-normal.woff2` — 13 KB — `19bf1984956517c35c2bd35b6cdedac12a21d6fcd3596c614ecdfb88b648909d`
- `fonts/dm-sans-latin-ext-300-normal.woff2` — 7 KB — `d45c7f5d73861db15ec16ba6c4a5e29fda548b32d382165a4afe3f9034ca13e2`
- `fonts/dm-sans-latin-ext-400-normal.woff2` — 7 KB — `962730c6ff7595f9499b0d963a3bccb2139d793f0fb31fbd87aed1881c020e0a`
- `fonts/dm-sans-latin-ext-500-normal.woff2` — 7 KB — `e0a1d21584ba00798a3dbe90ef5f8a162741d454f52ab66630f9dc41da372b3d`
- `fonts/fonts.css` — 4 KB — `09766ea3ad404229566064f5fa437396ce65f4cc1e9490f196303a73272c3c12`
- `pdfjs/LICENSE.txt` — 9 KB — `0d542e0c8804e39aa7f37eb00da5a762149dc682d7829451287e11b938e94594`
- `pdfjs/pdf.min.mjs` — 328 KB — `49e26487d87a86cb96f6a21740cf7e678bd43db0ccf4e82a6877a806c4d7d5e4`
- `pdfjs/pdf.worker.min.mjs` — 1334 KB — `d2e6ef4cbc6f0e2c1ccb8a4a71d92d09f6242a96a0af07991f08f31e62cc7181`
- `tabler/LICENSE.txt` — 1 KB — `d5a3f948ae5cb95bfc4d2f767ef2bf6a778815b0ddb2d1c48037744cf636518e`
- `tabler/tabler-icons.min.css` — 4 KB — `dede4bfcf28f1851f70b38848818e43ccf3d39047cb792e84ee1029d2f8c44cf`
- `tabler/fonts/tabler-icons.woff2` — 21 KB — `245f7e40b5d00b181c6aaf9a1dbc4a8c1e7a21bbac96049996115e3767b09d9c`
