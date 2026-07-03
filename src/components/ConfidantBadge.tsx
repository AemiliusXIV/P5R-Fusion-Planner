// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
import { confidantRequirements } from '../data/Data5Royal';
import { useStore } from '../store/useStore';

// Shows which arcana's Confidant must be maxed before this persona can be
// fused. Deliberately names the arcana, not the Confidant's character, so it
// doesn't spoil who they are. Renders nothing for personas with no confidant
// requirement, and turns green once that Confidant is marked maxed in Settings.
export function ConfidantBadge({ persona, size = 'sm' }: { persona: string; size?: 'sm' | 'md' }) {
  const { maxedConfidants } = useStore();
  const req = confidantRequirements[persona];
  if (!req) return null;

  const maxed = !!maxedConfidants[req.arcana];
  const fontSize = size === 'md' ? 12 : 10;

  return (
    <div
      className={`font-display uppercase tracking-wider border-l-2 pl-1.5 ${
        maxed ? 'text-green-400 border-green-500' : 'text-p5gold border-p5gold'
      }`}
      style={{ fontSize }}
      title={
        maxed
          ? `${req.arcana} Confidant maxed, so this persona can be fused`
          : `Requires the ${req.arcana} Confidant at max rank before it can be fused`
      }
    >
      {maxed ? `✓ ${req.arcana} Confidant maxed` : `Requires max ${req.arcana} Confidant`}
    </div>
  );
}
