# Escopo — Quadro de tarefas com limite e desfazer

Este documento descreve **o que** o sistema deve fazer, a partir do enunciado do desafio.
Decisões técnicas (stack, API, telas, formatos) ficam para outro passo.

Regra de leitura: **o que não está descrito aqui não é esperado.**

## 1. Objetivo

Uma equipe precisa acompanhar tarefas sem perder alterações acidentais.
O sistema é um quadro com as colunas `a_fazer`, `em_andamento` e `concluido`, com limite
de trabalho em andamento e a opção de desfazer a última mudança.

A interação pode ser feita por uma tela ou por comandos/funções.

## 2. Conceitos

| Conceito | Definição |
| -------- | --------- |
| Tarefa   | Tem um identificador (`id`) e um título, ambos em texto. |
| Colunas  | Exatamente três: `a_fazer`, `em_andamento`, `concluido`. |
| Limite   | Quantidade máxima de tarefas em `em_andamento`. Configurado antes do uso; padrão **2**. |
| Histórico | Registro das criações e movimentações que realmente mudaram o quadro, usado pelo desfazer. |

## 3. Ações e regras de negócio

### 3.1 Criar tarefa

- **RN01** — Toda tarefa nova entra em `a_fazer`.

### 3.2 Mover tarefa

- **RN02** — A pessoa pode mover uma tarefa para qualquer uma das três colunas.
- **RN03** — Se a tarefa não existir, a ação falha: explicar o erro e manter o quadro como estava.
- **RN04** — Se a coluna for desconhecida, a ação falha: explicar o erro e manter o quadro como estava.
- **RN05** — Mover uma tarefa para a coluna onde ela já está não muda nada.

### 3.3 Limite de trabalho em andamento

- **RN06** — A coluna `em_andamento` tem um limite de tarefas.
- **RN07** — O limite é configurado antes do uso; se não for configurado, vale **2**.

### 3.4 Desfazer

- **RN08** — Desfaz uma criação ou movimentação por vez, começando pela última que realmente mudou o quadro.
- **RN09** — Desfazer uma criação remove a tarefa recém-criada.
- **RN10** — Desfazer uma movimentação devolve a tarefa à coluna anterior.
- **RN11** — O próprio desfazer não cria uma nova entrada no histórico.
- **RN12** — Quando não houver nada para desfazer, retornar `nada_a_desfazer`.

### 3.5 Exibição do quadro

- **RN13** — Mostrar as tarefas de cada coluna em ordem crescente de identificador.
- **RN14** — Indicar se é possível desfazer.

### 3.6 Resultado das ações

- **RN15** — Deixar claro quando uma ação **funcionou**, **falhou** ou **não mudou nada**.
- **RN16** — Em caso de falha, preservar tanto o quadro quanto o histórico.

## 4. Premissas

- As ações acontecem uma de cada vez.
- Tudo fica em memória.

## 5. Fora do escopo

- Login.
- Colaboração em tempo real.
- Exclusão de tarefas.
- Refazer.
- Armazenamento em disco.

## 6. Decisões complementares

O enunciado não definia estes pontos; foram decididos com o usuário em 2026-10-29.

- **RN17** — Com `em_andamento` no limite, mover uma tarefa para essa coluna falha: explicar o erro e manter quadro e histórico como estavam.
- **RN18** — O título da tarefa não pode ser vazio nem conter só espaços; caso contrário, a criação falha sem alterar quadro e histórico.
- **RN19** — O limite de `em_andamento` deve ser um número inteiro maior ou igual a 1; outros valores são rejeitados na configuração.
- **RN20** — O id é gerado pelo sistema como contador sem zeros à esquerda, é ordenado por tamanho e depois por texto, e nunca é reutilizado (ver ADR 0003).
