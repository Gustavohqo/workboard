import { Suspense } from 'react';
import { Counter } from '@/components/counter';

const API_URL = process.env.API_URL ?? 'http://localhost:3333/api';

async function ApiStatus() {
  let message: string;
  try {
    const res = await fetch(API_URL, { cache: 'no-store' });
    message = res.ok ? await res.text() : `API respondeu com status ${res.status}`;
  } catch {
    message = 'API indisponível — rode `pnpm dev` na raiz do projeto.';
  }

  return <>{message}</>;
}

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-4xl font-bold">Workboard</h1>
      <p className="text-zinc-500">Monorepo Next.js + NestJS</p>
      <p className="rounded-md border px-4 py-2 font-mono text-sm">
        API:{' '}
        {/* Dados dinâmicos precisam de <Suspense> com cacheComponents ativo */}
        <Suspense fallback="carregando...">
          <ApiStatus />
        </Suspense>
      </p>
      <Counter />
    </main>
  );
}
