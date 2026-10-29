# 0002 — Testes do frontend

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O `create-next-app` não configura testes. O backend já usa Vitest. Segundo a documentação do Next.js 16, o Vitest não renderiza Server Components `async`, que devem ser cobertos por testes E2E.

## Decisão

- **Unitários:** Vitest + React Testing Library (`jsdom`, `@testing-library/jest-dom`, `@testing-library/user-event`), arquivos `src/**/*.test.tsx` ao lado do código. Os aliases do `tsconfig` são resolvidos nativamente pelo Vite (`resolve.tsconfigPaths`), sem plugin extra.
- **E2E:** Playwright (Chromium), arquivos em `apps/web/e2e/`, com `webServer` subindo o `next dev` automaticamente.
- Scripts no padrão da API: `test`, `test:watch`, `test:e2e`; na raiz, `pnpm test` e `pnpm test:e2e` via Turborepo.

## Alternativas consideradas

- **Jest:** também suportado pelo Next, mas exigiria uma segunda ferramenta de testes no monorepo.
- **Cypress:** viável para E2E, mas o Playwright é mais leve, roda em paralelo por padrão e é o mais adotado atualmente.

## Consequências

- Uma única ferramenta de testes unitários (Vitest) em todo o monorepo.
- O E2E precisa de um navegador baixado uma vez por máquina (`playwright install chromium`).
