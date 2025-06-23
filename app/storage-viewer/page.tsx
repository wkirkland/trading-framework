// app/storage-viewer/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

import { ErrorBoundary } from '@/components/error/ErrorBoundary';

interface StorageData {
  metrics: any[];
  metricData: any[];
  freshness: any[];
  apiHealth: any[];
  cache: any[];
  stats: any;
}

interface TabProps {
  label: string;
  count: number;
  isActive: boolean;
  onClick: () => void;
}

function Tab({ label, count, isActive, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        isActive
          ? 'bg-blue-500 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function JsonViewer({ data, title }: { data: any; title: string }) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
      <div 
        className="p-4 bg-gray-50 dark:bg-gray-800 cursor-pointer border-b border-gray-200 dark:border-gray-700"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center justify-between">
          {title}
          <span className="text-sm text-gray-500">
            {expanded ? '▼' : '▶'} {Array.isArray(data) ? `${data.length} items` : typeof data === 'object' ? `${Object.keys(data).length} keys` : ''}
          </span>
        </h3>
      </div>
      {expanded && (
        <div className="p-4">
          <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function StorageViewerContent() {
  const [data, setData] = useState<StorageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('stats');
  const [storageAvailable, setStorageAvailable] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch storage data from API
        const response = await fetch('/api/storage?section=all');
        const result = await response.json();

        if (!result.success) {
          setError(result.error || 'Failed to load storage data');
          return;
        }

        setStorageAvailable(result.data.stats?.isAvailable || false);
        setData(result.data);

      } catch (err) {
        console.error('Error loading storage data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const refreshData = () => {
    setData(null);
    setLoading(true);
    setError(null);
    // Trigger useEffect to reload
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-4 text-gray-600 dark:text-gray-400">Loading storage data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Storage Error</h3>
            <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={refreshData}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-500 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No storage data available</p>
      </div>
    );
  }

  const tabs = [
    { key: 'stats', label: 'Statistics', count: data.stats ? 1 : 0 },
    { key: 'metricData', label: 'Metric Data', count: data.metricData.length },
    { key: 'metrics', label: 'Metrics Config', count: data.metrics.length },
    { key: 'freshness', label: 'Freshness', count: data.freshness.length },
    { key: 'apiHealth', label: 'API Health', count: data.apiHealth.length },
    { key: 'cache', label: 'Cache', count: data.cache.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Storage Database Viewer</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View cached data and storage statistics
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${storageAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {storageAvailable ? 'Storage Active' : 'Storage Unavailable'}
            </span>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            label={tab.label}
            count={tab.count}
            isActive={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
          />
        ))}
      </div>

      {/* Content */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {activeTab === 'stats' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Storage Statistics</h2>
            {data.stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {data.stats.totalDataPoints || 0}
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">Total Data Points</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {data.stats.cachedMetrics || 0}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">Cached Metrics</div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {data.stats.cacheHitRate ? `${data.stats.cacheHitRate.toFixed(1)}%` : '0%'}
                  </div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">Cache Hit Rate</div>
                </div>
                <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {data.stats.storageSize ? `${(data.stats.storageSize / 1024).toFixed(1)} KB` : '0 KB'}
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">Storage Size</div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {data.stats.lastCleanup ? 'Yes' : 'No'}
                  </div>
                  <div className="text-sm text-gray-700 dark:text-gray-300">Cleanup Ran</div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
            )}
            
            {data.stats?.sampleMetricData && (
              <div className="mt-6">
                <JsonViewer data={data.stats.sampleMetricData} title="Sample Cached Metrics" />
              </div>
            )}
          </div>
        )}

        {activeTab === 'metricData' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Metric Data</h2>
            {data.metricData.length > 0 ? (
              <div className="space-y-4">
                {data.metricData.slice(0, 20).map((item, index) => (
                  <JsonViewer key={index} data={item} title={`${item.metricName} - ${item.formatted || item.value}`} />
                ))}
                {data.metricData.length > 20 && (
                  <p className="text-gray-500 dark:text-gray-400 text-center">
                    ... and {data.metricData.length - 20} more items
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No metric data available</p>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Metrics Configuration</h2>
            {data.metrics.length > 0 ? (
              <div className="space-y-4">
                {data.metrics.map((item, index) => (
                  <JsonViewer key={index} data={item} title={item.name || `Metric ${index + 1}`} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No metrics configuration available</p>
            )}
          </div>
        )}

        {activeTab === 'freshness' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Data Freshness</h2>
            {data.freshness.length > 0 ? (
              <div className="space-y-4">
                {data.freshness.map((item, index) => (
                  <JsonViewer key={index} data={item} title={item.metricName || `Freshness ${index + 1}`} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No freshness data available</p>
            )}
          </div>
        )}

        {activeTab === 'apiHealth' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">API Health</h2>
            {data.apiHealth.length > 0 ? (
              <div className="space-y-4">
                {data.apiHealth.map((item, index) => (
                  <JsonViewer key={index} data={item} title={item.apiName || `API ${index + 1}`} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No API health data available</p>
            )}
          </div>
        )}

        {activeTab === 'cache' && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cache Data</h2>
            {data.cache.length > 0 ? (
              <div className="space-y-4">
                {data.cache.map((item, index) => (
                  <JsonViewer key={index} data={item} title={item.key || `Cache ${index + 1}`} />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No cache data available</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StorageViewerPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <ErrorBoundary fallback={<div className="text-red-500 p-4">Error loading storage viewer</div>}>
        <StorageViewerContent />
      </ErrorBoundary>
    </div>
  );
}