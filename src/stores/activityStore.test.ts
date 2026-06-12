import { describe, it, expect, beforeEach } from 'vitest';
import { useActivityStore } from './activityStore';
import type { Activity } from '../lib/types';

describe('activityStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useActivityStore.setState({
      activities: [],
      selectedIds: [],
      isLoading: false,
      filter: {},
    });
  });

  it('should initialize with empty activities', () => {
    const { activities } = useActivityStore.getState();
    expect(activities).toEqual([]);
  });

  it('should prepend activity', () => {
    const mockActivity: Activity = {
      id: 1,
      app_name: 'Chrome',
      window_title: 'Test Page',
      process_path: '/Applications/Chrome.app',
      window_id: '123',
      detected_category: 'incident',
      started_at: '2024-01-01T00:00:00Z',
      ended_at: null,
      duration_seconds: null,
      created_at: '2024-01-01T00:00:00Z',
    };

    useActivityStore.getState().prependActivity(mockActivity);

    const { activities } = useActivityStore.getState();
    expect(activities).toHaveLength(1);
    expect(activities[0]).toEqual(mockActivity);
  });

  it('should update filter', () => {
    useActivityStore.getState().setFilter({ app: 'Chrome' });

    const { filter } = useActivityStore.getState();
    expect(filter.app).toBe('Chrome');
  });

  it('should toggle activity selection', () => {
    useActivityStore.getState().toggleSelection(1);

    const { selectedIds } = useActivityStore.getState();
    expect(selectedIds).toContain(1);

    useActivityStore.getState().toggleSelection(1);
    expect(useActivityStore.getState().selectedIds).not.toContain(1);
  });

  it('should clear selection', () => {
    useActivityStore.setState({ selectedIds: [1, 2, 3] });
    useActivityStore.getState().clearSelection();

    const { selectedIds } = useActivityStore.getState();
    expect(selectedIds).toEqual([]);
  });
});
