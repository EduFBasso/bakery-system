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

## URLs remotas

O host público do tenant atual é `https://panificadora.ebsis.com.br`.
Cliente e administrador usam o mesmo host, com fluxos separados por caminho:

- Entrada do cliente: `https://panificadora.ebsis.com.br/`
- Cliente existente: `https://panificadora.ebsis.com.br/login`
- Novo cliente: `https://panificadora.ebsis.com.br/register`
- Login administrativo: `https://panificadora.ebsis.com.br/admin`
- Dashboard do cliente: `https://panificadora.ebsis.com.br/customer/dashboard`

O domínio deve ser associado ao projeto Vercel e o registro DNS deve apontar
para a Vercel. O deploy não deve ser realizado antes da validação com o cliente.

Os contratos de autenticação usados pelo frontend são
`/api/v1/auth/bakery/login/admin/` e
`/api/v1/auth/bakery/login/customer/`. O endpoint único antigo não deve ser
usado.

## Build e testes

```bash
npm run build
npm run test
```
