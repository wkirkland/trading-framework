'use client';

import { useState } from 'react';

import { GaugeChart } from '@/components/charts/GaugeChart';
import { MetricGrid } from '@/components/metrics/MetricGrid';
import { MetricTable } from '@/components/metrics/MetricTable';
import type { MetricCardData } from '@/components/metrics/MetricCard';
import { useSignalAnalysis } from '@/lib/hooks/useSignalAnalysis';

const thesisOptions = [
  {
    id: 'strong-growth-stable-inflation',
    description: 'Strong economic growth with stable inflation near target',
    supportingFactors: ['GDP growth 2.5-4%', 'Inflation 2-3%', 'Low unemployment', 'Positive sentiment'],
    contradictingFactors: ['Economic contraction', 'High inflation', 'Labor market weakness']
  },
  {
    id: 'moderate-growth-with-headwinds',
    description: 'Moderate growth facing various economic challenges',
    supportingFactors: ['Steady but slow growth', 'Manageable inflation', 'Resilient consumers'],
    contradictingFactors: ['Supply chain issues', 'Geopolitical tensions', 'Monetary tightening']
  },
  {
    id: 'recessionary-conditions',
    description: 'Economic contraction with declining activity',
    supportingFactors: ['GDP decline', 'Rising unemployment', 'Business pessimism', 'Credit tightening'],
    contradictingFactors: ['Policy support', 'Consumer resilience', 'Market stability']
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

  // View toggle state
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');


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

  // Transform keyMetrics to MetricCardData format
  const metricCardsData: MetricCardData[] = keyMetrics.map((metric) => ({
    name: metric.name,
    value: metric.value,
    signal: metric.currentSignal,
    impact: metric.impact,
    change: metric.change,
    reasoning: metric.reasoning,
    nextUpdate: metric.nextUpdate,
    category: 'economic', // Default category for now
    isLive: metric.value !== null && metric.value !== undefined,
    // Generate sample sparkline data (in real implementation, this would come from historical data)
    sparklineData: Array.from({ length: 7 }, () => 
      metric.value !== null ? metric.value + (Math.random() - 0.5) * (metric.value * 0.1) : 0
    )
  }));

  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <div className="card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Signal Conflict Dashboard</h1>
          <p className="subtitle">Real-time tracking of reinforcing vs. contradicting macro signals</p>
          
          {/* Live Data Status with ARIA live region */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '1rem',
            marginTop: '1rem',
            fontSize: '0.9rem',
            color: '#374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%',
                background: loading ? '#f59e0b' : error ? '#ef4444' : '#10b981'
              }}></div>
              <span 
                aria-live="polite"
                aria-atomic="true"
                id="analysis-status"
              >
                {loading ? 'Updating analysis...' : error ? 'Using cached data' : 'Live analysis active'}
              </span>
            </div>
            
            {lastFetched && (
              <span 
                aria-live="polite"
                aria-atomic="true"
                id="last-updated-status"
              >
                Last updated: {formatLastUpdated(lastFetched)}
              </span>
            )}
            
            <button 
              onClick={fetchData}
              disabled={loading}
              aria-describedby="analysis-status"
              style={{
                background: 'none',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                padding: '0.25rem 0.75rem',
                fontSize: '0.8rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                color: loading ? '#6b7280' : '#1f2937'
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
            className="bg-surface-2 text-on-surface-2 border border-border-subtle"
            style={{
              padding: '0.75rem 1.25rem',
              fontSize: '1.1rem',
              borderRadius: '0.5rem',
              minWidth: '300px',
              fontWeight: '600'
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

        {/* View Toggle Controls */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'var(--color-surface-secondary)',
            border: '1px solid var(--color-neutral-200)',
            borderRadius: 'var(--radius-full)',
            padding: 'var(--spacing-1)',
            display: 'flex',
            gap: 'var(--spacing-1)'
          }}>
            <button
              onClick={() => setViewMode('cards')}
              className="view-toggle-button"
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: viewMode === 'cards' ? 'var(--color-primary-500)' : 'transparent',
                color: viewMode === 'cards' ? 'white' : 'var(--color-neutral-900)',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14-7H5m14 14H5" />
              </svg>
              Cards View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className="view-toggle-button"
              style={{
                padding: 'var(--spacing-2) var(--spacing-4)',
                borderRadius: 'var(--radius-full)',
                border: 'none',
                background: viewMode === 'table' ? 'var(--color-primary-500)' : 'transparent',
                color: viewMode === 'table' ? 'white' : 'var(--color-neutral-900)',
                fontWeight: 'var(--font-weight-medium)',
                fontSize: 'var(--font-size-sm)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-2)'
              }}
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18m-7 8h7" />
              </svg>
              Table View
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="row" style={{ marginBottom: '2rem' }}>
          {/* Weight of Evidence Gauge */}
          <div className="col-12 col-lg-6">
            <div className="gauge-card">
              <GaugeChart
                value={evidenceScores.overall * 10} // Scale from -10 to +10 range to -100 to +100
                size={280}
                title="Weight of Evidence"
                subtitle={`Based on ${keyMetrics.filter(m => m.value !== null).length} live economic indicators`}
                showValue={true}
                showLabels={true}
                colorScheme="trading"
              />
              
              {/* Breakdown by category */}
              <div style={{ 
                marginTop: 'var(--spacing-4)',
                padding: 'var(--spacing-4)',
                background: 'var(--color-surface-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--color-neutral-200)'
              }}>
                <h4 style={{ 
                  margin: '0 0 var(--spacing-3) 0',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-neutral-900)',
                  textAlign: 'center'
                }}>
                  Category Breakdown
                </h4>
                
                {Object.entries(evidenceScores).map(([category, score]) => (
                  category !== 'overall' && (
                    <div key={category} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      marginBottom: 'var(--spacing-2)',
                      padding: 'var(--spacing-2)',
                      borderRadius: 'var(--radius-md)',
                      background: score > 0 ? 'var(--status-confirm-bg)' : 
                                 score < 0 ? 'var(--status-contradict-bg)' : 
                                 'var(--status-neutral-bg)'
                    }}>
                      <div style={{ 
                        fontWeight: 'var(--font-weight-medium)',
                        textTransform: 'capitalize',
                        fontSize: 'var(--font-size-sm)',
                        color: score > 0 ? 'var(--status-confirm-text)' :
                               score < 0 ? 'var(--status-contradict-text)' :
                               'var(--status-neutral-text)'
                      }}>
                        {category}
                      </div>
                      <div style={{ 
                        fontWeight: 'var(--font-weight-bold)',
                        fontSize: 'var(--font-size-sm)',
                        color: score > 0 ? 'var(--status-confirm-text)' :
                               score < 0 ? 'var(--status-contradict-text)' :
                               'var(--status-neutral-text)'
                      }}>
                        {score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1)}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Conflict Alerts Panel */}
          <div className="col-12 col-lg-6">
            <div style={{ 
              background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
              color: 'white', 
              padding: '1.5rem', 
              borderRadius: '1rem',
              height: '100%'
            }}>
            <h3 
              style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}
              aria-live="polite"
              aria-atomic="true"
              id="conflict-count"
            >
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
        </div>

        {/* Threshold Triggers */}
        <div className="row" style={{ marginBottom: '2rem' }}>
          {thresholdTriggers.map((trigger, index) => (
            <div key={index} className="col-12 col-md-4 col-lg-4">
              <div style={{ 
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                color: 'white', 
                padding: '1.5rem', 
                borderRadius: '1rem',
                height: '100%'
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
            </div>
          ))}
        </div>

        {/* Key Metrics - Conditional View */}
        {viewMode === 'cards' ? (
          <MetricGrid
            title="Key Economic Indicators"
            subtitle={`Real-time analysis of ${keyMetrics.length} economic signals`}
            metrics={metricCardsData}
            layout="normal"
            cardSize="md"
            showSparklines={true}
            loading={loading}
            error={error ? `Analysis error: ${error}` : undefined}
            onCardClick={(metric) => {
              console.log('Metric clicked:', metric.name);
              // In a real app, this could open a detailed modal or navigate to metric details
            }}
          />
        ) : (
          <MetricTable
            title="Key Economic Indicators"
            subtitle={`Detailed analysis of ${keyMetrics.length} economic signals with sortable columns`}
            metrics={keyMetrics}
            loading={loading}
            error={error ? `Analysis error: ${error}` : undefined}
            onRowClick={(metric) => {
              console.log('Table row clicked:', metric.name);
              // In a real app, this could open a detailed modal or navigate to metric details
            }}
          />
        )}

        {/* Footer with live data count */}
        <div style={{ textAlign: 'center', marginTop: '2rem', color: '#374151' }}>
          <p style={{ fontSize: '0.9rem' }}>
            Analysis powered by live Federal Reserve economic data (FRED)
          </p>
          <p 
            style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}
            aria-live="polite"
            aria-atomic="true"
            id="metrics-count"
          >
            Evidence scores calculated from {keyMetrics.filter(m => m.value !== null).length} real-time indicators
          </p>
        </div>
          </div>
        </div>
      </div>
    </div>
  );
}