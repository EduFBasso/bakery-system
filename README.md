# Frontend Bakery

Frontend do sistema Bakery (panificadora), separado do frontend-clinic.

## Objetivo

- interface para operação de clientes, produtos e pedidos
- acompanhamento do fluxo comercial da panificadora

## Stack

- React + Vite + TypeScript
- Testes com Vitest

## Deploy

- Projeto dedicado na Vercel para o domínio Bakery
- Variáveis de ambiente próprias, separadas do frontend-clinic

## Estrutura

- src/: código principal
- public/: arquivos estáticos
- notes/: notas técnicas do domínio bakery

## Rodar localmente

```bash
npm install
npm run dev
```

Com o backend local em `http://127.0.0.1:8000`, use o host do tenant para
preservar o slug `admin-panificadora`:

- Entrada do cliente: `http://admin-panificadora.localhost:5174/`
- Cliente existente: `http://admin-panificadora.localhost:5174/login`
- Novo cliente: `http://admin-panificadora.localhost:5174/register`
- Login administrativo: `http://admin-panificadora.localhost:5174/admin`
- Dashboard do cliente após o login: `http://admin-panificadora.localhost:5174/customer/dashboard`

Os contratos de autenticação usados pelo frontend são
`/api/v1/auth/bakery/login/admin/` e
`/api/v1/auth/bakery/login/customer/`. O endpoint único antigo não deve ser
usado.

## Build e testes

```bash
npm run build
npm run test
```
