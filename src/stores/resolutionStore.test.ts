import { beforeEach, describe, expect, it } from 'vitest';
import { useResolutionStore } from './resolutionStore';

describe('resolutionStore', () => {
  beforeEach(() => {
    useResolutionStore.setState({
      currentDraft: '',
      currentResolutionId: null,
      isGenerating: false,
      generationError: null,
      selectedActivityIds: [],
      resolutions: [],
    });
  });

  it('starts generation without a known resolution id', () => {
    useResolutionStore.getState().startGeneration();

    const state = useResolutionStore.getState();
    expect(state.isGenerating).toBe(true);
    expect(state.currentResolutionId).toBeNull();
    expect(state.currentDraft).toBe('');
    expect(state.generationError).toBeNull();
  });

  it('updates resolution id after generation begins', () => {
    useResolutionStore.getState().startGeneration();
    useResolutionStore.getState().setCurrentResolutionId(42);

    expect(useResolutionStore.getState().currentResolutionId).toBe(42);
  });

  it('finishes generation with an error message when unsuccessful', () => {
    useResolutionStore.getState().startGeneration();
    useResolutionStore
      .getState()
      .finishGeneration(false, 'backend unavailable');

    const state = useResolutionStore.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.generationError).toBe('backend unavailable');
  });
});
