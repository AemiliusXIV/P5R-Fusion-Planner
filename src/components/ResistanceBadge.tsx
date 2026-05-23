import type { ElementResist } from '../engine/types';

const ELEM_LABELS = ['Phys', 'Gun', 'Fire', 'Ice', 'Elec', 'Wind', 'Psy', 'Nuke', 'Bless', 'Curse'];

// Element colours matching the skill list palette
const ELEM_HEX = [
  '#f97316', // Phys  — orange
  '#9ca3af', // Gun   — gray
  '#ef4444', // Fire  — red
  '#60a5fa', // Ice   — blue
  '#facc15', // Elec  — yellow
  '#4ade80', // Wind  — green
  '#c084fc', // Psy   — purple
  '#f472b6', // Nuke  — pink
  '#fef08a', // Bless — pale yellow
  '#a21caf', // Curse — deep purple
];

// Background opacity (as 0-1) for each resistance type
const RESIST_ALPHA: Record<ElementResist, number> = {
  '-': 0.12, // normal — barely visible
  wk:  1.00, // weak   — maximum visibility (danger!)
  rs:  0.40, // resist — moderate
  nu:  0.18, // null   — very dim
  ab:  0.85, // absorb — strong (heals from it)
  rp:  0.65, // repel  — quite visible (bounces back)
};

// Short label shown inside the badge
const ELEM_SHORT: Record<ElementResist, string> = {
  wk: 'Wk', rs: 'Rs', nu: 'Nu', ab: 'Ab', rp: 'Rp', '-': '—',
};

// Full label for the tooltip
const RESIST_LABEL: Record<ElementResist, string> = {
  '-': 'Normal', wk: 'Weak', rs: 'Resist', nu: 'Null', ab: 'Absorb', rp: 'Repel',
};

function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return `${hex}${a}`;
}

interface Props {
  elems: ElementResist[];
  compact?: boolean;
}

export function ResistanceBadge({ elems, compact = false }: Props) {
  return (
    <div className="flex gap-0.5">
      {elems.map((resist, i) => {
        const hex = ELEM_HEX[i] ?? '#6b7280';
        const alpha = RESIST_ALPHA[resist];
        const isNormal = resist === '-';
        const tooltipText = `${ELEM_LABELS[i]}: ${RESIST_LABEL[resist]}`;

        return (
          <div
            key={i}
            title={tooltipText}
            style={{
              backgroundColor: hexWithAlpha(hex, alpha),
              // Subtle left border in full element colour so normal cells still show their element
              borderLeft: `2px solid ${hex}`,
            }}
            className={[
              compact ? 'w-5 h-5 text-[9px]' : 'w-7 h-6 text-[10px]',
              'flex items-center justify-center font-display font-bold cursor-default transition-opacity',
              isNormal ? 'opacity-50 hover:opacity-100' : 'hover:brightness-110',
            ].join(' ')}
          >
            <span style={{ color: alpha < 0.3 ? hex : '#ffffff' }}>
              {ELEM_SHORT[resist]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
