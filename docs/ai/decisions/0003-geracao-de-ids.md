# 0003 — Geração e ordenação de ids das tarefas

- **Data:** 2026-10-29
- **Status:** Aceita (revisada em 2026-10-29: largura fixa trocada por tamanho dinâmico)

## Contexto

O escopo (`docs/ai/context/escopo.md`) diz que a tarefa tem um id em texto e que cada coluna é exibida em ordem crescente de id, mas não diz quem define o id. Ids em texto comparados caractere por caractere não seguem a ordem numérica: `"10"` vem antes de `"2"`.

## Decisão

- O **sistema gera o id**; quem cria a tarefa informa apenas o título.
- O id é um contador inteiro que começa em 1, convertido para texto **sem zeros à esquerda** (`"1"`, `"2"`, …, `"10"`). O tamanho cresce conforme o contador.
- A ordenação compara **primeiro o tamanho e, em empate, o texto** (`a.length - b.length`, depois `a < b`), sem `localeCompare`. Como não há zeros à esquerda, essa ordem coincide com a ordem numérica e com a ordem de criação.
- O contador **só avança**: desfazer uma criação remove a tarefa, mas não devolve o id, que não é reutilizado.

## Alternativas consideradas

- **Id informado por quem cria:** exigiria tratar id repetido e vazio, e a ordem de exibição não seguiria a criação.
- **Alfabeto `a-z0-9` com tamanho variável:** a ordem de texto não acompanha a sequência (`"aa"` antes de `"b"`, dígitos antes de letras).
- **Largura fixa com zeros à esquerda (`"000001"`):** permite ordem de texto simples, mas impõe uma capacidade máxima e, ao esgotá-la, ou a criação falha ou é preciso reescrever todos os ids e o histórico (O(n)), mudando ids que as pessoas já usam.
- **Reutilizar o id após desfazer uma criação:** o mesmo id poderia nomear duas tarefas diferentes ao longo do uso, o que confunde quem acompanha o quadro.

## Consequências

- Os pontos "id repetido" e "id vazio" do escopo deixam de existir; a criação valida só o título.
- Não há limite prático de quantidade: o contador é seguro até `Number.MAX_SAFE_INTEGER`.
- A ordenação exige um comparador próprio; o `sort()` padrão do JavaScript daria a ordem errada (`"10"` antes de `"2"`).
- Após desfazer uma criação, a sequência de ids exibida pode ter lacunas.
