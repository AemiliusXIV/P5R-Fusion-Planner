import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { OwnedMap, OwnedState, ImportedOwnedData } from '../engine/types';
import { buildPersonaRuntime, allDlcPersonaNames } from '../engine/initData';
import type { PersonaRuntime } from '../engine/initData';
import { FusionCalculator } from '../engine/FusionCalculator';
import { confidantNames } from '../data/Data5Royal';

export type DisplaySize = 'compact' | 'normal' | 'comfortable';
export type ColorMode = 'p5' | 'bw';

interface SettingsState {
  dlcEnabled: Record<string, boolean>;
  maxedConfidants: Record<string, boolean>;
  fusionTreeDepth: number;
  displaySize: DisplaySize;
  colorMode: ColorMode;
}

interface AppState extends SettingsState {
  ownedMap: OwnedMap;
  nameFilter: string;
  ingredientFilter: string;
  arcanaFilter: string;
  showOwnedOnly: boolean;
  showWishlistOnly: boolean;

  personaList: PersonaRuntime[];
  personaMap: Record<string, PersonaRuntime>;
  personaeByArcana: Record<string, PersonaRuntime[]>;
  calculator: FusionCalculator;

  setOwned(name: string, patch: Partial<OwnedState>): void;
  importOwned(data: ImportedOwnedData): void;
  exportOwned(): ImportedOwnedData;

  setDlcEnabled(name: string, enabled: boolean): void;
  setAllDlcEnabled(enabled: boolean): void;
  setMaxedConfidant(arcana: string, maxed: boolean): void;
  setAllConfidants(maxed: boolean): void;
  setFusionTreeDepth(depth: number): void;
  setDisplaySize(v: DisplaySize): void;
  setColorMode(v: ColorMode): void;

  setNameFilter(v: string): void;
  setIngredientFilter(v: string): void;
  setArcanaFilter(v: string): void;
  setShowOwnedOnly(v: boolean): void;
  setShowWishlistOnly(v: boolean): void;

  rebuildEngine(): void;
}

const defaultDlcEnabled: Record<string, boolean> = {};
for (const name of allDlcPersonaNames) {
  defaultDlcEnabled[name] = false;
}

function buildEngine(dlcEnabled: Record<string, boolean>) {
  return buildPersonaRuntime(dlcEnabled);
}

const initialEngine = buildEngine(defaultDlcEnabled);

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      ownedMap: {},
      nameFilter: '',
      ingredientFilter: '',
      arcanaFilter: '',
      showOwnedOnly: false,
      showWishlistOnly: false,
      dlcEnabled: defaultDlcEnabled,
      maxedConfidants: {},
      fusionTreeDepth: 4,
      displaySize: 'normal',
      colorMode: 'p5',

      ...initialEngine,

      setOwned(name, patch) {
        set(state => {
          const existing = state.ownedMap[name] ?? { owned: false, wishlist: false, notes: '' };
          return {
            ownedMap: {
              ...state.ownedMap,
              [name]: { ...existing, ...patch },
            },
          };
        });
      },

      importOwned(data) {
        // 'save-file' source comes from the companion save reader. It only
        // contains owned personas; merge so we preserve user-set wishlist
        // and notes data. Manual exports replace the entire map.
        if (data.source === 'save-file') {
          set(state => {
            const merged: OwnedMap = { ...state.ownedMap };
            for (const [name, patch] of Object.entries(data.personas)) {
              const existing = merged[name] ?? { owned: false, wishlist: false, notes: '' };
              merged[name] = { ...existing, ...patch };
            }
            return { ownedMap: merged };
          });
        } else {
          set({ ownedMap: data.personas });
        }
      },

      exportOwned(): ImportedOwnedData {
        return {
          version: 1,
          source: 'manual',
          personas: get().ownedMap,
        };
      },

      setDlcEnabled(name, enabled) {
        const dlcEnabled = { ...get().dlcEnabled, [name]: enabled };
        set({ dlcEnabled, ...buildEngine(dlcEnabled) });
      },

      setAllDlcEnabled(enabled) {
        const dlcEnabled: Record<string, boolean> = {};
        for (const name of allDlcPersonaNames) dlcEnabled[name] = enabled;
        set({ dlcEnabled, ...buildEngine(dlcEnabled) });
      },

      setMaxedConfidant(arcana, maxed) {
        set(state => ({ maxedConfidants: { ...state.maxedConfidants, [arcana]: maxed } }));
      },

      setAllConfidants(maxed) {
        const all: Record<string, boolean> = {};
        for (const arcana of Object.keys(confidantNames)) all[arcana] = maxed;
        set({ maxedConfidants: all });
      },

      setFusionTreeDepth(depth) {
        set({ fusionTreeDepth: Math.max(1, Math.min(6, depth)) });
      },

      setDisplaySize(v) { set({ displaySize: v }); },
      setColorMode(v) { set({ colorMode: v }); },

      setNameFilter(v) { set({ nameFilter: v }); },
      setIngredientFilter(v) { set({ ingredientFilter: v }); },
      setArcanaFilter(v) { set({ arcanaFilter: v }); },
      setShowOwnedOnly(v) { set({ showOwnedOnly: v }); },
      setShowWishlistOnly(v) { set({ showWishlistOnly: v }); },

      rebuildEngine() {
        set(state => buildEngine(state.dlcEnabled));
      },
    }),
    {
      name: 'p5r-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ownedMap: state.ownedMap,
        dlcEnabled: state.dlcEnabled,
        maxedConfidants: state.maxedConfidants,
        fusionTreeDepth: state.fusionTreeDepth,
        displaySize: state.displaySize,
        colorMode: state.colorMode,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          const engine = buildEngine(state.dlcEnabled ?? defaultDlcEnabled);
          Object.assign(state, engine);
        }
      },
    }
  )
);
