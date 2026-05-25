const ARCANA_COLORS: Record<string, string> = {
  Fool:       'bg-gray-600',
  Magician:   'bg-red-700',
  Priestess:  'bg-blue-700',
  Empress:    'bg-green-700',
  Emperor:    'bg-yellow-700',
  Hierophant: 'bg-orange-700',
  Lovers:     'bg-pink-600',
  Chariot:    'bg-red-600',
  Justice:    'bg-sky-600',
  Hermit:     'bg-amber-700',
  Fortune:    'bg-purple-600',
  Strength:   'bg-orange-600',
  Hanged:     'bg-teal-600',
  Death:      'bg-neutral-600',   // was gray-900: invisible on dark bg
  Temperance: 'bg-cyan-700',
  Devil:      'bg-red-800',
  Tower:      'bg-stone-600',
  Star:       'bg-indigo-600',
  Moon:       'bg-violet-700',
  Sun:        'bg-yellow-500',
  Judgement:  'bg-zinc-600',
  Faith:      'bg-rose-600',
  Councillor: 'bg-emerald-700',
  World:      'bg-p5gold',
};

interface Props {
  arcana: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ArcanaIcon({ arcana, size = 'md' }: Props) {
  const color = ARCANA_COLORS[arcana] ?? 'bg-gray-700';
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs';

  return (
    <span
      className={`badge-clip font-display font-bold tracking-wider uppercase text-white ${color} ${sizeClass} inline-block`}
    >
      {arcana}
    </span>
  );
}
