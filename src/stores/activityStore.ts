import { create } from 'zustand';
import type { Activity } from '../lib/types';

interface ActivityState {
  activities: Activity[];
  selectedIds: number[];
  isLoading: boolean;
  filter: {
    app?: string;
    category?: string;
    timeRange?: string;
  };
  fetchActivities: () => Promise<void>;
  prependActivity: (activity: Activity) => void;
  setFilter: (filter: ActivityState['filter']) => void;
  toggleSelection: (id: number) => void;
  clearSelection: () => void;
  selectMultiple: (ids: number[]) => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  selectedIds: [],
  isLoading: false,
  filter: {},

  fetchActivities: async () => {
    set({ isLoading: true });
    // TODO: Implement with getActivities() from tauri.ts when activity list view is added
    set({ isLoading: false });
  },

  prependActivity: (activity) => {
    set((state) => ({
      activities: [activity, ...state.activities],
    }));
  },

  setFilter: (filter) => {
    set({ filter });
  },

  toggleSelection: (id) =>
    set((state) => {
      const isSelected = state.selectedIds.includes(id);
      return {
        selectedIds: isSelected
          ? state.selectedIds.filter((sid) => sid !== id)
          : [...state.selectedIds, id],
      };
    }),

  clearSelection: () => set({ selectedIds: [] }),

  selectMultiple: (ids) => set({ selectedIds: ids }),
}));
