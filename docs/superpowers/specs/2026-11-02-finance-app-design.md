# Finance App: Design

- **Data:** 2026-11-02
- **Status:** aguardando revisão do usuário
- **Pasta do projeto:** `finance-app/` (nome provisório, pode mudar)

## 1. Objetivo

App de controle financeiro pessoal com CRUD completo e dashboard. O projeto é um portfólio: código organizado, testado e documentado para ser lido por recrutadores no GitHub e no LinkedIn.

**Critérios de sucesso:**

- Clonar o repositório e rodar em três comandos.
- CRUD de transações, categorias e contas, com validação e erros tratados.
- Dashboard com números corretos, cobertos por teste.
- CI verde a cada push, com testes unitários, de integração e um de ponta a ponta.
- README com GIF do dashboard e links para as decisões de design.

## 2. Escopo

**Fase 1 (este documento):**

- Transações (receitas e despesas)
- Categorias
- Contas (carteiras)
- Dashboard básico
- Seed com 6 meses de dados de exemplo

**Fase 2 (outro documento, depois da fase 1):**

- Orçamentos e metas por categoria

**Fora do projeto por enquanto:**

- Login e multiusuário
- Previsões
- Exportação em CSV
- Soft delete e auditoria

## 3. Stack

| Área | Escolha |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Banco e ORM | PostgreSQL + Prisma |
| Validação | Zod |
| Formulários | react-hook-form (com o resolver do Zod) |
| UI | Tailwind CSS + shadcn/ui |
| Gráficos | Recharts |
| Testes | Vitest (unitário e integração) + Playwright (ponta a ponta) |
| Qualidade | ESLint + Prettier |
| Ambiente local | Docker Compose (PostgreSQL) |
| CI | GitHub Actions |

## 4. Estrutura de pastas

```
finance-app/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/                     # rotas do Next.js, só monta as páginas
│   │   ├── (dashboard)/
│   │   │   ├── page.tsx
│   │   │   ├── transactions/page.tsx
│   │   │   ├── categories/page.tsx
│   │   │   └── accounts/page.tsx
│   │   └── layout.tsx
│   ├── features/                # uma pasta por domínio
│   │   ├── transactions/
│   │   │   ├── actions.ts       # criar, editar, excluir (server actions)
│   │   │   ├── queries.ts       # leituras, filtros e paginação
│   │   │   ├── schemas.ts       # validação com Zod
│   │   │   └── components/
│   │   ├── categories/
│   │   ├── accounts/
│   │   └── dashboard/           # agregações e gráficos
│   ├── components/ui/           # primitivos do shadcn/ui
│   └── lib/
│       ├── db.ts                # cliente Prisma
│       └── money.ts             # centavos <-> exibição em R$
├── tests/                       # testes de integração e ponta a ponta
├── docs/superpowers/specs/      # specs de design
├── docker-compose.yml
└── README.md
```

**Regras de dependência:**

- `app/` só monta páginas. Não tem regra de negócio.
- Uma feature não importa de outra. A exceção é `dashboard`, que lê dados pelo `queries.ts` das outras features.
- `components/ui` não conhece domínio. `lib/` não conhece feature.

## 5. Modelo de dados

```prisma
enum AccountType {
  CHECKING
  WALLET
  SAVINGS
}

enum TransactionType {
  INCOME
  EXPENSE
}

model Account {
  id                  String        @id @default(cuid())
  name                String
  type                AccountType
  initialBalanceCents Int           @default(0)
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt
  transactions        Transaction[]
}

model Category {
  id           String          @id @default(cuid())
  name         String
  type         TransactionType
  color        String
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  transactions Transaction[]
}

model Transaction {
  id          String          @id @default(cuid())
  description String
  amountCents Int
  type        TransactionType
  date        DateTime
  accountId   String
  account     Account         @relation(fields: [accountId], references: [id], onDelete: Restrict)
  categoryId  String
  category    Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt

  @@index([accountId, date])
  @@index([categoryId])
}
```

**Decisões:**

1. **Valores em centavos (`Int`).** Evita erro de arredondamento de ponto flutuante. A conversão para R$ fica em `lib/money.ts`.
2. **Valor sempre positivo.** O tipo define o sinal. A regra `amountCents > 0` fica no schema Zod, porque o Prisma não tem essa restrição nativa.
3. **Saldo calculado, não guardado.** Saldo = saldo inicial + receitas - despesas.
4. **Excluir conta ou categoria com transações é bloqueado** (`onDelete: Restrict`), com mensagem clara ao usuário. Nada de exclusão em cascata.
5. **Data sem horário.** A data é guardada ao meio-dia UTC, para que o fuso horário não troque o dia.

## 6. Fluxos

**Escrita (criar, editar, excluir):**

1. O formulário envia os dados para uma server action em `actions.ts`.
2. A action valida com o schema Zod de `schemas.ts`.
3. Se for inválido, devolve erros por campo e não grava nada.
4. Se for válido, grava via Prisma (`lib/db.ts`).
5. Revalida as telas afetadas (lista e dashboard) com `revalidatePath`.
6. Retorna um resultado tipado: `{ ok: true }` ou `{ ok: false, error }`.

**Leitura:**

- `queries.ts` busca os dados dentro de Server Components.
- Filtros (período, conta, categoria, tipo) ficam na URL, então a tela pode ser compartilhada e recarrega no mesmo estado.
- Paginação simples, 20 itens por página.

**Regras de validação de transação:**

- Descrição obrigatória.
- Valor maior que zero. O formulário aceita vírgula ("12,50").
- Data, tipo, conta e categoria obrigatórios.
- Categoria precisa ser do mesmo tipo da transação. Receita não pode usar categoria de despesa.

**Um schema Zod para servidor e formulário.** O formulário reutiliza o schema, então a regra existe em um lugar só.

## 7. Dashboard

- **Cards no topo:** saldo total, receitas do período, despesas do período e saldo do período.
- **Gráfico de despesas por categoria** no período.
- **Gráfico de receitas x despesas**, mês a mês, dos últimos 6 meses.
- **Últimas 5 transações**, com link para a lista completa.

**Decisões:**

1. **Somas feitas no banco** (`aggregate` e `groupBy`). O app não carrega todas as transações para somar em JavaScript.
2. **Período na URL.** O padrão é o mês atual.
3. **Estado vazio tratado.** Sem dados, a tela mostra mensagem e botão para adicionar a primeira transação, sem gráfico quebrado.

## 8. Tratamento de erros

| Situação | Comportamento |
|---|---|
| Dados inválidos | Erros por campo no formulário. Nada é gravado. |
| Regra de negócio (ex.: excluir conta com transações) | Mensagem clara ao usuário. Não é exceção. |
| Registro não encontrado (ex.: editar transação excluída em outra aba) | Mensagem "não encontrado" e volta para a lista. |
| Erro inesperado | Registrado no servidor. O usuário vê uma mensagem genérica. |

## 9. Testes

| Nível | Ferramenta | O que cobre |
|---|---|---|
| Unitário | Vitest | `money.ts` e os schemas Zod, incluindo a regra de tipo de categoria |
| Integração | Vitest + PostgreSQL de teste (Docker) | Server actions e queries contra banco real |
| Ponta a ponta | Playwright | Um fluxo feliz: criar conta, categoria e transação, e ver o valor no dashboard |

**Decisão:** integração com banco real, não mock do Prisma. Mock prova que o código chama um método, mas não que a consulta funciona.

## 10. Qualidade e portfólio

**CI (GitHub Actions),** a cada push:

1. Lint
2. Verificação de tipos
3. Testes

Um selo de status no README mostra que o CI está passando.

**README:**

- GIF ou captura de tela do dashboard no topo.
- Stack, com o motivo de cada escolha em uma linha.
- Como rodar em três comandos: `docker compose up -d`, `npm run db:seed` e `npm run dev`.
- Link para este documento de design.

## 11. Decisões registradas

| Decisão | Motivo |
|---|---|
| Centavos em `Int` | Evita erro de ponto flutuante |
| Saldo calculado | Não existe saldo dessincronizado |
| `onDelete: Restrict` | Protege o histórico de exclusões acidentais |
| Server actions em vez de REST | Menos código para manter nesta fase |
| Schema Zod compartilhado | Uma regra de validação, em um lugar |
| Banco real nos testes de integração | Testa a consulta de verdade |

## 12. Próximos passos

1. Revisão deste documento pelo usuário.
2. Plano de implementação (skill `writing-plans`).
3. Implementação da fase 1, na ordem do plano.
