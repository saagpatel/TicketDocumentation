import { invoke } from '@tauri-apps/api/core';
import type { Activity, MonitoringStatus, Resolution, OllamaStatus, AppSettings, Exclusion } from './types';

// Typed wrappers for Tauri commands (stubs for now)

export async function getActivities(
  limit?: number,
  offset?: number,
  appFilter?: string,
  categoryFilter?: string
): Promise<Activity[]> {
  return await invoke<Activity[]>('get_activities', {
    request: {
      limit,
      offset,
      app_filter: appFilter,
      category_filter: categoryFilter,
    },
  });
}

export async function startMonitoring(): Promise<void> {
  await invoke('start_monitoring');
}

export async function stopMonitoring(): Promise<void> {
  await invoke('stop_monitoring');
}

export async function getMonitoringStatus(): Promise<MonitoringStatus> {
  return await invoke<MonitoringStatus>('get_monitoring_status');
}

// Resolution commands
export async function generateResolution(
  activityIds: number[],
  templateId: string
): Promise<number> {
  return await invoke<number>('generate_resolution', {
    request: {
      activity_ids: activityIds,
      template_id: templateId,
    },
  });
}

export async function saveResolution(id: number, editedText: string): Promise<void> {
  await invoke('save_resolution', {
    request: {
      id,
      edited_text: editedText,
    },
  });
}

export async function getResolutions(
  limit?: number,
  offset?: number
): Promise<Resolution[]> {
  return await invoke<Resolution[]>('get_resolutions', {
    request: {
      limit,
      offset,
    },
  });
}

export async function getResolutionById(id: number): Promise<Resolution> {
  return await invoke<Resolution>('get_resolution_by_id', { id });
}

// Ollama commands
export async function checkOllamaStatus(): Promise<OllamaStatus> {
  return await invoke<OllamaStatus>('check_ollama_status');
}

// Settings commands
export async function getSettings(): Promise<AppSettings> {
  return await invoke<AppSettings>('get_settings');
}

export async function updateSettings(settings: AppSettings): Promise<void> {
  await invoke('update_settings', { settings });
}

export async function getExclusions(): Promise<Exclusion[]> {
  return await invoke<Exclusion[]>('get_exclusions');
}

export async function addExclusion(appName: string, reason?: string): Promise<Exclusion> {
  return await invoke<Exclusion>('add_exclusion', {
    app_name: appName,
    reason,
  });
}

export async function removeExclusion(id: number): Promise<void> {
  await invoke('remove_exclusion', { id });
}
