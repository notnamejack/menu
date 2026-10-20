import { Flame, Search, X } from 'lucide-react';
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

  return (
    <div className={`app-bg flex h-dvh flex-col text-cream ${kiosk ? 'kiosk' : ''}`}>
      <header className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/10 px-5 py-3 min-[900px]:px-7">
        <div className="flex items-center gap-3">
          <Flame className="text-copper" size={26} aria-hidden="true" />
          <div>
            <p className="eyebrow text-[11px] tracking-[0.28em] text-copper uppercase">дровяной зал</p>
            <h1 className="font-serif text-[2.35rem] leading-none tracking-tight text-cream italic">Огниво</h1>
          </div>
        </div>
        <form
          className="relative order-last min-w-0 w-full min-[900px]:order-none min-[900px]:w-auto min-[900px]:max-w-md min-[900px]:flex-1"
          role="search"
          onSubmit={(event) => event.preventDefault()}
        >
          <Search className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 text-mist" size={18} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Найти блюдо"
            aria-label="Поиск по названию"
            className="h-12 w-full border-b border-white/20 bg-transparent pr-10 pl-7 text-base text-cream outline-none placeholder:text-mist"
          />
          {query ? (
            <button
              type="button"
              className="absolute top-0 right-0 inline-flex size-12 items-center justify-center text-sand"
              aria-label="Очистить поиск"
              onClick={() => setQuery('')}
            >
              <X size={18} />
            </button>
          ) : null}
        </form>
        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-pressed={kiosk}
            onClick={toggleKiosk}
            className={`inline-flex min-h-12 items-center px-4 ${
              kiosk ? 'bg-copper text-coal' : 'border border-white/15 text-cream'
            }`}
          >
            {kiosk ? 'Закрыть киоск' : 'Киоск'}
          </button>
          {kiosk ? null : (
            <a
              href={`${import.meta.env.BASE_URL}admin/`}
              className="inline-flex min-h-12 items-center px-3 text-sand"
            >
              Для кухни
            </a>
          )}
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col min-[900px]:flex-row">
        <nav
          aria-label="Категории"
          className="no-scrollbar flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 min-[900px]:w-60 min-[900px]:flex-col min-[900px]:overflow-y-auto min-[900px]:border-r min-[900px]:border-b-0 min-[900px]:px-4 min-[900px]:py-6"
        >
          <button
            type="button"
            onClick={() => goTo('all')}
            className={`inline-flex min-h-12 shrink-0 items-center gap-3 px-2 text-left font-serif text-lg ${
              active === 'all' ? 'text-cream' : 'text-mist'
            }`}
          >
            <span className={`h-px w-6 ${active === 'all' ? 'bg-copper' : 'bg-transparent'}`} />
            Всё меню
          </button>
          {menu.categories.map((category, index) => {
            const enabled = visibleIds.has(category.id);
            const isActive = active === category.id;
            return (
              <button
                key={category.id}
                type="button"
                disabled={!enabled}
                onClick={() => goTo(category.id)}
                className={`inline-flex min-h-12 shrink-0 items-center gap-3 px-2 text-left font-serif text-lg disabled:opacity-35 ${
                  isActive ? 'text-cream' : 'text-mist'
                }`}
              >
                <span className="w-6 font-sans text-base text-copper tabular-nums">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {category.name}
              </button>
            );
          })}
        </nav>

        <main ref={scrollRef} onScroll={onScroll} className="menu-scroll min-h-0 flex-1 overflow-y-auto px-5 py-6 min-[900px]:px-8 min-[900px]:py-8">
          {sections.length === 0 ? (
            <p className="max-w-md pt-10 font-serif text-3xl leading-tight text-sand">
              Такого названия нет. Попробуйте «рибай» или «утка».
            </p>
          ) : (
            <div className="space-y-12">
              {sections.map((section) => (
                <section key={section.category.id} id={`section-${section.category.id}`} className="scroll-mt-4">
                  <header className="mb-5 flex items-end justify-between border-b border-white/10 pb-3">
                    <h2 className="font-serif text-4xl tracking-tight text-cream italic min-[1500px]:text-5xl">
                      {section.category.name}
                    </h2>
                    <span className="text-mist tabular-nums">{section.items.length}</span>
                  </header>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-8 min-[900px]:grid-cols-2 min-[1500px]:grid-cols-3">
                    {section.items.map((item) => (
                      <DishCard key={item.id} item={item} register={register} onOpen={setOpened} />
                    ))}
                  </div>
                </section>
              ))}
              <p className="pt-4 pb-8 tracking-[0.16em] text-mist uppercase">
                Огниво · дровяной зал на Патриарших
              </p>
            </div>
          )}
        </main>
      </div>

      {opened ? <DishModal item={opened} category={openedCategory} onClose={() => setOpened(null)} /> : null}
    </div>
  );
}
