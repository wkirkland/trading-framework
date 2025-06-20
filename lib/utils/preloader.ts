// lib/utils/preloader.ts
// Intelligent component preloading based on user behavior and route patterns

export interface PreloadConfig {
  aggressive: boolean;
  prefetchOnHover: boolean;
  prefetchOnVisible: boolean;
  delayMs: number;
}

const defaultConfig: PreloadConfig = {
  aggressive: false,
  prefetchOnHover: true,
  prefetchOnVisible: true,
  delayMs: 200
};

// Component import map
const componentImports = {
  // Dashboard components
  signalDashboard: () => import('@/components/dashboard/SignalDashboard'),
  metricGrid: () => import('@/components/metrics/MetricGrid'),
  metricTable: () => import('@/components/metrics/MetricTable'),
  
  // Chart components
  gaugeChart: () => import('@/components/charts/GaugeChart'),
  
  // Table components
  dataTable: () => import('@/components/table/DataTable'),
  
  // UI components
  tooltip: () => import('@/components/ui/Tooltip'),
  liveRegion: () => import('@/components/ui/LiveRegion'),
  
  // Loading components
  skeleton: () => import('@/components/loading/Skeleton'),
  suspense: () => import('@/components/loading/Suspense')
} as const;

type ComponentKey = keyof typeof componentImports;

// Route-based preloading strategy
const routePreloadMap: Record<string, ComponentKey[]> = {
  '/': ['signalDashboard', 'metricGrid', 'gaugeChart'],
  '/module1': ['metricTable', 'dataTable'],
  '/signal-dashboard': ['signalDashboard', 'metricGrid', 'metricTable', 'gaugeChart'],
  '/enhanced-dashboard': ['metricGrid', 'gaugeChart', 'dataTable']
};

// Preload tracking
const preloadedComponents = new Set<ComponentKey>();
const preloadPromises = new Map<ComponentKey, Promise<any>>();

/**
 * Preload a single component
 */
export function preloadComponent(componentKey: ComponentKey): Promise<any> {
  if (preloadedComponents.has(componentKey)) {
    return Promise.resolve();
  }

  if (preloadPromises.has(componentKey)) {
    return preloadPromises.get(componentKey)!;
  }

  const importFn = componentImports[componentKey];
  if (!importFn) {
    console.warn(`Unknown component key: ${componentKey}`);
    return Promise.resolve();
  }

  const promise = importFn()
    .then(module => {
      preloadedComponents.add(componentKey);
      preloadPromises.delete(componentKey);
      return module;
    })
    .catch(error => {
      console.error(`Failed to preload component ${componentKey}:`, error);
      preloadPromises.delete(componentKey);
      throw error;
    });

  preloadPromises.set(componentKey, promise);
  return promise;
}

/**
 * Preload multiple components
 */
export function preloadComponents(componentKeys: ComponentKey[]): Promise<any[]> {
  return Promise.all(componentKeys.map(preloadComponent));
}

/**
 * Preload components for a specific route
 */
export function preloadForRoute(route: string, config: Partial<PreloadConfig> = {}): Promise<any[]> {
  const finalConfig = { ...defaultConfig, ...config };
  const componentsToPreload = routePreloadMap[route] || [];

  if (componentsToPreload.length === 0) {
    // For unknown routes, preload common components
    return preloadComponents(['metricGrid', 'tooltip']);
  }

  if (finalConfig.aggressive) {
    // Preload all route components immediately
    return preloadComponents(componentsToPreload);
  } else {
    // Preload with delay
    return new Promise(resolve => {
      setTimeout(() => {
        preloadComponents(componentsToPreload).then(resolve);
      }, finalConfig.delayMs);
    });
  }
}

/**
 * Preload all components (for aggressive caching)
 */
export function preloadAllComponents(): Promise<any[]> {
  const allComponents = Object.keys(componentImports) as ComponentKey[];
  return preloadComponents(allComponents);
}

/**
 * Hook for preloading components on link hover
 */
export function useHoverPreload(route: string, config: Partial<PreloadConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  const handleMouseEnter = () => {
    if (finalConfig.prefetchOnHover) {
      preloadForRoute(route, finalConfig);
    }
  };

  return { onMouseEnter: handleMouseEnter };
}

/**
 * Hook for preloading components when element is visible
 */
export function useVisibilityPreload(route: string, config: Partial<PreloadConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config };

  React.useEffect(() => {
    if (!finalConfig.prefetchOnVisible) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            preloadForRoute(route, finalConfig);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    // Observe the document body as a fallback
    observer.observe(document.body);

    return () => observer.disconnect();
  }, [route, finalConfig]);

  return React.useRef<HTMLElement>(null);
}

/**
 * Smart preloader that adapts to user behavior
 */
export class SmartPreloader {
  private config: PreloadConfig;
  private userBehavior: {
    visitedRoutes: Set<string>;
    timeSpentOnRoutes: Map<string, number>;
    componentUsage: Map<ComponentKey, number>;
  };

  constructor(config: Partial<PreloadConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.userBehavior = {
      visitedRoutes: new Set(),
      timeSpentOnRoutes: new Map(),
      componentUsage: new Map()
    };
  }

  /**
   * Track route visit
   */
  trackRouteVisit(route: string) {
    this.userBehavior.visitedRoutes.add(route);
    
    // Preload related routes based on common patterns
    this.preloadRelatedRoutes(route);
  }

  /**
   * Track time spent on route
   */
  trackTimeOnRoute(route: string, timeMs: number) {
    const currentTime = this.userBehavior.timeSpentOnRoutes.get(route) || 0;
    this.userBehavior.timeSpentOnRoutes.set(route, currentTime + timeMs);
  }

  /**
   * Track component usage
   */
  trackComponentUsage(componentKey: ComponentKey) {
    const currentUsage = this.userBehavior.componentUsage.get(componentKey) || 0;
    this.userBehavior.componentUsage.set(componentKey, currentUsage + 1);
  }

  /**
   * Preload based on user behavior patterns
   */
  private preloadRelatedRoutes(currentRoute: string) {
    // If user visits signal-dashboard frequently, preload metric components
    if (currentRoute === '/signal-dashboard') {
      preloadComponents(['metricGrid', 'metricTable', 'gaugeChart']);
    }

    // If user spends time on module1, they likely need table components
    if (currentRoute === '/module1') {
      preloadComponents(['dataTable', 'metricTable']);
    }

    // If user visits root, preload dashboard components
    if (currentRoute === '/') {
      preloadComponents(['signalDashboard', 'metricGrid']);
    }
  }

  /**
   * Get preload recommendations based on usage patterns
   */
  getRecommendations(): ComponentKey[] {
    const recommendations: ComponentKey[] = [];
    
    // Recommend based on most used components
    const sortedUsage = Array.from(this.userBehavior.componentUsage.entries())
      .sort(([, a], [, b]) => b - a);
    
    recommendations.push(...sortedUsage.slice(0, 3).map(([key]) => key));

    // Recommend based on most visited routes
    const sortedRoutes = Array.from(this.userBehavior.timeSpentOnRoutes.entries())
      .sort(([, a], [, b]) => b - a);
    
    sortedRoutes.slice(0, 2).forEach(([route]) => {
      const routeComponents = routePreloadMap[route] || [];
      recommendations.push(...routeComponents);
    });

    // Remove duplicates
    return Array.from(new Set(recommendations));
  }

  /**
   * Apply smart preloading
   */
  applySmartPreloading() {
    const recommendations = this.getRecommendations();
    return preloadComponents(recommendations);
  }
}

// Global smart preloader instance
export const smartPreloader = new SmartPreloader();

// Utility functions for React components
import React from 'react';

/**
 * React hook for smart preloading
 */
export function useSmartPreload(route: string) {
  React.useEffect(() => {
    smartPreloader.trackRouteVisit(route);
    
    const startTime = Date.now();
    return () => {
      const timeSpent = Date.now() - startTime;
      smartPreloader.trackTimeOnRoute(route, timeSpent);
    };
  }, [route]);

  const preloadForCurrentRoute = React.useCallback(() => {
    return preloadForRoute(route);
  }, [route]);

  return { preloadForCurrentRoute };
}

/**
 * Preload components based on network conditions
 */
export function preloadBasedOnNetwork() {
  // @ts-ignore - navigator.connection might not be available in all browsers
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    // Fallback: preload essential components only
    return preloadComponents(['metricGrid', 'tooltip']);
  }

  const { effectiveType, downlink } = connection;
  
  if (effectiveType === '4g' && downlink > 2) {
    // Good connection: aggressive preloading
    return preloadAllComponents();
  } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 2)) {
    // Moderate connection: preload common components
    return preloadComponents(['metricGrid', 'gaugeChart', 'tooltip']);
  } else {
    // Slow connection: minimal preloading
    return preloadComponents(['tooltip']);
  }
}

/**
 * Initialize preloader with intelligent defaults
 */
export function initializePreloader(currentRoute: string = '/') {
  // Start with current route preloading
  preloadForRoute(currentRoute, { delayMs: 100 });
  
  // Apply network-based preloading after a delay
  setTimeout(() => {
    preloadBasedOnNetwork();
  }, 1000);
  
  // Apply smart preloading based on stored behavior
  setTimeout(() => {
    smartPreloader.applySmartPreloading();
  }, 2000);
}