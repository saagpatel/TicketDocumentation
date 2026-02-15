import { useCallback } from 'react';
import { useTauriEvent } from './useTauriEvent';
import { useActivityStore } from '../stores/activityStore';
import { EVENTS } from '../lib/constants';
import type { NewActivityEvent } from '../lib/types';

export function useActivityStream() {
  const prependActivity = useActivityStore((state) => state.prependActivity);

  const handleNewActivity = useCallback(
    (event: NewActivityEvent) => {
      prependActivity(event.activity);
    },
    [prependActivity]
  );

  useTauriEvent<NewActivityEvent>(EVENTS.NEW_ACTIVITY, handleNewActivity);
}
