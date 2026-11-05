# Redesign visual: brief para os agentes

Data: 2026-11-04. Este brief vale para todos os agentes do redesign. Leia inteiro antes de mexer em qualquer arquivo.

## 1. Paleta (fonte: references/cores.jpg)

Seis cores, nesta ordem do mais escuro ao mais claro:

| Código | Papel no app |
|---|---|
| `#190019` | fundo do modo escuro, texto do modo claro |
| `#2B124C` | superfícies (cards) no escuro, primário no claro |
| `#522B5B` | superfícies secundárias, bordas no escuro |
| `#854F6C` | acento de despesa e foco |
| `#DFB6B2` | texto secundário no escuro, acento claro |
| `#FBE4D8` | fundo do modo claro, texto do modo escuro |

Regras:
- Use só essas seis cores. Tons derivados são permitidos via `color-mix()` sobre elas.
- Exceção única: `--destructive` (`#b4324f` no claro, `#e57a94` no escuro) para exclusão e erro. É a única cor de fora da paleta.
- Nunca escreva cor solta no componente (`bg-purple-500`, `#fff`). Use os tokens do Tailwind: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `bg-primary`, `text-primary-foreground`, `bg-secondary`, `bg-accent`, `border-border`, `text-income`, `text-expense`, `text-destructive`, `ring-ring`, `bg-chart-1` a `bg-chart-5`.
- Os tokens estão em `src/app/globals.css`. Não os altere sem avisar o coordenador.

## 2. Tipografia

- Fonte única: **Xmind**, via `--font-xmind` (carregada em `src/app/layout.tsx`). Pesos 400, 500, 600, 700.
- Classe padrão `font-sans` já aponta para a Xmind. Não importe outra fonte.
- Valores monetários: `font-semibold tabular-nums`, sempre com o símbolo `R$` pela função `formatBrl`.
- Hierarquia: um número grande por card (`text-3xl` a `text-5xl`), rótulo pequeno e discreto (`text-sm text-muted-foreground`).

## 3. Forma e superfícies (inspiração das referências)

- Raio grande: cards em `rounded-3xl` (o token `--radius` é 1.5rem). Controles em pill (`rounded-full`).
- Superfícies em camadas: fundo, depois card, depois bloco interno. Não use sombra pesada. Sombra só em elementos flutuantes (menu, diálogo, pill de navegação).
- Controles segmentados em pill (estilo "Gasto | Receita | Depósito" das referências).
- Cartões de conta empilhados (referência com dois cartões sobrepostos).
- Ícones: `lucide-react`. Nada de emoji como ícone.

## 4. Anti-slop (obrigatório)

Não use:
- gradiente roxo-para-rosa em fundo, texto com gradiente, blobs decorativos
- glassmorphism em todas as superfícies
- faixa de cor na lateral dos cards (`border-left` colorido)
- fileira de métricas com quatro cards idênticos sem hierarquia
- cards dentro de cards sem necessidade
- texto de boas-vindas genérico ("Bem-vindo de volta!")
- emoji, ilustração genérica, ícone de foguete ou de "IA"

Use dados reais, rótulos específicos em português e espaço em branco com intenção. Antes de entregar, rode a skill `anti-ui-slop` na sua área e corrija o que ela apontar.

## 5. Movimento (somente funcional)

Movimento é decoração que precisa ter motivo. Só isto:

- Entrada do conteúdo da página: fade + subida de 8px, 240ms, `ease-out`, uma vez.
- Lista de itens: stagger de no máximo 40ms por item, só na primeira renderização.
- Pill ativa da navegação: deslizar até o item ativo, 200ms.
- Números de totais do painel: contagem até o valor, 500ms, uma vez.
- Calculadora: tecla com `scale(0.96)` ao pressionar, 80ms. Troca do valor com fade.
- Gráficos: desenho inicial (padrão do Recharts), uma vez.
- Diálogos: mantenha as animações do shadcn.

Proibido: bounce, elástico, animação em loop decorativa, animar `width`, `height` ou `top` (use `transform` e `opacity`). Use `motion-safe:` no Tailwind. O `prefers-reduced-motion` já está tratado em `globals.css`.

## 6. Responsividade

- Breakpoints (Tailwind): mobile até 639px, tablet 640px a 1023px, desktop a partir de 1024px.
- Testes de viewport: 360, 390, 768, 1024, 1440.
- Nenhuma rolagem horizontal da página em nenhum viewport.
- Alvos de toque de no mínimo 44px.
- Tabelas viram lista de cards no mobile (ou ficam dentro de um contêiner com rolagem própria, nunca na página inteira).
- Navegação: barra superior no desktop; pill flutuante na parte de baixo no mobile, com `padding-bottom: env(safe-area-inset-bottom)`.

## 7. Acessibilidade

- Contraste de texto de no mínimo 4.5:1 nas duas temas. A paleta já cumpre isso nos pares de texto do token.
- Foco visível em todo controle (`focus-visible:ring-ring`).
- Botões só com ícone têm `aria-label`.
- Não tire `label`, `role` ou `aria-*` existentes sem substituir por equivalente.

## 8. Textos e seletores preservados pelos testes E2E

O arquivo `tests/e2e/happy-path.spec.ts` depende destes textos. **Não renomeie** sem atualizar o teste no mesmo passo:

- Botões: `Nova conta`, `Nova categoria`, `Nova transação`, `Salvar`
- Campos (por label): `Nome`, `Tipo` (combobox), `Descrição`, `Valor (R$)`, `Data`, `Conta` (combobox), `Categoria` (combobox)
- Opções: `Conta corrente`, `Despesa`, `Conta teste`, `Mercado`
- Tabela de contas: `aria-label="Contas cadastradas"`
- Card de totais: componente `Card` do shadcn (que tem `data-slot="card"`) com o texto `Despesas do período`, e dentro dele o valor `R$ 150,00` após o lançamento do teste.
- Lançamento visível: `Supermercado`

## 9. Rotas e nomes de arquivo

| Rota | Tela | Dono |
|---|---|---|
| `/` | Painel | R1 (dashboard) |
| `/transactions` | Transações | R2 |
| `/categories` | Categorias | R3 |
| `/accounts` | Contas (com cartões e seletor) | B |
| `/investments` | Investimentos (nova aba) | C (onda 2) |
| `/registrar` | Calculadora de registro (gasto, receita, depósito) | A (onda 2) |
| shell (navegação, layout, tema) | — | S |

## 10. Propriedade de arquivos (não edite o que não é seu)

- **S (shell):** `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/loading.tsx`, `src/components/app-nav.tsx`, `src/components/theme-toggle.tsx`. Adiciona também os links de Investimentos e Registrar na navegação.
- **B (contas e cartões):** `src/app/(dashboard)/accounts/**`, `src/features/accounts/**`, `prisma/**`, `tests/integration/accounts.test.ts`, `tests/unit/**` que tratem de conta.
- **R1 (painel):** `src/app/(dashboard)/page.tsx`, `src/features/dashboard/components/**`.
- **R2 (transações):** `src/app/(dashboard)/transactions/**`, `src/features/transactions/components/**`.
- **R3 (categorias):** `src/app/(dashboard)/categories/**`, `src/features/categories/components/**`.
- **Onda 2:** C em `src/features/investments/**`, `src/app/(dashboard)/investments/**` e a migração própria. A em `src/app/(dashboard)/registrar/**` e `src/features/registrar/**`.
- **Ninguém** mexe em `src/app/globals.css`, `src/app/layout.tsx`, `src/components/ui/**` (crie o componente dentro da sua feature se precisar), `src/lib/**`, `package.json`.

## 11. Regras de execução

- Não faça commit, push ou `git add`. O usuário faz os commits.
- Não instale pacotes. Se precisar de um, pare e relate.
- Não rode `next dev` nem `next build`. Há um servidor de desenvolvimento rodando na porta 3000 que o usuário usa, e ele pega as mudanças sozinho.
- Migrações: só B (onda 1) e C (onda 2) rodam `prisma migrate dev` e somente no banco `finance`. Testes de integração usam o banco do próprio agente (informado no prompt).
- Formate os seus arquivos com `npx prettier --write`. Rode `npx tsc --noEmit` e `npx eslint` nos seus arquivos.
