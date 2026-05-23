import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { dlcPersona, confidantNames } from '../data/Data5Royal';
import type { ImportedOwnedData } from '../engine/types';

export function Settings() {
  const {
    dlcEnabled, setDlcEnabled,
    maxedConfidants, setMaxedConfidant,
    fusionTreeDepth, setFusionTreeDepth,
    exportOwned, importOwned,
    ownedMap,
  } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = exportOwned();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'p5r-owned.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ImportedOwnedData;
        if (data.version !== 1 || !data.personas) {
          alert('Invalid import file format.');
          return;
        }
        importOwned(data);
        alert(`Imported ${Object.keys(data.personas).length} personas.`);
      } catch {
        alert('Failed to parse import file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const ownedCount = Object.values(ownedMap).filter(s => s.owned).length;
  const wishlistCount = Object.values(ownedMap).filter(s => s.wishlist).length;

  const confidants = Object.entries(confidantNames);

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:pb-4 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-p5border pb-4">
        <div className="w-1 h-8 bg-p5red" />
        <h1 className="font-display font-bold text-2xl text-p5white tracking-widest uppercase">Settings</h1>
      </div>

      {/* Owned data */}
      <section className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-4">Owned Persona Data</h2>
        <div className="text-sm text-gray-400 font-display mb-4">
          {ownedCount} owned · {wishlistCount} wishlisted
        </div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={handleExport} className="btn-ghost text-sm">
            Export JSON
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-ghost text-sm">
            Import JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
        </div>
        <p className="text-xs text-gray-600 mt-3 font-display">
          Export saves your owned/wishlist list as a JSON file. Import loads from a previously exported file or from the companion save reader (Phase 2).
        </p>
      </section>

      {/* Fusion tree depth */}
      <section className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-4">Fusion Chain Depth</h2>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={1}
            max={6}
            value={fusionTreeDepth}
            onChange={e => setFusionTreeDepth(Number(e.target.value))}
            className="accent-p5red flex-1"
          />
          <span className="font-display font-bold text-p5white text-xl w-6">{fusionTreeDepth}</span>
        </div>
        <p className="text-xs text-gray-600 mt-2 font-display">
          How many levels deep the fusion chain planner builds. Higher = more detail, slower to compute.
        </p>
      </section>

      {/* Confidants */}
      <section className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-4">Maxed Confidants</h2>
        <p className="text-xs text-gray-500 font-display mb-3">
          Mark which confidants you've maxed so the fusion planner can flag locked recipes.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {confidants.map(([arcana, label]) => (
            <label key={arcana} className="flex items-center gap-2 py-1.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={!!maxedConfidants[arcana]}
                onChange={e => setMaxedConfidant(arcana, e.target.checked)}
                className="accent-p5red"
              />
              <span className={`text-sm font-display transition-colors ${maxedConfidants[arcana] ? 'text-p5white' : 'text-gray-500'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* DLC toggles */}
      <section className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-4">DLC Personas</h2>
        <p className="text-xs text-gray-500 font-display mb-3">
          Enable DLC personas you own so they appear in the list and can be used in fusion recipes.
        </p>
        <div className="flex flex-col gap-2">
          {dlcPersona.map((group, i) => (
            <div key={i} className="flex gap-3 flex-wrap border-b border-p5border pb-2 last:border-0">
              {group.map(pName => (
                <label key={pName} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!dlcEnabled[pName]}
                    onChange={e => setDlcEnabled(pName, e.target.checked)}
                    className="accent-p5red"
                  />
                  <span className={`text-sm font-display ${dlcEnabled[pName] ? 'text-p5white' : 'text-gray-500'}`}>
                    {pName}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
