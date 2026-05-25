import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { FusionTree } from '../components/FusionTree';
import type { FusionNode } from '../engine/types';

// Walk the frozen tree to count fusions still needed and identify base personas.
// Stops at nodes that are owned (either at build time or marked this session).
function walkTree(node: FusionNode, sessionOwned: Set<string>): { fusions: number; bases: string[] } {
  if (node.owned || sessionOwned.has(node.persona)) return { fusions: 0, bases: [] };
  if (!node.children) return { fusions: 0, bases: [node.persona] };
  const left = walkTree(node.children[0], sessionOwned);
  const right = walkTree(node.children[1], sessionOwned);
  return {
    fusions: 1 + left.fusions + right.fusions,
    bases: [...left.bases, ...right.bases],
  };
}

export function FusionPlan() {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';
  const {
    personaMap, calculator, ownedMap, maxedConfidants,
    fusionTreeDepth, setFusionTreeDepth, setOwned,
  } = useStore();

  const persona = personaMap[decodedName];

  // Ref so computeTree always reads the latest ownedMap without being
  // listed as a dependency (which would recompute on every owned change).
  const ownedMapRef = useRef(ownedMap);
  ownedMapRef.current = ownedMap;

  const [rootNode, setRootNode] = useState<FusionNode | null>(null);
  const [sessionOwned, setSessionOwned] = useState<Set<string>>(new Set());
  // Incrementing this key forces FusionTree to remount, resetting all swap state.
  const [refreshKey, setRefreshKey] = useState(0);

  const computeTree = useCallback(() => {
    if (!persona) { setRootNode(null); return; }
    setRootNode(
      calculator.getRecipesDeep(decodedName, fusionTreeDepth, ownedMapRef.current, maxedConfidants)
    );
    setSessionOwned(new Set());
    setRefreshKey(k => k + 1);
  }, [persona, calculator, decodedName, fusionTreeDepth, maxedConfidants]);

  // Compute on mount and whenever depth, target, or confidant settings change.
  // Deliberately omits ownedMap so marking personas owned doesn't rebuild the tree.
  useEffect(() => { computeTree(); }, [computeTree]);

  const handleMarkDone = useCallback((personaName: string) => {
    setSessionOwned(prev => new Set([...prev, personaName]));
    setOwned(personaName, { owned: true });
  }, [setOwned]);

  const summary = rootNode ? walkTree(rootNode, sessionOwned) : null;
  const baseCounts = summary
    ? summary.bases.reduce<Record<string, number>>((acc, b) => {
        acc[b] = (acc[b] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  if (!persona) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-400 font-display text-xl">Persona not found.</p>
        <Link to="/list" className="btn-ghost mt-4 inline-block">← Back</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 md:pb-4">
      {/* Back link */}
      <div className="flex items-center gap-3">
        <Link
          to={`/persona/${encodeURIComponent(decodedName)}`}
          className="text-gray-500 hover:text-p5red font-display text-sm uppercase tracking-wider transition-colors"
        >
          ← {decodedName}
        </Link>
      </div>

      {/* Title row */}
      <div className="flex items-center gap-4 border-b border-p5border pb-4 flex-wrap gap-y-2">
        <div className="w-1 h-8 bg-p5red" />
        <div>
          <h1 className="font-display font-bold text-2xl text-p5white tracking-wider">Fusion Chain</h1>
          <p className="text-gray-500 text-sm font-display">{decodedName}</p>
        </div>
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          <label className="text-xs text-gray-500 font-display uppercase tracking-wider">Depth</label>
          <input
            type="range" min={1} max={6} value={fusionTreeDepth}
            onChange={e => setFusionTreeDepth(Number(e.target.value))}
            className="accent-p5red w-24"
          />
          <span className="text-p5white font-display font-bold w-4">{fusionTreeDepth}</span>
          <button
            onClick={computeTree}
            className="px-3 py-1 text-xs font-display font-bold uppercase tracking-wider border border-p5border text-gray-400 hover:text-p5white hover:border-p5red transition-colors"
          >
            Refresh Tree
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs font-display text-gray-500 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-2 border-green-500 inline-block" /> Owned
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-2 border-amber-400 inline-block" /> Ready to fuse
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-2 border-yellow-500 inline-block" /> Confidant locked
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-2 border-p5red inline-block" /> Unowned
        </span>
        <span className="text-gray-600">Swap recipes using the dropdown on each node.</span>
      </div>

      {/* Acquisition summary */}
      {summary && summary.fusions > 0 && (
        <div className="bg-p5card border border-p5border p-3 text-xs font-display text-gray-400">
          <span className="text-p5white font-bold">
            {summary.fusions} fusion{summary.fusions !== 1 ? 's' : ''} needed.
          </span>
          {Object.keys(baseCounts).length > 0 && (
            <span className="ml-2">
              Base personas:{' '}
              {Object.entries(baseCounts).map(([n, c], i) => (
                <span key={n}>
                  {i > 0 ? ', ' : ''}
                  <span className="text-gray-300">{n}{c > 1 ? ` ×${c}` : ''}</span>
                </span>
              ))}
            </span>
          )}
        </div>
      )}

      {/* Tree: key forces full remount on refresh so swap state resets */}
      {rootNode ? (
        <div className="overflow-x-auto pb-4">
          <div className="inline-block min-w-full">
            <FusionTree
              key={refreshKey}
              node={rootNode}
              isRoot
              sessionOwned={sessionOwned}
              onMarkDone={handleMarkDone}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-16 font-display">
          {persona.rare ? 'Rare personas cannot be fused.' : 'No fusion recipes found.'}
        </div>
      )}
    </div>
  );
}
