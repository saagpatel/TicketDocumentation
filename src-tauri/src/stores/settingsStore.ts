import { create } from 'zustand';
import type { AppSettings, Exclusion } from '../lib/types';

interface SettingsState {
  settings: AppSettings | null;
  exclusions: Exclusion[];
  isLoading: boolean;

  // Actions
  setSettings: (settings: AppSettings) => void;
  setExclusions: (exclusions: Exclusion[]) => void;
  addExclusion: (exclusion: Exclusion) => void;
  removeExclusion: (id: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  exclusions: [],
  isLoading: false,

  setSettings: (settings) => set({ settings }),

  setExclusions: (exclusions) => set({ exclusions }),

  addExclusion: (exclusion) =>
    set((state) => ({
      exclusions: [...state.exclusions, exclusion],
    })),

  removeExclusion: (id) =>
    set((state) => ({
      exclusions: state.exclusions.filter((e) => e.id !== id),
    })),

  setLoading: (loading) => set({ isLoading: loading }),
}));
