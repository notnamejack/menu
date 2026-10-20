import { Search, X } from 'lucide-react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useKioskIdle, useKioskMode } from '../lib/useKiosk';
import { useVideoDirector } from '../lib/useVideoDirector';
import type { MenuData, MenuItem } from '../types';
import { DishCard } from './DishCard';
import { DishModal } from './DishModal';

type MenuScreenProps = {
  menu: MenuData;
};

export function MenuScreen({ menu }: MenuScreenProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const lockRef = useRef(false);
  const [query, setQuery] = useState('');
  const [active, setActive] = useState('all');
  const [opened, setOpened] = useState<MenuItem | null>(null);
  const [kiosk, toggleKiosk] = useKioskMode();
  const register = useVideoDirector(scrollRef, opened !== null);

  const sections = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return menu.categories
      .map((category) => ({
        category,
        items: menu.items.filter(
          (item) =>
            item.published &&
            item.categoryId === category.id &&
            (needle === '' || item.name.toLowerCase().includes(needle)),
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [menu, query]);

  const visibleIds = useMemo(() => new Set(sections.map((section) => section.category.id)), [sections]);

  const goTo = useCallback((id: string) => {
    setActive(id);
    lockRef.current = true;
    window.setTimeout(() => {
      lockRef.current = false;
    }, 800);
    const root = scrollRef.current;
    if (!root) return;
    if (id === 'all') {
      root.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const section = document.getElementById(`section-${id}`);
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const resetGuest = useCallback(() => {
    setQuery('');
    setOpened(null);
    setActive('all');
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useKioskIdle(kiosk, resetGuest);

  const onScroll = () => {
    if (lockRef.current) return;
    const root = scrollRef.current;
    if (!root) return;
    if (root.scrollTop < 32) {
      setActive('all');
      return;
    }
    const rootTop = root.getBoundingClientRect().top;
    let current = 'all';
    for (const section of sections) {
      const element = document.getElementById(`section-${section.category.id}`);
      if (!element) continue;
      if (element.getBoundingClientRect().top - rootTop <= 88) current = section.category.id;
    }
    setActive(current);
  };

  const openedCategory = opened ? menu.categories.find((category) => category.id === opened.categoryId) : undefined;

  const navClass = (isActive: boolean) =>
    `inline-flex min-h-12 shrink-0 items-center px-1 text-left text-base tracking-[0.14em] uppercase ${
      isActive ? 'text-ink underline decoration-1 underline-offset-[7px]' : 'text-muted'
    }`;

  return (
    <div className={`flex h-dvh flex-col bg-paper text-ink ${kiosk ? 'kiosk' : ''}`}>
      <header className="flex shrink-0 flex-col gap-4 border-b border-line px-5 py-4 min-[900px]:flex-row min-[900px]:items-end min-[900px]:justify-between min-[900px]:gap-8 min-[900px]:px-8 min-[900px]:py-5">
        <div className="min-w-0">
          <h1 className="wordmark">Osteria Alba</h1>
          <p className="eyebrow mt-2 text-[13px] tracking-[0.16em] text-muted lowercase">cucina italiana</p>
        </div>
        <div className="flex w-full min-w-0 flex-col gap-1 min-[900px]:mb-1 min-[900px]:w-auto min-[900px]:flex-row min-[900px]:items-center">
          <form className="relative w-full min-[900px]:w-72" role="search" onSubmit={(event) => event.preventDefault()}>
            <Search className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-muted" size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Найти блюдо"
              aria-label="Поиск по названию"
              autoComplete="off"
              className="h-12 w-full border-b border-ink/20 bg-transparent pr-10 pl-7 text-base text-ink outline-none placeholder:text-muted"
            />
            {query ? (
              <button
                type="button"
                className="absolute top-0 right-0 inline-flex size-12 items-center justify-center text-muted"
                aria-label="Очистить поиск"
                onClick={() => setQuery('')}
              >
                <X size={18} />
              </button>
            ) : null}
          </form>
          <div className="flex items-center self-end min-[900px]:self-center">
            <button
              type="button"
              aria-pressed={kiosk}
              onClick={toggleKiosk}
              className={`inline-flex min-h-12 items-center px-3 text-base whitespace-nowrap ${
                kiosk ? 'text-ink underline decoration-1 underline-offset-[7px]' : 'text-muted'
              }`}
            >
              {kiosk ? 'Закрыть киоск' : 'Киоск'}
            </button>
            {kiosk ? null : (
              <a
                href={`${import.meta.env.BASE_URL}admin/`}
                className="inline-flex min-h-12 items-center px-3 text-base whitespace-nowrap text-muted"
              >
                Для кухни
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col min-[900px]:flex-row">
        <nav
          aria-label="Категории"
          className="no-scrollbar flex shrink-0 gap-4 overflow-x-auto border-b border-line px-5 py-1 min-[900px]:w-56 min-[900px]:flex-col min-[900px]:gap-1 min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-b-0 min-[900px]:px-8 min-[900px]:py-8"
        >
          <button type="button" onClick={() => goTo('all')} className={navClass(active === 'all')}>
            Всё меню
          </button>
          {menu.categories.map((category) => {
            const enabled = visibleIds.has(category.id);
            return (
              <button
                key={category.id}
                type="button"
                disabled={!enabled}
                onClick={() => goTo(category.id)}
                className={`${navClass(active === category.id)} disabled:opacity-35`}
              >
                {category.name}
              </button>
            );
          })}
        </nav>

        <main
          ref={scrollRef}
          onScroll={onScroll}
          className="menu-scroll min-h-0 flex-1 overflow-y-auto px-5 py-7 min-[900px]:px-10 min-[900px]:py-8"
        >
          {sections.length === 0 ? (
            <p className="max-w-md pt-10 text-2xl leading-snug text-muted">
              Такого названия нет. Попробуйте «карбонара» или «тирамису».
            </p>
          ) : (
            <div className="space-y-14">
              {sections.map((section) => (
                <section key={section.category.id} id={`section-${section.category.id}`} className="scroll-mt-4">
                  <header className="mb-6 flex items-baseline justify-between">
                    <h2 className="text-base tracking-[0.22em] text-ink uppercase">{section.category.name}</h2>
                    <span className="meta-label text-[12px] text-muted tabular-nums">{section.items.length}</span>
                  </header>
                  <div className="grid grid-cols-1 gap-x-7 gap-y-10 min-[900px]:grid-cols-2 min-[1500px]:grid-cols-3">
                    {section.items.map((item, index) => (
                      <DishCard
                        key={item.id}
                        item={item}
                        categoryName={section.category.name}
                        marker={String(item.order).padStart(2, '0')}
                        register={register}
                        onOpen={setOpened}
                        delayMs={Math.min(index, 6) * 45}
                      />
                    ))}
                  </div>
                </section>
              ))}
              <p className="meta-label pt-2 pb-8 text-[12px] tracking-[0.18em] text-muted uppercase">
                Osteria Alba · cucina italiana
              </p>
            </div>
          )}
        </main>
      </div>

      {opened ? <DishModal item={opened} category={openedCategory} onClose={() => setOpened(null)} /> : null}
    </div>
  );
}
