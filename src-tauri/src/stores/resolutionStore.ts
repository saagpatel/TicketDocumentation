import { create } from 'zustand';
import type { Resolution } from '../lib/types';

interface ResolutionState {
  // Current draft being generated or edited
  currentDraft: string;
  currentResolutionId: number | null;
  isGenerating: boolean;
  generationError: string | null;

  // Selected activities for generation
  selectedActivityIds: number[];

  // Resolutions history
  resolutions: Resolution[];

  // Actions
  setSelectedActivityIds: (ids: number[]) => void;
  startGeneration: (resolutionId: number) => void;
  appendToken: (token: string) => void;
  finishGeneration: (success: boolean, error?: string) => void;
  setCurrentDraft: (text: string) => void;
  clearDraft: () => void;
  setResolutions: (resolutions: Resolution[]) => void;
  prependResolution: (resolution: Resolution) => void;
}

export const useResolutionStore = create<ResolutionState>((set) => ({
  currentDraft: '',
  currentResolutionId: null,
  isGenerating: false,
  generationError: null,
  selectedActivityIds: [],
  resolutions: [],

  setSelectedActivityIds: (ids) => set({ selectedActivityIds: ids }),

  startGeneration: (resolutionId) =>
    set({
      currentResolutionId: resolutionId,
      isGenerating: true,
      generationError: null,
      currentDraft: '',
    }),

  appendToken: (token) =>
    set((state) => ({
      currentDraft: state.currentDraft + token,
    })),

  finishGeneration: (success, error) =>
    set({
      isGenerating: false,
      generationError: error || null,
    }),

  setCurrentDraft: (text) => set({ currentDraft: text }),

  clearDraft: () =>
    set({
      currentDraft: '',
      currentResolutionId: null,
      generationError: null,
      selectedActivityIds: [],
    }),

  setResolutions: (resolutions) => set({ resolutions }),

  prependResolution: (resolution) =>
    set((state) => ({
      resolutions: [resolution, ...state.resolutions],
    })),
}));
