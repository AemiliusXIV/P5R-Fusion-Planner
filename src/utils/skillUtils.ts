// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
// Shared skill display helpers used by PersonaDetail and SkillList.

export function getSkillCost(element: string, cost?: number): string {
  if (element === 'passive' || element === 'trait') return '-';
  if (!cost) return '-';
  return cost < 100 ? `${cost}% HP` : `${cost / 100} SP`;
}

export const elemColor: Record<string, string> = {
  phys:     'text-orange-400',
  gun:      'text-slate-400',
  fire:     'text-red-400',
  ice:      'text-blue-400',
  elec:     'text-yellow-400',
  wind:     'text-green-400',
  psy:      'text-purple-400',
  nuke:     'text-cyan-400',
  bless:    'text-amber-400',
  curse:    'text-purple-500',
  almighty: 'text-red-300',
  ailment:  'text-teal-400',
  support:  'text-sky-400',
  passive:  'text-gray-500',
  healing:  'text-emerald-400',
  trait:    'text-p5gold',
};
