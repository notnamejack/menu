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
    <div className="flex min-h-dvh items-center justify-center bg-paper px-6 text-ink">
      <div className="max-w-lg">
        <h1 className="wordmark">Osteria Alba</h1>
        <p className="eyebrow mt-3 text-[13px] tracking-[0.16em] text-muted lowercase">cucina italiana</p>
        {state.status === 'loading' ? (
          <p className="mt-8 text-base text-muted">Открываем меню…</p>
        ) : (
          <>
            <p className="mt-8 text-2xl">Меню не открылось</p>
            <p className="mt-3 leading-relaxed text-muted">{state.message}</p>
          </>
        )}
      </div>
    </div>
  );
}
