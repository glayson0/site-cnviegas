# site-cnviegas

Sistema de biblioteca da CN Viegas — aplicação [Next.js](https://nextjs.org) com Supabase.

## Getting Started

Siga os passos nesta ordem — o servidor de desenvolvimento precisa das
variáveis de ambiente do Supabase local já configuradas, senão ele derruba
toda rota com um erro 500 (`@supabase/ssr` exige URL e chave anônima).

```bash
npm install
```

1. Suba o stack local do Supabase e configure `.env.local` — veja as seções
   "Banco de dados local" e "Variáveis de ambiente" abaixo.
2. Só então inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Banco de dados local

O projeto usa Supabase. Para rodar o stack local:

```bash
supabase start          # sobe Postgres, Auth e API em Docker
supabase status         # mostra a URL e a anon key para o .env.local
supabase db reset       # aplica migrations e o seed
```

Este projeto usa portas não-padrão (definidas em `supabase/config.toml`) para
não colidir com outros projetos Supabase na mesma máquina. `supabase status`
imprime os valores reais; num ambiente limpo eles tendem a ser:

| Serviço | URL local |
| --- | --- |
| API | `http://127.0.0.1:54421` |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54422/postgres` |
| Studio | `http://127.0.0.1:54423` |
| Inbucket/Mailpit (e-mails de teste) | `http://127.0.0.1:54424` |

A confirmação de e-mail está desativada (`enable_confirmations = false` em
`supabase/config.toml`) porque o ambiente local não tem um provedor SMTP
configurado — os cadastros ficam confirmados imediatamente. Para reativar em
produção é preciso configurar um provedor SMTP em `[auth.email.smtp]` no
`config.toml` (ou no dashboard do Supabase, se hospedado).

## Variáveis de ambiente

Copie `.env.local.example` para `.env.local`:

```bash
cp .env.local.example .env.local
```

Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os
valores impressos por `supabase status` (veja a seção acima) — `API_URL` vira
`NEXT_PUBLIC_SUPABASE_URL` e `ANON_KEY` vira `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### Contas de demonstração

Criadas por `supabase/seed.sql`, todas com a senha `demo123456`:

| E-mail | Papel |
| --- | --- |
| `admin@cnviegas.org` | admin |
| `leitor@cnviegas.org` | leitor |
| `beatriz@cnviegas.org` | leitor |
| `lucas@cnviegas.org` | leitor |

São fixtures públicas com senha conhecida por design — nunca devem conter
dados reais nem ser reutilizadas em produção.

O admin inicial é criado pelo seed porque a promoção dentro do app exige que
já exista um admin: não há como o primeiro admin se autopromover.

### Testes de banco

```bash
supabase test db --local supabase/tests
```

31 asserções pgTAP em 4 arquivos, cobrindo RLS de `profiles`, o trigger de
criação de perfil, a view pública e a função `set_user_role`. A suíte passa
tanto com `supabase db reset` (com seed) quanto com
`supabase db reset --no-seed`.

### Papéis

Novos cadastros recebem `reader`. Apenas admins podem alterar o papel de
outro usuário, e exclusivamente através da função `set_user_role` — a
coluna `role` teve seu privilégio de `UPDATE` revogado de `authenticated`,
então ninguém (nem um admin) consegue alterar papéis com um `UPDATE` direto
na tabela: readers não conseguem sequer chamar a RPC, que é restrita a
admins. Um admin não consegue se autopromover (já é admin, a chamada é um
no-op) e não consegue rebaixar a si mesmo se for o último admin restante —
mas, havendo dois ou mais admins, um admin PODE se autorrebaixar via
`set_user_role`; essa função não distingue "alvo = quem chama" de qualquer
outro alvo, ela só impede que o último admin seja rebaixado. `set_user_role`
também toma um lock de linha para que rebaixamentos concorrentes não possam
derrubar o número de admins para zero.

## Scripts

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
