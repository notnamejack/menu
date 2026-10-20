import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { assetUrl } from '../lib/assets';
import { formatPortion } from '../lib/format';
import type { Category, MenuItem } from '../types';

type DishModalProps = {
  item: MenuItem;
  category: Category | undefined;
  onClose: () => void;
};

export function DishModal({ item, category, onClose }: DishModalProps) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 min-[900px]:p-8" role="presentation">
      <button type="button" aria-label="Закрыть" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="modal-panel relative grid h-[min(44rem,92dvh)] w-full max-w-5xl grid-rows-[minmax(0,42%)_minmax(0,1fr)] overflow-hidden bg-white min-[900px]:grid-cols-2 min-[900px]:grid-rows-1"
      >
        <div className="relative min-h-0 overflow-hidden bg-paper">
          {item.video && !reduceMotion ? (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              src={assetUrl(item.video)}
              poster={assetUrl(item.image)}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <img src={assetUrl(item.image)} alt="" className="absolute inset-0 h-full w-full object-cover" />
          )}
        </div>
        <div className="relative min-h-0 overflow-y-auto px-6 py-8 min-[900px]:px-9 min-[900px]:py-10">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 inline-flex size-12 items-center justify-center text-ink"
            aria-label="Закрыть блюдо"
          >
            <X size={22} />
          </button>
          {category ? (
            <p className="meta-label pr-12 text-[12px] tracking-[0.2em] text-muted uppercase">{category.name}</p>
          ) : null}
          <h2 id="dish-title" className="mt-2 pr-12 text-4xl leading-none font-medium tracking-tight text-ink">
            {item.name}
          </h2>
          <p className="mt-4 text-lg tracking-wide text-ink">{formatPortion(item.weight, item.price)}</p>
          {!item.available ? <p className="mt-3 text-base tracking-[0.08em] text-muted uppercase">Нет в наличии</p> : null}
          <p className="mt-6 text-base leading-relaxed text-ink">{item.description}</p>
          <div className="mt-6">
            <p className="meta-label text-[12px] tracking-[0.18em] text-muted uppercase">Состав</p>
            <p className="mt-2 leading-relaxed text-muted">{item.composition}</p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line pt-5">
            <div>
              <dt className="meta-label text-[12px] tracking-[0.18em] text-muted uppercase">Вес</dt>
              <dd className="mt-1 text-2xl">{item.weight}</dd>
            </div>
            <div>
              <dt className="meta-label text-[12px] tracking-[0.18em] text-muted uppercase">Калории</dt>
              <dd className="mt-1 text-2xl">{item.calories} ккал</dd>
            </div>
          </dl>
          {item.tags.length > 0 ? (
            <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-1">
              {item.tags.map((tag) => (
                <li key={tag} className="tag text-[12px] tracking-[0.14em] text-muted uppercase">
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
