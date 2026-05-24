import type { ElementResist } from '../engine/types';

const ELEM_LABELS = ['Phys', 'Gun', 'Fire', 'Ice', 'Elec', 'Wind', 'Psy', 'Nuke', 'Bless', 'Curse'];

// Element colours tuned to match P5R in-game palette
const ELEM_HEX = [
  '#f97316', // Phys  -orange
  '#94a3b8', // Gun   -slate (steel/metallic blue-gray)
  '#ef4444', // Fire  -red
  '#60a5fa', // Ice   -blue
  '#facc15', // Elec  -yellow
  '#4ade80', // Wind  -green
  '#c084fc', // Psy   -purple
  '#22d3ee', // Nuke  -cyan/teal (corrected from pink; matches P5R in-game)
  '#fbbf24', // Bless -amber/gold (corrected from pale yellow; actually visible)
  '#a21caf', // Curse -deep purple
];

// Elements where bright yellow/amber background makes white text unreadable on Wk
// These get dark text instead when shown at full brightness
const LIGHT_ELEMENTS = new Set([4, 8]); // Elec (yellow), Bless (amber)

// Background opacity for each resistance type
const RESIST_ALPHA: Record<ElementResist, number> = {
  '-': 0.12, // normal -barely visible, just shows the element
  wk:  1.00, // weak   -maximum visibility; you need to know
  rs:  0.42, // resist -moderate
  nu:  0.18, // null   -very dim
  ab:  0.85, // absorb -strong (heals from it)
  rp:  0.65, // repel  -quite visible (bounces back)
};

const ELEM_SHORT: Record<ElementResist, string> = {
  wk: 'Wk', rs: 'Rs', nu: 'Nu', ab: 'Ab', rp: 'Rp', '-': '-',
};

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

        // Light-coloured elements (yellow, amber, mid-gray) need dark text at full brightness
        const needsDarkText = resist === 'wk' && LIGHT_ELEMENTS.has(i);
        const textColor = needsDarkText
          ? '#1a1a1a'
          : alpha < 0.3
            ? hex        // dim background -use element colour as text so it's still legible
            : '#ffffff';

        return (
          <div
            key={i}
            title={`${ELEM_LABELS[i]}: ${RESIST_LABEL[resist]}`}
            style={{
              backgroundColor: hexWithAlpha(hex, alpha),
              borderLeft: `2px solid ${hex}`,
            }}
            className={[
              compact ? 'w-5 h-5 text-[9px]' : 'w-7 h-6 text-[10px]',
              'flex items-center justify-center font-display font-bold cursor-default',
              isNormal ? 'opacity-50 hover:opacity-100 transition-opacity' : '',
            ].join(' ')}
          >
            <span style={{ color: textColor }}>{ELEM_SHORT[resist]}</span>
          </div>
        );
      })}
    </div>
  );
}
