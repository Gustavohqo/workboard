# 0009 — Composição do módulo `board` e configuração compartilhada

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O AGENTS.md (seção 4) pede um módulo por domínio, com controller e service. O `BoardService` recebe objetos de domínio (`IdGenerator`, `BoardSettings`, `History` e o mapa de tarefas) com valores padrão. O Nest injeta dependências por classe ou token, e não sabe construir esses objetos sozinho. Além disso, os testes HTTP (`supertest`) precisam da mesma configuração global de `main.ts`: prefixo `/api`, `ValidationPipe` e CORS (ADR 0007). Sem um ponto comum, a configuração poderia divergir entre o servidor e os testes.

## Decisão

- **Serviço por fábrica:** `BoardModule` registra o `BoardService` com `useFactory: () => new BoardService()`, em vez de deixar o Nest instanciá-lo pela classe. O serviço continua sendo `@Injectable()` para o controller recebê-lo por injeção.
- **Configuração compartilhada:** `configureApp(app)` em `apps/api/src/configure-app.ts` aplica o prefixo global, o `ValidationPipe` e o CORS. `main.ts` e os testes HTTP e E2E chamam essa mesma função.
- **Filtro de validação:** o `BoardValidationFilter` converte o erro de validação em `VALIDATION_ERROR` com o `board` atual, como o ADR 0007 já exige. Não é uma decisão nova, então não tem ADR próprio.

## Alternativas consideradas

- **Token de injeção com `useValue` e objetos criados fora do módulo:** funcionaria, mas espalharia a montagem do domínio pelo código de aplicação.
- **Repetir a configuração em `main.ts` e nos testes:** duplicaria regras que precisam ser idênticas; uma diferença faria um teste passar sem valer para o servidor real.

## Consequências

- Qualquer nova configuração global de HTTP entra em `configureApp`, e não em `main.ts`.
- Dependências novas do serviço exigem ajustar a fábrica no `BoardModule`.
