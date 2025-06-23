// lib/services/dataFreshnessService.ts

export interface DataFreshnessStatus {
  metricName: string;
  lastUpdated: Date | null;
  expectedFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  status: 'fresh' | 'aging' | 'stale' | 'unknown';
  staleness: number; // Hours since expected update
  nextExpectedUpdate: Date | null;
  isMarketHours?: boolean; // For market-dependent metrics
}

interface FreshnessThresholds {
  fresh: number; // Hours
  aging: number; // Hours  
  stale: number; // Hours
}

class DataFreshnessService {
  private readonly FRESHNESS_THRESHOLDS: Record<string, FreshnessThresholds> = {
    daily: {
      fresh: 6,    // Within 6 hours is fresh
      aging: 24,   // 6-24 hours is aging
      stale: 48    // 24+ hours is stale
    },
    weekly: {
      fresh: 24,   // Within 1 day is fresh
      aging: 96,   // 1-4 days is aging  
      stale: 168   // 4+ days is stale
    },
    monthly: {
      fresh: 72,   // Within 3 days is fresh
      aging: 336,  // 3-14 days is aging
      stale: 672   // 14+ days is stale
    },
    quarterly: {
      fresh: 168,  // Within 1 week is fresh
      aging: 720,  // 1-4 weeks is aging
      stale: 2160  // 4+ weeks is stale
    }
  };

  private readonly MARKET_HOURS = {
    start: 9.5,  // 9:30 AM
    end: 16      // 4:00 PM
  };

  /**
   * Determines if current time is within market hours (EST)
   */
  private isMarketHours(): boolean {
    const now = new Date();
    const estHour = now.getUTCHours() - 5; // Simple EST conversion
    const day = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
    
    // Skip weekends
    if (day === 0 || day === 6) return false;
    
    // Check if within market hours
    return estHour >= this.MARKET_HOURS.start && estHour < this.MARKET_HOURS.end;
  }

  /**
   * Calculates the next expected update time based on frequency
   */
  private getNextExpectedUpdate(
    lastUpdated: Date | null, 
    frequency: string, 
    isMarketDependent: boolean = false
  ): Date | null {
    if (!lastUpdated) return null;

    const next = new Date(lastUpdated);
    
    switch (frequency) {
      case 'daily':
        if (isMarketDependent) {
          // Next business day at market open
          next.setDate(next.getDate() + 1);
          while (next.getDay() === 0 || next.getDay() === 6) {
            next.setDate(next.getDate() + 1);
          }
          next.setHours(9, 30, 0, 0);
        } else {
          // Next day at same time
          next.setDate(next.getDate() + 1);
        }
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      default:
        return null;
    }
    
    return next;
  }

  /**
   * Determines data freshness status
   */
  calculateFreshness(
    metricName: string,
    lastUpdated: Date | null,
    expectedFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    isMarketDependent: boolean = false
  ): DataFreshnessStatus {
    if (!lastUpdated) {
      return {
        metricName,
        lastUpdated: null,
        expectedFrequency,
        status: 'unknown',
        staleness: 0,
        nextExpectedUpdate: null,
        isMarketHours: isMarketDependent ? this.isMarketHours() : undefined
      };
    }

    const now = new Date();
    const hoursOld = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    const thresholds = this.FRESHNESS_THRESHOLDS[expectedFrequency];
    
    let status: 'fresh' | 'aging' | 'stale' = 'fresh';
    if (hoursOld > thresholds.stale) {
      status = 'stale';
    } else if (hoursOld > thresholds.aging) {
      status = 'aging';
    }

    // Special handling for market-dependent metrics
    if (isMarketDependent && !this.isMarketHours() && expectedFrequency === 'daily') {
      // Outside market hours, daily metrics are expected to be older
      if (hoursOld < 24) {
        status = 'fresh';
      }
    }

    return {
      metricName,
      lastUpdated,
      expectedFrequency,
      status,
      staleness: hoursOld,
      nextExpectedUpdate: this.getNextExpectedUpdate(lastUpdated, expectedFrequency, isMarketDependent),
      isMarketHours: isMarketDependent ? this.isMarketHours() : undefined
    };
  }

  /**
   * Gets appropriate color for freshness status
   */
  getStatusColor(status: 'fresh' | 'aging' | 'stale' | 'unknown'): string {
    switch (status) {
      case 'fresh':
        return '#10b981'; // Green
      case 'aging':
        return '#f59e0b'; // Orange/Yellow
      case 'stale':
        return '#ef4444'; // Red
      case 'unknown':
        return '#6b7280'; // Gray
      default:
        return '#6b7280';
    }
  }

  /**
   * Gets appropriate icon for freshness status
   */
  getStatusIcon(status: 'fresh' | 'aging' | 'stale' | 'unknown'): string {
    switch (status) {
      case 'fresh':
        return '●'; // Solid dot
      case 'aging':
        return '◐'; // Half dot
      case 'stale':
        return '○'; // Empty dot
      case 'unknown':
        return '?'; // Question mark
      default:
        return '?';
    }
  }

  /**
   * Gets human-readable status description
   */
  getStatusDescription(status: 'fresh' | 'aging' | 'stale' | 'unknown'): string {
    switch (status) {
      case 'fresh':
        return 'Fresh';
      case 'aging':
        return 'Aging';
      case 'stale':
        return 'Stale';
      case 'unknown':
        return 'Unknown';
      default:
        return 'Unknown';
    }
  }

  /**
   * Formats time since last update in a human-readable way
   */
  formatTimeSince(date: Date | null): string {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return `${Math.floor(diffDays / 30)}mo ago`;
  }

  /**
   * Formats next expected update time
   */
  formatNextUpdate(date: Date | null): string {
    if (!date) return 'Unknown';
    
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return 'Overdue';
    if (diffHours < 1) return 'Soon';
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString();
  }

  /**
   * Determines if a metric should be considered market-dependent
   */
  isMarketDependentMetric(metricName: string): boolean {
    const marketMetrics = [
      'VIX Index',
      'S&P 500', 
      'Dollar Index'
    ];
    return marketMetrics.includes(metricName);
  }
}

export const dataFreshnessService = new DataFreshnessService();