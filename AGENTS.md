# AGENTS.md

Regras para agentes de IA (Claude, Codex, Cursor, etc.) que trabalham neste repositório.
Leia este arquivo inteiro antes de qualquer alteração.

## 1. Visão geral do projeto

Monorepo gerenciado com **pnpm workspaces** + **Turborepo**.

| Caminho     | O que é                                                     |
| ----------- | ----------------------------------------------------------- |
| `apps/api`  | Backend **NestJS** (TypeScript, Vitest, Oxlint)             |
| `apps/web`  | Frontend **Next.js** com App Router (React, Tailwind, ESLint) |
| `packages/` | Pacotes compartilhados entre apps (tipos, utilitários, config) |
| `docs/`     | Documentação humana e artefatos usados pela IA (`docs/ai/`) |

## 2. Regra obrigatória: atualizar o HISTORY.md

**A cada interação com a IA, atualize o `HISTORY.md` na raiz antes de encerrar a resposta.**

- Adicione uma nova entrada **no final** do arquivo, nunca reescreva entradas antigas.
- Use exatamente o formato abaixo:

```md
### AAAA-MM-DD HH:MM (fuso) — <título curto>

- **Solicitação:** <a solicitação resumida em uma frase>
- **Resultado:** Concordância | Discussão
- **Detalhes:** <o que foi feito; se houve discussão, quais pontos foram debatidos e o que foi decidido>
```

- Obtenha a hora real com `date '+%Y-%m-%d %H:%M %Z'`; não invente horários.
- **Concordância** = a IA executou o pedido sem objeções ou ajustes de rumo.
- **Discussão** = houve divergência, pergunta de esclarecimento, alternativa proposta ou correção do usuário. Descreva o debate.
- O `HISTORY.md` está no `.gitignore` de propósito: é um registro local. Não o remova do `.gitignore`.

## 3. Linguagem e stack

- **TypeScript é obrigatório** em todo código (front e back). Não crie arquivos `.js` de código-fonte; arquivos de configuração `.mjs` gerados por ferramentas são aceitos.
- Mantenha `strict` ativo nos `tsconfig.json`. Evite `any`; prefira `unknown` + validação.
- Use **pnpm** (via Corepack). Nunca use `npm install` ou `yarn` — eles quebram o lockfile.
  - Adicionar dependência a um app: `pnpm --filter @workboard/web add <pacote>`.
- Comandos de raiz passam pelo Turborepo: `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`.

## 4. Backend (`apps/api`)

- Siga a arquitetura modular do NestJS: um **módulo por domínio** (`src/<dominio>/<dominio>.module.ts`, `.controller.ts`, `.service.ts`).
- Gere artefatos com a CLI: `pnpm --filter @workboard/api exec nest g resource <nome>`.
- Controllers só lidam com HTTP; regra de negócio fica nos services.
- Valide entradas com DTOs.
- Todas as rotas ficam sob o prefixo global `/api`. A porta padrão é `3333`.
- O projeto é ESM (`"type": "module"`): imports relativos precisam da extensão `.js`.
- Testes com **Vitest** (`*.spec.ts` ao lado do código; e2e em `test/`).

## 5. Frontend (`apps/web`)

- Use o **App Router** (`src/app`). Não crie o diretório `pages/`.
- Componentes são **Server Components** por padrão; adicione `'use client'` apenas quando precisar de estado, efeitos ou eventos do navegador.
- Estilização com **Tailwind CSS**.
- Use o alias `@/` para imports internos (`@/components/...`).
- A URL da API vem de `API_URL` (veja `apps/web/.env.example`).
- Testes:
  - **Unitários com Vitest + React Testing Library**, em `*.test.tsx` ao lado do componente. Busque elementos por papel/texto (`getByRole`, `getByText`), não por classes CSS, e use `@testing-library/user-event` para interações.
  - **Server Components `async` não são testáveis no Vitest**: cubra-os com **E2E no Playwright** em `apps/web/e2e/*.spec.ts`.
  - Todo componente novo com lógica deve ter teste unitário; toda página nova, ao menos um teste E2E.
- O arquivo `apps/web/AGENTS.md` é gerado pelo Next.js e aponta para a documentação da versão instalada em `node_modules/next/dist/docs/`. **Consulte essa documentação antes de usar APIs do Next.js** — a versão pode ser mais nova que o seu conhecimento.

## 6. Documentação e artefatos de IA (`docs/`)

- `docs/guia-nextjs-react.md`: guia para iniciantes. Atualize-o se mudar convenções do front.
- `docs/ai/prompts/`: prompts reutilizáveis que funcionaram bem.
- `docs/ai/decisions/`: decisões de arquitetura (ADRs), uma por arquivo, `NNNN-titulo.md`.
- `docs/ai/context/`: contexto de negócio/domínio que a IA deve conhecer.
- Ao tomar uma decisão arquitetural relevante, registre um ADR em `docs/ai/decisions/`.

## 7. Boas práticas de trabalho

- Faça mudanças pequenas e focadas; não refatore o que não foi pedido.
- **Siga TDD: o teste vem antes do código.** Para cada comportamento, execute o ciclo completo, sem pular etapas:
  1. **Cria o teste** que descreve o comportamento esperado.
  2. **Executa** o teste.
  3. **Confirma que falha**, e pelo motivo esperado (não por erro de sintaxe ou import).
  4. **Implementa** o mínimo de código para o teste passar.
  5. **Executa** o teste de novo.
  6. **Confirma o sucesso** antes de seguir para o próximo comportamento.
- Antes de concluir, rode `pnpm lint`, `pnpm build` e `pnpm test` (e `pnpm test:e2e` se mexeu em páginas ou endpoints).
- Credenciais do GitHub ficam criptografadas em `~/.authinfo.gpg` (helper `git-credential-netrc`, veja o README). **Nunca leia, decifre, exiba ou altere esse arquivo**, e nunca coloque tokens em URLs de remoto ou em configurações do git.
- Nunca faça commit de segredos. Variáveis de ambiente novas devem aparecer no `.env.example` do app.
- Commits seguem **Conventional Commits** (`feat:`, `fix:`, `docs:`, `chore:`...).
- Só faça commit/push quando o usuário pedir.
- Escreva documentação e mensagens para o usuário em **português**; código e identificadores em **inglês**.
