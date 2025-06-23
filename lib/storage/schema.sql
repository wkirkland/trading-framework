-- lib/storage/schema.sql
-- SQLite schema for trading framework local data storage

-- Metrics metadata table
CREATE TABLE IF NOT EXISTS metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL CHECK (priority IN ('critical', 'high', 'medium', 'low')),
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    timing TEXT NOT NULL CHECK (timing IN ('leading', 'coincident', 'lagging')),
    source TEXT NOT NULL,
    api_source TEXT CHECK (api_source IN ('FRED', 'AlphaVantage', 'Calculated', 'Manual', 'Other')),
    api_identifier TEXT,
    units TEXT,
    is_poc_metric BOOLEAN DEFAULT FALSE,
    is_market_dependent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Metric data points table
CREATE TABLE IF NOT EXISTS metric_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL,
    value REAL,
    formatted_value TEXT,
    date TEXT NOT NULL, -- ISO date string from source
    change_value REAL,
    source TEXT NOT NULL,
    api_response_time_ms INTEGER,
    is_fallback BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metric_id) REFERENCES metrics (id) ON DELETE CASCADE
);

-- API health history table
CREATE TABLE IF NOT EXISTS api_health_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    api_name TEXT NOT NULL CHECK (api_name IN ('fred', 'alphaVantage')),
    status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'down', 'unknown')),
    response_time_ms INTEGER,
    error_message TEXT,
    consecutive_failures INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 100.0,
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Data freshness tracking table
CREATE TABLE IF NOT EXISTS data_freshness (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    metric_id INTEGER NOT NULL,
    last_successful_fetch TIMESTAMP,
    last_attempted_fetch TIMESTAMP,
    staleness_hours REAL,
    freshness_status TEXT CHECK (freshness_status IN ('fresh', 'aging', 'stale', 'unknown')),
    next_expected_update TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (metric_id) REFERENCES metrics (id) ON DELETE CASCADE,
    UNIQUE(metric_id) -- One freshness record per metric
);

-- Error tracking table
CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    component TEXT,
    operation TEXT,
    error_type TEXT,
    error_message TEXT NOT NULL,
    stack_trace TEXT,
    metric_name TEXT,
    api_name TEXT,
    user_agent TEXT,
    url TEXT,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    resolved BOOLEAN DEFAULT FALSE,
    occurred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cache management table
CREATE TABLE IF NOT EXISTS cache_metadata (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cache_key TEXT NOT NULL UNIQUE,
    cache_type TEXT NOT NULL CHECK (cache_type IN ('metric_data', 'api_response', 'analysis_result')),
    size_bytes INTEGER,
    expires_at TIMESTAMP,
    last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    access_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    operation TEXT NOT NULL,
    duration_ms INTEGER NOT NULL,
    memory_usage_mb REAL,
    cpu_usage_percent REAL,
    component TEXT,
    metric_count INTEGER,
    cache_hit_rate REAL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_metric_data_metric_id ON metric_data (metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_data_date ON metric_data (date DESC);
CREATE INDEX IF NOT EXISTS idx_metric_data_created_at ON metric_data (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_metric_data_fetched_at ON metric_data (fetched_at DESC);
CREATE INDEX IF NOT EXISTS idx_metric_data_source ON metric_data (source);

CREATE INDEX IF NOT EXISTS idx_api_health_api_name ON api_health_history (api_name);
CREATE INDEX IF NOT EXISTS idx_api_health_checked_at ON api_health_history (checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_health_status ON api_health_history (status);

CREATE INDEX IF NOT EXISTS idx_data_freshness_metric_id ON data_freshness (metric_id);
CREATE INDEX IF NOT EXISTS idx_data_freshness_status ON data_freshness (freshness_status);
CREATE INDEX IF NOT EXISTS idx_data_freshness_updated ON data_freshness (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_error_logs_occurred_at ON error_logs (occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_component ON error_logs (component);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs (severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_resolved ON error_logs (resolved);

CREATE INDEX IF NOT EXISTS idx_cache_metadata_key ON cache_metadata (cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_expires ON cache_metadata (expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_metadata_type ON cache_metadata (cache_type);

CREATE INDEX IF NOT EXISTS idx_performance_operation ON performance_metrics (operation);
CREATE INDEX IF NOT EXISTS idx_performance_recorded_at ON performance_metrics (recorded_at DESC);

-- Views for common queries
CREATE VIEW IF NOT EXISTS latest_metric_data AS
SELECT 
    m.name,
    m.category,
    m.frequency,
    md.value,
    md.formatted_value,
    md.date,
    md.change_value,
    md.source,
    md.is_fallback,
    md.created_at,
    md.fetched_at,
    df.freshness_status,
    df.staleness_hours
FROM metrics m
LEFT JOIN metric_data md ON m.id = md.metric_id
LEFT JOIN data_freshness df ON m.id = df.metric_id
WHERE md.id = (
    SELECT MAX(id) 
    FROM metric_data 
    WHERE metric_id = m.id
);

CREATE VIEW IF NOT EXISTS api_health_summary AS
SELECT 
    api_name,
    status,
    response_time_ms,
    consecutive_failures,
    success_rate,
    checked_at,
    ROW_NUMBER() OVER (PARTITION BY api_name ORDER BY checked_at DESC) as rn
FROM api_health_history;

CREATE VIEW IF NOT EXISTS cache_stats AS
SELECT 
    cache_type,
    COUNT(*) as total_entries,
    SUM(size_bytes) as total_size_bytes,
    AVG(access_count) as avg_access_count,
    COUNT(CASE WHEN expires_at > CURRENT_TIMESTAMP THEN 1 END) as active_entries,
    COUNT(CASE WHEN expires_at <= CURRENT_TIMESTAMP THEN 1 END) as expired_entries
FROM cache_metadata
GROUP BY cache_type;

-- Cleanup triggers
CREATE TRIGGER IF NOT EXISTS cleanup_old_metric_data
AFTER INSERT ON metric_data
BEGIN
    -- Keep only last 30 days of data per metric
    DELETE FROM metric_data 
    WHERE metric_id = NEW.metric_id 
    AND created_at < datetime('now', '-30 days');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_api_health
AFTER INSERT ON api_health_history
BEGIN
    -- Keep only last 7 days of API health data
    DELETE FROM api_health_history 
    WHERE checked_at < datetime('now', '-7 days');
END;

CREATE TRIGGER IF NOT EXISTS cleanup_old_error_logs
AFTER INSERT ON error_logs
BEGIN
    -- Keep only last 14 days of error logs
    DELETE FROM error_logs 
    WHERE occurred_at < datetime('now', '-14 days');
END;

CREATE TRIGGER IF NOT EXISTS update_metric_timestamp
AFTER UPDATE ON metrics
BEGIN
    UPDATE metrics 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;