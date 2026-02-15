import { act, renderHook, waitFor } from '@testing-library/react';
import { listen } from '@tauri-apps/api/event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useResolutionStore } from '../stores/resolutionStore';
import { useLlmStream } from './useLlmStream';

type EventPayload = {
  payload: {
    resolution_id: number;
    token?: string;
    success?: boolean;
    error?: string | null;
  };
};

describe('useLlmStream', () => {
  const listeners = new Map<string, (event: EventPayload) => void>();

  beforeEach(() => {
    listeners.clear();
    useResolutionStore.setState({
      currentDraft: '',
      currentResolutionId: null,
      isGenerating: false,
      generationError: null,
      selectedActivityIds: [],
      resolutions: [],
    });

    vi.mocked(listen).mockImplementation(
      (async (eventName, handler) => {
        listeners.set(eventName, handler as (event: EventPayload) => void);
        return () => {};
      }) as typeof listen
    );
  });

  it('captures first streaming id when generation starts without known id', async () => {
    renderHook(() => useLlmStream());
    await waitFor(() => expect(listeners.has('llm-token')).toBe(true));

    act(() => {
      useResolutionStore.getState().startGeneration();
    });

    act(() => {
      listeners.get('llm-token')?.({
        payload: { resolution_id: 123, token: 'hello ' },
      });
    });

    let state = useResolutionStore.getState();
    expect(state.currentResolutionId).toBe(123);
    expect(state.currentDraft).toBe('hello ');

    act(() => {
      listeners.get('llm-done')?.({
        payload: { resolution_id: 123, success: true, error: null },
      });
    });

    state = useResolutionStore.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.generationError).toBeNull();
  });

  it('ignores token events for different resolution ids', async () => {
    renderHook(() => useLlmStream());
    await waitFor(() => expect(listeners.has('llm-token')).toBe(true));

    act(() => {
      useResolutionStore.getState().startGeneration(7);
    });

    act(() => {
      listeners.get('llm-token')?.({
        payload: { resolution_id: 8, token: 'ignored' },
      });
    });

    const state = useResolutionStore.getState();
    expect(state.currentResolutionId).toBe(7);
    expect(state.currentDraft).toBe('');
  });
});
