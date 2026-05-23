import type { PersonaRuntime } from './types';
import { personaMapRoyal } from '../data/PersonaDataRoyal';
import { skillMapRoyal } from '../data/SkillDataRoyal';
import { dlcPersona } from '../data/Data5Royal';
import { FusionCalculator } from './FusionCalculator';

export { skillMapRoyal };
export type { PersonaRuntime };

export const allDlcPersonaNames = new Set(dlcPersona.flat());

export function buildPersonaRuntime(enabledDlc: Record<string, boolean>): {
  personaList: PersonaRuntime[];
  personaMap: Record<string, PersonaRuntime>;
  personaeByArcana: Record<string, PersonaRuntime[]>;
  calculator: FusionCalculator;
} {
  const personaList: PersonaRuntime[] = [];
  const personaMap: Record<string, PersonaRuntime> = {};

  for (const [name, entry] of Object.entries(personaMapRoyal)) {
    if (entry.dlc && !enabledDlc[name]) continue;
    const runtime: PersonaRuntime = {
      inherits: '',
      ...entry,
      name,
    };
    personaList.push(runtime);
    personaMap[name] = runtime;
  }

  const personaeByArcana: Record<string, PersonaRuntime[]> = {};
  for (const p of personaList) {
    if (!personaeByArcana[p.arcana]) personaeByArcana[p.arcana] = [];
    personaeByArcana[p.arcana].push(p);
  }
  for (const arr of Object.values(personaeByArcana)) {
    arr.sort((a, b) => a.level - b.level);
  }
  if (!personaeByArcana['World']) personaeByArcana['World'] = [];

  const calculator = new FusionCalculator(personaeByArcana, personaMap);
  return { personaList, personaMap, personaeByArcana, calculator };
}
