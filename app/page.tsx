import Link from 'next/link';

export default function Home() {
  return (
    <div className="page-container">
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem' }}>
            Trading Framework
          </h1>
          <p style={{ fontSize: '1.3rem', color: '#6b7280', marginBottom: '2rem', maxWidth: '800px', margin: '0 auto 2rem auto' }}>
            A systematic, nine-module approach to market analysis that eliminates emotional decision-making 
            and transforms trading into a disciplined, repeatable process.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/module1" className="btn btn-primary">
              Explore Module 1
            </Link>
            <Link href="/signal-dashboard" className="btn btn-secondary">
              Signal Dashboard
            </Link>
          </div>
        </div>

        {/* Framework Overview */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          <div>
            <h2>The Framework</h2>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '1.5rem' }}>
              Our systematic approach combines multiple analytical dimensions to create robust investment decisions. 
              Each module builds upon the previous, ensuring comprehensive analysis before any trade execution.
            </p>
            <ul style={{ listStyle: 'none', padding: 0, fontSize: '1rem', color: '#6b7280' }}>
              <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%', marginRight: '0.75rem' }}></div>
                Macro Environment Assessment
              </li>
              <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '50%', marginRight: '0.75rem' }}></div>
                Market Regime Identification
              </li>
              <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', marginRight: '0.75rem' }}></div>
                Sentiment & Positioning Analysis
              </li>
              <li style={{ display: 'flex', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', marginRight: '0.75rem' }}></div>
                And 6 additional systematic modules...
              </li>
            </ul>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Key Benefits</h3>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6b7280' }}>
                <li style={{ marginBottom: '0.5rem' }}>• Eliminates emotional decision-making</li>
                <li style={{ marginBottom: '0.5rem' }}>• Provides systematic risk management</li>
                <li style={{ marginBottom: '0.5rem' }}>• Creates repeatable, measurable results</li>
                <li style={{ marginBottom: '0.5rem' }}>• Adapts to changing market conditions</li>
              </ul>
            </div>

            <div className="card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Current Status</h3>
              <ul style={{ listStyle: 'none', padding: 0, color: '#6b7280' }}>
                <li style={{ marginBottom: '0.5rem' }}>• Module 1: Comprehensive metrics dashboard</li>
                <li style={{ marginBottom: '0.5rem' }}>• Signal conflict detection system</li>
                <li style={{ marginBottom: '0.5rem' }}>• Real-time thesis alignment tracking</li>
                <li style={{ marginBottom: '0.5rem' }}>• Performance attribution framework</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
          <Link href="/module1" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '2rem', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '1rem' 
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>1</span>
                </div>
                <h3>Module 1</h3>
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.75rem' }}>
                Macro Environment Assessment
              </h4>
              <p style={{ marginBottom: '1rem' }}>
                Comprehensive tracking of 100+ economic, political, social, and environmental metrics 
                with interactive filtering and real-time analysis.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', color: '#3b82f6', fontWeight: '500' }}>
                Explore Dashboard
                <span style={{ marginLeft: '0.5rem' }}>→</span>
              </div>
            </div>
          </Link>

          <Link href="/signal-dashboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="card" style={{ padding: '2rem', transition: 'all 0.2s', cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ 
                  width: '3rem', 
                  height: '3rem', 
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', 
                  borderRadius: '0.5rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  marginRight: '1rem' 
                }}>
                  <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>⚡</span>
                </div>
                <h3>Signal Dashboard</h3>
              </div>
              <h4 style={{ fontSize: '1.3rem', fontWeight: '500', color: '#1f2937', marginBottom: '0.75rem' }}>
                Conflict Analysis System
              </h4>
              <p style={{ marginBottom: '1rem' }}>
                Real-time tracking of reinforcing vs. contradicting signals with thesis alignment 
                analysis and threshold-based trigger alerts.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', color: '#8b5cf6', fontWeight: '500' }}>
                View Conflicts
                <span style={{ marginLeft: '0.5rem' }}>→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ color: '#6b7280' }}>
            Built with systematic precision for disciplined trading decisions
          </p>
        </div>
      </div>
    </div>
  );
}