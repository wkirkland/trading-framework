// lib/utils/correlationUtils.ts
// Utilities for calculating correlations between metrics

export interface CorrelationData {
  metric1: string;
  metric2: string;
  correlation: number;
  pValue?: number;
  dataPoints: number;
  strength: 'very-strong' | 'strong' | 'moderate' | 'weak' | 'very-weak';
  direction: 'positive' | 'negative';
}

export interface CorrelationMatrix {
  metrics: string[];
  matrix: number[][];
  correlations: CorrelationData[];
  timestamp: string;
}

export interface MetricDataPoint {
  date: string;
  value: number;
  timestamp: number;
}

/**
 * Calculate Pearson correlation coefficient between two data series
 */
export function calculateCorrelation(
  data1: MetricDataPoint[],
  data2: MetricDataPoint[]
): { correlation: number; dataPoints: number } {
  // Align data by timestamp
  const alignedData = alignDataSeries(data1, data2);
  
  if (alignedData.length < 3) {
    return { correlation: 0, dataPoints: 0 };
  }

  const values1 = alignedData.map(d => d.value1);
  const values2 = alignedData.map(d => d.value2);

  return {
    correlation: pearsonCorrelation(values1, values2),
    dataPoints: alignedData.length
  };
}

/**
 * Align two data series by finding matching timestamps
 */
function alignDataSeries(
  data1: MetricDataPoint[],
  data2: MetricDataPoint[]
): Array<{ timestamp: number; value1: number; value2: number }> {
  const aligned: Array<{ timestamp: number; value1: number; value2: number }> = [];
  
  // Create maps for faster lookup
  const map1 = new Map(data1.map(d => [d.timestamp, d.value]));
  const map2 = new Map(data2.map(d => [d.timestamp, d.value]));

  // Find common timestamps with tolerance for slight differences
  const tolerance = 24 * 60 * 60 * 1000; // 1 day tolerance
  
  for (const [timestamp1, value1] of map1) {
    // Look for exact match first
    if (map2.has(timestamp1)) {
      aligned.push({
        timestamp: timestamp1,
        value1,
        value2: map2.get(timestamp1)!
      });
    } else {
      // Look for close match within tolerance
      for (const [timestamp2, value2] of map2) {
        if (Math.abs(timestamp1 - timestamp2) <= tolerance) {
          aligned.push({
            timestamp: timestamp1,
            value1,
            value2
          });
          break;
        }
      }
    }
  }

  // Sort by timestamp
  return aligned.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Calculate Pearson correlation coefficient
 */
function pearsonCorrelation(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length === 0) {
    return 0;
  }

  const n = x.length;
  
  // Calculate means
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // Calculate numerator and denominators
  let numerator = 0;
  let sumXSquared = 0;
  let sumYSquared = 0;

  for (let i = 0; i < n; i++) {
    const deltaX = x[i] - meanX;
    const deltaY = y[i] - meanY;
    
    numerator += deltaX * deltaY;
    sumXSquared += deltaX * deltaX;
    sumYSquared += deltaY * deltaY;
  }

  // Avoid division by zero
  const denominator = Math.sqrt(sumXSquared * sumYSquared);
  if (denominator === 0) {
    return 0;
  }

  return numerator / denominator;
}

/**
 * Categorize correlation strength
 */
export function getCorrelationStrength(correlation: number): CorrelationData['strength'] {
  const abs = Math.abs(correlation);
  
  if (abs >= 0.9) return 'very-strong';
  if (abs >= 0.7) return 'strong';
  if (abs >= 0.5) return 'moderate';
  if (abs >= 0.3) return 'weak';
  return 'very-weak';
}

/**
 * Get correlation direction
 */
export function getCorrelationDirection(correlation: number): CorrelationData['direction'] {
  return correlation >= 0 ? 'positive' : 'negative';
}

/**
 * Build complete correlation matrix for multiple metrics
 */
export function buildCorrelationMatrix(
  metricData: Record<string, MetricDataPoint[]>
): CorrelationMatrix {
  const metrics = Object.keys(metricData).sort();
  const n = metrics.length;
  
  // Initialize matrix
  const matrix: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  const correlations: CorrelationData[] = [];

  // Calculate correlations for all pairs
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) {
        matrix[i][j] = 1; // Perfect self-correlation
        continue;
      }

      const metric1 = metrics[i];
      const metric2 = metrics[j];
      const data1 = metricData[metric1] || [];
      const data2 = metricData[metric2] || [];

      const result = calculateCorrelation(data1, data2);
      matrix[i][j] = result.correlation;

      // Only add unique pairs (avoid duplicates)
      if (i < j && result.dataPoints >= 3) {
        correlations.push({
          metric1,
          metric2,
          correlation: result.correlation,
          dataPoints: result.dataPoints,
          strength: getCorrelationStrength(result.correlation),
          direction: getCorrelationDirection(result.correlation)
        });
      }
    }
  }

  return {
    metrics,
    matrix,
    correlations: correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation)),
    timestamp: new Date().toISOString()
  };
}

/**
 * Filter correlations by strength
 */
export function filterCorrelationsByStrength(
  correlations: CorrelationData[],
  minStrength: CorrelationData['strength']
): CorrelationData[] {
  const strengthOrder = ['very-weak', 'weak', 'moderate', 'strong', 'very-strong'];
  const minIndex = strengthOrder.indexOf(minStrength);
  
  return correlations.filter(corr => {
    const corrIndex = strengthOrder.indexOf(corr.strength);
    return corrIndex >= minIndex;
  });
}

/**
 * Get color for correlation strength visualization
 */
export function getCorrelationColor(correlation: number): string {
  const abs = Math.abs(correlation);
  const isPositive = correlation >= 0;
  
  if (abs >= 0.9) return isPositive ? '#065f46' : '#7f1d1d'; // Very strong green/red
  if (abs >= 0.7) return isPositive ? '#059669' : '#b91c1c'; // Strong green/red
  if (abs >= 0.5) return isPositive ? '#10b981' : '#ef4444'; // Moderate green/red
  if (abs >= 0.3) return isPositive ? '#6ee7b7' : '#fca5a5'; // Weak green/red
  return '#e5e7eb'; // Very weak - gray
}

/**
 * Format correlation for display
 */
export function formatCorrelation(correlation: number): string {
  return correlation.toFixed(3);
}

/**
 * Get correlation description
 */
export function getCorrelationDescription(corr: CorrelationData): string {
  const absCorr = Math.abs(corr.correlation);
  const direction = corr.direction === 'positive' ? 'move together' : 'move opposite';
  const strength = corr.strength.replace('-', ' ');
  
  return `${strength} ${direction} (${formatCorrelation(corr.correlation)})`;
}