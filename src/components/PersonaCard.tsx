import { Link } from 'react-router-dom';
import type { PersonaRuntime } from '../engine/initData';
import { useStore } from '../store/useStore';
import { ArcanaIcon } from './ArcanaIcon';
import { ResistanceBadge } from './ResistanceBadge';

interface Props {
  persona: PersonaRuntime;
}

export function PersonaCard({ persona }: Props) {
  const { ownedMap, setOwned, displaySize } = useStore();
  const state = ownedMap[persona.name];
  const isOwned = !!state?.owned;
  const isWishlist = !!state?.wishlist;

  const statLabels = ['STR', 'MAG', 'END', 'AGI', 'LCK'];
  const maxStat = Math.max(...persona.stats);

  const padClass = displaySize === 'compact' ? 'p-2' : displaySize === 'comfortable' ? 'p-4' : 'p-3';

  return (
    <div className={`card-p5 relative flex flex-col gap-2 ${padClass} hover:border-p5red transition-all cursor-pointer group ${isOwned ? 'border-green-500' : ''}`}>
      {/* Wishlist star */}
      {isWishlist && (
        <span className="absolute top-2 right-2 text-p5gold text-sm" title="Wishlisted">★</span>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <ArcanaIcon arcana={persona.arcana} size="sm" />
          <Link
            to={`/persona/${encodeURIComponent(persona.name)}`}
            className="font-display font-bold text-base text-p5white hover:text-p5red transition-colors leading-tight"
          >
            {persona.name}
          </Link>
        </div>
        <span className="font-display font-bold text-p5gold text-lg leading-none mt-1 shrink-0">
          {persona.level}
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-1">
        {persona.stats.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-[9px] text-gray-500 font-display tracking-wider">{statLabels[i]}</span>
            <div className="w-full bg-p5border h-1">
              <div
                className="h-full bg-p5red"
                style={{ width: `${(val / maxStat) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-400">{val}</span>
          </div>
        ))}
      </div>

      {/* Resistances */}
      <ResistanceBadge elems={persona.elems} compact />

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={(e) => { e.preventDefault(); setOwned(persona.name, { owned: !isOwned }); }}
          aria-pressed={isOwned}
          className={`flex-1 text-xs font-display font-bold tracking-wider uppercase py-1 transition-colors border ${isOwned ? 'border-green-500 text-green-400 bg-green-950' : 'border-p5border text-gray-500 hover:border-green-500 hover:text-green-400'}`}
        >
          {isOwned ? '✓ Owned' : 'Own'}
        </button>
        <button
          onClick={(e) => { e.preventDefault(); setOwned(persona.name, { wishlist: !isWishlist }); }}
          aria-pressed={isWishlist}
          className={`flex-1 text-xs font-display font-bold tracking-wider uppercase py-1 transition-colors border ${isWishlist ? 'border-p5gold text-p5gold bg-yellow-950' : 'border-p5border text-gray-500 hover:border-p5gold hover:text-p5gold'}`}
        >
          {isWishlist ? '★ Listed' : 'Wishlist'}
        </button>
        <Link
          to={`/fusion-tree/${encodeURIComponent(persona.name)}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 text-xs font-display font-bold tracking-wider uppercase py-1 text-center border border-p5border text-gray-500 hover:border-p5red hover:text-p5red transition-colors"
          title="Plan fusion chain"
        >
          Plan
        </Link>
      </div>
    </div>
  );
}
