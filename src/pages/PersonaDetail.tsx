import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ArcanaIcon } from '../components/ArcanaIcon';
import { ResistanceBadge } from '../components/ResistanceBadge';
import { skillMapRoyal } from '../engine/initData';

const ELEM_LABELS = ['Phys', 'Gun', 'Fire', 'Ice', 'Elec', 'Wind', 'Psy', 'Nuke', 'Bless', 'Curse'];
const STAT_LABELS = ['STR', 'MAG', 'END', 'AGI', 'LCK'];

function getSkillCost(element: string, cost?: number): string {
  if (element === 'passive' || element === 'trait') return '—';
  if (!cost) return '—';
  return cost < 100 ? `${cost}% HP` : `${cost / 100} SP`;
}

export function PersonaDetail() {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';
  const { personaMap, calculator, ownedMap, setOwned } = useStore();

  const persona = personaMap[decodedName];
  const state = ownedMap[decodedName];
  const isOwned = !!state?.owned;
  const isWishlist = !!state?.wishlist;

  const recipes = useMemo(() => {
    if (!persona) return [];
    return calculator.getRecipes(persona);
  }, [persona, calculator]);

  const reverseRecipes = useMemo(() => {
    if (!persona) return [];
    return calculator.getAllResultingRecipesFrom(persona);
  }, [persona, calculator]);

  const skills = useMemo(() => {
    if (!persona) return [];
    const sorted = Object.entries(persona.skills).sort(([, a], [, b]) => a - b);
    const result = sorted.map(([skillName, lvl]) => {
      const skill = skillMapRoyal[skillName];
      return {
        name: skillName,
        level: lvl,
        element: skill?.element ?? '?',
        effect: skill?.effect ?? '',
        cost: getSkillCost(skill?.element ?? '', skill?.cost),
        unique: skill?.unique,
      };
    });
    if (persona.trait) {
      const trait = skillMapRoyal[persona.trait];
      result.unshift({
        name: persona.trait,
        level: 0,
        element: 'trait',
        effect: trait?.effect ?? '',
        cost: '—',
        unique: true,
      });
    }
    return result;
  }, [persona]);

  if (!persona) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 font-display text-xl">Persona not found: {decodedName}</p>
        <Link to="/list" className="btn-ghost mt-4 inline-block">← Back to List</Link>
      </div>
    );
  }

  const elemColor: Record<string, string> = {
    phys: 'text-orange-400', gun: 'text-slate-400', fire: 'text-red-400',
    ice: 'text-blue-400', elec: 'text-yellow-400', wind: 'text-green-400',
    psy: 'text-purple-400', nuke: 'text-cyan-400', bless: 'text-amber-400',
    curse: 'text-purple-500', almighty: 'text-red-300', ailment: 'text-teal-400',
    support: 'text-sky-400', passive: 'text-gray-500', healing: 'text-emerald-400',
    trait: 'text-p5gold',
  };

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:pb-4 max-w-4xl">
      {/* Back */}
      <Link to="/list" className="text-gray-500 hover:text-p5red font-display text-sm uppercase tracking-wider transition-colors">
        ← Back
      </Link>

      {/* Hero */}
      <div className="card-p5 p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <ArcanaIcon arcana={persona.arcana} size="lg" />
            <h1 className="font-display font-bold text-3xl text-p5white mt-2">{persona.name}</h1>
            <div className="font-display text-p5gold text-xl">Level {persona.level}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOwned(decodedName, { owned: !isOwned })}
              className={`btn-ghost text-sm ${isOwned ? '!border-green-500 !text-green-400' : ''}`}
            >
              {isOwned ? '✓ Owned' : 'Mark Owned'}
            </button>
            <button
              onClick={() => setOwned(decodedName, { wishlist: !isWishlist })}
              className={`btn-ghost text-sm ${isWishlist ? '!border-p5gold !text-p5gold' : ''}`}
            >
              {isWishlist ? '★ Wishlisted' : 'Wishlist'}
            </button>
            <Link to={`/fusion-tree/${encodeURIComponent(decodedName)}`} className="btn-p5 text-sm">
              Plan Fusion
            </Link>
          </div>
        </div>

        {persona.dlc && (
          <div className="mt-3 text-xs font-display tracking-wider text-p5gold uppercase border border-p5gold/30 bg-yellow-950/20 px-2 py-1 w-fit">
            DLC Persona
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Stats */}
        <div className="card-p5 p-4">
          <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-3">Stats</h2>
          <div className="flex flex-col gap-2">
            {STAT_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-display text-xs text-gray-500 w-8 uppercase">{label}</span>
                <div className="flex-1 bg-p5border h-1.5">
                  <div className="h-full bg-p5red" style={{ width: `${(persona.stats[i] / 99) * 100}%` }} />
                </div>
                <span className="font-display text-p5white text-sm w-6 text-right">{persona.stats[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resistances */}
        <div className="card-p5 p-4">
          <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-3">Resistances</h2>
          <div className="grid grid-cols-5 gap-1">
            {persona.elems.map((e, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-gray-600 font-display">{ELEM_LABELS[i]}</span>
                <ResistanceBadge elems={[e]} compact />
              </div>
            ))}
          </div>
          {persona.item && (
            <div className="mt-4 text-xs text-gray-500 font-display">
              <span className="text-gray-600">Item: </span>{persona.item}
              {persona.itemr && <><span className="text-gray-600 ml-2">/ R: </span>{persona.itemr}</>}
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-3">Skills</h2>
        <div className="flex flex-col gap-1">
          {skills.map((skill) => (
            <div key={skill.name} className={`flex items-center gap-3 py-1.5 border-b border-p5border last:border-0 ${skill.element === 'trait' ? 'bg-yellow-950/20' : ''}`}>
              <span className={`font-display text-xs uppercase w-16 shrink-0 ${elemColor[skill.element] ?? 'text-gray-400'}`}>
                {skill.element}
              </span>
              <span className="font-display font-bold text-sm text-p5white flex-1">{skill.name}</span>
              <span className="text-xs text-gray-500 w-12 text-right shrink-0">{skill.cost}</span>
              <span className="text-xs text-gray-500 w-6 text-right shrink-0 font-display">{skill.level || '—'}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[10px] text-gray-600">
          <span>Level = learn at level</span>
          <span>— = innate</span>
          <span>Trait = special ability</span>
        </div>
      </div>

      {/* Fusion recipes */}
      {recipes.length > 0 && (
        <div className="card-p5 p-4">
          <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-3">
            Fusion Recipes ({recipes.length})
          </h2>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-thin">
            {recipes.slice(0, 50).map((r, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-p5border last:border-0 text-sm flex-wrap">
                {r.sources.map((src, si) => (
                  <span key={si} className="flex items-center gap-2">
                    {si > 0 && <span className="text-gray-600 font-display">+</span>}
                    <Link to={`/persona/${encodeURIComponent(src.name)}`} className="text-p5white hover:text-p5red transition-colors font-display">
                      {src.name}
                    </Link>
                  </span>
                ))}
                <span className="text-xs text-gray-600 font-display ml-auto shrink-0">
                  ¥{r.cost.toLocaleString()}
                </span>
              </div>
            ))}
            {recipes.length > 50 && (
              <div className="text-xs text-gray-600 font-display py-2">…and {recipes.length - 50} more</div>
            )}
          </div>
        </div>
      )}

      {/* Reverse lookup */}
      {reverseRecipes.length > 0 && (
        <div className="card-p5 p-4">
          <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-3">
            Fuses Into ({reverseRecipes.length} results)
          </h2>
          <div className="flex flex-col gap-1 max-h-48 overflow-y-auto scrollbar-thin">
            {reverseRecipes.slice(0, 40).map((r, i) => (
              <div key={i} className="flex items-center gap-2 py-1 border-b border-p5border last:border-0 text-sm">
                <Link to={`/persona/${encodeURIComponent(r.result.name)}`} className="text-p5gold hover:text-p5red transition-colors font-display font-bold flex-1">
                  {r.result.name}
                </Link>
                <span className="text-xs text-gray-600">via</span>
                <Link to={`/persona/${encodeURIComponent(r.sources[1]?.name ?? '')}`} className="text-p5white hover:text-p5red transition-colors font-display text-xs">
                  + {r.sources[1]?.name}
                </Link>
              </div>
            ))}
            {reverseRecipes.length > 40 && (
              <div className="text-xs text-gray-600 font-display py-2">…and {reverseRecipes.length - 40} more</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
