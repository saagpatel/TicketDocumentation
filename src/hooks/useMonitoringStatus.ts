import { useEffect } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { invoke } from '@tauri-apps/api/core';
import type { MonitoringStatus } from '../lib/types';

export function useMonitoringStatus() {
  const setMonitoring = useSettingsStore((state) => state.setMonitoring);

  useEffect(() => {
    // Fetch initial status
    const fetchStatus = async () => {
      try {
        const status = await invoke<MonitoringStatus>('get_monitoring_status');
        setMonitoring(status.is_running);
      } catch (error) {
        console.error('Failed to fetch monitoring status:', error);
      }
    };

    fetchStatus();

    // Poll for status updates every 5 seconds.
    // NOTE: This could be optimized with event-based updates from the backend
    // instead of polling, but 5s is acceptable for monitoring status UI.
    const interval = setInterval(fetchStatus, 5000);

    return () => clearInterval(interval);
  }, [setMonitoring]);
}
