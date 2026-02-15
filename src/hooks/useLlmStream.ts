import { useEffect, useRef } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import type { LlmTokenEvent, LlmDoneEvent } from '../lib/types';
import { useResolutionStore } from '../stores/resolutionStore';

export function useLlmStream() {
  const { appendToken, finishGeneration, currentResolutionId } = useResolutionStore();

  // Use refs to access latest values without triggering re-setup
  const appendTokenRef = useRef(appendToken);
  const finishGenerationRef = useRef(finishGeneration);
  const currentResolutionIdRef = useRef(currentResolutionId);

  // Keep refs updated
  useEffect(() => {
    appendTokenRef.current = appendToken;
    finishGenerationRef.current = finishGeneration;
    currentResolutionIdRef.current = currentResolutionId;
  });

  useEffect(() => {
    let unlistenToken: UnlistenFn | undefined;
    let unlistenDone: UnlistenFn | undefined;

    const setupListeners = async () => {
      unlistenToken = await listen<LlmTokenEvent>('llm-token', (event) => {
        const { resolution_id, token } = event.payload;
        if (resolution_id === currentResolutionIdRef.current) {
          appendTokenRef.current(token);
        }
      });

      unlistenDone = await listen<LlmDoneEvent>('llm-done', (event) => {
        const { resolution_id, success, error } = event.payload;
        if (resolution_id === currentResolutionIdRef.current) {
          finishGenerationRef.current(success, error || undefined);
        }
      });
    };

    setupListeners();

    return () => {
      if (unlistenToken) unlistenToken();
      if (unlistenDone) unlistenDone();
    };
  }, []); // Empty deps - only set up once
}
