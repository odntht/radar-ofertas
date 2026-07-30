# Radar de Ofertas — Tech & Promo

Projeto **pessoal** do Fernando. Site estático que agrega ofertas de canais públicos do Telegram, organizadas por categoria. **Não tem nenhuma relação com a Wealthsimple.**

## Conta: usar SEMPRE a pessoal `odntht`

Commits e push nesta pasta usam a conta pessoal `odntht` — **NUNCA** a de trabalho (`frccws` / f.cavalcante@wealthsimple.com).

Config local já fixada (`.git/config`, não versionada):
- `user.name = odntht` · `user.email = odntht@gmail.com`
- remote HTTPS: `https://odntht@github.com/odntht/radar-ofertas.git`
- credential helper local: `!f() { echo username=odntht; echo "password=$(gh auth token --user odntht)"; }; f`

Se o push falhar por auth: o `gh` **global** segue `frccws`, e a **chave SSH padrão também autentica como frccws** — não usar SSH. Re-setar o remote HTTPS + o helper local acima e dar `git push`. **Não** rodar `gh auth setup-git` nem trocar a conta `gh` global.

## Nada da Wealthsimple sem permissão explícita

Não usar ferramentas, MCPs, sistemas ou contexto de trabalho neste projeto **sem permissão explícita do Fernando, confirmada a cada uso**:
- `mcplocker` (e sub-servidores `mcplocker__*`), `atlassian`, `glean`, `datadog`, `sentry`, `backstage`, `slackv2`, `jira`, `notion` (workspace WS).
- Não aplicar convenções, fluxos de PR/review, feature flags ou hábitos internos da WS; não referenciar repos/código proprietário (ex.: `front-end-monorepo`).
- Contexto externo: apenas ferramentas públicas (web search, fetch, GitHub público, documentação pública).

## O que é este projeto

Site estático Vue 3 + Tailwind (CDN), publicado no GitHub Pages. Dados em `dados/*.json` (um por canal do Telegram). Pipeline de coleta/conversão em `tools/` (`tg-scrape.py`, `tg-to-radar.py`). Veja `README.md`.
