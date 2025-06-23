// components/monitoring/ApiHealthIndicator.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { apiHealthService, type ApiHealthData, type ApiHealthStatus } from '@/lib/services/apiHealthService';

interface ApiHealthIndicatorProps {
  showDetails?: boolean;
  compact?: boolean;
  className?: string;
}

export function ApiHealthIndicator({ 
  showDetails = false, 
  compact = false, 
  className = '' 
}: ApiHealthIndicatorProps) {
  const [healthData, setHealthData] = useState<ApiHealthData | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    // Get initial status
    setHealthData(apiHealthService.getHealthStatus());

    // Subscribe to updates
    const unsubscribe = apiHealthService.subscribe((data) => {
      setHealthData(data);
    });

    // Start monitoring if not already started
    apiHealthService.startMonitoring();

    return () => {
      unsubscribe();
    };
  }, []);

  if (!healthData) {
    return (
      <div className={`api-health-indicator loading ${className}`}>
        <div className="status-dot unknown"></div>
        <span className="status-text">Checking APIs...</span>
      </div>
    );
  }

  const getStatusIcon = (status: ApiHealthStatus['status']) => {
    switch (status) {
      case 'healthy':
        return '●';
      case 'degraded':
        return '⚠';
      case 'down':
        return '●';
      case 'unknown':
        return '?';
      default:
        return '?';
    }
  };

  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const formatResponseTime = (ms: number | null) => {
    if (ms === null) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  if (compact) {
    return (
      <div 
        className={`api-health-compact ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <div 
          className="overall-status-dot"
          style={{
            display: 'inline-block',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: apiHealthService.getStatusColor(
              healthData.overall === 'healthy' ? 'healthy' :
              healthData.overall === 'degraded' ? 'degraded' : 'down'
            ),
            marginRight: '6px'
          }}
        ></div>
        <span style={{ fontSize: '0.75rem', color: 'var(--on-surface-1-muted)' }}>
          APIs
        </span>

        {showTooltip && (
          <div 
            className="tooltip"
            style={{
              position: 'absolute',
              top: '100%',
              left: '0',
              zIndex: 1000,
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '8px',
              boxShadow: 'var(--shadow-default)',
              minWidth: '200px',
              fontSize: '0.75rem'
            }}
          >
            <div style={{ marginBottom: '4px', fontWeight: '600' }}>API Status</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <span style={{ color: apiHealthService.getStatusColor(healthData.fred.status), marginRight: '6px' }}>
                {getStatusIcon(healthData.fred.status)}
              </span>
              <span>FRED: {healthData.fred.status}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: apiHealthService.getStatusColor(healthData.alphaVantage.status), marginRight: '6px' }}>
                {getStatusIcon(healthData.alphaVantage.status)}
              </span>
              <span>Alpha Vantage: {healthData.alphaVantage.status}</span>
            </div>
            <div style={{ fontSize: '0.65rem', color: 'var(--on-surface-2-muted)', marginTop: '4px' }}>
              Last checked: {formatLastUpdate(healthData.lastUpdated)}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`api-health-indicator ${className}`}>
      {/* Overall Status Header */}
      <div className="health-header" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        marginBottom: showDetails ? '12px' : '0',
        fontSize: '0.875rem',
        fontWeight: '600'
      }}>
        <div 
          className="overall-status-dot"
          style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: apiHealthService.getStatusColor(
              healthData.overall === 'healthy' ? 'healthy' :
              healthData.overall === 'degraded' ? 'degraded' : 'down'
            ),
            marginRight: '8px'
          }}
        ></div>
        <span style={{ color: 'var(--on-surface-2)' }}>
          Data Sources: {apiHealthService.getStatusDescription(
            healthData.overall === 'healthy' ? 'healthy' :
            healthData.overall === 'degraded' ? 'degraded' : 'down'
          )}
        </span>
      </div>

      {showDetails && (
        <div className="api-details" style={{ fontSize: '0.75rem' }}>
          {/* FRED API Status */}
          <div className="api-item" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: 'var(--surface-3)',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                color: apiHealthService.getStatusColor(healthData.fred.status), 
                marginRight: '6px',
                fontSize: '0.8rem'
              }}>
                {getStatusIcon(healthData.fred.status)}
              </span>
              <span style={{ fontWeight: '500', color: 'var(--on-surface-2)' }}>
                {healthData.fred.name}
              </span>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--on-surface-2-muted)' }}>
              <div>{formatResponseTime(healthData.fred.responseTime)}</div>
              <div style={{ fontSize: '0.65rem' }}>
                {formatLastUpdate(healthData.fred.lastSuccessful)}
              </div>
            </div>
          </div>

          {/* Alpha Vantage API Status */}
          <div className="api-item" style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '8px',
            padding: '6px 8px',
            backgroundColor: 'var(--surface-3)',
            borderRadius: '4px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ 
                color: apiHealthService.getStatusColor(healthData.alphaVantage.status), 
                marginRight: '6px',
                fontSize: '0.8rem'
              }}>
                {getStatusIcon(healthData.alphaVantage.status)}
              </span>
              <span style={{ fontWeight: '500', color: 'var(--on-surface-2)' }}>
                {healthData.alphaVantage.name}
              </span>
            </div>
            <div style={{ textAlign: 'right', color: 'var(--on-surface-2-muted)' }}>
              <div>{formatResponseTime(healthData.alphaVantage.responseTime)}</div>
              <div style={{ fontSize: '0.65rem' }}>
                {formatLastUpdate(healthData.alphaVantage.lastSuccessful)}
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {(healthData.fred.errorMessage || healthData.alphaVantage.errorMessage) && (
            <div className="error-messages" style={{ 
              marginTop: '8px',
              padding: '6px 8px',
              backgroundColor: 'var(--status-negative-bg)',
              borderRadius: '4px',
              border: '1px solid var(--status-negative)',
            }}>
              {healthData.fred.errorMessage && (
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--status-negative-text)',
                  marginBottom: '2px'
                }}>
                  <strong>FRED:</strong> {healthData.fred.errorMessage}
                </div>
              )}
              {healthData.alphaVantage.errorMessage && (
                <div style={{ 
                  fontSize: '0.65rem', 
                  color: 'var(--status-negative-text)'
                }}>
                  <strong>Alpha Vantage:</strong> {healthData.alphaVantage.errorMessage}
                </div>
              )}
            </div>
          )}

          {/* Last Updated */}
          <div style={{ 
            marginTop: '8px',
            fontSize: '0.65rem',
            color: 'var(--on-surface-2-muted)',
            textAlign: 'center'
          }}>
            Last checked: {formatLastUpdate(healthData.lastUpdated)}
          </div>
        </div>
      )}
    </div>
  );
}

export default ApiHealthIndicator;