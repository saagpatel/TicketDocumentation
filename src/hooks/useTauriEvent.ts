import { useEffect } from 'react';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

export function useTauriEvent<T>(
  eventName: string,
  handler: (payload: T) => void
) {
  useEffect(() => {
    let unlisten: UnlistenFn | undefined;

    // Set up listener
    const setupListener = async () => {
      unlisten = await listen<T>(eventName, (event) => {
        handler(event.payload);
      });
    };

    setupListener();

    // Clean up on unmount
    return () => {
      if (unlisten) {
        unlisten();
      }
    };
  }, [eventName, handler]);
}
