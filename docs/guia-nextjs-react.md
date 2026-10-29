# Guia rápido: construindo um produto com React e Next.js

Este guia é para quem **nunca trabalhou com React ou Next.js** e precisa contribuir com o frontend do Workboard (`apps/web`). Ele não substitui a documentação oficial, mas mostra o caminho mínimo para ser produtivo.

---

## 1. Os conceitos em 2 minutos

**React** é uma biblioteca para construir interfaces a partir de **componentes**: funções que recebem dados (`props`) e retornam o que deve aparecer na tela (JSX, um "HTML dentro do TypeScript").

```tsx
type GreetingProps = { name: string };

export function Greeting({ name }: GreetingProps) {
  return <p>Olá, {name}!</p>;
}
```

**Next.js** é um framework em cima do React que resolve o que o React sozinho não resolve: rotas, renderização no servidor, busca de dados, otimização de imagens, build e deploy.

---

## 2. Onde as coisas ficam

```
apps/web/
├── public/            # arquivos estáticos (imagens, ícones)
└── src/
    ├── app/           # ROTAS: cada pasta vira uma URL
    │   ├── layout.tsx # moldura comum a todas as páginas
    │   ├── page.tsx   # página da rota "/"
    │   └── globals.css
    ├── components/    # componentes reutilizáveis (crie conforme precisar)
    └── lib/           # funções utilitárias, chamadas à API
```

### Rotas = pastas

| Arquivo                               | URL              |
| ------------------------------------- | ---------------- |
| `src/app/page.tsx`                    | `/`              |
| `src/app/tarefas/page.tsx`            | `/tarefas`       |
| `src/app/tarefas/[id]/page.tsx`       | `/tarefas/123`   |

Arquivos especiais dentro de uma pasta de rota:

- `page.tsx` — o conteúdo da página.
- `layout.tsx` — envolve as páginas filhas (menu, rodapé).
- `loading.tsx` — exibido enquanto a página carrega.
- `error.tsx` — exibido se der erro.
- `not-found.tsx` — página 404.

---

## 3. Server Components x Client Components

Esse é o conceito mais importante do Next.js moderno.

- **Por padrão, todo componente é um Server Component.** Ele roda no servidor, pode buscar dados direto com `await` e não envia JavaScript para o navegador. Rápido e simples.
- Quando precisa de **interatividade** (clique, digitação, `useState`, `useEffect`), escreva `'use client'` na primeira linha do arquivo. Ele vira um **Client Component**.

```tsx
// src/components/counter.tsx
'use client';

import { useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)} className="rounded border px-3 py-1">
      Cliques: {count}
    </button>
  );
}
```

**Regra prática:** comece sem `'use client'`. Só adicione quando o compilador reclamar ou quando você precisar de evento/estado. Mantenha os Client Components pequenos e "nas folhas" da árvore.

---

## 4. Buscando dados da nossa API

Em um Server Component, basta usar `fetch` com `await`:

```tsx
// src/app/tarefas/page.tsx
type Task = { id: number; title: string };

export default async function TasksPage() {
  const res = await fetch(`${process.env.API_URL}/tasks`, { cache: 'no-store' });
  const tasks: Task[] = await res.json();

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

Pontos de atenção:

- `key` é obrigatório ao renderizar listas — use um id estável.
- `cache: 'no-store'` sempre busca dados frescos; sem ele o Next pode reaproveitar a resposta.
- Para **enviar** dados (formulários), estude **Server Actions** (`'use server'`) na documentação.

---

## 5. Estilo com Tailwind

Em vez de escrever CSS, você aplica classes utilitárias:

```tsx
<div className="flex items-center gap-4 rounded-lg bg-zinc-100 p-4 md:p-8">
```

- `p-4` = padding, `gap-4` = espaçamento, `md:` = só a partir de telas médias.
- Consulte a referência em https://tailwindcss.com/docs.

---

## 6. Testes

São dois tipos de teste, com uma ferramenta para cada:

**Unitário (Vitest + React Testing Library):** testa um componente isolado, rápido, sem navegador real. O arquivo fica ao lado do componente, com sufixo `.test.tsx`.

```tsx
// src/components/counter.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { Counter } from './counter';

it('increments on click', async () => {
  render(<Counter />);
  await userEvent.setup().click(screen.getByRole('button'));
  expect(screen.getByRole('button')).toHaveTextContent('Cliques: 1');
});
```

**End-to-end (Playwright):** abre a aplicação num navegador de verdade e age como um usuário. Fica em `apps/web/e2e/`. Use para páginas inteiras e para **Server Components `async`** (o Vitest não consegue renderizá-los).

```ts
// e2e/home.spec.ts
import { expect, test } from '@playwright/test';

test('home page renders title', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Workboard');
});
```

Dicas:

- Procure elementos como o usuário os vê: `getByRole('button', { name: 'Salvar' })`, `getByText(...)`. Evite procurar por classe CSS.
- `pnpm --filter @workboard/web test:watch` roda os unitários a cada alteração.
- `pnpm --filter @workboard/web exec playwright test --ui` abre uma interface para ver o E2E passo a passo.

---

## 7. Passo a passo para criar uma funcionalidade

1. **Defina a rota**: crie `src/app/<nome>/page.tsx`.
2. **Desenhe com componentes estáticos** primeiro (dados fixos no código).
3. **Extraia componentes** repetidos para `src/components/`.
4. **Conecte à API**: troque os dados fixos por `fetch` no Server Component. Se o endpoint não existe, crie-o em `apps/api`.
5. **Adicione interatividade** apenas onde precisar, com `'use client'`.
6. **Trate estados**: adicione `loading.tsx` e `error.tsx`.
7. **Teste**: unitário para componentes com lógica, E2E para a página (seção 6).
8. **Valide**: `pnpm lint`, `pnpm build` e `pnpm test` na raiz.

---

## 8. Erros comuns de iniciante

| Sintoma                                                   | Causa provável / solução                                        |
| --------------------------------------------------------- | --------------------------------------------------------------- |
| "You're importing a component that needs useState..."     | Falta `'use client'` no topo do arquivo.                        |
| "Each child in a list should have a unique key"           | Adicione `key={item.id}` no elemento da lista.                  |
| Página não atualiza os dados                              | Use `cache: 'no-store'` ou revalidação no `fetch`.              |
| `process.env.X` é `undefined` no navegador                | Variáveis só chegam ao navegador com prefixo `NEXT_PUBLIC_`.    |
| Hydration mismatch                                        | Algo renderiza diferente no servidor e no cliente (ex.: `Date.now()`, `Math.random()`). |

---

## 9. Onde aprender mais

- Documentação oficial do Next.js: https://nextjs.org/docs (siga o tutorial "Learn")
- Documentação do React: https://react.dev/learn
- A documentação exata da versão instalada fica em `apps/web/node_modules/next/dist/docs/`.
- Peça ajuda à IA do projeto: ela segue as regras de `AGENTS.md`.
