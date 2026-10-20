import { useEffect, useRef, useState } from 'react';
import { assetUrl } from '../lib/assets';
import { formatPortion } from '../lib/format';
import type { VideoRegister } from '../lib/useVideoDirector';
import type { MenuItem } from '../types';

type DishCardProps = {
  item: MenuItem;
  categoryName: string;
  marker: string;
  register: VideoRegister;
  onOpen: (item: MenuItem) => void;
  delayMs?: number;
};

export function DishCard({ item, categoryName, marker, register, onOpen, delayMs = 0 }: DishCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const playable = Boolean(item.video) && item.available;

  useEffect(() => {
    if (!playable || !cardRef.current || !videoRef.current) return;
    return register(item.id, cardRef.current, videoRef.current);
  }, [item.id, playable, register]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
    };
  }, [playable]);

  return (
    <article
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={item.available ? `Открыть «${item.name}»` : `«${item.name}», нет в наличии`}
      onClick={() => onOpen(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen(item);
        }
      }}
      style={{ animationDelay: `${delayMs}ms` }}
      className={`dish-card group flex cursor-pointer flex-col bg-white outline-none focus-visible:ring-1 focus-visible:ring-ink/30 ${
        item.available ? '' : 'is-stopped'
      }`}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-[1.35rem] leading-snug font-medium tracking-tight text-ink">{item.name}</h3>
          <p className="meta-label shrink-0 pt-1 text-[11px] tracking-[0.16em] text-muted uppercase">
            {categoryName} /{marker}
          </p>
        </div>
        <p className="mt-2 line-clamp-2 text-base leading-relaxed text-muted">{item.description}</p>
        <p className={`mt-3 text-base tracking-wide ${item.available ? 'text-ink' : 'text-muted'}`}>
          {formatPortion(item.weight, item.price)}
        </p>
        {!item.available ? (
          <p className="mt-2 text-base tracking-[0.08em] text-muted uppercase">Нет в наличии</p>
        ) : null}
        {item.tags.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-x-3 gap-y-1">
            {item.tags.map((tag) => (
              <li key={tag} className="tag text-[11px] tracking-[0.14em] text-muted uppercase">
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="relative mt-auto aspect-[4/3] overflow-hidden bg-paper">
        <img
          src={assetUrl(item.image)}
          alt=""
          className={`h-full w-full object-cover transition duration-700 ${
            item.available ? 'group-hover:scale-[1.02]' : ''
          }`}
        />
        {playable && item.video ? (
          <video
            ref={videoRef}
            className={`dish-video pointer-events-none absolute inset-0 h-full w-full object-cover ${
              playing ? 'is-on' : ''
            }`}
            src={assetUrl(item.video)}
            muted
            loop
            playsInline
            preload="metadata"
          />
        ) : null}
      </div>
    </article>
  );
}
