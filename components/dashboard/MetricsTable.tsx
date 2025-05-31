'use client';

import { useState, useMemo } from 'react';
import { metricsData } from '@/lib/data/metrics';
import { useLiveData } from '@/lib/context/DataContext'; 

export function MetricsTable() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [timingFilter, setTimingFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');

  const { loading, error, lastFetched, fetchData, getLiveValue, getChangeIndicator, getChangeColor } = useLiveData();

  const filteredMetrics = useMemo(() => {
    return metricsData.filter(metric => {
      return (categoryFilter === 'all' || metric.category === categoryFilter) &&
             (priorityFilter === 'all' || metric.priority === priorityFilter) &&
             (timingFilter === 'all' || metric.timing === timingFilter) &&
             (frequencyFilter === 'all' || metric.frequency === frequencyFilter);
    });
  }, [categoryFilter, priorityFilter, timingFilter, frequencyFilter]);

  const stats = useMemo(() => {
    return {
      total: filteredMetrics.length,
      critical: filteredMetrics.filter(m => m.priority === 'critical').length,
      leading: filteredMetrics.filter(m => m.timing === 'leading').length,
      daily: filteredMetrics.filter(m => m.frequency === 'daily').length,
    };
  }, [filteredMetrics]);

  const getPriorityClass = (priority: string) => {
    return `priority-${priority}`;
  };

  const getTimingClass = (timing: string) => {
    return `timing-${timing}`;
  };

  const getFrequencyClass = (frequency: string) => {
    return `frequency-${frequency}`;
  };

  const getCategoryClass = (category: string) => {
    return `category-${category}`;
  };

  const formatLastUpdated = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="page-container">
      <div className="card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Module 1: Macro Environment Assessment</h1>
          <p className="subtitle">
            Comprehensive Economic, Political, Social & Environmental Metrics Dashboard
          </p>
          
          {/* Live Data Status */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1rem',
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: '#6b7280'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%',
                background: loading ? '#f59e0b' : error ? '#ef4444' : '#10b981'
              }}></div>
              <span>
                {loading ? 'Updating...' : error ? 'Using cached data' : 'Live data active'}
              </span>
            </div>
            
            {lastFetched && (
              <span>Last updated: {formatLastUpdated(lastFetched)}</span>
            )}
            
            <button 
              onClick={fetchData}
              disabled={loading}
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: loading ? '#9ca3af' : '#374151'
              }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Total Metrics</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.critical}</div>
            <div className="stat-label">Critical Priority</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.leading}</div>
            <div className="stat-label">Leading Indicators</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.daily}</div>
            <div className="stat-label">Daily Updates</div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters">
          <div className="filter-group">
            <label className="filter-label">Filter by Category</label>
            <select 
              value={categoryFilter} 
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="economic">Economic</option>
              <option value="political">Political</option>
              <option value="social">Social/Demographic</option>
              <option value="environmental">Environmental</option>
              <option value="composite">Composite</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Priority</label>
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Filter by Timing</label>
            <select 
              value={timingFilter} 
              onChange={(e) => setTimingFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="leading">Leading</option>
              <option value="coincident">Coincident</option>
              <option value="lagging">Lagging</option>
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Update Frequency</label>
            <select 
              value={frequencyFilter} 
              onChange={(e) => setFrequencyFilter(e.target.value)}
            >
              <option value="all">All Frequencies</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Metric Name</th>
                <th>Current Value</th>
                <th>Change</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Frequency</th>
                <th>Timing</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric, index) => {
                const liveValue = getLiveValue(metric.name);
                const hasLiveData = liveValue && liveValue.value !== null;
                
                return (
                  <tr key={index} className={getCategoryClass(metric.category)}>
                    <td>
                      <strong style={{ textTransform: 'capitalize' }}>
                        {metric.category}
                      </strong>
                    </td>
                    <td>
                      <strong>{metric.name}</strong>
                      {hasLiveData && (
                        <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                          ● Live Data
                        </div>
                      )}
                    </td>
                    <td>
                      {hasLiveData ? (
                        <div>
                          <strong style={{ fontSize: '1.1rem' }}>
                            {liveValue.formatted}
                          </strong>
                          <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                            as of {new Date(liveValue.date).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                          Static data
                        </span>
                      )}
                    </td>
                    <td>
                      {hasLiveData && liveValue.change !== undefined ? (
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.25rem',
                          color: getChangeColor(metric.name),
                          fontWeight: '600'
                        }}>
                          <span style={{ fontSize: '1.2rem' }}>
                            {getChangeIndicator(metric.name)}
                          </span>
                          <span>
                            {Math.abs(liveValue.change).toFixed(2)}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>—</span>
                      )}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.9rem', lineHeight: '1.4', maxWidth: '300px' }}>
                        {metric.description}
                      </div>
                    </td>
                    <td>
                      <span className={getPriorityClass(metric.priority)}>
                        {metric.priority.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={getFrequencyClass(metric.frequency)} style={{ textTransform: 'capitalize' }}>
                        {metric.frequency}
                      </span>
                    </td>
                    <td>
                      <span className={getTimingClass(metric.timing)} style={{ textTransform: 'capitalize' }}>
                        {metric.timing}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#666' }}>{metric.source}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
          <p>Showing {filteredMetrics.length} of {metricsData.length} metrics</p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Live economic data powered by FRED (Federal Reserve Economic Data)
          </p>
        </div>
      </div>
    </div>
  );
}