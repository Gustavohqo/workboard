# Planejamento de execução — backend (`apps/api`)

Plano de execução das tarefas de backend, derivado do escopo (`docs/ai/context/escopo.md`) e dos ADRs.
Cada comportamento segue TDD (AGENTS.md, seção 7): teste → falha pelo motivo esperado → implementação mínima → passa.

Status: **Executada** · **Em andamento** · **Pendente**

## Regras de projeto já definidas

- Código, docstrings e rotas HTTP em inglês (AGENTS.md, seção 3).
- Limite de `em_andamento` definido pelo cliente no início do uso; padrão 2 (ADR 0006).
- Limite só pode ser alterado com a coluna `em_andamento` vazia (RN21).
- Só a tarefa da última ação que mudou o quadro exibe o indicador de desfazer (RN22).

## Fase 0 — Decisões antes do código

| Item | Status | Observação |
| ---- | ------ | ---------- |
| Configuração do limite pelo cliente | Executada | ADR 0006 e RN21. |
| Validação dos DTOs com `class-validator` | Executada | Dependência instalada na Fase 1. |
| Destino do scaffold | Executada | Removido na Fase 1. |
| Contrato HTTP (rotas, formato de resposta, mapeamento de resultado: funcionou / falhou / não mudou nada, `nada_a_desfazer`) | Executada | ADR 0007: colunas `todo`, `in_progress`, `done`; mensagens de erro fixas em inglês; desfazer sem histórico retorna 200; board em todas as respostas. |

## Fase 1 — Scaffold e base

**Status: Executada**

- Removidos `app.controller.ts`, `app.controller.spec.ts`, `app.service.ts` e `test/app.e2e-spec.ts`.
- `app.module.ts` mantido como módulo raiz, sem controllers nem providers.
- Instaladas `class-validator` e `class-transformer` em `@workboard/api`.
- `passWithNoTests: true` em `vitest.config.ts` e `vitest.config.e2e.ts`, para que os scripts passem sem specs. Remover `passWithNoTests` de `vitest.config.ts` foi feito na Fase 2; em `vitest.config.e2e.ts` permanece até a Fase 5.
- Verificado: `lint`, `build`, `test` e `test:e2e` da API passam.

## Fase 2 — Domínio puro (TDD, sem Nest)

**Status: Executada**

Arquivos em `apps/api/src/board/domain/`, cada um com `*.spec.ts` ao lado. Nenhum importa `@nestjs/*`.

- **Gerador de ids** (`id-generator.ts`, ADR 0003): `IdGenerator` com contador a partir de 1, sem zeros à esquerda, nunca reutilizado; `compareTaskIds` por tamanho e depois por texto.
- **`Task`** (`task.ts`): `id`, `title`, `column`; lança erro se o título for vazio ou só espaços (RN18).
- **Colunas** (`column.ts`): `COLUMNS` fixas (`todo`, `in_progress`, `done`, conforme ADR 0007) e `isColumn` (RN04).
- **`BoardSettings`** (`board-settings.ts`): limite inteiro ≥ 1, padrão 2 (RN07, RN19); `setLimit(limit, quantidadeEmAndamento)` falha se houver tarefas em `em_andamento` (RN21) e valida antes de alterar.
- **`History`** (`history.ts`): pilha com `push`, `peek`, `pop` e `size`; entradas `create` e `move` (ADR 0004). Os nomes do código estão em inglês, conforme AGENTS.md.

## Fase 3 — Serviço transacional (TDD)

**Status: Pendente**

Cada teste verifica tarefas **e** histórico (ADR 0005).

- **Criar** (RN01, RN18): entra em `todo`; falha sem alterar nada.
- **Mover** (RN02–RN05, RN17): validar tudo antes; mesma coluna não muda nada nem entra no histórico; respeita o limite.
- **Desfazer** (RN08–RN12): ler o topo, reverter, só então remover a entrada; sem histórico, retorna `nada_a_desfazer`; a reversão não passa pela checagem de limite.
- **Alterar limite** (RN21): falha se houver tarefa em `em_andamento`; sucesso com a coluna vazia, mesmo após outras ações.
- **Falha simulada** em cada ação: injetar erro ao empilhar ou reverter e checar que quadro e histórico voltam ao estado anterior (RN16).
- **Indicador de desfazer** (RN22): apenas a tarefa afetada pela ação no topo do histórico recebe o indicador; ações que falham ou não mudam nada não contam; com histórico vazio, nenhuma tarefa recebe.
- **Exibição** (RN13): colunas ordenadas pelo comparador do ADR 0003.

## Fase 4 — Camada HTTP (TDD)

**Status: Pendente**

- `board.module.ts`, `board.controller.ts`, `board.service.ts` (um módulo por domínio, AGENTS.md seção 4).
- Controller só lida com HTTP; regra fica no serviço.
- DTOs validados com `class-validator` e `class-transformer`.
- Rotas sob `/api`, em inglês, conforme o ADR 0007 (Fase 0).
- Testes de controller com `supertest`.

## Fase 5 — E2E

**Status: Pendente**

- `apps/api/test/*.e2e-spec.ts` cobrindo: criar, mover até o limite, exceder o limite, desfazer até `nada_a_desfazer`, alterar limite com e sem tarefa em andamento.
- Executar com `pnpm --filter @workboard/api test:e2e`.

## Fase 6 — Fechamento

**Status: Pendente**

- Gates na raiz: `pnpm lint`, `pnpm build`, `pnpm test`, e `pnpm test:e2e` por mexer em endpoints.
- Variáveis de ambiente novas no `apps/api/.env.example`.
- ADRs para decisões novas.
- Entrada no `HISTORY.md` ao fim de cada interação.
- Commit somente quando o usuário pedir.

## Dependências

Fase 0 → 1 → 2 → 3 → 4 → 5 → 6. Sem trechos independentes que justifiquem execução paralela.

## Fora deste plano

Persistência em disco, login, exclusão, refazer e colaboração em tempo real estão fora do escopo; os gatilhos estão em `NEXT_STEPS.md`. O frontend (`apps/web`) não entra aqui.
