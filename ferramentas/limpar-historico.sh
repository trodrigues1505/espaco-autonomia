#!/bin/bash
# ferramentas/limpar-historico.sh — remove CPF e RG de TODO o histórico do git (testado em um clone do seu repositório:
# 459 commits → 0 ocorrências depois). Reescreve o histórico: os hashes de todos os commits mudam.
#
# O QUE ISTO NÃO FAZ (leia antes): o repositório é PÚBLICO, então os dados já podem ter sido copiados.
#   • forks e clones de terceiros continuam com o histórico antigo;
#   • o GitHub guarda visualizações em cache e as referências refs/pull/* — peça a remoção ao Suporte do GitHub
#     (https://support.github.com/contact → "Remove sensitive data") informando os hashes antigos;
#   • trate os números como EXPOSTOS: avise os titulares (LGPD art. 48) e, se for o caso, monitore o uso do CPF.
#
# Uso:  bash ferramentas/limpar-historico.sh https://github.com/SEU-USUARIO/SEU-REPO
set -euo pipefail
URL="${1:?informe a URL do repositório}"
command -v git-filter-repo >/dev/null || { echo "Instale:  pip install git-filter-repo"; exit 1; }
DIR="repo-limpo-$(date +%Y%m%d)"
git clone "$URL" "$DIR" && cd "$DIR"
cat > /tmp/substituicoes.txt <<'REGRAS'
regex:[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}==>***.***.***-**
regex:[0-9]{1,2}\.[0-9]{3}\.[0-9]{3}-[0-9Xx]==>**.***.***-*
REGRAS
git filter-repo --replace-text /tmp/substituicoes.txt --force
echo "== verificação: ocorrências restantes em TODAS as revisões (deve ser 0) =="
N=$( { git rev-list --all | xargs -I{} git grep -I -o -E '[0-9]{3}\.[0-9]{3}\.[0-9]{3}-[0-9]{2}' {} 2>/dev/null || true; } | wc -l )
echo "CPF: $N"
[ "$N" = "0" ] || { echo "AINDA HÁ OCORRÊNCIAS — não faça push."; exit 1; }
echo
echo "Tudo certo localmente. PARA PUBLICAR (irreversível, sobrescreve o histórico remoto):"
echo "  cd $DIR && git remote add origin $URL"
echo "  git push --force --all && git push --force --tags"
echo "Depois: apague clones antigos, confira Insights > Forks e abra o chamado no Suporte do GitHub."
