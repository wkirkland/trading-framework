'use client';

import { useSignalAnalysis } from '@/lib/hooks/useSignalAnalysis';

const thesisOptions = [
  {
    id: 'economic-transition',
    description: 'Economy transitioning from old to new paradigm',
    supportingFactors: ['GDP contraction', 'Structural shifts', 'Innovation acceleration'],
    contradictingFactors: ['Consumer resilience', 'Policy support', 'Market recovery']
  },
  {
    id: 'soft-landing',
    description: 'Growth slows without recession, inflation moderates',
    supportingFactors: ['Labor market strength', 'Consumer spending', 'Fed gradualism'],
    contradictingFactors: ['GDP contraction', 'Business investment decline', 'Credit tightening']
  },
  {
    id: 'mild-recession',
    description: 'Brief, shallow recession with quick recovery',
    supportingFactors: ['GDP decline', 'Business pessimism', 'Yield curve inversion'],
    contradictingFactors: ['Employment strength', 'Consumer confidence', 'Policy support']
  },
  {
    id: 'stagflation',
    description: 'Persistent inflation with weak economic growth',
    supportingFactors: ['Supply chain disruptions', 'Wage-price spiral', 'Energy costs'],
    contradictingFactors: ['Fed policy response', 'Demand destruction', 'Technology deflation']
  },
  {
    id: 'reflation',
    description: 'Economic recovery with rising inflation expectations',
    supportingFactors: ['Fiscal stimulus', 'Monetary accommodation', 'Commodity demand'],
    contradictingFactors: ['Central bank tightening', 'Debt constraints', 'Demographic headwinds']
  }
];

export default function SignalDashboard() {
  const {
    selectedThesis,
    setSelectedThesis,
    evidenceScores,
    keyMetrics,
    conflictAlerts,
    thresholdTriggers,
    loading,
    error,
    lastFetched,
    fetchData
  } = useSignalAnalysis();

  const getEvidenceBarStyle = (score: number) => {
    const percentage = Math.max(10, Math.min(90, 50 + (score * 20)));
    const color = score > 1 ? '#10b981' : score > 0 ? '#f59e0b' : score > -1 ? '#ef4444' : '#dc2626';
    return {
      width: `${percentage}%`,
      background: `linear-gradient(90deg, ${color}, ${color}dd)`,
      height: '100%',
      borderRadius: '0.75rem',
      transition: 'width 0.3s ease'
    };
  };

  const getSignalClass = (signal: string) => {
    switch (signal) {
      case 'confirm': return 'priority-high';
      case 'contradict': return 'priority-critical';
      case 'neutral': return 'priority-medium';
      default: return 'priority-low';
    }
  };

  const getImpactClass = (impact: string) => {
    switch (impact) {
      case 'high': return 'frequency-daily';
      case 'medium': return 'frequency-weekly';
      case 'low': return 'frequency-monthly';
      default: return 'frequency-quarterly';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f59e0b';
      case 'LOW': return '#3b82f6';
      default: return '#6b7280';
    }
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
          <h1>Signal Conflict Dashboard</h1>
          <p className="subtitle">Real-time tracking of reinforcing vs. contradicting macro signals</p>
          
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
                {loading ? 'Updating analysis...' : error ? 'Using cached data' : 'Live analysis active'}
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
              {loading ? 'Refreshing...' : 'Refresh Analysis'}
            </button>
          </div>
        </div>

        {/* Thesis Selector */}
        <div style={{ 
          background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
          color: 'white', 
          padding: '1.5rem', 
          borderRadius: '1rem', 
          marginBottom: '2rem',
          textAlign: 'center'
        }}>
          <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.5rem' }}>Current Market Thesis</h2>
          <select
            value={selectedThesis}
            onChange={(e) => setSelectedThesis(e.target.value)}
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '1.1rem',
              border: 'none',
              borderRadius: '0.5rem',
              background: 'white',
              minWidth: '300px',
              fontWeight: '600',
              color: '#1f2937'
            }}
          >
            {thesisOptions.map((thesis) => (
              <option key={thesis.id} value={thesis.id}>
                {thesis.description}
              </option>
            ))}
          </select>
          
          {/* Thesis Description */}
          <div style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.9 }}>
            {thesisOptions.find(t => t.id === selectedThesis)?.description}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
          {/* Weight of Evidence Panel */}
          <div style={{ 
            background: 'linear-gradient(135deg, #10b981, #059669)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '1rem' 
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}>
              Weight of Evidence
            </h3>
            
            {Object.entries(evidenceScores).map(([category, score]) => (
              category !== 'overall' && (
                <div key={category} style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{ width: '120px', fontWeight: '600', textTransform: 'capitalize' }}>
                    {category}
                  </div>
                  <div style={{ 
                    flex: 1, 
                    height: '25px', 
                    background: 'rgba(255,255,255,0.3)', 
                    borderRadius: '0.75rem', 
                    margin: '0 1rem', 
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <div style={getEvidenceBarStyle(score)}></div>
                  </div>
                  <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                    {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
                  </div>
                </div>
              )
            ))}
            
            <div style={{ 
              borderTop: '2px solid rgba(255,255,255,0.3)', 
              paddingTop: '1rem', 
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{ width: '120px', fontWeight: '600' }}>Overall</div>
              <div style={{ 
                flex: 1, 
                height: '25px', 
                background: 'rgba(255,255,255,0.3)', 
                borderRadius: '0.75rem', 
                margin: '0 1rem',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={getEvidenceBarStyle(evidenceScores.overall)}></div>
              </div>
              <div style={{ fontWeight: '700', fontSize: '1.1rem' }}>
                {evidenceScores.overall > 0 ? `+${evidenceScores.overall.toFixed(1)}` : evidenceScores.overall.toFixed(1)}
              </div>
            </div>
            
            {/* Data Quality Indicator */}
            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.8rem', 
              opacity: 0.8, 
              textAlign: 'center' 
            }}>
              Based on {keyMetrics.filter(m => m.value !== null).length} live economic indicators
            </div>
          </div>

          {/* Conflict Alerts Panel */}
          <div style={{ 
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '1rem' 
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}>
              Active Conflicts ({conflictAlerts.filter(a => a.isActive).length})
            </h3>
            
            {conflictAlerts.length > 0 ? (
              conflictAlerts.filter(alert => alert.isActive).map((alert, index) => (
                <div key={index} style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '1rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1rem',
                  borderLeft: `4px solid ${getSeverityColor(alert.severity)}`
                }}>
                  <div style={{ 
                    fontWeight: '700', 
                    marginBottom: '0.5rem', 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span>{alert.title}</span>
                    <span style={{ 
                      background: 'rgba(255,255,255,0.3)', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '1rem', 
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      {alert.severity}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{alert.description}</div>
                </div>
              ))
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '2rem', 
                opacity: 0.7 
              }}>
                <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✓</div>
                <div>No major conflicts detected</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  Economic indicators are aligned with current thesis
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Threshold Triggers */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {thresholdTriggers.map((trigger, index) => (
            <div key={index} style={{ 
              background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
              color: 'white', 
              padding: '1.5rem', 
              borderRadius: '1rem' 
            }}>
              <h4 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem' }}>
                {trigger.title}
              </h4>
              {trigger.conditions.map((condition, idx) => (
                <div key={idx} style={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '0.75rem',
                  fontSize: '0.9rem',
                  fontFamily: 'monospace'
                }}>
                  {condition}
                </div>
              ))}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                marginTop: '1rem' 
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ 
                    width: '15px', 
                    height: '15px', 
                    borderRadius: '50%', 
                    marginRight: '0.5rem',
                    background: trigger.statusColor
                  }}></div>
                  <span>{trigger.status}</span>
                </div>
                <span>{trigger.triggered}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Key Metrics Table */}
        <div className="table-container">
          <div style={{ background: 'linear-gradient(135deg, #1f2937, #111827)', color: 'white', padding: '1.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.5rem' }}>Key Metric Signal Mapping</h3>
            <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>
              Real-time analysis of {keyMetrics.length} key economic indicators
            </p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current Value</th>
                <th>Signal</th>
                <th>Thesis Alignment</th>
                <th>Impact Weight</th>
                <th>Recent Change</th>
                <th>Reasoning</th>
                <th>Next Update</th>
              </tr>
            </thead>
            <tbody>
              {keyMetrics.map((metric, index) => (
                <tr key={index}>
                  <td>
                    <strong>{metric.name}</strong>
                    {metric.value !== null && metric.value !== undefined && (
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                        ● Live Data
                      </div>
                    )}
                  </td>
                  <td>
                    {metric.value !== null && metric.value !== undefined ? (
                      <strong style={{ fontSize: '1.1rem' }}>
                        {typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value}
                        {metric.name.includes('Rate') || metric.name.includes('Unemployment') ? '%' : ''}
                      </strong>
                    ) : (
                      <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>No data</span>
                    )}
                  </td>
                  <td>
                    <span className={getSignalClass(metric.currentSignal)}>
                      {metric.currentSignal.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <strong style={{ 
                      color: metric.currentSignal === 'confirm' ? '#10b981' : 
                             metric.currentSignal === 'contradict' ? '#ef4444' : '#6b7280'
                    }}>
                      {metric.currentSignal === 'confirm' ? 'SUPPORTS' :
                       metric.currentSignal === 'contradict' ? 'CONTRADICTS' : 'NEUTRAL'}
                    </strong>
                  </td>
                  <td>
                    <span className={getImpactClass(metric.impact)} style={{ textTransform: 'uppercase' }}>
                      {metric.impact}
                    </span>
                  </td>
                  <td style={{ 
                    color: metric.change.includes('↑') ? '#10b981' : 
                           metric.change.includes('↓') ? '#ef4444' : '#6b7280',
                    fontWeight: '600'
                  }}>
                    {metric.change}
                  </td>
                  <td>
                    <div style={{ fontSize: '0.85rem', maxWidth: '200px' }}>
                      {metric.reasoning}
                    </div>
                  </td>
                  <td>{metric.nextUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#666' }}>
          <p style={{ fontSize: '0.9rem' }}>
            Analysis powered by live Federal Reserve economic data (FRED)
          </p>
          <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>
            Evidence scores calculated from {keyMetrics.filter(m => m.value !== null).length} real-time indicators
          </p>
        </div>
      </div>
    </div>
  );
}