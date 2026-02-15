import { useEffect } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { LlmTokenEvent, LlmDoneEvent } from '../lib/types';
import { useResolutionStore } from '../stores/resolutionStore';

export function useLlmStream() {
  const { appendToken, finishGeneration, currentResolutionId } = useResolutionStore();

  useEffect(() => {
    let unlistenToken: UnlistenFn | undefined;
    let unlistenDone: UnlistenFn | undefined;

    // Set up event listeners
    const setupListeners = async () => {
      // Listen for token events
      unlistenToken = await listen<LlmTokenEvent>('llm-token', (event) => {
        const { resolution_id, token } = event.payload;
        
        // Only append if this is for the current resolution
        if (resolution_id === currentResolutionId) {
          appendToken(token);
        }
      });

      // Listen for completion events
      unlistenDone = await listen<LlmDoneEvent>('llm-done', (event) => {
        const { resolution_id, success, error } = event.payload;
        
        // Only finish if this is for the current resolution
        if (resolution_id === currentResolutionId) {
          finishGeneration(success, error || undefined);
        }
      });
    };

    setupListeners();

    // Cleanup
    return () => {
      if (unlistenToken) unlistenToken();
      if (unlistenDone) unlistenDone();
    };
  }, [appendToken, finishGeneration, currentResolutionId]);
}
