# 0004 — Modelo do quadro em memória

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O escopo (`docs/ai/context/escopo.md`) pede tudo em memória, desfazer em ordem inversa e preservação total do quadro e do histórico em caso de falha. A primeira proposta tinha três estruturas: `tasks`, `history` e um `board` que mapeava cada coluna aos ids das suas tarefas, guardando também o limite.

## Decisão

- **`Task`** guarda `id`, `title` e `column`. A coluna da tarefa fica na própria entidade; as tarefas ficam em `Map<string, Task>`, indexadas pelo id.
- **Não existe `Board`.** As colunas exibidas são derivadas das tarefas (filtro por coluna + ordenação do ADR 0003).
- **`BoardSettings`** encapsula as colunas existentes (`a_fazer`, `em_andamento`, `concluido`) e o limite de `em_andamento`, e é o lugar para configurações futuras. É definido antes do uso e não muda depois.
- **`History`** é uma pilha. Cada entrada guarda o necessário para reverter a ação:
  - criação: `id` da tarefa;
  - movimentação: `id`, coluna de origem e coluna de destino.
- Só entra no histórico a ação que mudou o quadro. Desfazer faz `pop` e não empilha nada; com a pilha vazia, retorna `nada_a_desfazer`.
- Toda ação valida tudo antes de alterar qualquer estrutura, para que uma falha não deixe quadro ou histórico pela metade. A orquestração entre tarefas e histórico como transação está no ADR 0005.

### Validações

- **Id repetido:** inserir uma tarefa com um id que já existe lança erro. Os ids são gerados pelo sistema (ADR 0003), então isso protege uma invariante, não uma entrada do usuário.
- **Limite:** precisa ser inteiro e maior ou igual a 1.
- **Título:** não pode ser vazio nem conter só espaços em branco (`title.trim() === ''` é rejeitado).

## Alternativas consideradas

- **`Board` mapeando coluna → ids:** guarda em dois lugares onde cada tarefa está; toda mudança precisa atualizar ambos, e achar a coluna de uma tarefa exige varrer as colunas.

## Consequências

- Uma única fonte da posição de cada tarefa: mover é alterar um campo.
- Exibir uma coluna custa O(n log n) (filtro + ordenação), aceitável para um quadro em memória.
- Contar as tarefas em `em_andamento` para checar o limite exige percorrer as tarefas, ou manter um contador derivado que precisa ser atualizado junto.
