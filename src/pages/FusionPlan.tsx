import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { FusionTree } from '../components/FusionTree';

export function FusionPlan() {
  const { name } = useParams<{ name: string }>();
  const decodedName = name ? decodeURIComponent(name) : '';
  const { personaMap, calculator, ownedMap, maxedConfidants, fusionTreeDepth, setFusionTreeDepth } = useStore();

  const persona = personaMap[decodedName];

  const rootNode = useMemo(() => {
    if (!persona) return null;
    return calculator.getRecipesDeep(decodedName, fusionTreeDepth, ownedMap, maxedConfidants);
  }, [persona, calculator, decodedName, fusionTreeDepth, ownedMap, maxedConfidants]);

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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to={`/persona/${encodeURIComponent(decodedName)}`} className="text-gray-500 hover:text-p5red font-display text-sm uppercase tracking-wider transition-colors">
          ← {decodedName}
        </Link>
      </div>

      <div className="flex items-center gap-4 border-b border-p5border pb-4">
        <div className="w-1 h-8 bg-p5red" />
        <div>
          <h1 className="font-display font-bold text-2xl text-p5white tracking-wider">Fusion Chain</h1>
          <p className="text-gray-500 text-sm font-display">{decodedName}</p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <label className="text-xs text-gray-500 font-display uppercase tracking-wider">Depth</label>
          <input
            type="range"
            min={1}
            max={6}
            value={fusionTreeDepth}
            onChange={e => setFusionTreeDepth(Number(e.target.value))}
            className="accent-p5red w-24"
          />
          <span className="text-p5white font-display font-bold w-4">{fusionTreeDepth}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs font-display text-gray-500 flex-wrap">
        <span className="flex items-center gap-1"><span className="w-3 h-3 border-l-2 border-green-500 inline-block" /> Owned</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 border-l-2 border-yellow-500 inline-block" /> Confidant locked</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 border-l-2 border-p5red inline-block" /> Unowned</span>
        <span className="text-gray-600">Swap recipes using the dropdown on each node.</span>
      </div>

      {/* Tree */}
      {rootNode ? (
        <div className="overflow-x-auto pb-4">
          <div className="inline-block min-w-full">
            <FusionTree node={rootNode} isRoot />
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
