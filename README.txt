# Deploy na Netlify (clone do site + Payevo)

## 1) Subir este projeto
- Faça upload desta pasta na Netlify (Deploy manual) ou conecte via Git.

## 2) Configurar variáveis de ambiente (Site settings > Environment variables)
- PAYEVO_SECRET_KEY = sua chave secreta (NUNCA no front)
- PAYEVO_POSTBACK_URL = https://SEU_DOMINIO/api/payevo/webhook  (opcional mas recomendado)

## 3) URLs
- Home: /
- Checkout: /checkout

## 4) Rotas que o front usa (mantidas)
- POST /api/pix/create
- GET  /api/pix/status/{id}
- POST /api/payevo/webhook

## Observação importante
A função de status usa GET /transactions/:id (padrão).
Se a Payevo usar outra rota, me envie o trecho exato da doc de "Buscar transação" para eu ajustar.
