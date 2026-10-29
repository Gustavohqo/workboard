# Design system — Workboard

Guia visual do `apps/web`. Consulte antes de criar ou alterar telas e componentes.

- **Tokens:** [`tokens.json`](tokens.json) é a fonte de verdade. Eles já estão aplicados em [`src/app/globals.css`](../../src/app/globals.css) como variáveis CSS e utilitários do Tailwind. Se mudar um valor, mude nos dois arquivos.
- **Versão visual:** o design system completo, com prévias ao vivo dos componentes nos dois temas, está no artifact [Workboard](https://claude.ai/artifact/CxL3WS9VBLxDwwPh9wk68V) (privado).

Um quadro de tarefas pessoal com três colunas, limite de trabalho em andamento e desfazer. A interface é quieta: neutros quase brancos (ou quase pretos), uma única cor de destaque e nada que dispute atenção com as tarefas.

## Princípios

- **As tarefas são o conteúdo.** Cromo mínimo: sem gradientes, sem ilustrações, uma única sombra (`shadow-card`).
- **Toda ação dá um retorno claro.** Funcionou, falhou ou não mudou nada, sempre com palavra e nunca só com cor (RN15).
- **Uma cor tem um significado.** `accent` é ação principal e "pode desfazer"; `warning` é "coluna no limite"; `danger` é "falhou". Não use essas cores como decoração.

## Conteúdo e tom

- Português, frases curtas, caixa de frase: "Criar tarefa", não "Criar Tarefa".
- Prefira verbos diretos: "Mover para Concluído".
- Colunas exibidas como **A fazer**, **Em andamento** e **Concluído**. Os ids internos (`a_fazer`, `em_andamento`, `concluido`) nunca aparecem na tela.
- Mensagens de erro dizem o que aconteceu e que nada mudou: "Em andamento já tem 2 de 2 tarefas. Nada foi alterado."
- Sem emoji. Ids aparecem como `#12`, em fonte mono.

## Usando no Tailwind

| Token | Utilitário | Uso |
| --- | --- | --- |
| `surface` | `bg-surface` | Fundo da página |
| `surface-raised` | `bg-surface-raised` | Cartões, campos, menus |
| `surface-sunken` | `bg-surface-sunken` | Fundo das colunas; hover de botões secundários |
| `line` | `border-line` | Divisórias e borda dos cartões |
| `line-strong` | `border-line-strong` | Borda de campos e botões secundários (3:1) |
| `ink` | `text-ink` | Texto principal |
| `ink-muted` | `text-ink-muted` | Ids, contadores, texto de apoio |
| `accent` / `on-accent` | `bg-accent text-on-accent` | Botão principal |
| `accent` / `accent-soft` | `text-accent bg-accent-soft` | Indicador de desfazer, mensagem de sucesso |
| `warning` / `warning-soft` | `text-warning bg-warning-soft` | Coluna no limite, mensagem "não mudou nada" |
| `danger` / `danger-soft` | `text-danger bg-danger-soft` | Mensagem de falha, campo com erro |
| `focus` | aplicado em `:focus-visible` | Anel de foco de 2px (global) |
| `shadow-card` | `shadow-card` | Só no cartão de tarefa |

Os temas claro e escuro trocam sozinhos por `prefers-color-scheme`. Para forçar um tema, use `data-theme="light"` ou `data-theme="dark"` no `<html>`. Não use cores fixas do Tailwind (`zinc-500`, `white` etc.) nas telas novas: elas não acompanham o tema.

### Tipografia

Geist para tudo e Geist Mono só para ids e contadores. As duas já são carregadas por `next/font` em `layout.tsx`.

| Estilo | Utilitário | Medidas | Uso |
| --- | --- | --- | --- |
| display | `text-display` | 24/32, 600 | Título da página, um por tela |
| title | `text-title` | 16/24, 600 | Cabeçalho de coluna |
| body | `text-body` | 14/20, 400 | Título da tarefa, mensagens, campos |
| body-strong | `text-body font-medium` | 14/20, 500 | Botões e ênfase pontual |
| caption | `text-caption` | 12/16, 400 | Texto de apoio, dicas de campo |
| label | `text-label` | 12/16, 500 | Rótulos e indicador de desfazer |
| id | `text-id font-mono` | 12/16, 400 | `#12`, `1/2` |

### Espaço e cantos

- Grade de 4px, igual à escala padrão do Tailwind: `space-1` = `p-1` (4px), `space-2` = `p-2` (8px), `space-3` = `p-3` (12px), `space-4` = `p-4` (16px), `space-6` = `p-6` (24px).
- Cartões ficam a `gap-2` um do outro, colunas a `gap-4` e a página tem margem `p-6`.
- Cantos: `rounded-md` (6px) em botões, campos e cartões; `rounded-lg` (10px) em colunas e mensagens; `rounded-sm` (4px) em indicadores.

## Estados

- **Foco:** anel sólido de 2px em `focus` com 2px de afastamento. Já é global, então não remova o `outline`.
- **Hover:** troque o fundo para `bg-surface-sunken` (secundário) ou escureça 8% (`hover:brightness-92`, principal). Sem movimento além de transições de cor de 120ms.
- **Desabilitado:** `disabled:opacity-50`, cursor padrão.

## Layout

- Três colunas de largura igual, lado a lado a partir de 720px; abaixo disso, empilhadas na ordem A fazer → Em andamento → Concluído.
- Barra superior: título (`text-display`) à esquerda e botão "↶ Desfazer" à direita, desabilitado quando não há nada a desfazer.
- Campo de nova tarefa acima do quadro; mensagem de resultado logo abaixo dele.

## Ícones

Sem biblioteca de ícones. O sistema usa só três glifos em texto, sempre acompanhados de palavra: `↶` (desfazer), `→` (mover) e `+` (criar).

## Componentes

Componentes previstos para `src/components/`. As receitas abaixo mostram a aparência esperada; a implementação em React (com testes, conforme o AGENTS.md) ainda não existe.

### Button

Três variantes: `primary`, `secondary` (padrão) e `ghost`. Altura de 36px (28px no tamanho `sm`), `rounded-md`, `text-body font-medium`, `px-4` (`px-2` no `sm`).

- `primary`: `bg-accent text-on-accent`. No máximo um por vista: "+ Criar tarefa".
- `secondary`: `bg-surface-raised text-ink border border-line-strong`, para ações de página como "↶ Desfazer".
- `ghost`: `text-ink-muted`, sem borda, no tamanho `sm`, para mover tarefas dentro do cartão: "→ Em andamento".
- O rótulo começa com verbo, em caixa de frase.

### TextField

Campo de uma linha com rótulo (`text-label`), dica (`text-caption text-ink-muted`) e erro. Altura de 36px, `px-3`, `rounded-md`, `border-line-strong`, `bg-surface-raised`.

- Sempre com rótulo; o placeholder não substitui o rótulo.
- No erro, a borda e a mensagem ficam em `danger`, com `aria-invalid` e `aria-describedby`: "O título não pode ficar vazio." (RN18), "Use um número inteiro a partir de 1." (RN19).
- Usado no título da nova tarefa e no limite de Em andamento ("Só pode mudar com a coluna vazia.", RN21).

### TaskCard

Cartão de uma tarefa: `bg-surface-raised border border-line rounded-md shadow-card p-3`, com id (`text-id font-mono text-ink-muted`), título (`text-body`) e ações opcionais.

- O indicador "↶ Pode desfazer" (`text-label text-accent bg-accent-soft rounded-sm`) aparece só na tarefa afetada pela última ação que mudou o quadro (RN22). Nunca em mais de um cartão; com o histórico vazio, em nenhum.
- As ações são botões `ghost` `sm` para as outras duas colunas. Não mostre a coluna atual.
- O título quebra linha; não trunque.

### Column

Coluna do quadro: `bg-surface-sunken rounded-lg p-3`, com cabeçalho (`text-title` e contador) e lista de cartões com `gap-2`.

- Títulos exatos: "A fazer", "Em andamento", "Concluído".
- O contador (`text-id font-mono text-ink-muted`) mostra a quantidade. Em Em andamento ele mostra `1/2`; no limite, vira `2/2 · limite` em `text-warning bg-warning-soft`.
- Cartões em ordem crescente de id (RN13).
- Sem tarefas, mostra "Nenhuma tarefa" em `text-caption text-ink-muted`.

### ResultMessage

Faixa com o resultado da última ação (RN15): `rounded-lg px-4 py-3 text-body`, com uma palavra de estado em negrito antes do texto.

| Estado | Palavra | Cores | Exemplo |
| --- | --- | --- | --- |
| funcionou | **Feito** | `text-accent` sobre `bg-accent-soft` | "Tarefa #4 criada em A fazer." |
| falhou | **Falhou** | `text-danger` sobre `bg-danger-soft` | "Em andamento já tem 2 de 2 tarefas. Nada foi alterado." |
| não mudou nada | **Nada mudou** | `text-warning` sobre `bg-warning-soft` | "Não há nada para desfazer." |

- Uma mensagem por vez, logo abaixo do campo de nova tarefa, substituída a cada ação.
- Use `role="alert"` na falha e `role="status"` nos outros estados.
