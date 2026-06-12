import { useEffect, useState } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import {
  getSettings,
  updateSettings,
  getExclusions,
  addExclusion,
  removeExclusion,
  checkOllamaStatus,
} from '../../lib/tauri';
import type { AppSettings } from '../../lib/types';

export function Settings() {
  const { settings, exclusions, setSettings, setExclusions, addExclusion: addExclusionToStore, removeExclusion: removeExclusionFromStore } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState<AppSettings | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [ollamaConnected, setOllamaConnected] = useState(false);
  const [newExclusionApp, setNewExclusionApp] = useState('');

  // Load settings and exclusions on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsData, exclusionsData] = await Promise.all([
          getSettings(),
          getExclusions(),
        ]);
        setSettings(settingsData);
        setLocalSettings(settingsData);
        setExclusions(exclusionsData);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadData();
  }, [setSettings, setExclusions]);

  // Check Ollama status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const status = await checkOllamaStatus();
        setOllamaConnected(status.is_running);
      } catch {
        setOllamaConnected(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSettingChange = (key: keyof AppSettings, value: string | number | boolean) => {
    if (!localSettings) return;
    setLocalSettings({ ...localSettings, [key]: value });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!localSettings) return;

    setIsSaving(true);
    try {
      await updateSettings(localSettings);
      setSettings(localSettings);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to save settings: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (settings) {
      setLocalSettings(settings);
      setHasChanges(false);
    }
  };

  const handleAddExclusion = async () => {
    if (!newExclusionApp.trim()) return;

    try {
      const exclusion = await addExclusion(newExclusionApp.trim());
      addExclusionToStore(exclusion);
      setNewExclusionApp('');
    } catch (error) {
      console.error('Failed to add exclusion:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to add exclusion: ${errorMessage}`);
    }
  };

  const handleRemoveExclusion = async (id: number) => {
    try {
      await removeExclusion(id);
      removeExclusionFromStore(id);
    } catch (error) {
      console.error('Failed to remove exclusion:', error);
    }
  };

  if (!localSettings) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Configure your application preferences
          </p>
        </div>

        {/* Ollama Configuration */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Ollama Configuration
            </h2>
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                ollamaConnected
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {ollamaConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Ollama URL
              </label>
              <input
                type="text"
                value={localSettings.ollama_url}
                onChange={(e) => handleSettingChange('ollama_url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="http://localhost:11434"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model Name
              </label>
              <input
                type="text"
                value={localSettings.ollama_model}
                onChange={(e) => handleSettingChange('ollama_model', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="llama3.2:latest"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Make sure this model is pulled in Ollama
              </p>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Privacy & Data
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  PII Scrubbing
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically redact sensitive information from window titles
                </p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.pii_scrubbing_enabled}
                onChange={(e) => handleSettingChange('pii_scrubbing_enabled', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Auto-delete activities after (days)
              </label>
              <input
                type="number"
                min="0"
                value={localSettings.auto_delete_days}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  handleSettingChange('auto_delete_days', Number.isNaN(parsed) ? 0 : parsed);
                }}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Set to 0 to keep activities indefinitely
              </p>
            </div>
          </div>
        </section>

        {/* Monitoring Settings */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Monitoring
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Poll interval (seconds)
              </label>
              <input
                type="number"
                min="5"
                max="30"
                value={localSettings.poll_interval_seconds}
                onChange={(e) => {
                  const parsed = Number.parseInt(e.target.value, 10);
                  handleSettingChange('poll_interval_seconds', Number.isNaN(parsed) ? 5 : parsed);
                }}
                className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                How often to check for window changes (5-30 seconds)
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Start monitoring on launch
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Automatically begin monitoring when the app starts
                </p>
              </div>
              <input
                type="checkbox"
                checked={localSettings.start_on_launch}
                onChange={(e) => handleSettingChange('start_on_launch', e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded"
              />
            </div>
          </div>
        </section>

        {/* Exclusions */}
        <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Excluded Applications
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Applications listed here will not be monitored
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newExclusionApp}
              onChange={(e) => setNewExclusionApp(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddExclusion()}
              placeholder="App name (e.g., Messages)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
            <button
              onClick={handleAddExclusion}
              disabled={!newExclusionApp.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>

          {exclusions.length > 0 ? (
            <ul className="space-y-2">
              {exclusions.map((exclusion) => (
                <li
                  key={exclusion.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {exclusion.app_name}
                    </div>
                    {exclusion.reason && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {exclusion.reason}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveExclusion(exclusion.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No excluded applications
            </p>
          )}
        </section>

        {/* Save/Reset buttons */}
        {hasChanges && (
          <div className="flex gap-3 sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 -mx-6">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleReset}
              disabled={isSaving}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Reset
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
