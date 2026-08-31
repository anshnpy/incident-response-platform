CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  severity TEXT NOT NULL,
  status TEXT NOT NULL,
  phase TEXT NOT NULL,
  owner TEXT NOT NULL,
  affected_user TEXT,
  affected_endpoint TEXT,
  risk_score INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  source_incident_id TEXT,
  source_ip TEXT,
  technique TEXT,
  occurrences INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_cases_status
  ON cases(status);

CREATE INDEX IF NOT EXISTS idx_cases_severity
  ON cases(severity);

CREATE INDEX IF NOT EXISTS idx_cases_source_incident
  ON cases(source_incident_id);

CREATE INDEX IF NOT EXISTS idx_cases_endpoint
  ON cases(affected_endpoint);

CREATE INDEX IF NOT EXISTS idx_cases_updated
  ON cases(updated_at);

CREATE TABLE IF NOT EXISTS incident_metadata (
  incident_id TEXT PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'detected',
  priority TEXT NOT NULL DEFAULT 'medium',
  assignee TEXT,
  notes TEXT,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incident_metadata_status
  ON incident_metadata(status);

CREATE INDEX IF NOT EXISTS idx_incident_metadata_priority
  ON incident_metadata(priority);

CREATE INDEX IF NOT EXISTS idx_incident_metadata_assignee
  ON incident_metadata(assignee);

CREATE TABLE IF NOT EXISTS incident_activity (
  id TEXT PRIMARY KEY,
  incident_id TEXT NOT NULL,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  field TEXT,
  old_value TEXT,
  new_value TEXT,
  detail TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_incident_activity_incident
  ON incident_activity(incident_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_activity_actor
  ON incident_activity(actor);

CREATE INDEX IF NOT EXISTS idx_incident_activity_action
  ON incident_activity(action);

CREATE TABLE IF NOT EXISTS findings (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL,
  confidence TEXT NOT NULL,
  technique TEXT,
  evidence_ids TEXT NOT NULL DEFAULT '[]',
  entity_ids TEXT NOT NULL DEFAULT '[]',
  event_ids TEXT NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  author TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_findings_case
  ON findings(case_id);

CREATE INDEX IF NOT EXISTS idx_findings_status
  ON findings(status);

CREATE INDEX IF NOT EXISTS idx_findings_updated
  ON findings(updated_at);

CREATE TABLE IF NOT EXISTS response_actions (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  name TEXT NOT NULL,
  target TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  requested_at TEXT NOT NULL,
  completed_at TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_response_actions_case
  ON response_actions(case_id);

CREATE INDEX IF NOT EXISTS idx_response_actions_status
  ON response_actions(status);

CREATE INDEX IF NOT EXISTS idx_response_actions_requested
  ON response_actions(requested_at DESC);

CREATE TABLE IF NOT EXISTS playbook_runs (
  id TEXT PRIMARY KEY,
  case_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at TEXT,
  completed_at TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playbook_runs_case
  ON playbook_runs(case_id);

CREATE INDEX IF NOT EXISTS idx_playbook_runs_status
  ON playbook_runs(status);

CREATE INDEX IF NOT EXISTS idx_playbook_runs_updated
  ON playbook_runs(updated_at);

CREATE TABLE IF NOT EXISTS playbook_run_steps (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL,
  step_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  started_at TEXT,
  completed_at TEXT,
  error TEXT,
  sort_order INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_playbook_run_steps_run
  ON playbook_run_steps(run_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_playbook_run_steps_status
  ON playbook_run_steps(status);
