// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { useState, useCallback, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import type { FusionNode } from '../engine/types';
import { useStore } from '../store/useStore';
import { ArcanaIcon } from './ArcanaIcon';

interface NodeCardProps {
  node: FusionNode;
  onSwapRecipe: (recipe: string[]) => void;
  onMarkDone: (name: string) => void;
  sessionOwned: Set<string>;
  isRoot?: boolean;
  requiredSkill?: string;
  skillSources?: Set<string>;
}

export function NodeCard({ node, onSwapRecipe, onMarkDone, sessionOwned, isRoot, requiredSkill, skillSources }: NodeCardProps) {
  const { ownedMap } = useStore();
  const isOwnedNow = node.owned || sessionOwned.has(node.persona) || !!ownedMap[node.persona]?.owned;
  const wishlist = !isOwnedNow && !!ownedMap[node.persona]?.wishlist;

  const allIngredientsOwned = !!node.children && node.children.length > 0 &&
    node.children.every(c => c.owned || sessionOwned.has(c.persona) || !!ownedMap[c.persona]?.owned);
  // A confidant-gated node isn't "ready" even with every ingredient in hand,
  // since it can't be fused until that Confidant is maxed.
  const readyToFuse = !isOwnedNow && !node.locked && allIngredientsOwned;

  const statusClass = isOwnedNow
    ? 'border-l-4 border-green-500 bg-green-950/30'
    : readyToFuse
    ? 'border-l-4 border-amber-400 bg-amber-950/20'
    : node.locked
    ? 'border-l-4 border-yellow-500 bg-yellow-950/20'
    : 'border-l-4 border-p5red bg-p5card';

  const sortedAlts = [...node.alternatives].sort((a, b) => {
    const score = (names: string[]) => {
      const ownedCount = names.filter(n => !!ownedMap[n]?.owned || sessionOwned.has(n)).length;
      if (ownedCount === names.length) return 0;
      if (ownedCount > 0) return 1;
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
              {node.recipe.join(' + ')}
            </option>
            {sortedAlts.slice(0, 9).map((alt, i) => (
              <option key={i} value={alt.join('+')}>
                {alt.join(' + ')}
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
  // Path from root to this node, e.g. "Yoshitsune/Kali/Sui-Ki". Used as the
  // map key for swap state so the same persona at two separate branches is
  // tracked independently.
  path: string;
  onRecipeSwap?: (path: string, recipe: string[]) => void;
  onExpand?: (path: string) => void;
  initialSwaps?: Record<string, string[]>;
  initialExpanded?: Set<string>;
}

export function FusionTree({
  node, isRoot = false, sessionOwned, onMarkDone, requiredSkill, skillSources,
  path, onRecipeSwap, onExpand, initialSwaps, initialExpanded,
}: FusionTreeProps) {
  const { calculator, personaMap, ownedMap, maxedConfidants, fusionTreeAutoExpand } = useStore();
  const [currentNode, setCurrentNode] = useState(node);
  // Open by default at the root, or whenever the tree was pre-built deep
  // (auto-expand setting on) so children are already populated.
  const [expanded, setExpanded] = useState(isRoot || (fusionTreeAutoExpand && !!node.children));
  const [noRecipe, setNoRecipe] = useState(false);
  // Ensures the restoration effect only fires once per mount.
  const hasAppliedInitial = useRef(false);

  const isOwnedNow = currentNode.owned || sessionOwned.has(currentNode.persona) || !!ownedMap[currentNode.persona]?.owned;

  // reportUp=true for user interactions; false when restoring from a shared URL
  // so the already-encoded state isn't double-counted in the share map.
  const handleSwap = useCallback((recipe: string[], reportUp = true) => {
    if (!recipe.every(name => personaMap[name])) return;
    const newChildren: FusionNode[] = recipe.map(name =>
      calculator.getRecipesDeep(name, 1, ownedMap, maxedConfidants)
    );
    setCurrentNode(prev => ({
      ...prev,
      recipe,
      children: newChildren,
      alternatives: prev.alternatives
        .filter(a => a.join('+') !== recipe.join('+'))
        .concat([prev.recipe!]),
    }));
    setExpanded(true);
    if (reportUp) onRecipeSwap?.(path, recipe);
  }, [calculator, personaMap, ownedMap, maxedConfidants, path, onRecipeSwap]);

  const handleToggle = useCallback((reportUp = true) => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    if (!currentNode.children) {
      // Manual reveals load one layer at a time. Auto-expand mode already
      // builds the full chain upfront, so this only fires on rare chains
      // that exceed the build cap.
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
        setNoRecipe(true);
        return;
      }
    }
    setExpanded(true);
    if (reportUp) onExpand?.(path);
  }, [expanded, currentNode, calculator, ownedMap, maxedConfidants, path, onExpand]);

  // Restore recipe selections and expansion state from a shared URL. Runs once
  // per mount — empty dep array is intentional; we only want this on the
  // initial render, not on re-renders triggered by user interaction.
  useEffect(() => {
    if (isRoot || hasAppliedInitial.current) return;
    hasAppliedInitial.current = true;

    const myRecipe = initialSwaps?.[path];
    const shouldExpand = initialExpanded?.has(path);

    if (myRecipe) {
      handleSwap(myRecipe, false);
    } else if (shouldExpand) {
      handleToggle(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showChildren = expanded && !!currentNode.children && !isOwnedNow;
  // In auto-expand mode the whole chain is already shown to its natural ends,
  // so there's nothing to toggle. The button only belongs to manual mode,
  // where each layer is revealed on demand.
  const showToggle = !isRoot && !isOwnedNow && !noRecipe && !fusionTreeAutoExpand;

  return (
    <div className="flex flex-col items-center">
      <NodeCard
        node={currentNode}
        onSwapRecipe={recipe => handleSwap(recipe)}
        onMarkDone={onMarkDone}
        sessionOwned={sessionOwned}
        isRoot={isRoot}
        requiredSkill={requiredSkill}
        skillSources={skillSources}
      />

      {showToggle && (
        <button
          onClick={() => handleToggle()}
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
            {currentNode.children.map((child, i) => (
              <div key={`${i}-${child.persona}`} className="flex flex-col items-center pt-4">
                <FusionTree
                  node={child}
                  sessionOwned={sessionOwned}
                  onMarkDone={onMarkDone}
                  requiredSkill={requiredSkill}
                  skillSources={skillSources}
                  path={`${path}/${child.persona}`}
                  onRecipeSwap={onRecipeSwap}
                  onExpand={onExpand}
                  initialSwaps={initialSwaps}
                  initialExpanded={initialExpanded}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
