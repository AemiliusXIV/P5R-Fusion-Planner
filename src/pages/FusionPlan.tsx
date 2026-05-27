// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { skillMapRoyal } from '../engine/initData';
import { FusionTree } from '../components/FusionTree';
import { ShareModal } from '../components/ShareModal';
import { elemColor } from '../utils/skillUtils';
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

interface SharedState {
  swaps: Record<string, [string, string]>;
  expanded: string[];
}

function decodeState(raw: string): SharedState | null {
  try {
    const normalised = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalised + '='.repeat((4 - normalised.length % 4) % 4);
    const json = atob(padded);
    const parsed = JSON.parse(json);
    if (typeof parsed !== 'object' || parsed === null) return null;
    return {
      swaps: parsed.swaps ?? {},
      expanded: Array.isArray(parsed.expanded) ? parsed.expanded : [],
    };
  } catch {
    return null;
  }
}

function encodeState(state: SharedState): string {
  return btoa(JSON.stringify(state))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function FusionPlan() {
  const { name } = useParams<{ name: string }>();
  const [searchParams] = useSearchParams();
  const decodedName = name ? decodeURIComponent(name) : '';
  const requiredSkill = searchParams.get('skill') ?? undefined;
  const {
    personaMap, calculator, ownedMap, maxedConfidants, setOwned,
  } = useStore();

  const persona = personaMap[decodedName];

  // Personas that naturally learn the required skill (used to highlight nodes).
  const skillSources = useMemo<Set<string> | undefined>(() => {
    if (!requiredSkill) return undefined;
    const skill = skillMapRoyal[requiredSkill];
    if (!skill?.personas) return new Set();
    return new Set(Object.keys(skill.personas));
  }, [requiredSkill]);

  const ownedMapRef = useRef(ownedMap);
  ownedMapRef.current = ownedMap;

  const [rootNode, setRootNode] = useState<FusionNode | null>(null);
  const [sessionOwned, setSessionOwned] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // ── Share state ──────────────────────────────────────────────────────────
  // Decoded once from the URL on mount; persists across refreshes so the
  // shared chain re-applies even after the user clicks Refresh.
  const [initialShared, setInitialShared] = useState<SharedState | null>(null);
  // New swaps and expansions made this session (reset on Refresh).
  const [swapMap, setSwapMap] = useState<Record<string, [string, string]>>({});
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [showShareModal, setShowShareModal] = useState(false);

  // Parse the ?state= param once on mount.
  useEffect(() => {
    const raw = searchParams.get('state');
    if (raw) setInitialShared(decodeState(raw));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const computeTree = useCallback(() => {
    if (!persona) { setRootNode(null); return; }
    setRootNode(
      calculator.getRecipesDeep(decodedName, 1, ownedMapRef.current, maxedConfidants)
    );
    setSessionOwned(new Set());
    setSwapMap({});
    setExpandedPaths(new Set());
    setRefreshKey(k => k + 1);
  }, [persona, calculator, decodedName, maxedConfidants]);

  useEffect(() => { computeTree(); }, [computeTree]);

  const handleMarkDone = useCallback((personaName: string) => {
    setSessionOwned(prev => new Set([...prev, personaName]));
    setOwned(personaName, { owned: true });
  }, [setOwned]);

  const handleRecipeSwap = useCallback((swapPath: string, recipe: [string, string]) => {
    setSwapMap(prev => ({ ...prev, [swapPath]: recipe }));
  }, []);

  const handleExpand = useCallback((swapPath: string) => {
    setExpandedPaths(prev => new Set([...prev, swapPath]));
  }, []);

  // Merge the URL-decoded initial state with anything the user has done this
  // session, then encode into a shareable URL.
  const buildShareUrl = useCallback((): string => {
    const combinedSwaps = { ...(initialShared?.swaps ?? {}), ...swapMap };
    const combinedExpanded = [
      ...new Set([...(initialShared?.expanded ?? []), ...expandedPaths]),
    ];

    const state: SharedState = { swaps: combinedSwaps, expanded: combinedExpanded };
    const hasContent = Object.keys(combinedSwaps).length > 0 || combinedExpanded.length > 0;

    const base = `${window.location.origin}${window.location.pathname}#/fusion-tree/${encodeURIComponent(decodedName)}`;
    const skillParam = requiredSkill ? `skill=${encodeURIComponent(requiredSkill)}` : '';

    if (!hasContent) {
      return skillParam ? `${base}?${skillParam}` : base;
    }

    const stateParam = `state=${encodeState(state)}`;
    const queryString = skillParam ? `${skillParam}&${stateParam}` : stateParam;
    return `${base}?${queryString}`;
  }, [decodedName, requiredSkill, initialShared, swapMap, expandedPaths]);

  // Derived share props passed down to FusionTree.
  const initialSwaps = initialShared?.swaps;
  const initialExpanded = useMemo(
    () => initialShared ? new Set(initialShared.expanded) : undefined,
    [initialShared]
  );

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
          <div className="flex items-center gap-2">
            <p className="text-gray-500 text-sm font-display">{decodedName}</p>
            {requiredSkill && (() => {
              const skill = skillMapRoyal[requiredSkill];
              const color = skill ? (elemColor[skill.element] ?? 'text-gray-400') : 'text-gray-400';
              return (
                <span className={`text-xs font-display font-bold uppercase tracking-wider px-1.5 py-0.5 border border-current ${color}`}>
                  {requiredSkill}
                </span>
              );
            })()}
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1 text-xs font-display font-bold uppercase tracking-wider border border-p5border text-gray-400 hover:text-p5white hover:border-p5red transition-colors"
          >
            Share
          </button>
          <button
            onClick={computeTree}
            className="px-3 py-1 text-xs font-display font-bold uppercase tracking-wider border border-p5border text-gray-400 hover:text-p5white hover:border-p5red transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs font-display text-gray-400 flex-wrap">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-4 border-green-500 inline-block" /> Owned
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-4 border-amber-400 inline-block" /> Ready to fuse
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-4 border-yellow-500 inline-block" /> Confidant locked
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 border-l-4 border-p5red inline-block" /> Unowned
        </span>
        {requiredSkill && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 border-l-4 border-sky-400 inline-block" /> Has {requiredSkill}
          </span>
        )}
        <span className="text-gray-500">Swap recipes via the dropdown on each node.</span>
      </div>

      {/* Acquisition summary */}
      {summary && summary.fusions > 0 && (
        <div className="bg-p5card border-l-4 border-p5red p-3 text-xs font-display text-gray-400" style={{ boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
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

      {/* Tree */}
      {rootNode ? (
        <div className="overflow-x-auto pb-4">
          <div className="inline-block min-w-full">
            <FusionTree
              key={refreshKey}
              node={rootNode}
              isRoot
              sessionOwned={sessionOwned}
              onMarkDone={handleMarkDone}
              requiredSkill={requiredSkill}
              skillSources={skillSources}
              path={decodedName}
              onRecipeSwap={handleRecipeSwap}
              onExpand={handleExpand}
              initialSwaps={initialSwaps}
              initialExpanded={initialExpanded}
            />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500 py-16 font-display">
          {persona.rare ? 'Rare personas cannot be fused.' : 'No fusion recipes found.'}
        </div>
      )}

      {showShareModal && (
        <ShareModal
          url={buildShareUrl()}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
