// Event names for Tauri events
export const EVENTS = {
  NEW_ACTIVITY: 'new-activity',
  LLM_TOKEN: 'llm-token',
  LLM_DONE: 'llm-done',
  MONITORING_STATUS: 'monitoring-status',
} as const;

// Default settings
export const DEFAULTS = {
  OLLAMA_URL: 'http://localhost:11434',
  OLLAMA_MODEL: 'llama3.2:latest',
  AUTO_DELETE_DAYS: 7,
  PII_SCRUBBING_ENABLED: true,
  POLL_INTERVAL_SECONDS: 5,
  START_ON_LAUNCH: true,
} as const;
