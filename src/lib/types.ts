export interface Activity {
  id: number;
  app_name: string;
  window_title: string;
  process_path: string;
  window_id: string;
  detected_category: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface Resolution {
  id: number;
  activity_ids: string;  // JSON array
  template_id: string;
  prompt_text: string;
  generated_text: string;
  edited_text: string | null;
  model_name: string;
  generation_duration_ms: number | null;
  created_at: string;
  updated_at: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  is_builtin: boolean;
  created_at: string;
  updated_at: string;
}

export interface Exclusion {
  id: number;
  app_name: string;
  reason: string | null;
  created_at: string;
}

export interface MonitoringStatus {
  is_running: boolean;
  has_screen_recording_permission: boolean;
  activities_today: number;
}

export interface OllamaStatus {
  is_running: boolean;
  models: string[];
  active_model: string | null;
}

export interface NewActivityEvent {
  activity: Activity;
}

export interface LlmTokenEvent {
  resolution_id: number;
  token: string;
  done: boolean;
}

export interface LlmDoneEvent {
  resolution_id: number;
  success: boolean;
  error: string | null;
  duration_ms: number;
}

export interface AppSettings {
  ollama_url: string;
  ollama_model: string;
  auto_delete_days: number;
  pii_scrubbing_enabled: boolean;
  poll_interval_seconds: number;
  start_on_launch: boolean;
  app_context: string;
}
