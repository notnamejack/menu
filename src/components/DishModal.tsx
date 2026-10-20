import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { assetUrl } from '../lib/assets';
import { formatPrice } from '../lib/format';
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
      <button type="button" aria-label="Закрыть" className="absolute inset-0 bg-black/75" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dish-title"
        className="relative grid max-h-[92dvh] w-full max-w-5xl overflow-hidden border border-white/15 bg-coal shadow-none min-[900px]:grid-cols-2"
      >
        <div className="relative min-h-64 bg-bark">
          {item.video && !reduceMotion ? (
            <video
              className="h-full max-h-[46dvh] w-full object-cover min-[900px]:max-h-[92dvh] min-[900px]:min-h-full"
              src={assetUrl(item.video)}
              poster={assetUrl(item.image)}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <img
              src={assetUrl(item.image)}
              alt=""
              className="h-full max-h-[46dvh] w-full object-cover min-[900px]:max-h-[92dvh] min-[900px]:min-h-full"
            />
          )}
        </div>
        <div className="relative overflow-y-auto px-6 py-7 min-[900px]:px-8 min-[900px]:py-10">
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 inline-flex size-12 items-center justify-center text-cream"
            aria-label="Закрыть блюдо"
          >
            <X size={22} />
          </button>
          {category ? (
            <p className="meta-label text-[12px] tracking-[0.22em] text-copper uppercase">{category.name}</p>
          ) : null}
          <h2 id="dish-title" className="mt-2 pr-12 font-serif text-4xl leading-none tracking-tight text-cream">
            {item.name}
          </h2>
          <p className="mt-4 font-serif text-3xl text-copper">{formatPrice(item.price)}</p>
          {!item.available ? (
            <p className="mt-4 inline-block border border-white/20 px-3 py-2 text-sand">Нет в наличии</p>
          ) : null}
          <p className="mt-6 text-lg leading-relaxed text-cream">{item.description}</p>
          <div className="mt-6">
            <p className="meta-label text-[12px] tracking-[0.18em] text-mist uppercase">Состав</p>
            <p className="mt-2 leading-relaxed text-sand">{item.composition}</p>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
            <div>
              <dt className="meta-label text-[12px] tracking-[0.18em] text-mist uppercase">Вес</dt>
              <dd className="mt-1 font-serif text-2xl">{item.weight}</dd>
            </div>
            <div>
              <dt className="meta-label text-[12px] tracking-[0.18em] text-mist uppercase">Калории</dt>
              <dd className="mt-1 font-serif text-2xl">{item.calories} ккал</dd>
            </div>
          </dl>
          <ul className="mt-6 flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <li key={tag} className="tag border border-copper/30 px-2.5 py-1 text-[13px] tracking-[0.12em] text-sand uppercase">
                {tag}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
