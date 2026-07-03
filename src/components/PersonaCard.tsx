// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { Link } from 'react-router-dom';
import type { PersonaRuntime } from '../engine/initData';
import { useStore } from '../store/useStore';
import { ArcanaIcon } from './ArcanaIcon';
import { ResistanceBadge } from './ResistanceBadge';
import { ConfidantBadge } from './ConfidantBadge';

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

  // Use explicit classes instead of card-p5 so we can control border colour on hover.
  // Default: dark gray left bar. Hover: red. Owned: green. Priority: owned > hover > default.
  const borderClass = isOwned
    ? 'border-l-4 border-green-500'
    : 'border-l-4 border-p5border hover:border-p5red';

  return (
    <div
      className={`bg-p5card relative flex flex-col gap-2 ${padClass} ${borderClass} transition-colors cursor-pointer group`}
      style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
    >
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
        {/* Level: large gold number is a key P5 visual element */}
        <span className="font-display font-bold text-p5gold text-xl leading-none mt-0.5 shrink-0 tabular-nums">
          {persona.level}
        </span>
      </div>

      {/* Stats */}
      <div className="flex gap-1">
        {persona.stats.map((val, i) => (
          <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
            <span className="text-[10px] text-gray-400 font-display tracking-wider">{statLabels[i]}</span>
            <div className="w-full bg-p5border h-1">
              <div
                className="h-full bg-p5red"
                style={{ width: `${(val / maxStat) * 100}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-300 font-display font-bold tabular-nums">{val}</span>
          </div>
        ))}
      </div>

      {/* Resistances */}
      <ResistanceBadge elems={persona.elems} compact />

      {/* Confidant requirement (only shows on arcana ultimates) */}
      <ConfidantBadge persona={persona.name} />

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
