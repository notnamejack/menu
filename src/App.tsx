import { useEffect, useState } from 'react';
import { MenuScreen } from './components/MenuScreen';
import { loadMenu } from './lib/menu';
import type { MenuData } from './types';

type LoadState =
  | { status: 'loading' }
  | { status: 'ready'; menu: MenuData }
  | { status: 'error'; message: string };

export function App() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    loadMenu().then(
      (menu) => {
        if (!cancelled) setState({ status: 'ready', menu });
      },
      (error: unknown) => {
        if (cancelled) return;
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка при чтении меню.';
        setState({ status: 'error', message });
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'ready') return <MenuScreen menu={state.menu} />;

  return (
    <div className="app-bg flex min-h-dvh items-center justify-center px-6 text-cream">
      <div className="max-w-lg">
        <p className="text-[11px] tracking-[0.28em] text-copper uppercase">дровяной зал</p>
        <h1 className="mt-2 font-serif text-6xl italic">Огниво</h1>
        {state.status === 'loading' ? (
          <p className="mt-6 text-lg text-sand">Разжигаем угли…</p>
        ) : (
          <>
            <p className="mt-6 font-serif text-3xl">Меню не открылось</p>
            <p className="mt-3 leading-relaxed text-sand">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
