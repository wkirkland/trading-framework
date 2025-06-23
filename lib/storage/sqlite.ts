// lib/storage/sqlite.ts
// SQLite storage service for local data persistence

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

import type { LiveMetricData } from '@/lib/context/DataContext';
import type { ApiHealthData } from '@/lib/services/apiHealthService';
import type { DataFreshnessStatus } from '@/lib/services/dataFreshnessService';
import { metricsData } from '@/lib/data/metrics';

// Database path - store in app data directory
const DB_PATH = path.join(process.cwd(), 'data', 'trading-framework.db');

// Ensure data directory exists
const DATA_DIR = path.dirname(DB_PATH);
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface MetricRecord {
  id: number;
  name: string;
  category: string;
  description?: string;
  priority: string;
  frequency: string;
  timing: string;
  source: string;
  api_source?: string;
  api_identifier?: string;
  units?: string;
  is_poc_metric: boolean;
  is_market_dependent: boolean;
}

interface MetricDataRecord {
  id: number;
  metric_id: number;
  value: number | null;
  formatted_value: string;
  date: string;
  change_value: number | null;
  source: string;
  api_response_time_ms: number | null;
  is_fallback: boolean;
  error_message: string | null;
  created_at: string;
  fetched_at: string;
}

interface ApiHealthRecord {
  id: number;
  api_name: string;
  status: string;
  response_time_ms: number | null;
  error_message: string | null;
  consecutive_failures: number;
  success_rate: number;
  checked_at: string;
}

interface DataFreshnessRecord {
  metric_id: number;
  last_successful_fetch: string | null;
  last_attempted_fetch: string | null;
  staleness_hours: number | null;
  freshness_status: string;
  next_expected_update: string | null;
  consecutive_failures: number;
  updated_at: string;
}

class SqliteStorage {
  private db: Database.Database | null = null;
  private isInitialized = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    try {
      this.db = new Database(DB_PATH);
      
      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');
      this.db.pragma('synchronous = NORMAL');
      this.db.pragma('cache_size = 1000');
      this.db.pragma('temp_store = memory');
      
      this.createTables();
      this.seedMetrics();
      this.isInitialized = true;
      
      console.log('SQLite database initialized at:', DB_PATH);
    } catch (error) {
      console.error('Failed to initialize SQLite database:', error);
      this.db = null;
    }
  }

  private createTables() {
    if (!this.db) return;

    try {
      // Read and execute schema
      const schemaPath = path.join(__dirname, 'schema.sql');
      const schema = fs.readFileSync(schemaPath, 'utf-8');
      
      // Split and execute each statement
      const statements = schema.split(';').filter(stmt => stmt.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          this.db.exec(statement);
        }
      }
    } catch (error) {
      console.error('Failed to create database tables:', error);
      
      // Fallback to inline schema if file not found
      this.createTablesInline();
    }
  }

  private createTablesInline() {
    if (!this.db) return;

    const statements = [
      `CREATE TABLE IF NOT EXISTS metrics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL,
        frequency TEXT NOT NULL,
        timing TEXT NOT NULL,
        source TEXT NOT NULL,
        api_source TEXT,
        api_identifier TEXT,
        units TEXT,
        is_poc_metric BOOLEAN DEFAULT FALSE,
        is_market_dependent BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS metric_data (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_id INTEGER NOT NULL,
        value REAL,
        formatted_value TEXT,
        date TEXT NOT NULL,
        change_value REAL,
        source TEXT NOT NULL,
        api_response_time_ms INTEGER,
        is_fallback BOOLEAN DEFAULT FALSE,
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (metric_id) REFERENCES metrics (id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS data_freshness (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        metric_id INTEGER NOT NULL,
        last_successful_fetch TIMESTAMP,
        last_attempted_fetch TIMESTAMP,
        staleness_hours REAL,
        freshness_status TEXT,
        next_expected_update TIMESTAMP,
        consecutive_failures INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (metric_id) REFERENCES metrics (id) ON DELETE CASCADE,
        UNIQUE(metric_id)
      )`,
      
      `CREATE INDEX IF NOT EXISTS idx_metric_data_metric_id ON metric_data (metric_id)`,
      `CREATE INDEX IF NOT EXISTS idx_metric_data_date ON metric_data (date DESC)`,
      `CREATE INDEX IF NOT EXISTS idx_metric_data_created_at ON metric_data (created_at DESC)`
    ];

    for (const statement of statements) {
      try {
        this.db.exec(statement);
      } catch (error) {
        console.error('Error executing statement:', statement, error);
      }
    }
  }

  private seedMetrics() {
    if (!this.db) return;

    try {
      const insertMetric = this.db.prepare(`
        INSERT OR REPLACE INTO metrics (
          name, category, description, priority, frequency, timing, 
          source, api_source, api_identifier, units, is_poc_metric, is_market_dependent
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = this.db.transaction((metrics) => {
        for (const metric of metrics) {
          insertMetric.run(
            metric.name,
            metric.category,
            metric.description,
            metric.priority,
            metric.frequency,
            metric.timing,
            metric.source,
            metric.apiSource,
            JSON.stringify(metric.apiIdentifier),
            metric.units,
            metric.isPocMetric || false,
            this.isMarketDependentMetric(metric.name)
          );
        }
      });

      insertMany(metricsData);
      console.log(`Seeded ${metricsData.length} metrics into database`);
    } catch (error) {
      console.error('Failed to seed metrics:', error);
    }
  }

  private isMarketDependentMetric(metricName: string): boolean {
    const marketMetrics = ['VIX Index', 'S&P 500', 'Dollar Index'];
    return marketMetrics.includes(metricName);
  }

  // Get metric ID by name
  getMetricId(metricName: string): number | null {
    if (!this.db) return null;

    try {
      const metric = this.db.prepare('SELECT id FROM metrics WHERE name = ?').get(metricName) as { id: number } | undefined;
      return metric?.id || null;
    } catch (error) {
      console.error('Error getting metric ID:', error);
      return null;
    }
  }

  // Store metric data
  storeMetricData(metricName: string, data: LiveMetricData, responseTime?: number): boolean {
    if (!this.db) return false;

    try {
      const metricId = this.getMetricId(metricName);
      if (!metricId) {
        console.warn(`Metric not found: ${metricName}`);
        return false;
      }

      const insert = this.db.prepare(`
        INSERT INTO metric_data (
          metric_id, value, formatted_value, date, change_value, 
          source, api_response_time_ms, is_fallback, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insert.run(
        metricId,
        data.value,
        data.formatted,
        data.date,
        data.change,
        data.source || 'Unknown',
        responseTime || null,
        data.isFallback || false,
        data.error || null
      );

      return true;
    } catch (error) {
      console.error('Error storing metric data:', error);
      return false;
    }
  }

  // Store multiple metrics data
  storeMetricsData(metricsData: Record<string, LiveMetricData>): boolean {
    if (!this.db) return false;

    try {
      const insert = this.db.prepare(`
        INSERT INTO metric_data (
          metric_id, value, formatted_value, date, change_value, 
          source, api_response_time_ms, is_fallback, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertMany = this.db.transaction((entries) => {
        for (const [metricName, data] of entries) {
          const metricId = this.getMetricId(metricName);
          if (metricId) {
            insert.run(
              metricId,
              data.value,
              data.formatted,
              data.date,
              data.change,
              data.source || 'Unknown',
              null, // No individual response time for batch
              data.isFallback || false,
              data.error || null
            );
          }
        }
      });

      insertMany(Object.entries(metricsData));
      return true;
    } catch (error) {
      console.error('Error storing metrics data:', error);
      return false;
    }
  }

  // Get latest metric data
  getLatestMetricData(metricName: string): LiveMetricData | null {
    if (!this.db) return null;

    try {
      const data = this.db.prepare(`
        SELECT md.*, m.name
        FROM metric_data md
        JOIN metrics m ON md.metric_id = m.id
        WHERE m.name = ?
        ORDER BY md.created_at DESC
        LIMIT 1
      `).get(metricName) as (MetricDataRecord & { name: string }) | undefined;

      if (!data) return null;

      return {
        value: data.value,
        formatted: data.formatted_value,
        date: data.date,
        change: data.change_value,
        lastUpdated: data.fetched_at,
        source: data.source,
        isFallback: data.is_fallback,
        error: data.error_message
      };
    } catch (error) {
      console.error('Error getting latest metric data:', error);
      return null;
    }
  }

  // Get all latest metrics data
  getAllLatestMetricsData(): Record<string, LiveMetricData> {
    if (!this.db) return {};

    try {
      const data = this.db.prepare(`
        SELECT m.name, md.*
        FROM metrics m
        LEFT JOIN metric_data md ON m.id = md.metric_id
        WHERE md.id = (
          SELECT MAX(id) 
          FROM metric_data 
          WHERE metric_id = m.id
        )
        OR md.id IS NULL
      `).all() as (MetricDataRecord & { name: string })[];

      const result: Record<string, LiveMetricData> = {};
      
      for (const row of data) {
        if (row.value !== undefined) { // Has data
          result[row.name] = {
            value: row.value,
            formatted: row.formatted_value,
            date: row.date,
            change: row.change_value,
            lastUpdated: row.fetched_at,
            source: row.source,
            isFallback: row.is_fallback,
            error: row.error_message
          };
        }
      }

      return result;
    } catch (error) {
      console.error('Error getting all latest metrics data:', error);
      return {};
    }
  }

  // Store data freshness information
  storeFreshnessData(metricName: string, freshness: DataFreshnessStatus): boolean {
    if (!this.db) return false;

    try {
      const metricId = this.getMetricId(metricName);
      if (!metricId) return false;

      const upsert = this.db.prepare(`
        INSERT INTO data_freshness (
          metric_id, last_successful_fetch, last_attempted_fetch, 
          staleness_hours, freshness_status, next_expected_update, consecutive_failures
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(metric_id) DO UPDATE SET
          last_successful_fetch = excluded.last_successful_fetch,
          last_attempted_fetch = excluded.last_attempted_fetch,
          staleness_hours = excluded.staleness_hours,
          freshness_status = excluded.freshness_status,
          next_expected_update = excluded.next_expected_update,
          consecutive_failures = excluded.consecutive_failures,
          updated_at = CURRENT_TIMESTAMP
      `);

      upsert.run(
        metricId,
        freshness.lastUpdated?.toISOString() || null,
        new Date().toISOString(),
        freshness.staleness,
        freshness.status,
        freshness.nextExpectedUpdate?.toISOString() || null,
        0 // TODO: Track consecutive failures
      );

      return true;
    } catch (error) {
      console.error('Error storing freshness data:', error);
      return false;
    }
  }

  // Clean up old data
  cleanup(): boolean {
    if (!this.db) return false;

    try {
      // Manual cleanup in case triggers don't work
      const statements = [
        "DELETE FROM metric_data WHERE created_at < datetime('now', '-30 days')",
        "DELETE FROM error_logs WHERE occurred_at < datetime('now', '-14 days')",
        "VACUUM" // Reclaim space
      ];

      for (const statement of statements) {
        this.db.exec(statement);
      }

      console.log('Database cleanup completed');
      return true;
    } catch (error) {
      console.error('Error during cleanup:', error);
      return false;
    }
  }

  // Get database statistics
  getStats() {
    if (!this.db) return null;

    try {
      const stats = {
        metrics: this.db.prepare('SELECT COUNT(*) as count FROM metrics').get() as { count: number },
        metricData: this.db.prepare('SELECT COUNT(*) as count FROM metric_data').get() as { count: number },
        dataFreshness: this.db.prepare('SELECT COUNT(*) as count FROM data_freshness').get() as { count: number },
        databaseSize: fs.statSync(DB_PATH).size,
        lastVacuum: this.db.prepare("SELECT datetime(last_vacuum, 'localtime') as last_vacuum FROM pragma_wal_checkpoint").get()
      };

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }

  // Check if storage is available
  isAvailable(): boolean {
    return this.isInitialized && this.db !== null;
  }
}

// Singleton instance
let sqliteStorage: SqliteStorage | null = null;

export function getSqliteStorage(): SqliteStorage {
  if (!sqliteStorage) {
    sqliteStorage = new SqliteStorage();
  }
  return sqliteStorage;
}

export { SqliteStorage };
export type { MetricRecord, MetricDataRecord, ApiHealthRecord, DataFreshnessRecord };