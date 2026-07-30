# Radar de Ofertas — Tech & Promo

Site estático (GitHub Pages) que agrega **ofertas dos canais públicos do Telegram**, organizadas **por categoria** (RAM, CPU, GPU, placa-mãe, armazenamento, monitor, impressão 3D, periféricos, cupons, etc.).

> Evoluído do "Radar de Ofertas DF" (que era focado em preços de supermercado) para foco em **tech/promoções**.

## Como funciona
- **Front-end:** Vue 3 + Tailwind (via CDN), sem build. `index.html` + `js/{app,filters,loader}.js` + `css/style.css`.
- **Dados:** arquivos `dados/*.json` (um por canal). O `loader.js` descobre os arquivos pela API do GitHub e carrega todos.
- **UI:** filtro por **categoria** (chips), por **canal** e **loja**, busca por texto, ordenação por data ou preço, e paginação ("mostrar mais").

## Schema de cada oferta (`dados/*.json`)
```json
{
  "id_visual": 1,
  "produto": "Título da oferta",
  "categoria": "Memória RAM",
  "preco": 199.90,        // ou null
  "loja": "Amazon",
  "canal": "PC do Fafá",
  "data": "2026-07-29",
  "link": "https://…",
  "cupom": "CODIGO",      // ou null
  "texto": "texto completo da mensagem"
}
```

## Atualizar os dados
Os scripts do pipeline estão em `tools/` (Python, só stdlib):

1. **Coletar** o histórico público de um canal (`t.me/s/<canal>`):
   ```bash
   python3 tools/tg-scrape.py --channel=pcdofafapromo --since=2026-01-01 --max=60000
   # gera ~/Downloads/02-Pessoal/AI-Outputs/telegram-<canal>/messages.jsonl
   # use --resume para continuar de onde parou (retry embutido)
   ```
2. **Converter** as mensagens no schema do site (categoriza + extrai preço/loja/cupom/link):
   ```bash
   python3 tools/tg-to-radar.py   # escreve em dados/*.json
   ```
3. Commit + push → o GitHub Pages atualiza.

Canais atuais: `pcdofafapromo`, `peperaiohardware`, `achadinhos3D`, `linguicapromocoes`.

## Aviso
Ofertas coletadas de canais públicos do Telegram, para uso pessoal. Preços/cupons podem expirar; confira sempre na loja.
