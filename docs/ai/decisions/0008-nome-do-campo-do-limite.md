# 0008 — Nome do campo do limite no corpo do `PUT`

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O ADR 0007 fixou as rotas e as respostas, mas não o nome do campo que o cliente envia em `PUT /api/board/settings`. Na Fase 4 o campo foi nomeado `wipLimit`, igual ao campo que `GET /api/board` devolve. O cliente depende desse nome, então ele precisa ficar registrado.

## Decisão

- O corpo de `PUT /api/board/settings` tem o campo `wipLimit`, um inteiro maior ou igual a 1:

```json
{ "wipLimit": 3 }
```

- O nome é o mesmo usado na resposta de `GET /api/board`, para que o cliente leia e escreva o mesmo campo.
- Validação pelo `SetLimitDto` (`class-validator`): `@IsInt()` e `@Min(1)`. Valor fora disso retorna `VALIDATION_ERROR` (400).

## Alternativas consideradas

- **`limit` no corpo:** mais curto, mas o cliente teria de traduzir `wipLimit` ao ler e `limit` ao escrever.
- **Corpo com o limite direto (`3`):** evitaria o objeto, mas não deixa espaço para novos campos de configuração sem quebrar o contrato.

## Consequências

- Mudar o nome do campo exige novo ADR, como qualquer mudança de contrato (ADR 0007).
