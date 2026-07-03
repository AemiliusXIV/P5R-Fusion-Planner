// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { confidantRequirements } from '../data/Data5Royal';
import { ArcanaIcon } from '../components/ArcanaIcon';
import { ConfidantBadge } from '../components/ConfidantBadge';

// The one persona each Confidant unlocks for fusion at max rank. This page is a
// shopping list: the ones you can go make now float to the top, the ones still
// gated behind a Confidant sit in the middle, and anything you already have
// drops to the bottom.

type Status = 'ready' | 'unlocked' | 'locked' | 'owned';

const STATUS_ORDER: Record<Status, number> = { ready: 0, unlocked: 1, locked: 2, owned: 3 };

const STATUS_META: Record<Status, { label: string; border: string; text: string }> = {
  ready:    { label: 'Ready to fuse',   border: 'border-amber-400', text: 'text-amber-400' },
  unlocked: { label: 'Unlocked',        border: 'border-sky-400',   text: 'text-sky-400' },
  locked:   { label: 'Confidant locked', border: 'border-yellow-500', text: 'text-yellow-400' },
  owned:    { label: 'Owned',           border: 'border-green-500', text: 'text-green-400' },
};

export function Ultimates() {
  const { personaMap, calculator, ownedMap, maxedConfidants, setOwned } = useStore();

  const rows = useMemo(() => {
    const canFuseDirect = (name: string): boolean => {
      const p = personaMap[name];
      if (!p) return false;
      // Ready = at least one recipe whose ingredients are all owned.
      return calculator.getRecipes(p).some(r => r.sources.every(s => !!ownedMap[s.name]?.owned));
    };

    const list = Object.entries(confidantRequirements)
      .map(([name, req]) => {
        const persona = personaMap[name];
        const owned = !!ownedMap[name]?.owned;
        const confidantMaxed = !!maxedConfidants[req.arcana];
        let status: Status;
        if (owned) status = 'owned';
        else if (!confidantMaxed) status = 'locked';
        else status = canFuseDirect(name) ? 'ready' : 'unlocked';
        return { name, arcana: req.arcana, level: persona?.level ?? 0, persona, status };
      })
      // A persona could be missing if its DLC group is off; drop those cleanly.
      .filter(r => r.persona);

    list.sort((a, b) =>
      STATUS_ORDER[a.status] - STATUS_ORDER[b.status] || a.level - b.level
    );
    return list;
  }, [personaMap, calculator, ownedMap, maxedConfidants]);

  const readyCount = rows.filter(r => r.status === 'ready').length;
  const unlockedCount = rows.filter(r => r.status === 'unlocked').length;

  return (
    <div className="flex flex-col gap-4 p-4 pb-20 md:pb-4 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-p5border pb-4">
        <div className="w-1 h-8 bg-p5red" />
        <h1 className="font-display font-bold text-2xl text-p5white tracking-widest uppercase">Ultimates</h1>
        <span className="text-gray-500 text-sm font-display ml-auto">{rows.length} personas</span>
      </div>

      <p className="text-xs text-gray-500 font-display">
        Each Confidant unlocks one ultimate persona for fusion at max rank. Ones you can fuse now sit
        at the top; ones still behind a Confidant are marked, and any you already have drop to the bottom.
        Mark which Confidants you've maxed in <Link to="/settings" className="text-gray-400 hover:text-p5red">Settings</Link>.
      </p>

      {(readyCount > 0 || unlockedCount > 0) && (
        <div className="bg-p5card border-l-4 border-p5red p-3 text-xs font-display text-gray-400" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
          {readyCount > 0 && <span className="text-amber-400 font-bold">{readyCount} ready to fuse now</span>}
          {readyCount > 0 && unlockedCount > 0 && <span className="text-gray-600"> · </span>}
          {unlockedCount > 0 && <span className="text-sky-400">{unlockedCount} unlocked, need a chain</span>}
        </div>
      )}

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {rows.map(({ name, arcana, level, persona, status }) => {
          const meta = STATUS_META[status];
          return (
            <div
              key={name}
              className={`bg-p5card border-l-4 ${meta.border} p-3 flex items-center gap-3 flex-wrap`}
              style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}
            >
              <ArcanaIcon arcana={persona!.arcana} size="sm" />
              <div className="min-w-0">
                <Link
                  to={`/persona/${encodeURIComponent(name)}`}
                  className="font-display font-bold text-p5white hover:text-p5red transition-colors block leading-tight"
                >
                  {name}
                </Link>
                <span className="text-[11px] text-gray-500 font-display">{arcana} · Lv {level}</span>
              </div>

              <div className="ml-auto flex items-center gap-3 flex-wrap">
                <ConfidantBadge persona={name} />
                <span className={`text-[10px] font-display font-bold uppercase tracking-wider ${meta.text}`}>
                  {meta.label}
                </span>
                <button
                  onClick={() => setOwned(name, { owned: status !== 'owned' })}
                  className={`text-xs font-display font-bold uppercase tracking-wider px-2 py-1 border transition-colors ${
                    status === 'owned'
                      ? 'border-green-500 text-green-400 bg-green-950'
                      : 'border-p5border text-gray-500 hover:border-green-500 hover:text-green-400'
                  }`}
                >
                  {status === 'owned' ? '✓ Owned' : 'Own'}
                </button>
                <Link
                  to={`/fusion-tree/${encodeURIComponent(name)}`}
                  className="text-xs font-display font-bold uppercase tracking-wider px-2 py-1 border border-p5border text-gray-500 hover:border-p5red hover:text-p5red transition-colors"
                >
                  Plan
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
