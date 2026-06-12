import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useSettingsStore } from '../../stores/settingsStore';

export function PauseButton() {
  const isMonitoring = useSettingsStore((state) => state.isMonitoring);
  const setMonitoring = useSettingsStore((state) => state.setMonitoring);
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = async () => {
    setIsLoading(true);
    try {
      if (isMonitoring) {
        await invoke('stop_monitoring');
        setMonitoring(false);
      } else {
        await invoke('start_monitoring');
        setMonitoring(true);
      }
    } catch (error) {
      console.error('Failed to toggle monitoring:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`
        px-3 py-1 text-sm font-medium rounded transition-colors
        ${isMonitoring
          ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
          : 'bg-green-500 hover:bg-green-600 text-white'
        }
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
    >
      {isLoading ? 'Loading...' : isMonitoring ? 'Pause' : 'Start'}
    </button>
  );
}
