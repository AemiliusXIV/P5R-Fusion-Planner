import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import type { DisplaySize, ColorMode } from '../store/useStore';
import { dlcPersona, confidantNames } from '../data/Data5Royal';
import type { ImportedOwnedData } from '../engine/types';

const DEPTH_DESCRIPTIONS: Record<number, string> = {
  1: 'Shows only the two direct ingredients for your target persona. Good for a quick lookup.',
  2: 'Shows ingredients and what you need to fuse each of them. Two steps total.',
  3: 'Three layers deep; usually enough to see whether base-level personas are in the chain.',
  4: 'Default. Most fusion chains in P5R fully resolve at this depth. Recommended starting point.',
  5: 'Extended depth, useful for complex personas like Yoshitsune or Satanael where chains are long.',
  6: 'Maximum depth. Can be slow for high-level personas. Use when depth 5 still leaves unknowns.',
};

export function Settings() {
  const {
    dlcEnabled, setDlcEnabled, setAllDlcEnabled,
    maxedConfidants, setMaxedConfidant, setAllConfidants,
    fusionTreeDepth, setFusionTreeDepth,
    displaySize, setDisplaySize,
    colorMode, setColorMode,
    exportOwned, importOwned,
    ownedMap,
    lastImportedAt,
  } = useStore();

  const lastImportedDisplay = lastImportedAt
    ? new Date(lastImportedAt).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Never';

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileStatus, setFileStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [fileMessage, setFileMessage] = useState('');
  const [pasteValue, setPasteValue] = useState('');
  const [pasteStatus, setPasteStatus] = useState<'idle' | 'ok' | 'error'>('idle');
  const [pasteMessage, setPasteMessage] = useState('');

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
    setFileStatus('idle');
    setFileMessage('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as ImportedOwnedData;
        if (data.version !== 1 || !data.personas) {
          setFileStatus('error');
          setFileMessage('Invalid import file format.');
          return;
        }
        importOwned(data);
        const count = Object.keys(data.personas).length;
        setFileStatus('ok');
        setFileMessage(`Imported ${count} persona${count !== 1 ? 's' : ''}.`);
      } catch {
        setFileStatus('error');
        setFileMessage('Could not parse the file. Make sure it is a valid P5R Fusion Planner export.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePasteImport = () => {
    const raw = pasteValue.trim();
    if (!raw) return;
    setPasteStatus('idle');
    setPasteMessage('');

    try {
      let json: string;

      if (raw.startsWith('{')) {
        // Raw JSON pasted directly
        json = raw;
      } else {
        // Either a full deep-link URL or a bare base64 string
        let b64 = raw;
        if (raw.startsWith('http')) {
          const hashIndex = raw.indexOf('#');
          const fragment = hashIndex >= 0 ? raw.slice(hashIndex + 1) : '';
          const params = new URLSearchParams(fragment.replace(/^\/import\?/, ''));
          b64 = params.get('data') ?? '';
          if (!b64) throw new Error('No data parameter found in the URL.');
        }
        const normalised = b64.replace(/-/g, '+').replace(/_/g, '/');
        const padded = normalised + '='.repeat((4 - normalised.length % 4) % 4);
        const binaryStr = atob(padded);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
        json = new TextDecoder('utf-8').decode(bytes);
      }

      const data = JSON.parse(json) as ImportedOwnedData;
      if (data.version !== 1 || !data.personas || typeof data.personas !== 'object') {
        setPasteStatus('error');
        setPasteMessage('Unrecognised format; expected a P5R Fusion Planner export.');
        return;
      }

      importOwned(data);
      const count = Object.values(data.personas).filter(p => p.owned).length;
      setPasteStatus('ok');
      setPasteMessage(`Imported ${count} owned persona${count !== 1 ? 's' : ''}.`);
      setPasteValue('');
    } catch (err) {
      setPasteStatus('error');
      setPasteMessage(err instanceof Error ? err.message : 'Could not parse the pasted data.');
    }
  };

  const ownedCount = Object.values(ownedMap).filter(s => s.owned).length;
  const wishlistCount = Object.values(ownedMap).filter(s => s.wishlist).length;

  const confidants = Object.entries(confidantNames);
  const allConfidantsMaxed = confidants.every(([arcana]) => !!maxedConfidants[arcana]);
  const allDlcEnabled = dlcPersona.flat().every(n => !!dlcEnabled[n]);

  const sizeOptions: { value: DisplaySize; label: string; desc: string }[] = [
    { value: 'compact',     label: 'Compact',     desc: 'More cards on screen, smaller text. Good for wide monitors or quick browsing.' },
    { value: 'normal',      label: 'Normal',      desc: 'Default layout. Balanced for most screens.' },
    { value: 'comfortable', label: 'Comfortable', desc: 'Larger text and cards. Easier to read, fewer cards visible at once.' },
  ];

  const colorOptions: { value: ColorMode; label: string; desc: string }[] = [
    { value: 'p5', label: 'Persona 5',    desc: 'Full colour theme: red, gold, and black.' },
    { value: 'bw', label: 'Muted Colors', desc: 'Heavily desaturated dark mode. Keeps the layout and contrast but removes most colour, for a quieter look.' },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 pb-20 md:pb-4 max-w-2xl">
      <div className="flex items-center gap-3 border-b border-p5border pb-4">
        <div className="w-1 h-8 bg-p5red" />
        <h1 className="font-display font-bold text-2xl text-p5white tracking-widest uppercase">Settings</h1>
      </div>

      {/* ── Display ── */}
      <section className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-1">Display Size</h2>
        <p className="text-xs text-gray-500 font-display mb-4">
          Controls card size and text size together. Changing this takes effect immediately.
        </p>
        <div className="flex flex-col gap-2">
          {sizeOptions.map(opt => (
            <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="radio"
                name="displaySize"
                value={opt.value}
                checked={displaySize === opt.value}
                onChange={() => setDisplaySize(opt.value)}
                className="accent-p5red mt-0.5"
              />
              <div>
                <span className={`font-display font-bold text-sm ${displaySize === opt.value ? 'text-p5white' : 'text-gray-400 group-hover:text-p5white'} transition-colors`}>
                  {opt.label}
                </span>
                <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="mt-5 border-t border-p5border pt-4">
          <h3 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-1">Colour Mode</h3>
          <p className="text-xs text-gray-500 font-display mb-3">
            Black & white mode applies a greyscale filter to the entire app.
          </p>
          <div className="flex flex-col gap-2">
            {colorOptions.map(opt => (
              <label key={opt.value} className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="colorMode"
                  value={opt.value}
                  checked={colorMode === opt.value}
                  onChange={() => setColorMode(opt.value)}
                  className="accent-p5red mt-0.5"
                />
                <div>
                  <span className={`font-display font-bold text-sm ${colorMode === opt.value ? 'text-p5white' : 'text-gray-400 group-hover:text-p5white'} transition-colors`}>
                    {opt.label}
                  </span>
                  <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fusion chain depth ── */}
      <section className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-1">Fusion Chain Depth</h2>
        <p className="text-xs text-gray-500 font-display mb-4">
          How many fusion steps the Fusion Tree Planner expands when you open it for a persona.
          Each step reveals the ingredients needed to fuse the previous layer's personas.
        </p>
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
        <p className="text-xs text-gray-400 mt-3 font-display leading-relaxed">
          {DEPTH_DESCRIPTIONS[fusionTreeDepth]}
        </p>
        <div className="mt-3 grid grid-cols-6 gap-1">
          {[1,2,3,4,5,6].map(d => (
            <button
              key={d}
              onClick={() => setFusionTreeDepth(d)}
              className={`text-xs font-display font-bold py-1 border transition-colors ${fusionTreeDepth === d ? 'border-p5red text-p5red bg-red-950/30' : 'border-p5border text-gray-500 hover:border-p5red hover:text-p5red'}`}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      {/* ── Confidants ── */}
      <section className="card-p5 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm">Maxed Confidants</h2>
          <button
            onClick={() => setAllConfidants(!allConfidantsMaxed)}
            className="text-xs font-display font-bold tracking-wider uppercase border border-p5border text-gray-500 hover:border-p5red hover:text-p5red px-2 py-1 transition-colors"
          >
            {allConfidantsMaxed ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <p className="text-xs text-gray-500 font-display mb-3">
          Mark confidants you've reached max rank with. The Fusion Tree Planner will flag
          personas that require a specific confidant rank as locked or unlocked accordingly.
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
              <span className={`text-sm font-display transition-colors ${maxedConfidants[arcana] ? 'text-p5white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* ── DLC personas ── */}
      <section className="card-p5 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm">DLC Personas</h2>
          <button
            onClick={() => setAllDlcEnabled(!allDlcEnabled)}
            className="text-xs font-display font-bold tracking-wider uppercase border border-p5border text-gray-500 hover:border-p5red hover:text-p5red px-2 py-1 transition-colors"
          >
            {allDlcEnabled ? 'Disable All' : 'Enable All'}
          </button>
        </div>
        <p className="text-xs text-gray-500 font-display mb-3">
          Enable DLC persona packs you own. Enabled personas appear in the list and can be
          used as ingredients in fusion recipes. The fusion engine rebuilds each time you toggle a group.
        </p>
        <div className="flex flex-col gap-2">
          {dlcPersona.map((group, i) => (
            <div key={i} className="flex gap-3 flex-wrap border-b border-p5border pb-2 last:border-0">
              {group.map(pName => (
                <label key={pName} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={!!dlcEnabled[pName]}
                    onChange={e => setDlcEnabled(pName, e.target.checked)}
                    className="accent-p5red"
                  />
                  <span className={`text-sm font-display transition-colors ${dlcEnabled[pName] ? 'text-p5white' : 'text-gray-500 group-hover:text-gray-300'}`}>
                    {pName}
                  </span>
                </label>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── Companion app ── */}
      <section className="card-p5 p-4">
        <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-1">Companion App</h2>
        <p className="text-xs text-gray-500 font-display mb-3">
          The companion app reads your P5R save file directly and populates your owned persona
          list automatically — no manual toggling needed. Runs on Windows alongside the game.
        </p>
        <a
          href="https://github.com/AemiliusXIV/P5RFusionCalc/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-ghost text-sm inline-block"
        >
          Download on GitHub ↗
        </a>
      </section>

      {/* ── Owned data ── */}
      <section className="card-p5 p-4">
        <div className="flex items-center gap-3 mb-1">
          <h2 className="font-display font-bold text-p5red uppercase tracking-widest text-sm">Owned Persona Data</h2>
          <span className="text-[10px] font-display tracking-wider text-green-500 border border-green-800 bg-green-950/40 px-1.5 py-0.5">
            AUTO-SAVED
          </span>
        </div>
        <p className="text-xs text-gray-500 font-display mb-3">
          Everything (owned personas, wishlist, settings, DLC toggles) is saved automatically
          to your browser's local storage. It persists across page refreshes and browser restarts
          as long as you don't clear site data. Use Export to back it up as a JSON file you can
          keep, or Import to restore from a backup.
        </p>
        <div className="text-sm text-gray-400 font-display mb-1">
          {ownedCount} owned · {wishlistCount} wishlisted
        </div>
        <div className="text-xs text-gray-500 font-display mb-4">
          Last import: {lastImportedDisplay}
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <button onClick={handleExport} className="btn-ghost text-sm">
            Export JSON
          </button>
          <button
            onClick={() => { setFileStatus('idle'); fileInputRef.current?.click(); }}
            className="btn-ghost text-sm"
          >
            Import JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          {fileStatus === 'ok' && (
            <span className="text-xs text-green-400 font-display">✓ {fileMessage}</span>
          )}
          {fileStatus === 'error' && (
            <span className="text-xs text-p5red font-display">{fileMessage}</span>
          )}
        </div>

        <div className="mt-5 border-t border-p5border pt-4">
          <h3 className="font-display font-bold text-p5red uppercase tracking-widest text-sm mb-1">Paste Import</h3>
          <p className="text-xs text-gray-500 font-display mb-3">
            Paste a link or string from the companion app. Accepts the full deep-link URL,
            a bare base64 string, or raw JSON.
          </p>
          <textarea
            value={pasteValue}
            onChange={e => { setPasteValue(e.target.value); setPasteStatus('idle'); }}
            placeholder="Paste link or data here..."
            rows={3}
            className="input-p5 w-full font-mono text-xs resize-none mb-2"
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handlePasteImport}
              disabled={!pasteValue.trim()}
              className="btn-ghost text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Import
            </button>
            {pasteStatus === 'ok' && (
              <span className="text-xs text-green-400 font-display">✓ {pasteMessage}</span>
            )}
            {pasteStatus === 'error' && (
              <span className="text-xs text-p5red font-display">{pasteMessage}</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
