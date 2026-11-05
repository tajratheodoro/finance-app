# Finanças

Controle financeiro pessoal com CRUD completo de contas, categorias e transações, um painel com totais e gráficos, registro de gastos e depósitos por uma calculadora própria, e uma aba de investimentos. Tem tema claro e escuro, feito com uma paleta de seis cores.

![Painel com totais, gráficos e últimas transações](docs/screenshots/dashboard.png)

[![CI](https://github.com/tajratheodoro/finance-app/actions/workflows/ci.yml/badge.svg)](https://github.com/tajratheodoro/finance-app/actions/workflows/ci.yml)

## Funcionalidades

- Contas (corrente, carteira e poupança) com saldo calculado a partir das transações.
- Categorias de receita e despesa.
- Transações com filtros por tipo, conta, categoria e período, e paginação de 20 itens. Os filtros ficam na URL.
- Painel com saldo total, totais do período, despesas por categoria e receitas x despesas dos últimos 6 meses.
- Exclusão bloqueada quando uma conta ou categoria ainda tem transações, com mensagem clara.
- Cartões de conta com a aparência da instituição (quando informada) e um seletor de conta.
- Registro pela calculadora: gasto, receita ou depósito, com expressão (por exemplo, `75 + 50`) e valor em centavos.
- Investimentos: aplicações por tipo (renda fixa, ações, fundos, cripto e outros), com total investido, valor atual, rentabilidade e distribuição em gráfico.
- Tema claro e escuro, layout responsivo (celular, tablet e desktop) e animações só onde ajudam a entender a tela, sem nada que se mova sozinho.

## Stack

| Área        | Escolha                                                      | Motivo                                                          |
| ----------- | ------------------------------------------------------------ | --------------------------------------------------------------- |
| Framework   | Next.js (App Router) + TypeScript                            | Front e servidor no mesmo projeto, com tipagem ponta a ponta    |
| Banco e ORM | PostgreSQL + Prisma                                          | Integridade referencial real e consultas tipadas                |
| Validação   | Zod                                                          | Uma única regra de validação, usada no servidor e no formulário |
| Formulários | react-hook-form                                              | Estado de formulário leve, com validação pelo Zod               |
| UI          | Tailwind CSS + shadcn/ui                                     | Componentes acessíveis que ficam no próprio repositório         |
| Tipografia  | Xmind (Google Fonts), servida localmente                     | Fonte única, sem buscar arquivos externos em tempo de execução  |
| Tema        | next-themes                                                  | Tema claro e escuro sem piscar a tela ao carregar               |
| Gráficos    | Recharts                                                     | Biblioteca madura para gráficos em React                        |
| Testes      | Vitest (unitários e integração) + Playwright (ponta a ponta) | Integração roda no banco real, sem mock do Prisma               |
| CI          | GitHub Actions                                               | Lint, tipos e testes a cada push                                |

Valores são guardados em centavos (`Int`), para evitar erro de ponto flutuante.

## Como rodar

Pré-requisitos: Node.js 22 e Docker.

```bash
npm install
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000). O seed cria seis meses de dados de exemplo.

## Testes

```bash
# unitários e de integração (usa o banco finance_test)
npm test

# ponta a ponta (usa o banco finance_test_e2e, que é limpo antes da execução)
TEST_DATABASE_URL=postgresql://finance:finance@localhost:5432/finance_test_e2e npm run test:e2e
```

Antes do primeiro teste, aplique as migrações nos dois bancos de teste:

```bash
npm run db:test:migrate
TEST_DATABASE_URL=postgresql://finance:finance@localhost:5432/finance_test_e2e npm run db:test:migrate
```

## Decisões de design

A especificação e o plano de implementação estão em `docs/superpowers/`:

- [Spec de design](docs/superpowers/specs/2026-11-02-finance-app-design.md)
- [Plano da fase 1](docs/superpowers/plans/2026-11-02-finance-app-phase1.md)

## Estrutura

```
src/
├── app/                 # rotas do Next.js; só monta as páginas
├── features/            # um diretório por domínio: accounts, categories, transactions, dashboard
│   └── <feature>/       # actions.ts, queries.ts, schemas.ts, components/
├── components/ui/       # primitivos do shadcn/ui
└── lib/                 # banco, valores em R$ e tipos compartilhados
```
