import { create } from 'zustand';
import type { Activity } from '../lib/types';

interface ActivityState {
  activities: Activity[];
  selectedIds: number[];
  filter: {
    app?: string;
    category?: string;
    timeRange?: string;
  };

  // Actions
  setActivities: (activities: Activity[]) => void;
  prependActivity: (activity: Activity) => void;
  toggleSelection: (id: number) => void;
  clearSelection: () => void;
  selectMultiple: (ids: number[]) => void;
  setFilter: (filter: Partial<ActivityState['filter']>) => void;
  clearFilter: () => void;
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  selectedIds: [],
  filter: {},

  setActivities: (activities) => set({ activities }),

  prependActivity: (activity) =>
    set((state) => ({
      activities: [activity, ...state.activities],
    })),

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

  setFilter: (filter) =>
    set((state) => ({
      filter: { ...state.filter, ...filter },
    })),

  clearFilter: () => set({ filter: {} }),
}));
