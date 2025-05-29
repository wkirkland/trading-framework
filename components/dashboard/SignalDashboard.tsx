'use client';

import { useState, useMemo } from 'react';

interface SignalData {
  name: string;
  currentSignal: 'confirm' | 'contradict' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  change: string;
  nextUpdate: string;
}

interface ThesisData {
  id: string;
  description: string;
  supportingFactors: string[];
  contradictingFactors: string[];
}

interface EvidenceScores {
  economic: number;
  political: number;
  social: number;
  environmental: number;
  overall: number;
}

const thesisOptions: ThesisData[] = [
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

const keyMetrics: SignalData[] = [
  { name: 'Real GDP Growth', currentSignal: 'contradict', impact: 'high', change: '↓ -0.3%', nextUpdate: 'Jun 27' },
  { name: 'Core PCE Inflation', currentSignal: 'confirm', impact: 'high', change: '↓ 2.8%', nextUpdate: 'May 31' },
  { name: 'Unemployment Rate', currentSignal: 'contradict', impact: 'high', change: '→ 3.9%', nextUpdate: 'Jun 7' },
  { name: 'Fed Funds Rate', currentSignal: 'confirm', impact: 'high', change: '→ 4.5%', nextUpdate: 'Jun 12' },
  { name: 'Consumer Confidence', currentSignal: 'contradict', impact: 'medium', change: '↑ 102.3', nextUpdate: 'May 28' },
  { name: 'Manufacturing PMI', currentSignal: 'confirm', impact: 'medium', change: '↓ 48.7', nextUpdate: 'Jun 3' },
  { name: 'Credit Spreads (IG)', currentSignal: 'neutral', impact: 'medium', change: '↓ 145bps', nextUpdate: 'Daily' },
  { name: 'VIX Index', currentSignal: 'contradict', impact: 'medium', change: '↓ 17.8', nextUpdate: 'Daily' },
  { name: 'Initial Claims', currentSignal: 'confirm', impact: 'medium', change: '↑ 219k', nextUpdate: 'Jun 1' },
  { name: 'Housing Starts', currentSignal: 'confirm', impact: 'low', change: '↓ 1.36M', nextUpdate: 'Jun 18' }
];

export default function SignalDashboard() {
  const [selectedThesis, setSelectedThesis] = useState<string>('economic-transition');

  const evidenceScores = useMemo(() => {
    const scores: { [key: string]: EvidenceScores } = {
      'economic-transition': { economic: -2.1, political: -0.8, social: 1.3, environmental: 0.0, overall: -0.4 },
      'soft-landing': { economic: 0.5, political: 0.2, social: 1.8, environmental: 0.3, overall: 0.7 },
      'mild-recession': { economic: -1.8, political: -1.2, social: -0.5, environmental: -0.2, overall: -0.9 },
      'stagflation': { economic: -1.5, political: -2.0, social: -0.8, environmental: -1.2, overall: -1.4 },
      'reflation': { economic: 1.2, political: 0.8, social: 0.5, environmental: 0.2, overall: 0.7 }
    };
    return scores[selectedThesis] || scores['economic-transition'];
  }, [selectedThesis]);

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

  const conflictAlerts = [
    {
      title: 'Consumer vs. Business Divergence',
      severity: 'HIGH',
      description: 'Consumer confidence rising while business investment declining - historically unsustainable'
    },
    {
      title: 'Credit vs. Equity Markets',
      severity: 'MEDIUM',
      description: 'Credit spreads tightening while equity volatility elevated - mixed risk appetite signals'
    },
    {
      title: 'Fed Policy vs. Inflation Data',
      severity: 'MEDIUM',
      description: 'Fed dovish signals contradict persistent core inflation above target'
    },
    {
      title: 'Labor Market Strength vs. GDP',
      severity: 'LOW',
      description: 'Employment metrics strong despite GDP contraction - productivity or data lag'
    }
  ];

  const thresholdTriggers = [
    {
      title: 'Thesis Reversal Triggers',
      conditions: [
        '3+ consecutive months of positive GDP growth',
        'Unemployment rate drops below 3.5%',
        'Core inflation falls below 2.5%'
      ],
      status: 'Safe Zone',
      triggered: '0 of 3 triggered',
      statusColor: '#10b981'
    },
    {
      title: 'Thesis Acceleration Triggers',
      conditions: [
        'GDP contraction exceeds -1.0% annualized',
        'Credit spreads widen >200bps',
        'Fed emergency rate cut'
      ],
      status: 'Monitor Zone',
      triggered: '1 of 3 triggered',
      statusColor: '#f59e0b'
    },
    {
      title: 'External Shock Triggers',
      conditions: [
        'Major geopolitical crisis',
        'Financial system stress (banks, credit)',
        'Commodity price shock >30%'
      ],
      status: 'Safe Zone',
      triggered: '0 of 3 triggered',
      statusColor: '#10b981'
    }
  ];

  return (
    <div className="page-container">
      <div className="card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Signal Conflict Dashboard</h1>
          <p className="subtitle">Real-time tracking of reinforcing vs. contradicting macro signals</p>
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
          </div>

          {/* Conflict Alerts Panel */}
          <div style={{ 
            background: 'linear-gradient(135deg, #ef4444, #dc2626)', 
            color: 'white', 
            padding: '1.5rem', 
            borderRadius: '1rem' 
          }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1.5rem', textAlign: 'center' }}>
              Active Conflicts
            </h3>
            
            {conflictAlerts.map((alert, index) => (
              <div key={index} style={{ 
                background: 'rgba(255,255,255,0.2)', 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1rem',
                borderLeft: '4px solid #fff'
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
                    font: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {alert.severity}
                  </span>
                </div>
                <div style={{ fontSize: '0.9rem' }}>{alert.description}</div>
              </div>
            ))}
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
                  fontSize: '0.9rem'
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
          </div>
          <table>
            <thead>
              <tr>
                <th>Metric</th>
                <th>Current Signal</th>
                <th>Thesis Alignment</th>
                <th>Impact Weight</th>
                <th>Recent Change</th>
                <th>Next Update</th>
              </tr>
            </thead>
            <tbody>
              {keyMetrics.map((metric, index) => (
                <tr key={index}>
                  <td><strong>{metric.name}</strong></td>
                  <td>
                    <span className={getSignalClass(metric.currentSignal)}>
                      {metric.currentSignal.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    {metric.currentSignal === 'confirm' ? 'SUPPORTS' :
                     metric.currentSignal === 'contradict' ? 'CONTRADICTS' : 'NEUTRAL'}
                  </td>
                  <td>
                    <span className={getImpactClass(metric.impact)} style={{ textTransform: 'uppercase' }}>
                      {metric.impact}
                    </span>
                  </td>
                  <td>{metric.change}</td>
                  <td>{metric.nextUpdate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}