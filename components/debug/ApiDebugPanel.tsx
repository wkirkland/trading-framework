// components/debug/ApiDebugPanel.tsx

'use client';

import { useState } from 'react';

interface ApiDebugData {
  success: boolean;
  timestamp: string;
  tests?: any;
  cacheStats?: any;
  debug?: any;
  error?: string;
}

export function ApiDebugPanel() {
  const [debugData, setDebugData] = useState<ApiDebugData | null>(null);
  const [loading, setLoading] = useState(false);

  const runDebugTest = async () => {
    setLoading(true);
    try {
      // Test the debug endpoint
      const response = await fetch('/api/fred-data', { method: 'POST' });
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setDebugData({
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMainApi = async () => {
    setLoading(true);
    try {
      // Test the main API endpoint
      const response = await fetch('/api/fred-data');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      setDebugData({
        success: false,
        error: String(error),
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      background: 'white', 
      border: '2px solid #e5e7eb', 
      borderRadius: '8px', 
      padding: '16px', 
      maxWidth: '400px',
      maxHeight: '600px',
      overflow: 'auto',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      zIndex: 1000
    }}>
      <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 'bold' }}>
        🔍 API Debug Panel
      </h3>
      
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <button 
          onClick={runDebugTest}
          disabled={loading}
          style={{
            padding: '6px 12px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing...' : 'Run Debug Test'}
        </button>
        
        <button 
          onClick={fetchMainApi}
          disabled={loading}
          style={{
            padding: '6px 12px',
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '12px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Fetching...' : 'Test Main API'}
        </button>
      </div>

      {debugData && (
        <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
          <div style={{ marginBottom: '8px' }}>
            <strong>Status:</strong> {debugData.success ? '✅ Success' : '❌ Failed'}
          </div>
          
          <div style={{ marginBottom: '8px' }}>
            <strong>Time:</strong> {new Date(debugData.timestamp).toLocaleTimeString()}
          </div>

          {debugData.error && (
            <div style={{ marginBottom: '8px', color: '#ef4444' }}>
              <strong>Error:</strong> {debugData.error}
            </div>
          )}

          {debugData.debug && (
            <div style={{ marginBottom: '8px' }}>
              <strong>🔧 Debug Info:</strong>
              <div style={{ 
                background: '#f3f4f6', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontSize: '11px',
                fontFamily: 'monospace'
              }}>
                <div>FRED Status: {debugData.debug.fredStatus}</div>
                <div>Alpha Vantage Status: {debugData.debug.alphaVantageStatus}</div>
                <div>FRED Key: {debugData.debug.apiKeys?.fredPresent ? '✅' : '❌'}</div>
                <div>Alpha Key: {debugData.debug.apiKeys?.alphaVantagePresent ? '✅' : '❌'}</div>
                {debugData.debug.errors?.length > 0 && (
                  <div style={{ marginTop: '8px' }}>
                    <strong>Errors ({debugData.debug.errors.length}):</strong>
                    {debugData.debug.errors.map((error: string, idx: number) => (
                      <div key={idx} style={{ color: '#ef4444', marginLeft: '8px' }}>
                        • {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {debugData.tests && (
            <div style={{ marginBottom: '8px' }}>
              <strong>🧪 API Tests:</strong>
              <div style={{ 
                background: '#f3f4f6', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontSize: '11px'
              }}>
                <div>
                  <strong>FRED:</strong> {debugData.tests.fredTest?.success ? '✅' : '❌'}
                  {debugData.tests.fredTest?.result && (
                    <span> - {debugData.tests.fredTest.result.formatted}</span>
                  )}
                </div>
                <div>
                  <strong>Alpha Vantage:</strong> {debugData.tests.alphaVantageTest?.success ? '✅' : '❌'}
                  {debugData.tests.alphaVantageTest?.result && (
                    <span> - {debugData.tests.alphaVantageTest.result.formatted} ({debugData.tests.alphaVantageTest.result.source})</span>
                  )}
                </div>
                
                {debugData.tests.environmentTest && (
                  <div style={{ marginTop: '4px' }}>
                    <strong>Environment:</strong>
                    <div>FRED Key: {debugData.tests.environmentTest.fredKey}</div>
                    <div>Alpha Key: {debugData.tests.environmentTest.alphaKey}</div>
                    <div>Node Env: {debugData.tests.environmentTest.nodeEnv}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {debugData.cacheStats && (
            <div style={{ marginBottom: '8px' }}>
              <strong>💾 Cache Stats:</strong>
              <div style={{ 
                background: '#f3f4f6', 
                padding: '8px', 
                borderRadius: '4px', 
                marginTop: '4px',
                fontSize: '11px'
              }}>
                <div>FRED Cache: {debugData.cacheStats.fred?.size || 0} items</div>
                <div>Market Cache: {debugData.cacheStats.market?.size || 0} items</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}