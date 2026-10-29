# 0005 — Ações como transações na camada de serviço

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O ADR 0004 define duas estruturas em memória: as tarefas (`Map<string, Task>`) e o histórico (`History`, uma pilha). O escopo exige que uma falha preserve **tanto o quadro quanto o histórico** (RN16). O histórico é tão importante quanto o estado: um histórico que não corresponde às tarefas faz o desfazer produzir um quadro errado.

## Decisão

- **Estruturas independentes.** As tarefas e o histórico vivem separados e não conhecem um ao outro. Nenhum dos dois altera o outro.
- **A camada de serviço orquestra.** Criar, mover e desfazer ficam no serviço, que é o único lugar que altera as duas estruturas juntas.
- **Cada ação é uma transação:** ou tarefas e histórico mudam juntos, ou nenhum muda.

### Criar e mover

1. Validar tudo antes de alterar qualquer coisa (título, tarefa existente, coluna conhecida, limite).
2. Se não houver mudança (mover para a mesma coluna), encerrar sem tocar em nada.
3. Alterar as tarefas.
4. Só depois de a alteração nas tarefas ter sucesso, empilhar a entrada no histórico.
5. Se empilhar falhar, reverter a alteração nas tarefas antes de propagar o erro.

### Desfazer

1. Com o histórico vazio, retornar `nada_a_desfazer`.
2. Ler a entrada do topo **sem removê-la**.
3. Aplicar a reversão nas tarefas: remover a tarefa criada ou devolvê-la à coluna de origem.
4. Só depois de a reversão ter sucesso, remover a entrada do topo.
5. Se a reversão falhar, as tarefas são restauradas e a entrada continua no topo.

A reversão é uma operação interna do serviço: não passa pela validação de limite nem gera entrada no histórico (RN11). Como o desfazer segue a ordem inversa, o estado restaurado é sempre um estado que já foi válido.

## Alternativas consideradas

- **Histórico registrado pela própria estrutura de tarefas:** acopla as duas estruturas e espalha a regra de transação.
- **Remover a entrada antes de reverter:** se a reversão falhar, a entrada se perde e o histórico deixa de corresponder ao quadro.

## Consequências

- Como tudo é em memória e as ações acontecem uma de cada vez (escopo, seção 4), a transação é garantida por validação prévia e reversão em caso de erro, sem mecanismo de lock.
- Os testes do serviço verificam **tarefas e histórico** após cada ação, inclusive nas falhas e nas ações que não mudam nada.
