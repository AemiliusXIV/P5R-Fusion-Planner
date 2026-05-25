import type { PersonaRuntime, Recipe, FusionNode, OwnedMap } from './types';
import {
  arcana2Combos,
  specialCombos,
  rareCombos,
  rarePersonae,
  confidantRequirements,
} from '../data/Data5Royal';

export class FusionCalculator {
  private personaeByArcana: Record<string, PersonaRuntime[]>;
  private personaMap: Record<string, PersonaRuntime>;
  private arcanaMap: Record<string, Record<string, string>>;
  private special2Combos: { sources: [string, string]; result: string }[];

  constructor(
    personaeByArcana: Record<string, PersonaRuntime[]>,
    personaMap: Record<string, PersonaRuntime>
  ) {
    this.personaeByArcana = personaeByArcana;
    this.personaMap = personaMap;

    this.arcanaMap = {};
    for (const combo of arcana2Combos) {
      const [a, b] = combo.source;
      if (!this.arcanaMap[a]) this.arcanaMap[a] = {};
      if (!this.arcanaMap[b]) this.arcanaMap[b] = {};
      this.arcanaMap[a][b] = combo.result;
      this.arcanaMap[b][a] = combo.result;
    }

    this.special2Combos = specialCombos
      .filter(c => c.sources.length === 2)
      .map(c => ({ sources: c.sources as [string, string], result: c.result }));
  }

  public fuse(p1: PersonaRuntime, p2: PersonaRuntime): PersonaRuntime | null {
    const special = this.getSpecialFuseResult(p1, p2);
    if (special !== null) return special;

    if ((p1.rare && !p2.rare) || (!p1.rare && p2.rare)) {
      const rare = p1.rare ? p1 : p2;
      const normal = p1.rare ? p2 : p1;
      return this.fuseRare(rare, normal);
    }

    return this.fuseNormal(p1, p2);
  }

  public getAllResultingRecipesFrom(persona: PersonaRuntime): Recipe[] {
    const recipes: Recipe[] = [];
    for (const other of Object.values(this.personaMap)) {
      const result = this.fuse(persona, other);
      if (result !== null) {
        const recipe: Recipe = {
          sources: [persona, other],
          result,
          cost: this.getApproxCost([persona, other]),
          isAllRare: !!(persona.rare && other.rare),
        };
        recipes.push(recipe);
      }
    }
    return this.dedupeRecipes(recipes);
  }

  private getSpecialFuseResult(p1: PersonaRuntime, p2: PersonaRuntime): PersonaRuntime | null {
    for (const combo of this.special2Combos) {
      if (
        (p1.name === combo.sources[0] && p2.name === combo.sources[1]) ||
        (p2.name === combo.sources[0] && p1.name === combo.sources[1])
      ) {
        return this.personaMap[combo.result] ?? null;
      }
    }
    return null;
  }

  private fuseNormal(p1: PersonaRuntime, p2: PersonaRuntime): PersonaRuntime | null {
    if ((p1.rare && !p2.rare) || (p2.rare && !p1.rare)) return null;
    if (this.getSpecialFuseResult(p1, p2) !== null) return null;

    const level = 1 + Math.floor((p1.level + p2.level) / 2);
    const arcana = this.arcanaMap[p1.arcana]?.[p2.arcana];
    if (!arcana) return null;

    const personae = this.personaeByArcana[arcana];
    if (!personae) return null;

    let found: PersonaRuntime | null = null;
    if (p1.arcana === p2.arcana) {
      for (let i = personae.length - 1; i >= 0; i--) {
        const p = personae[i];
        if (p.level <= level) {
          if (p.special || p.rare || p.name === p1.name || p.name === p2.name) continue;
          found = p;
          break;
        }
      }
    } else {
      for (const p of personae) {
        if (p.level >= level) {
          if (p.special || p.rare) continue;
          found = p;
          break;
        }
      }
    }

    return found;
  }

  private fuseRare(rare: PersonaRuntime, normal: PersonaRuntime): PersonaRuntime | null {
    const combos = rareCombos[normal.arcana];
    if (!combos) return null;
    const rareIdx = rarePersonae.indexOf(rare.name);
    if (rareIdx === -1) return null;

    const personae = this.personaeByArcana[normal.arcana];
    if (!personae) return null;
    const mainIdx = personae.indexOf(normal);
    if (mainIdx === -1) return null;

    let modifier = combos[rareIdx];
    let newPersona = personae[mainIdx + modifier];

    if (!newPersona) return null;

    while (newPersona && (newPersona.special || newPersona.rare)) {
      if (modifier > 0) modifier++;
      else if (modifier < 0) modifier--;
      newPersona = personae[mainIdx + modifier];
    }

    return newPersona ?? null;
  }

  private getSpecialRecipe(persona: PersonaRuntime): Recipe[] {
    const allRecipes: Recipe[] = [];
    for (const combo of specialCombos) {
      if (combo.result === persona.name) {
        const sources = combo.sources
          .map(s => this.personaMap[s])
          .filter((p): p is PersonaRuntime => p !== undefined);
        if (sources.length === combo.sources.length) {
          allRecipes.push({
            sources,
            result: persona,
            cost: this.getApproxCost(sources),
            isAllRare: sources.every(p => !!p.rare),
          });
        }
      }
    }
    return allRecipes;
  }

  public getRecipes(persona: PersonaRuntime): Recipe[] {
    if (persona.rare) return [];
    if (persona.special) return this.getSpecialRecipe(persona);

    const candidates = this.getArcanaRecipes(persona.arcana);
    const filtered = candidates.filter(r => this.isGoodRecipe(r, persona));
    return this.dedupeRecipes(filtered);
  }

  private isGoodRecipe(recipe: Recipe, expected: PersonaRuntime): boolean {
    if (recipe.sources[0].name === expected.name) return false;
    if (recipe.sources.length > 1 && recipe.sources[1].name === expected.name) return false;
    return recipe.result.name === expected.name;
  }

  private getArcanaRecipes(arcana: string): Recipe[] {
    const recipes: Recipe[] = [];
    const arcanaCombos = arcana2Combos.filter(c => c.result === arcana);

    for (const combo of arcanaCombos) {
      const personae1 = this.personaeByArcana[combo.source[0]] ?? [];
      const personae2 = this.personaeByArcana[combo.source[1]] ?? [];
      for (let j = 0; j < personae1.length; j++) {
        const p1 = personae1[j];
        for (let k = 0; k < personae2.length; k++) {
          if (p1.arcana === personae2[k].arcana && k <= j) continue;
          const p2 = personae2[k];
          if (p1.rare && !p2.rare) continue;
          if (p2.rare && !p1.rare) continue;
          const result = this.fuseNormal(p1, p2);
          if (!result) continue;
          const sorted = [p1, p2].sort((a, b) => b.level - a.level) as [PersonaRuntime, PersonaRuntime];
          recipes.push({ sources: sorted, result, cost: this.getApproxCost(sorted), isAllRare: false });
        }
      }
    }

    for (const rareName of rarePersonae) {
      const rareP = this.personaMap[rareName];
      if (!rareP) continue;
      const personae = this.personaeByArcana[arcana] ?? [];
      for (const mainP of personae) {
        if (rareP.name === mainP.name) continue;
        const result = this.fuseRare(rareP, mainP);
        if (!result) continue;
        recipes.push({
          sources: [rareP, mainP],
          result,
          cost: this.getApproxCost([rareP, mainP]),
          isAllRare: false,
        });
      }
    }

    return recipes;
  }

  private dedupeRecipes(recipes: Recipe[]): Recipe[] {
    const seen = new Set<string>();
    return recipes.filter(r => {
      const key = r.sources.map(s => s.name).sort().join('|') + '>' + r.result.name;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getApproxCost(sources: PersonaRuntime[]): number {
    return sources.reduce((sum, s) => {
      const l = s.level;
      return sum + (27 * l * l) + (126 * l) + 2147;
    }, 0);
  }

  public getRecipesDeep(
    targetName: string,
    depthRemaining: number,
    ownedMap: OwnedMap,
    maxedConfidants: Record<string, boolean>
  ): FusionNode {
    const persona = this.personaMap[targetName];
    const level = persona?.level ?? 0;
    const arcana = persona?.arcana ?? '';

    const confidant = confidantRequirements[targetName];
    const locked = confidant ? !maxedConfidants[confidant.arcana] : false;

    if (ownedMap[targetName]?.owned) {
      return {
        persona: targetName, level, arcana, owned: true, locked,
        confidant, recipe: null, alternatives: [], children: null, cost: 0,
      };
    }

    if (depthRemaining === 0 || !persona) {
      return {
        persona: targetName, level, arcana, owned: false, locked,
        confidant, recipe: null, alternatives: [], children: null, cost: level,
      };
    }

    const recipes = this.getRecipes(persona);
    if (!recipes.length) {
      return {
        persona: targetName, level, arcana, owned: false, locked,
        confidant, recipe: null, alternatives: [], children: null, cost: level,
      };
    }

    // Prefer recipes where both ingredients are already owned, then one, then neither.
    // Within each tier, break ties by cost.
    const ownedScore = (r: Recipe) => {
      const aOwned = !!ownedMap[r.sources[0]?.name]?.owned;
      const bOwned = !!ownedMap[r.sources[1]?.name]?.owned;
      if (aOwned && bOwned) return 0;
      if (aOwned || bOwned) return 1;
      return 2;
    };
    const sorted = [...recipes].sort((a, b) => {
      const diff = ownedScore(a) - ownedScore(b);
      return diff !== 0 ? diff : a.cost - b.cost;
    });

    const best = sorted[0];
    const [a, b] = best.sources as [PersonaRuntime, PersonaRuntime];

    const alternatives = sorted.slice(1).map(r => [r.sources[0].name, r.sources[1].name] as [string, string]);

    const node: FusionNode = {
      persona: targetName, level, arcana, owned: false, locked,
      confidant,
      recipe: [a.name, b.name],
      alternatives,
      children: [
        this.getRecipesDeep(a.name, depthRemaining - 1, ownedMap, maxedConfidants),
        this.getRecipesDeep(b.name, depthRemaining - 1, ownedMap, maxedConfidants),
      ],
      cost: best.cost,
    };

    return node;
  }
}
