// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { ArcanaIcon } from '../components/ArcanaIcon';
import { ResistanceBadge } from '../components/ResistanceBadge';
import { skillMapRoyal } from '../engine/initData';
import { getSkillCost, elemColor } from '../utils/skillUtils';

const ELEM_LABELS = ['Phys', 'Gun', 'Fire', 'Ice', 'Elec', 'Wind', 'Psy', 'Nuke', 'Bless', 'Curse'];
const STAT_LABELS = ['STR', 'MAG', 'END', 'AGI', 'LCK'];

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

  // Annotate each recipe with owned status and sort ready-to-fuse first.
  const enrichedRecipes = useMemo(() => {
    return recipes
      .map(r => {
        const ready = r.sources.every(s => !!ownedMap[s.name]?.owned);
        const partial = !ready && r.sources.some(s => !!ownedMap[s.name]?.owned);
        return { ...r, ready, partial };
      })
      .sort((a, b) => {
        if (a.ready !== b.ready) return a.ready ? -1 : 1;
        if (a.partial !== b.partial) return a.partial ? -1 : 1;
        return a.cost - b.cost;
      });
  }, [recipes, ownedMap]);

  const readyCount = enrichedRecipes.filter(r => r.ready).length;

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
        cost: '-',
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

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:pb-4 max-w-6xl">
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
              aria-pressed={isOwned}
              className={`btn-ghost text-sm ${isOwned ? '!border-green-500 !text-green-400' : ''}`}
            >
              {isOwned ? '✓ Owned' : 'Mark Owned'}
            </button>
            <button
              onClick={() => setOwned(decodedName, { wishlist: !isWishlist })}
              aria-pressed={isWishlist}
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
          <h2 className="section-head">Stats</h2>
          <div className="flex flex-col gap-2">
            {STAT_LABELS.map((label, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="font-display text-xs text-gray-400 w-8 uppercase">{label}</span>
                <div className="flex-1 bg-p5border h-1.5">
                  <div className="h-full bg-p5red" style={{ width: `${(persona.stats[i] / 99) * 100}%` }} />
                </div>
                <span className="font-display font-bold text-p5white text-sm w-6 text-right tabular-nums">{persona.stats[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Resistances */}
        <div className="card-p5 p-4">
          <h2 className="section-head">Resistances</h2>
          <div className="grid grid-cols-5 gap-1">
            {persona.elems.map((e, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[10px] text-gray-400 font-display">{ELEM_LABELS[i]}</span>
                <ResistanceBadge elems={[e]} compact />
              </div>
            ))}
          </div>
          {persona.item && (
            <div className="mt-4 pt-3 border-t border-p5border">
              <div className="text-[10px] text-gray-500 font-display uppercase tracking-wider mb-1">
                Electric Chair
              </div>
              <div className="flex flex-col gap-0.5 text-xs font-display">
                <div className="flex gap-2">
                  <span className="text-gray-500 w-16 shrink-0">Standard:</span>
                  <span className="text-p5white">{persona.item}</span>
                </div>
                {persona.itemr && (
                  <div className="flex gap-2">
                    <span className="text-gray-500 w-16 shrink-0">Alarm:</span>
                    <span className="text-p5white">{persona.itemr}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Skills */}
      <div className="card-p5 p-4">
        <h2 className="section-head">Skills</h2>
        <div className="flex items-center gap-3 pb-1.5 border-b border-p5border text-[10px] text-gray-500 font-display uppercase tracking-wider">
          <span className="w-14 shrink-0">Elem</span>
          <span className="flex-1 min-w-0">Name &amp; effect</span>
          <span className="w-14 text-right shrink-0">Cost</span>
          <span className="w-6 text-right shrink-0">Lv</span>
        </div>
        <div className="flex flex-col gap-0">
          {skills.map((skill) => (
            <div key={skill.name} className={`flex items-start gap-3 py-1.5 border-b border-p5border last:border-0 ${skill.element === 'trait' ? 'bg-yellow-950/20' : ''}`}>
              {/* Element tag: Rajdhani all-caps, coloured by element type */}
              <span className={`font-display text-[10px] uppercase w-14 shrink-0 pt-0.5 ${elemColor[skill.element] ?? 'text-gray-400'}`}>
                {skill.element}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-display font-bold text-sm text-p5white block leading-tight">{skill.name}</span>
                {/* Effect text: Inter for readability, not Rajdhani */}
                {skillMapRoyal[skill.name]?.effect && (
                  <span className="text-[11px] text-gray-400 mt-0.5 block leading-snug" style={{ fontFamily: 'Inter, sans-serif' }}>
                    {skillMapRoyal[skill.name].effect}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-400 w-14 text-right shrink-0 tabular-nums pt-0.5">{skill.cost}</span>
              <span className="text-[11px] text-gray-400 w-6 text-right shrink-0 font-display font-bold pt-0.5 tabular-nums">{skill.level || '-'}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-4 text-[10px] text-gray-500">
          <span>Lv = learn at level</span>
          <span>- = innate</span>
          <span>Trait = passive special</span>
        </div>
      </div>

      {/* Fusion recipes + reverse lookup side by side on wide screens */}
      <div className="grid md:grid-cols-2 gap-4">
        {enrichedRecipes.length > 0 && (
          <div className="card-p5 p-4">
            <div className="section-head mb-3">
              Fusion Recipes
              <span className="text-gray-500 font-normal tracking-normal normal-case text-xs ml-1">({enrichedRecipes.length})</span>
              {readyCount > 0 && (
                <span className="text-green-400 text-xs font-display font-bold normal-case tracking-normal ml-1">
                  · {readyCount} ready
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-thin">
              {enrichedRecipes.slice(0, 50).map((r, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 py-1 border-b border-p5border last:border-0 text-sm flex-wrap ${r.ready ? 'bg-green-950/20' : ''}`}
                >
                  {r.sources.map((src, si) => {
                    const srcOwned = !!ownedMap[src.name]?.owned;
                    return (
                      <span key={si} className="flex items-center gap-2">
                        {si > 0 && <span className="text-gray-500 font-display">+</span>}
                        <Link
                          to={`/persona/${encodeURIComponent(src.name)}`}
                          className={`hover:text-p5red transition-colors font-display ${srcOwned ? 'text-green-400' : 'text-p5white'}`}
                        >
                          {src.name}
                        </Link>
                      </span>
                    );
                  })}
                  <span className="ml-auto shrink-0 flex items-center gap-2">
                    {r.ready && (
                      <span className="text-[10px] text-green-400 font-display font-bold uppercase">✓ Ready</span>
                    )}
                    <span className="text-xs text-gray-500 font-display tabular-nums">¥{r.cost.toLocaleString()}</span>
                  </span>
                </div>
              ))}
              {enrichedRecipes.length > 50 && (
                <div className="text-xs text-gray-500 font-display py-2">…and {enrichedRecipes.length - 50} more</div>
              )}
            </div>
          </div>
        )}

        {reverseRecipes.length > 0 && (
          <div className="card-p5 p-4">
            <div className="section-head mb-3">
              Fuses Into
              <span className="text-gray-500 font-normal tracking-normal normal-case text-xs ml-1">({reverseRecipes.length} results)</span>
            </div>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-thin">
              {reverseRecipes.slice(0, 40).map((r, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-p5border last:border-0 text-sm">
                  <Link to={`/persona/${encodeURIComponent(r.result.name)}`} className="text-p5gold hover:text-p5red transition-colors font-display font-bold flex-1">
                    {r.result.name}
                  </Link>
                  <span className="text-xs text-gray-500">via</span>
                  <Link to={`/persona/${encodeURIComponent(r.sources[1]?.name ?? '')}`} className="text-p5white hover:text-p5red transition-colors font-display text-xs">
                    + {r.sources[1]?.name}
                  </Link>
                </div>
              ))}
              {reverseRecipes.length > 40 && (
                <div className="text-xs text-gray-500 font-display py-2">…and {reverseRecipes.length - 40} more</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
