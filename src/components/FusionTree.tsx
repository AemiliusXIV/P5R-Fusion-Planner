import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { FusionNode } from '../engine/types';
import { useStore } from '../store/useStore';
import { ArcanaIcon } from './ArcanaIcon';

interface NodeCardProps {
  node: FusionNode;
  onSwapRecipe: (recipe: [string, string]) => void;
  isRoot?: boolean;
}

function NodeCard({ node, onSwapRecipe, isRoot }: NodeCardProps) {
  const { ownedMap } = useStore();
  const owned = node.owned || !!ownedMap[node.persona]?.owned;
  const wishlist = !!ownedMap[node.persona]?.wishlist;

  const statusClass = owned
    ? 'border-l-2 border-green-500 bg-green-950/30'
    : node.locked
    ? 'border-l-2 border-yellow-500 bg-yellow-950/20'
    : 'border-l-2 border-p5red bg-p5card';

  return (
    <div className={`${statusClass} p-2 min-w-[180px] max-w-[240px]`}>
      <div className="flex items-center gap-1 mb-1">
        <ArcanaIcon arcana={node.arcana} size="sm" />
        {isRoot && <span className="text-[10px] text-p5red font-display font-bold uppercase tracking-wider ml-1">Target</span>}
      </div>
      <Link
        to={`/persona/${encodeURIComponent(node.persona)}`}
        className="font-display font-bold text-sm text-p5white hover:text-p5red transition-colors block"
      >
        {node.persona}
      </Link>
      <div className="text-[11px] text-gray-500 font-display">Lv {node.level}</div>

      {owned && (
        <div className="text-[10px] text-green-400 font-display font-bold uppercase mt-1">✓ Owned</div>
      )}
      {wishlist && !owned && (
        <div className="text-[10px] text-p5gold font-display font-bold uppercase mt-1">★ Wishlist</div>
      )}
      {node.locked && (
        <div className="text-[10px] text-yellow-400 font-display mt-1" title={`Requires ${node.confidant?.arcana} rank ${node.confidant?.rank}`}>
          🔒 Confidant locked
        </div>
      )}

      {node.alternatives.length > 0 && node.recipe && (
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
            {node.alternatives.slice(0, 9).map((alt, i) => (
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
  depth?: number;
  isRoot?: boolean;
}

export function FusionTree({ node, depth = 0, isRoot = false }: FusionTreeProps) {
  const { calculator, personaMap, ownedMap, maxedConfidants, fusionTreeDepth } = useStore();
  const [currentNode, setCurrentNode] = useState(node);

  const handleSwap = (recipe: [string, string]) => {
    const pA = personaMap[recipe[0]];
    const pB = personaMap[recipe[1]];
    if (!pA || !pB) return;

    const remainingDepth = fusionTreeDepth - depth - 1;
    const newChildren: [FusionNode, FusionNode] = [
      calculator.getRecipesDeep(recipe[0], remainingDepth, ownedMap, maxedConfidants),
      calculator.getRecipesDeep(recipe[1], remainingDepth, ownedMap, maxedConfidants),
    ];
    setCurrentNode({
      ...currentNode,
      recipe,
      children: newChildren,
      alternatives: currentNode.alternatives
        .filter(a => !(a[0] === recipe[0] && a[1] === recipe[1]))
        .concat([currentNode.recipe!]),
    });
  };

  const isLeaf = !currentNode.children || currentNode.owned || !!ownedMap[currentNode.persona]?.owned;

  return (
    <div className="flex flex-col items-center">
      <NodeCard node={currentNode} onSwapRecipe={handleSwap} isRoot={isRoot} />

      {!isLeaf && currentNode.children && (
        <div className="flex items-start gap-4 mt-4 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-p5border" />
          <div className="flex gap-4 mt-4 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-p5border" />
            <div className="flex flex-col items-center pt-4">
              <FusionTree node={currentNode.children[0]} depth={depth + 1} />
            </div>
            <div className="flex flex-col items-center pt-4">
              <FusionTree node={currentNode.children[1]} depth={depth + 1} />
            </div>
          </div>
        </div>
      )}

      {(currentNode.owned || !!ownedMap[currentNode.persona]?.owned) && !isRoot && (
        <div className="mt-1 text-[10px] text-green-400 font-display font-bold">OWNED - stop here</div>
      )}
    </div>
  );
}
