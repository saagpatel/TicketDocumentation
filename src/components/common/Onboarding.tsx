import { useState, useEffect } from 'react';
import { getSettings, updateSettings, getMonitoringStatus, startMonitoring, checkOllamaStatus } from '../../lib/tauri';
import { invoke } from '@tauri-apps/api/core';
import type { AppSettings, MonitoringStatus, OllamaStatus } from '../../lib/types';

export function Onboarding() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<MonitoringStatus | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatus | null>(null);
  const [isStartingMonitoring, setIsStartingMonitoring] = useState(false);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const [settingsData, monitoringData, ollamaData] = await Promise.all([
        getSettings(),
        getMonitoringStatus(),
        checkOllamaStatus(),
      ]);
      setSettings(settingsData);
      setMonitoringStatus(monitoringData);
      setOllamaStatus(ollamaData);
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleGrantPermission = async () => {
    await invoke('plugin:opener|open', { path: 'x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture' });
  };

  const handleInstallOllama = async () => {
    await invoke('plugin:opener|open', { path: 'https://ollama.ai' });
  };

  const handleStartMonitoring = async () => {
    setIsStartingMonitoring(true);
    try {
      await startMonitoring();
      await loadStatus();
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    } finally {
      setIsStartingMonitoring(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!settings) return;
    try {
      await updateSettings({
        ...settings,
        start_on_launch: true,
      });

      // Parent component should handle onboarding completion state
      // rather than reloading. For now, emit a custom event.
      window.dispatchEvent(new CustomEvent('onboarding-complete'));
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  if (!settings || !monitoringStatus || !ollamaStatus) {
    return (
      <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const hasPermission = monitoringStatus.has_screen_recording_permission;
  const hasOllama = ollamaStatus.is_running;
  const isMonitoring = monitoringStatus.is_running;
  const canComplete = hasPermission && hasOllama && isMonitoring;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Welcome to Ticket Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Let's get you set up in just a few steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {/* Step 1: Screen Recording Permission */}
          <div className={`border-2 rounded-lg p-4 ${hasPermission ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${hasPermission ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                {hasPermission ? '✓' : '1'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Grant Screen Recording Permission
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Required to capture window titles for activity tracking. Your privacy is protected - no screenshots are taken.
                </p>
                {!hasPermission && (
                  <button
                    onClick={handleGrantPermission}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    Open System Preferences
                  </button>
                )}
                {hasPermission && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Permission granted!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Step 2: Install Ollama */}
          <div className={`border-2 rounded-lg p-4 ${hasOllama ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${hasOllama ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                {hasOllama ? '✓' : '2'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Install Ollama
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Local LLM server required for generating resolution notes. Runs entirely on your machine - no cloud dependencies.
                </p>
                {!hasOllama && (
                  <button
                    onClick={handleInstallOllama}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
                  >
                    Visit ollama.ai
                  </button>
                )}
                {hasOllama && (
                  <div className="space-y-1">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Ollama is running!
                    </p>
                    {ollamaStatus.models.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Models: {ollamaStatus.models.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 3: Start Monitoring */}
          <div className={`border-2 rounded-lg p-4 ${isMonitoring ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-300 dark:border-gray-600'}`}>
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isMonitoring ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300'}`}>
                {isMonitoring ? '✓' : '3'}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Start Activity Monitoring
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Begin tracking your app usage to build a timeline of your work activities.
                </p>
                {!isMonitoring && hasPermission && (
                  <button
                    onClick={handleStartMonitoring}
                    disabled={isStartingMonitoring}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 text-sm"
                  >
                    {isStartingMonitoring ? 'Starting...' : 'Start Monitoring'}
                  </button>
                )}
                {!hasPermission && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Complete step 1 first
                  </p>
                )}
                {isMonitoring && (
                  <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                    Monitoring active!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Complete Button */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCompleteOnboarding}
            disabled={!canComplete}
            className="w-full px-6 py-3 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {canComplete ? "Let's Go!" : 'Complete all steps to continue'}
          </button>
        </div>
      </div>
    </div>
  );
}
