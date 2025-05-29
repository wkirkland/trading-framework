'use client';

import { useState, useMemo } from 'react';
import { metricsData, type Metric } from '@/lib/data/metrics';

export function MetricsTable() {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [timingFilter, setTimingFilter] = useState<string>('all');
  const [frequencyFilter, setFrequencyFilter] = useState<string>('all');

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

  return (
    <div className="page-container">
      <div className="card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Module 1: Macro Environment Assessment</h1>
          <p className="subtitle">
            Comprehensive Economic, Political, Social & Environmental Metrics Dashboard
          </p>
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
                <th>Description</th>
                <th>Priority</th>
                <th>Frequency</th>
                <th>Timing</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {filteredMetrics.map((metric, index) => (
                <tr key={index} className={getCategoryClass(metric.category)}>
                  <td>
                    <strong style={{ textTransform: 'capitalize' }}>
                      {metric.category}
                    </strong>
                  </td>
                  <td>
                    <strong>{metric.name}</strong>
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
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
          <p>Showing {filteredMetrics.length} of {metricsData.length} metrics</p>
        </div>
      </div>
    </div>
  );
}