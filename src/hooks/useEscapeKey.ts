import { useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';

export function useEscapeKey() {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        const appWindow = getCurrentWindow();
        appWindow.hide().catch(console.error);
      }
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);
}
