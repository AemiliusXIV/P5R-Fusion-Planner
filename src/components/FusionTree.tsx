import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { FusionNode } from '../engine/types';
import { useStore } from '../store/useStore';
import { ArcanaIcon } from './ArcanaIcon';

interface NodeCardProps {
  node: FusionNode;
  onSwapRecipe: (recipe: [string, string]) => void;
  onMarkDone: (name: string) => void;
  sessionOwned: Set<string>;
  isRoot?: boolean;
  requiredSkill?: string;
  skillSources?: Set<string>;
}

function NodeCard({ node, onSwapRecipe, onMarkDone, sessionOwned, isRoot, requiredSkill, skillSources }: NodeCardProps) {
  const { ownedMap } = useStore();
  const isOwnedNow = node.owned || sessionOwned.has(node.persona) || !!ownedMap[node.persona]?.owned;
  const wishlist = !isOwnedNow && !!ownedMap[node.persona]?.wishlist;

  const childA = node.children?.[0];
  const childB = node.children?.[1];
  const ingAOwned = !!(childA && (childA.owned || sessionOwned.has(childA.persona) || !!ownedMap[childA.persona]?.owned));
  const ingBOwned = !!(childB && (childB.owned || sessionOwned.has(childB.persona) || !!ownedMap[childB.persona]?.owned));
  const readyToFuse = !isOwnedNow && !!node.children && ingAOwned && ingBOwned;

  const statusClass = isOwnedNow
    ? 'border-l-4 border-green-500 bg-green-950/30'
    : readyToFuse
    ? 'border-l-4 border-amber-400 bg-amber-950/20'
    : node.locked
    ? 'border-l-4 border-yellow-500 bg-yellow-950/20'
    : 'border-l-4 border-p5red bg-p5card';

  const sortedAlts = [...node.alternatives].sort((a, b) => {
    const score = (pair: [string, string]) => {
      const p0 = !!ownedMap[pair[0]]?.owned || sessionOwned.has(pair[0]);
      const p1 = !!ownedMap[pair[1]]?.owned || sessionOwned.has(pair[1]);
      if (p0 && p1) return 0;
      if (p0 || p1) return 1;
      return 2;
    };
    return score(a) - score(b);
  });

  return (
    <div className={`${statusClass} p-2 min-w-[180px] max-w-[240px]`} style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-1 mb-1">
        <ArcanaIcon arcana={node.arcana} size="sm" />
        {isRoot && (
          <span className="text-[10px] text-p5red font-display font-bold uppercase tracking-wider ml-1">Target</span>
        )}
        {readyToFuse && !isRoot && (
          <span className="text-[10px] text-amber-400 font-display font-bold uppercase tracking-wider ml-auto">Ready</span>
        )}
      </div>

      <Link
        to={`/persona/${encodeURIComponent(node.persona)}`}
        className="font-display font-bold text-sm text-p5white hover:text-p5red transition-colors block"
      >
        {node.persona}
      </Link>
      <div className="text-[11px] text-gray-400 font-display tabular-nums">Lv {node.level}</div>

      {isOwnedNow && (
        <div className="text-[10px] text-green-400 font-display font-bold uppercase mt-1">✓ Owned</div>
      )}
      {wishlist && (
        <div className="text-[10px] text-p5gold font-display font-bold uppercase mt-1">★ Wishlist</div>
      )}
      {requiredSkill && skillSources?.has(node.persona) && (
        <div className="text-[10px] text-sky-400 font-display font-bold uppercase mt-1">
          ⚡ Has {requiredSkill}
        </div>
      )}
      {node.locked && (
        <div
          className="text-[10px] text-yellow-400 font-display mt-1"
          title={`Requires ${node.confidant?.arcana} rank ${node.confidant?.rank}`}
        >
          🔒 Confidant locked
        </div>
      )}

      {!isOwnedNow && (
        <button
          onClick={() => onMarkDone(node.persona)}
          className="mt-1.5 w-full text-[10px] font-display font-bold uppercase tracking-wider py-0.5 border border-green-700 text-green-500 hover:bg-green-900/30 transition-colors"
        >
          Mark as fused
        </button>
      )}

      {sortedAlts.length > 0 && node.recipe && (
        <div className="mt-1.5">
          <select
            className="text-[10px] bg-p5gray border border-p5border text-gray-400 w-full py-0.5 font-display"
            value={node.recipe.join('+')}
            onChange={(e) => {
              const alt = node.alternatives.find(a => a.join('+') === e.target.value);
              if (alt) onSwapRecipe(alt);
            }}
          >
            <option value={node.recipe.join('+')}>
              {node.recipe[0]} + {node.recipe[1]}
            </option>
            {sortedAlts.slice(0, 9).map((alt, i) => (
              <option key={i} value={alt.join('+')}>
                {alt[0]} + {alt[1]}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}

interface FusionTreeProps {
  node: FusionNode;
  isRoot?: boolean;
  sessionOwned: Set<string>;
  onMarkDone: (name: string) => void;
  requiredSkill?: string;
  skillSources?: Set<string>;
}

export function FusionTree({ node, isRoot = false, sessionOwned, onMarkDone, requiredSkill, skillSources }: FusionTreeProps) {
  const { calculator, personaMap, ownedMap, maxedConfidants } = useStore();
  const [currentNode, setCurrentNode] = useState(node);
  // Root's children are shown immediately; all other nodes start collapsed.
  const [expanded, setExpanded] = useState(isRoot);
  // Tracks whether we tried to expand and found no recipe.
  const [noRecipe, setNoRecipe] = useState(false);

  const isOwnedNow = currentNode.owned || sessionOwned.has(currentNode.persona) || !!ownedMap[currentNode.persona]?.owned;

  const handleSwap = useCallback((recipe: [string, string]) => {
    if (!personaMap[recipe[0]] || !personaMap[recipe[1]]) return;
    // Rebuild one level deep for the swapped ingredients; they can be expanded further if needed.
    const newChildren: [FusionNode, FusionNode] = [
      calculator.getRecipesDeep(recipe[0], 1, ownedMap, maxedConfidants),
      calculator.getRecipesDeep(recipe[1], 1, ownedMap, maxedConfidants),
    ];
    setCurrentNode(prev => ({
      ...prev,
      recipe,
      children: newChildren,
      alternatives: prev.alternatives
        .filter(a => !(a[0] === recipe[0] && a[1] === recipe[1]))
        .concat([prev.recipe!]),
    }));
    setExpanded(true);
  }, [calculator, personaMap, ownedMap, maxedConfidants]);

  const handleToggle = useCallback(() => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    // Children not loaded yet — fetch one level on demand.
    if (!currentNode.children) {
      const loaded = calculator.getRecipesDeep(currentNode.persona, 1, ownedMap, maxedConfidants);
      if (loaded.children) {
        setCurrentNode(prev => ({
          ...prev,
          children: loaded.children,
          recipe: loaded.recipe,
          alternatives: loaded.alternatives,
        }));
        setNoRecipe(false);
      } else {
        // Persona has no recipe — it's a base persona, hide the toggle.
        setNoRecipe(true);
        return;
      }
    }
    setExpanded(true);
  }, [expanded, currentNode, calculator, ownedMap, maxedConfidants]);

  const showChildren = expanded && !!currentNode.children && !isOwnedNow;
  // Show toggle on any non-root, non-owned node that hasn't been confirmed as a base persona.
  const showToggle = !isRoot && !isOwnedNow && !noRecipe;

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={currentNode}
        onSwapRecipe={handleSwap}
        onMarkDone={onMarkDone}
        sessionOwned={sessionOwned}
        isRoot={isRoot}
        requiredSkill={requiredSkill}
        skillSources={skillSources}
      />

      {isOwnedNow && !isRoot && (
        <div className="mt-1 text-[10px] text-green-400 font-display font-bold">OWNED — stop here</div>
      )}

      {showToggle && (
        <button
          onClick={handleToggle}
          className="mt-1.5 text-[10px] font-display uppercase tracking-widest border border-p5border px-2 py-0.5 transition-colors text-gray-500 hover:border-p5red hover:text-p5red"
        >
          {expanded ? '▲ hide' : '▼ show recipe'}
        </button>
      )}

      {showChildren && currentNode.children && (
        <div className="flex items-start gap-4 mt-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-p5border" />
          <div className="flex gap-4 mt-4 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-p5border" />
            <div className="flex flex-col items-center pt-4">
              <FusionTree
                node={currentNode.children[0]}
                sessionOwned={sessionOwned}
                onMarkDone={onMarkDone}
                requiredSkill={requiredSkill}
                skillSources={skillSources}
              />
            </div>
            <div className="flex flex-col items-center pt-4">
              <FusionTree
                node={currentNode.children[1]}
                sessionOwned={sessionOwned}
                onMarkDone={onMarkDone}
                requiredSkill={requiredSkill}
                skillSources={skillSources}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
