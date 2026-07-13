// Copyright (c) AemiliusXIV
// SPDX-License-Identifier: Apache-2.0
export type ElementResist = 'wk' | 'rs' | 'nu' | 'ab' | 'rp' | '-';

export interface PersonaEntry {
  arcana: string;
  level: number;
  stats: [number, number, number, number, number];
  elems: ElementResist[];
  skills: Record<string, number>;
  inherits?: string;
  item?: string;
  itemr?: string;
  skillCard?: boolean;
  special?: boolean;
  rare?: boolean;
  max?: boolean;
  dlc?: boolean;
  trait?: string;
  area?: string;
  floor?: string;
  note?: string;
  personality?: string;
  [key: string]: unknown;
}

export interface PersonaRuntime extends PersonaEntry {
  name: string;
  inherits: string;
}

export interface SkillEntry {
  effect: string;
  element: string;
  cost?: number;
  personas?: Record<string, number>;
  fuse?: string | string[];
  talk?: string;
  unique?: boolean | string;
  dlc?: boolean | string;
  note?: string;
  card?: string;
  [key: string]: unknown;
}

export interface SkillRuntime extends SkillEntry {
  name: string;
}

export interface ItemEntry {
  type: string;
  description: string;
  [key: string]: unknown;
}

export type PersonaMap = Record<string, PersonaEntry>;
export type SkillMap = Record<string, SkillEntry>;
export type ItemMap = Record<string, ItemEntry>;

export interface ArcanaCombo {
  source: [string, string];
  result: string;
}

export interface SpecialCombo {
  result: string;
  sources: string[];
}

export interface OwnedState {
  owned: boolean;
  wishlist: boolean;
  notes: string;
}

export type OwnedMap = Record<string, OwnedState>;

export interface FusionNode {
  persona: string;
  level: number;
  arcana: string;
  owned: boolean;
  locked: boolean;
  confidant?: { arcana: string; rank: number };
  // Ingredient persona names. Normal fusions have two; special fusions can
  // have up to six. children[i] is the subtree for recipe[i].
  recipe: string[] | null;
  alternatives: string[][];
  children: FusionNode[] | null;
  cost: number;
}

export interface Recipe {
  sources: PersonaRuntime[];
  result: PersonaRuntime;
  cost: number;
  isAllRare: boolean;
}

export interface ImportedOwnedData {
  version: number;
  source: string;
  personas: OwnedMap;
}
