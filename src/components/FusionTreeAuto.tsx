// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { useMemo, useRef, useState, useLayoutEffect } from 'react';
import type { FusionNode } from '../engine/types';
import { useStore } from '../store/useStore';
import { NodeCard } from './FusionTree';

// Fixed-slot tidy-tree layout. Each leaf gets its own horizontal slot;
// every parent sits at the exact midpoint of its children's cards. This
// keeps the branching look while removing the drift the flex layout produced
// when one child had a deep subtree and its sibling was a lone leaf.
//
// Positions are written as inline left/top, so this renders correctly even in
// environments where utility CSS for flex isn't present.

const NODE_W = 240;
const SLOT = NODE_W + 28;   // horizontal distance between adjacent leaves
const LEVEL_H = 200;        // vertical distance between depth levels
const CARD_EST = 150;       // approx height of an internal card; where its
                            // outgoing connector starts
// Lower bound on the fit-to-width scale. Below this, cards get too small to
// read, so we stop shrinking and let the container scroll instead.
const MIN_SCALE = 0.5;

interface Placed {
  node: FusionNode;
  path: string;
  depth: number;
  x: number;       // left edge of the card
  isLeaf: boolean;
}

interface Layout {
  placed: Placed[];
  edges: { from: Placed; to: Placed }[];
  width: number;
  height: number;
}

function buildLayout(
  root: FusionNode,
  rootPath: string,
  isOwnedNow: (n: FusionNode) => boolean
): Layout {
  const placed: Placed[] = [];
  const edges: { from: Placed; to: Placed }[] = [];
  let nextLeaf = 0;
  let maxDepth = 0;

  const visit = (node: FusionNode, path: string, depth: number): Placed => {
    maxDepth = Math.max(maxDepth, depth);
    // An owned persona terminates the branch; so does a node with no recipe.
    const kids = !isOwnedNow(node) && node.children ? node.children : null;

    if (!kids) {
      const me: Placed = { node, path, depth, x: nextLeaf * SLOT, isLeaf: true };
      nextLeaf++;
      placed.push(me);
      return me;
    }

    const placedKids = kids.map(k => visit(k, `${path}/${k.persona}`, depth + 1));
    const first = placedKids[0];
    const last = placedKids[placedKids.length - 1];
    const me: Placed = { node, path, depth, x: (first.x + last.x) / 2, isLeaf: false };
    placed.push(me);
    for (const c of placedKids) edges.push({ from: me, to: c });
    return me;
  };

  visit(root, rootPath, 0);

  return {
    placed,
    edges,
    width: Math.max(NODE_W, nextLeaf * SLOT),
    height: (maxDepth + 1) * LEVEL_H,
  };
}

interface Props {
  root: FusionNode;
  rootPath: string;
  sessionOwned: Set<string>;
  onMarkDone: (name: string) => void;
  onSwap: (path: string, recipe: string[]) => void;
  requiredSkill?: string;
  skillSources?: Set<string>;
}

export function FusionTreeAuto({
  root, rootPath, sessionOwned, onMarkDone, onSwap, requiredSkill, skillSources,
}: Props) {
  const { ownedMap } = useStore();

  const layout = useMemo(() => {
    const isOwnedNow = (n: FusionNode) =>
      n.owned || sessionOwned.has(n.persona) || !!ownedMap[n.persona]?.owned;
    return buildLayout(root, rootPath, isOwnedNow);
  }, [root, rootPath, sessionOwned, ownedMap]);

  // Scale the tree down to fit the available width so a horizontal scrollbar
  // doesn't appear for normal trees. Never scale above 1 (small trees stay
  // full size); never below MIN_SCALE (very wide trees scroll instead).
  const fitRef = useRef<HTMLDivElement>(null);
  const [avail, setAvail] = useState(0);
  useLayoutEffect(() => {
    const el = fitRef.current;
    if (!el) return;
    const measure = () => setAvail(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scale = avail > 0
    ? Math.min(1, Math.max(MIN_SCALE, avail / layout.width))
    : 1;
  const scaledW = layout.width * scale;
  const scaledH = layout.height * scale;

  return (
    <div ref={fitRef} className="overflow-x-auto pb-4">
      <div style={{ width: scaledW, height: scaledH, margin: '0 auto' }}>
        <div
          className="relative"
          style={{
            width: layout.width,
            height: layout.height,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={layout.width}
        height={layout.height}
      >
        {layout.edges.map(({ from, to }, i) => {
          const sx = from.x + NODE_W / 2;
          const sy = from.depth * LEVEL_H + CARD_EST;
          const cx = to.x + NODE_W / 2;
          const cy = to.depth * LEVEL_H;
          const midY = sy + (cy - sy) / 2;
          return (
            <path
              key={i}
              d={`M ${sx} ${sy} V ${midY} H ${cx} V ${cy}`}
              fill="none"
              stroke="#3a3a3a"
              strokeWidth={1}
            />
          );
        })}
      </svg>

      {layout.placed.map(p => (
        <div
          key={p.path}
          className="absolute"
          style={{ left: p.x, top: p.depth * LEVEL_H, width: NODE_W }}
        >
          <NodeCard
            node={p.node}
            isRoot={p.depth === 0}
            sessionOwned={sessionOwned}
            onMarkDone={onMarkDone}
            onSwapRecipe={recipe => onSwap(p.path, recipe)}
            requiredSkill={requiredSkill}
            skillSources={skillSources}
          />
        </div>
      ))}
        </div>
      </div>
    </div>
  );
}
