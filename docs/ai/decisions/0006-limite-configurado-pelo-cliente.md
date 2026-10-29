# 0006 — Limite de `em_andamento` configurado pelo cliente

- **Data:** 2026-10-29
- **Status:** Aceita

## Contexto

O escopo (RN06, RN07) diz que o limite de `em_andamento` é configurado antes do uso e que, se não for configurado, vale 2. O ADR 0004 prevê `BoardSettings` como lugar das configurações. Faltava definir quem configura e como.

## Decisão

- O **cliente** (tela ou quem consome a API) define o limite no início do uso, por meio de uma rota HTTP dedicada à configuração.
- Sem configuração explícita, o limite é **2** (padrão do escopo).
- O valor é validado como inteiro maior ou igual a 1 (RN19); valores inválidos são rejeitados sem alterar a configuração atual.
- Todas as rotas HTTP e os nomes de código são em inglês (regra registrada no `AGENTS.md`, seção 3).

## Alternativas consideradas

- **Variável de ambiente:** o limite ficaria fixo no deploy, e o cliente não poderia defini-lo no início do uso como o escopo pede.
- **Parâmetro de inicialização do servidor:** mesmo problema da variável de ambiente.

## Consequências

- A rota de configuração precisa de um DTO validado com `class-validator`.
- Mudança depois do uso: o cliente pode alterar o limite a qualquer momento, desde que a coluna `em_andamento` esteja vazia (RN21). Com tarefas em andamento, a alteração é rejeitada. Isso elimina a necessidade de decidir o que fazer com um limite menor que a quantidade atual.
