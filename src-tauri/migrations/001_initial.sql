-- Activities logged from window monitoring
CREATE TABLE IF NOT EXISTS activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL,
    window_title TEXT NOT NULL DEFAULT '',
    process_path TEXT NOT NULL DEFAULT '',
    window_id TEXT NOT NULL DEFAULT '',
    detected_category TEXT,
    started_at TEXT NOT NULL,          -- ISO 8601
    ended_at TEXT,                     -- NULL until next activity
    duration_seconds INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activities_started_at ON activities(started_at);
CREATE INDEX IF NOT EXISTS idx_activities_app_name ON activities(app_name);

-- Generated resolution drafts
CREATE TABLE IF NOT EXISTS resolutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    activity_ids TEXT NOT NULL,        -- JSON array of activity IDs
    template_id TEXT NOT NULL,
    prompt_text TEXT NOT NULL,
    generated_text TEXT NOT NULL,
    edited_text TEXT,
    model_name TEXT NOT NULL,
    generation_duration_ms INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Prompt templates
CREATE TABLE IF NOT EXISTS templates (
    id TEXT PRIMARY KEY,              -- slug: "incident-resolution"
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    prompt_template TEXT NOT NULL,     -- uses {{activity_summary}}, {{category}}, {{app_context}}
    is_builtin INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Apps excluded from monitoring
CREATE TABLE IF NOT EXISTS exclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    app_name TEXT NOT NULL UNIQUE,
    reason TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Key-value settings
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Insert default settings
INSERT OR IGNORE INTO settings (key, value) VALUES
    ('ollama_url', 'http://localhost:11434'),
    ('ollama_model', 'llama3.2:latest'),
    ('auto_delete_days', '7'),
    ('pii_scrubbing_enabled', 'true'),
    ('poll_interval_seconds', '5'),
    ('start_on_launch', 'true'),
    ('onboarding_completed', 'false');

-- Insert built-in templates
INSERT OR IGNORE INTO templates (id, name, description, prompt_template, is_builtin) VALUES
    ('incident', 'Incident Resolution', 'For incident tickets',
     'You are an IT support engineer writing a resolution note for an incident ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what was done to resolve the incident
- Only mentions actions that appear in the activity summary above
- Uses professional IT support language
- Focuses on the resolution steps, not the problem description

Format: Start with "Performed troubleshooting:" or "Resolved incident by:"', 1),

    ('request', 'Service Request', 'For service requests',
     'You are an IT support engineer writing a resolution note for a service request ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what was provisioned or configured
- Only mentions actions that appear in the activity summary above
- Uses professional IT support language
- Confirms successful completion

Format: Start with "Completed service request:" or "Provisioned:"', 1),

    ('change', 'Change Record', 'For change tickets',
     'You are an IT support engineer writing a resolution note for a change ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what was deployed or changed
- Only mentions actions that appear in the activity summary above
- Notes any validation or testing performed
- Uses professional IT support language

Format: Start with "Implemented change:" or "Deployed:"', 1),

    ('problem', 'Problem Investigation', 'For problem tickets',
     'You are an IT support engineer writing a resolution note for a problem investigation.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes the investigation performed
- Only mentions actions that appear in the activity summary above
- Notes findings or root cause if evident
- Uses professional IT support language

Format: Start with "Investigated issue:" or "Root cause analysis:"', 1),

    ('generic', 'Generic', 'General purpose template',
     'You are an IT support engineer writing a resolution note for a support ticket.

Activity Summary:
{{activity_summary}}

Category: {{category}}

Write a concise resolution note (3-5 sentences) that:
- Describes what actions were performed
- Only mentions actions that appear in the activity summary above
- Uses professional IT support language
- Is suitable for pasting into {{app_context}}

Format: Start with "Performed:" or "Completed:"', 1);
