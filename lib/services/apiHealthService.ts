// lib/services/apiHealthService.ts
// API Health Monitoring Service for FRED and Alpha Vantage APIs

export interface ApiHealthStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  lastChecked: Date;
  lastSuccessful: Date | null;
  responseTime: number | null; // milliseconds
  errorMessage: string | null;
  successRate: number; // percentage over last 24 hours
  consecutiveFailures: number;
}

export interface ApiHealthData {
  fred: ApiHealthStatus;
  alphaVantage: ApiHealthStatus;
  overall: 'healthy' | 'degraded' | 'down';
  lastUpdated: Date;
}

class ApiHealthService {
  private healthData: ApiHealthData;
  private checkInterval: NodeJS.Timeout | null = null;
  private listeners: ((data: ApiHealthData) => void)[] = [];

  constructor() {
    this.healthData = {
      fred: this.createInitialStatus('FRED Economic Data'),
      alphaVantage: this.createInitialStatus('Alpha Vantage'),
      overall: 'unknown',
      lastUpdated: new Date()
    };
  }

  private createInitialStatus(name: string): ApiHealthStatus {
    return {
      name,
      status: 'unknown',
      lastChecked: new Date(),
      lastSuccessful: null,
      responseTime: null,
      errorMessage: null,
      successRate: 100,
      consecutiveFailures: 0
    };
  }

  // Subscribe to health status changes
  subscribe(callback: (data: ApiHealthData) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  // Get current health status
  getHealthStatus(): ApiHealthData {
    return { ...this.healthData };
  }

  // Start periodic health checks (every 30 minutes)
  startMonitoring(intervalMs: number = 30 * 60 * 1000) {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    // Initial check
    this.performHealthChecks();

    // Periodic checks
    this.checkInterval = setInterval(() => {
      this.performHealthChecks();
    }, intervalMs);
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Perform health checks for all APIs
  private async performHealthChecks() {
    const checks = await Promise.allSettled([
      this.checkFredApi(),
      this.checkAlphaVantageApi()
    ]);

    // Update FRED status
    if (checks[0].status === 'fulfilled') {
      this.healthData.fred = checks[0].value;
    } else {
      this.updateApiStatus('fred', 'down', null, 'Health check failed');
    }

    // Update Alpha Vantage status
    if (checks[1].status === 'fulfilled') {
      this.healthData.alphaVantage = checks[1].value;
    } else {
      this.updateApiStatus('alphaVantage', 'down', null, 'Health check failed');
    }

    // Update overall status
    this.updateOverallStatus();
    this.healthData.lastUpdated = new Date();

    // Notify listeners
    this.notifyListeners();
  }

  // Check FRED API health
  private async checkFredApi(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Use a lightweight endpoint to check FRED API
      const response = await fetch(
        `https://api.stlouisfed.org/fred/series?series_id=GDP&api_key=${process.env.FRED_API_KEY}&file_type=json&limit=1`,
        { 
          method: 'GET',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        
        // Check if response has expected structure
        if (data.seriess && Array.isArray(data.seriess)) {
          return this.updateApiStatus('fred', 'healthy', responseTime);
        } else {
          return this.updateApiStatus('fred', 'degraded', responseTime, 'Unexpected response format');
        }
      } else {
        return this.updateApiStatus('fred', 'down', responseTime, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.updateApiStatus('fred', 'down', responseTime, errorMessage);
    }
  }

  // Check Alpha Vantage API health
  private async checkAlphaVantageApi(): Promise<ApiHealthStatus> {
    const startTime = Date.now();
    
    try {
      // Use a lightweight endpoint to check Alpha Vantage API
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=SPY&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`,
        { 
          method: 'GET',
          signal: AbortSignal.timeout(10000) // 10 second timeout
        }
      );

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        
        // Check if response has expected structure and no error message
        if (data['Global Quote'] && !data['Error Message'] && !data['Note']) {
          return this.updateApiStatus('alphaVantage', 'healthy', responseTime);
        } else if (data['Note']) {
          return this.updateApiStatus('alphaVantage', 'degraded', responseTime, 'API rate limit exceeded');
        } else {
          return this.updateApiStatus('alphaVantage', 'degraded', responseTime, 'Unexpected response format');
        }
      } else {
        return this.updateApiStatus('alphaVantage', 'down', responseTime, `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return this.updateApiStatus('alphaVantage', 'down', responseTime, errorMessage);
    }
  }

  // Update API status and return the updated status
  private updateApiStatus(
    api: 'fred' | 'alphaVantage', 
    status: ApiHealthStatus['status'], 
    responseTime: number | null, 
    errorMessage: string | null = null
  ): ApiHealthStatus {
    const currentStatus = this.healthData[api];
    const now = new Date();

    // Update consecutive failures
    let consecutiveFailures = currentStatus.consecutiveFailures;
    if (status === 'healthy') {
      consecutiveFailures = 0;
    } else if (status === 'down') {
      consecutiveFailures++;
    }

    // Update last successful time
    const lastSuccessful = status === 'healthy' ? now : currentStatus.lastSuccessful;

    const updatedStatus: ApiHealthStatus = {
      ...currentStatus,
      status,
      lastChecked: now,
      lastSuccessful,
      responseTime,
      errorMessage,
      consecutiveFailures
    };

    this.healthData[api] = updatedStatus;
    return updatedStatus;
  }

  // Update overall system status
  private updateOverallStatus() {
    const fredStatus = this.healthData.fred.status;
    const alphaStatus = this.healthData.alphaVantage.status;

    if (fredStatus === 'healthy' && alphaStatus === 'healthy') {
      this.healthData.overall = 'healthy';
    } else if (fredStatus === 'down' && alphaStatus === 'down') {
      this.healthData.overall = 'down';
    } else {
      this.healthData.overall = 'degraded';
    }
  }

  // Notify all listeners of status change
  private notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.healthData);
      } catch (error) {
        console.error('Error notifying health status listener:', error);
      }
    });
  }

  // Manual trigger for health check (useful for testing)
  async checkNow(): Promise<ApiHealthData> {
    await this.performHealthChecks();
    return this.getHealthStatus();
  }

  // Record API call result (called from actual API services)
  recordApiCall(api: 'fred' | 'alphaVantage', success: boolean, responseTime: number, errorMessage?: string) {
    const status = success ? 'healthy' : 'degraded';
    this.updateApiStatus(api, status, responseTime, errorMessage || null);
    this.updateOverallStatus();
    this.healthData.lastUpdated = new Date();
    this.notifyListeners();
  }

  // Get human-readable status description
  getStatusDescription(status: ApiHealthStatus['status']): string {
    switch (status) {
      case 'healthy': return 'All systems operational';
      case 'degraded': return 'Some issues detected';
      case 'down': return 'Service unavailable';
      case 'unknown': return 'Status unknown';
      default: return 'Unknown status';
    }
  }

  // Get status color for UI
  getStatusColor(status: ApiHealthStatus['status']): string {
    switch (status) {
      case 'healthy': return '#10b981'; // green
      case 'degraded': return '#f59e0b'; // amber
      case 'down': return '#ef4444'; // red
      case 'unknown': return '#6b7280'; // gray
      default: return '#6b7280';
    }
  }
}

// Singleton instance
export const apiHealthService = new ApiHealthService();

// Export default for convenience
export default apiHealthService;