# 0001 — Estrutura do monorepo

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O projeto precisa de um backend e um frontend em TypeScript, além de um local para documentação e artefatos de IA.

## Decisão

- Monorepo com **pnpm workspaces** + **Turborepo** (padrão atual da comunidade para monorepos JS/TS).
- `apps/api`: **NestJS 12**, gerado pela CLI oficial (`nest new --strict`), ESM, Vitest e Oxlint.
- `apps/web`: **Next.js 16**, gerado pelo `create-next-app` com App Router, `src/`, Tailwind CSS, ESLint e Turbopack.
- `packages/` reservado para código compartilhado.
- `docs/` para documentação humana e `docs/ai/` para artefatos da IA.

## Consequências

- Um único `pnpm install` e comandos unificados (`pnpm dev`, `pnpm build`).
- Cache de build do Turborepo entre apps.
- Exige pnpm (via Corepack) — npm/yarn não devem ser usados.
