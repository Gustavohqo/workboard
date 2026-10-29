# 0007 — Contrato HTTP da API

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O escopo (`docs/ai/context/escopo.md`) deixa a interação aberta ("por uma tela ou por comandos/funções"). Para o backend ser usado por um cliente, é preciso definir rotas, formato das respostas, códigos de erro e como o cliente sabe o que mudou. As regras RN12, RN15, RN16 e RN22 exigem que o resultado de cada ação seja explícito.

## Decisão

### Convenções

- Prefixo global `/api`; rotas e campos em inglês (AGENTS.md, seção 3).
- Valores das colunas em inglês: `todo`, `in_progress`, `done`. Correspondem, respectivamente, a `a_fazer`, `em_andamento` e `concluido` do escopo.
- JSON com campos em `camelCase`.
- Toda resposta, de sucesso ou de falha, inclui o `board` atual. O cliente não precisa adivinhar o estado depois de uma ação.
- Toda mensagem de erro é fixa em inglês: `error.code` e `error.message`.

### Rotas

| Método | Rota | Função | Regras |
| ------ | ---- | ------ | ------ |
| `GET` | `/api/board` | Estado do quadro: colunas ordenadas, limite e `undoTaskId` | RN13, RN14, RN22 |
| `PUT` | `/api/board/settings` | Define o limite de `in_progress` | RN07, RN19, RN21 |
| `POST` | `/api/tasks` | Cria tarefa com `title`; o id é gerado pelo sistema | RN01, RN18, RN20 |
| `PATCH` | `/api/tasks/:id/column` | Move a tarefa para `column` | RN02–RN05, RN17 |
| `POST` | `/api/board/undo` | Desfaz a última ação que mudou o quadro | RN08–RN12 |

### Resultado das ações

Toda ação de escrita retorna `outcome`, com exatamente um dos valores:

- `changed`: a ação mudou o quadro (status `201` para criação, `200` para as demais).
- `unchanged`: nada mudou, como mover para a coluna atual ou desfazer sem histórico (status `200`).
- `failed`: a ação foi rejeitada e nada mudou (status de erro, com `error`).

Exemplo de falha:

```json
{
  "outcome": "failed",
  "error": { "code": "WIP_LIMIT_REACHED", "message": "The in_progress column is full." },
  "board": { "...": "..." }
}
```

Desfazer sem histórico retorna `200` com `"outcome": "unchanged"` e `"reason": "nothing_to_undo"`.

### Estado do quadro

`GET /api/board` retorna:

```json
{
  "columns": {
    "todo": [{ "id": "1", "title": "..." }],
    "in_progress": [],
    "done": []
  },
  "wipLimit": 2,
  "undoTaskId": "1"
}
```

- Cada coluna vem ordenada pelo comparador do ADR 0003.
- `wipLimit` é o limite atual, com padrão 2 (ADR 0006).
- `undoTaskId` é o id da tarefa afetada pela entrada no topo do histórico (RN22), ou `null` se o histórico estiver vazio.

### Códigos de erro

| Situação | Status | `error.code` |
| -------- | ------ | ------------ |
| Entrada inválida: título vazio ou só espaços, limite não inteiro ou menor que 1, corpo fora do formato | 400 | `VALIDATION_ERROR` |
| Coluna desconhecida | 400 | `UNKNOWN_COLUMN` |
| Tarefa não existe | 404 | `TASK_NOT_FOUND` |
| `in_progress` já está no limite | 409 | `WIP_LIMIT_REACHED` |
| Alteração de limite com tarefa em `in_progress` | 409 | `WIP_LIMIT_LOCKED` |

## Alternativas consideradas

- **Colunas com os nomes do escopo (`a_fazer`, `em_andamento`, `concluido`):** manteria o vocabulário do enunciado, mas quebraria a regra de inglês nas rotas e nos campos. Os nomes do escopo continuam valendo como termos de negócio na documentação.
- **Desfazer sem histórico com `409`:** tornaria a falta de histórico um erro, embora nada seja perdido. Preferiu-se `200 unchanged`.
- **Respostas de erro sem o `board`:** deixaria o cliente sem o estado atual após uma falha. Preferiu-se incluí-lo sempre.

## Consequências

- O cliente trata três casos de `outcome` e uma lista fixa de códigos de erro.
- Como toda resposta traz o `board`, o cliente pode substituir o estado local sem nova consulta.
- Mudar qualquer rota, campo ou código exige novo ADR, porque o cliente depende deste contrato.
