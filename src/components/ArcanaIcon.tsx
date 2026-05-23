const ARCANA_COLORS: Record<string, string> = {
  Fool:       'bg-gray-700',
  Magician:   'bg-red-800',
  Priestess:  'bg-blue-800',
  Empress:    'bg-green-800',
  Emperor:    'bg-yellow-700',
  Hierophant: 'bg-orange-700',
  Lovers:     'bg-pink-700',
  Chariot:    'bg-red-600',
  Justice:    'bg-sky-700',
  Hermit:     'bg-amber-800',
  Fortune:    'bg-purple-700',
  Strength:   'bg-orange-600',
  Hanged:     'bg-teal-700',
  Death:      'bg-gray-900',
  Temperance: 'bg-cyan-700',
  Devil:      'bg-red-900',
  Tower:      'bg-stone-700',
  Star:       'bg-indigo-700',
  Moon:       'bg-violet-800',
  Sun:        'bg-yellow-500',
  Judgement:  'bg-zinc-700',
  Faith:      'bg-rose-700',
  Councillor: 'bg-emerald-800',
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
