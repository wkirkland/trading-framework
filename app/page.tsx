// app/page.tsx (your home page with debug panel added)

import { ApiDebugPanel } from '@/components/debug/ApiDebugPanel';

export default function HomePage() {
  return (
    <div className="page-container">
      <div className="card">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1>Trading Framework</h1>
          <p className="subtitle">
            Systematic Market Analysis & Signal Detection Platform
          </p>
        </div>

        {/* Overview Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">9</div>
            <div className="stat-label">Analysis Modules</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">100+</div>
            <div className="stat-label">Economic Indicators</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">4</div>
            <div className="stat-label">Market Indicators</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">Real-time</div>
            <div className="stat-label">Live Data Feeds</div>
          </div>
        </div>

        {/* Framework Overview */}
        <div style={{ marginBottom: '2rem' }}>
          <h2>Framework Modules</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', 
              color: 'white', 
              padding: '1.5rem', 
              borderRadius: '1rem' 
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Module 1: Macro Environment</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                Comprehensive economic, political, social & environmental metrics assessment
              </p>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #10b981, #059669)', 
              color: 'white', 
              padding: '1.5rem', 
              borderRadius: '1rem' 
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>Signal Dashboard</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                Real-time conflict detection and thesis validation with live economic data
              </p>
            </div>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)', 
              color: 'white', 
              padding: '1.5rem', 
              borderRadius: '1rem' 
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem' }}>🔥 Enhanced Dashboard</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.9 }}>
                Advanced analysis combining economic data with real-time market indicators
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="/module1" className="btn btn-primary">
            Explore Module 1
          </a>
          <a href="/signal-dashboard" className="btn btn-secondary">
            View Signal Dashboard
          </a>
          <a href="/enhanced-dashboard" className="btn btn-primary">
            🔥 Enhanced Dashboard
          </a>
        </div>

        {/* Project Description */}
        <div style={{ marginTop: '3rem', padding: '2rem', background: '#f8fafc', borderRadius: '1rem' }}>
          <h3>About This Framework</h3>
          <p>
            This systematic trading framework transforms market analysis from art to science through a 
            structured nine-module approach. Each module builds upon previous insights to create 
            comprehensive, data-driven investment decisions.
          </p>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginTop: '1.5rem' }}>
            <div>
              <h4 style={{ color: '#3b82f6', marginBottom: '0.5rem' }}>📊 Live Data Integration</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Real-time feeds from FRED Economic Data and Alpha Vantage market data
              </p>
            </div>
            <div>
              <h4 style={{ color: '#10b981', marginBottom: '0.5rem' }}>🎯 Signal Conflict Detection</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Automated detection of contradictions between economic and market signals
              </p>
            </div>
            <div>
              <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>⚖️ Evidence-Based Scoring</h4>
              <p style={{ fontSize: '0.9rem', margin: 0 }}>
                Quantitative scoring across multiple dimensions for systematic decision-making
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Panel - Add this for debugging */}
      <ApiDebugPanel />
    </div>
  );
}