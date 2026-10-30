import { Suspense } from 'react';
import { BoardView } from '@/components/board-view';
import { getBoard } from '@/lib/board/api';

async function BoardPage() {
  const board = await getBoard().catch(() => null);

  if (!board) {
    return (
      <p role="alert" className="text-body text-danger">
        API indisponível — rode `pnpm dev` na raiz do projeto.
      </p>
    );
  }

  return <BoardView initialBoard={board} />;
}

export default function Home() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl p-6">
      {/* Dados dinâmicos precisam de <Suspense> com cacheComponents ativo */}
      <Suspense fallback={<p className="text-body text-ink-muted">Carregando quadro…</p>}>
        <BoardPage />
      </Suspense>
    </main>
  );
}
