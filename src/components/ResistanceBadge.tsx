import type { ElementResist } from '../engine/types';

const ELEM_LABELS = ['Phys', 'Gun', 'Fire', 'Ice', 'Elec', 'Wind', 'Psy', 'Nuke', 'Bless', 'Curse'];

const ELEM_COLORS: Record<ElementResist, string> = {
  wk:  'bg-red-500 text-white',
  rs:  'bg-blue-500 text-white',
  nu:  'bg-gray-600 text-gray-300',
  ab:  'bg-green-600 text-white',
  rp:  'bg-yellow-500 text-black',
  '-': 'bg-p5border text-gray-500',
};

const ELEM_SHORT: Record<ElementResist, string> = {
  wk: 'Wk', rs: 'Rs', nu: 'Nu', ab: 'Ab', rp: 'Rp', '-': '—',
};

interface Props {
  elems: ElementResist[];
  compact?: boolean;
}

export function ResistanceBadge({ elems, compact = false }: Props) {
  return (
    <div className="flex gap-0.5">
      {elems.map((e, i) => (
        <div
          key={i}
          title={`${ELEM_LABELS[i]}: ${ELEM_SHORT[e]}`}
          className={`${compact ? 'w-5 h-5 text-[9px]' : 'w-7 h-6 text-[10px]'} flex items-center justify-center font-display font-bold ${ELEM_COLORS[e]}`}
        >
          {ELEM_SHORT[e]}
        </div>
      ))}
    </div>
  );
}
