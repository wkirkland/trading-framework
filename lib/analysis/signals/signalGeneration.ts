// lib/analysis/signals/signalGeneration.ts
// Signal generation and classification logic

import type {
  SignalData,
  BasicSignalData,
  MarketIndicators,
  GetLiveValueFunction,
  ThesisScoringRules,
  SignalType,
  ImpactLevel
} from '../types/analysis.types';

/**
 * Helper function to estimate the next update frequency for a metric.
 */
export function getNextUpdateEstimate(metricName: string): string {
  const dailyMetrics = ['Fed Funds Rate', '10-Year Treasury Yield', 'VIX Index', 'S&P 500', 'Dollar Index', 'Gold Price'];
  const weeklyMetrics = ['Initial Jobless Claims'];
  const monthlyMetrics = ['Unemployment Rate (U-3)', 'Core PCE', 'Consumer Confidence Index'];

  if (dailyMetrics.includes(metricName)) return 'Real-time';
  if (weeklyMetrics.includes(metricName)) return 'Weekly';
  if (monthlyMetrics.includes(metricName)) return 'Monthly';
  return 'Quarterly';
}

/**
 * Generates an array of key metrics with their signals and supporting data.
 */
export function generateEnhancedKeyMetrics(
  selectedThesis: string,
  allThesisScoringRules: Record<string, ThesisScoringRules>,
  marketData: MarketIndicators,
  getLiveValue: GetLiveValueFunction
): SignalData[] {
  const metrics: SignalData[] = [];
  const rules = allThesisScoringRules[selectedThesis];

  if (!rules) {
    console.warn(`No scoring rules found for thesis (keyMetrics): ${selectedThesis}`);
    return [];
  }

  // Economic metrics
  Object.entries(rules.economic).forEach(([metricName, rule]) => {
      const liveValue = getLiveValue(metricName);
      let signal: SignalType = 'neutral';
      let reasoning = 'No data available'; // Default reasoning
    
      if (liveValue?.value !== null && liveValue?.value !== undefined) {
        const value = liveValue.value; // Raw value, e.g., 240000
        
        // --- ADDED/MODIFIED FOR BETTER REASONING STRING ---
        const formattedValue = liveValue.formatted || value.toFixed(0); // Use formatted if available
    
        // For reasoning display, format thresholds to K if it's ICSA for better readability
        // The actual rule.threshold.positive/negative are now raw numbers (e.g., 300000)
        const positiveThresholdDisplay = (metricName === 'Initial Jobless Claims' && rule.threshold.positive >= 1000) ? 
                                         `${(rule.threshold.positive / 1000).toFixed(0)}K` : 
                                         rule.threshold.positive.toString();
        const negativeThresholdDisplay = (metricName === 'Initial Jobless Claims' && rule.threshold.negative >= 1000) ? 
                                         `${(rule.threshold.negative / 1000).toFixed(0)}K` : 
                                         rule.threshold.negative.toString();
        // --- END ADDED/MODIFIED ---
    
        // Comparisons still use raw values
        if (value <= rule.threshold.positive) {
          signal = 'confirm';
          reasoning = `${formattedValue} supports thesis (≤${positiveThresholdDisplay})`; // MODIFIED
        } else if (value >= rule.threshold.negative) {
          signal = 'contradict';
          reasoning = `${formattedValue} contradicts thesis (≥${negativeThresholdDisplay})`; // MODIFIED
        } else {
          signal = 'neutral';
          reasoning = `${formattedValue} is neutral`; // MODIFIED
        }
      }
    
      metrics.push({
        name: metricName,
        currentSignal: signal,
        impact: determineImpactLevel(rule.weight),
        change: formatChangeValue(liveValue?.change),
        nextUpdate: getNextUpdateEstimate(metricName),
        value: liveValue?.value,
        reasoning, // This now uses the improved reasoning string
        source: 'Economic Data',
        formatted: liveValue?.formatted
      });
    });

  // Market indicators
  if (rules.market) {
    Object.entries(rules.market).forEach(([indicatorName, rule]) => {
      let value: number | null = null;
      let formatted: string = '';
      let signal: SignalType = 'neutral';
      let reasoning = 'No data available';
      let changeFromMarket: number | undefined = undefined;

      switch (indicatorName) {
        case 'VIX Index':
          const vixLiveValue = getLiveValue('VIX Index');
          value = vixLiveValue?.value || null;
          formatted = vixLiveValue?.formatted || (value !== null ? value.toFixed(1) : '');
          changeFromMarket = vixLiveValue?.change;
          
          if (value !== null) {
            if (selectedThesis === 'soft-landing') {
              if (value <= rule.threshold.positive) {
                signal = 'confirm';
                reasoning = `VIX at ${formatted} suggests low volatility (≤${rule.threshold.positive})`;
              } else if (value >= rule.threshold.negative) {
                signal = 'contradict';
                reasoning = `VIX at ${formatted} indicates high volatility (≥${rule.threshold.negative})`;
              } else {
                signal = 'neutral';
                reasoning = `VIX at ${formatted} is in neutral range`;
              }
            } else {
              // For other theses, high VIX might be expected
              if (value >= rule.threshold.positive) {
                signal = 'confirm';
                reasoning = `VIX at ${formatted} confirms market stress (≥${rule.threshold.positive})`;
              } else if (value <= rule.threshold.negative) {
                signal = 'contradict';
                reasoning = `VIX at ${formatted} suggests market complacency (≤${rule.threshold.negative})`;
              } else {
                signal = 'neutral';
                reasoning = `VIX at ${formatted} is in neutral range`;
              }
            }
          }
          break;

        case 'S&P 500':
          const sp500LiveValue = getLiveValue('S&P 500');
          value = sp500LiveValue?.value || null;
          formatted = sp500LiveValue?.formatted || (value !== null ? value.toFixed(0) : '');
          changeFromMarket = sp500LiveValue?.change;
          
          if (value !== null) {
            if (selectedThesis === 'soft-landing') {
              if (value >= rule.threshold.positive) {
                signal = 'confirm';
                reasoning = `S&P 500 at ${formatted} shows market confidence (≥${rule.threshold.positive})`;
              } else if (value <= rule.threshold.negative) {
                signal = 'contradict';
                reasoning = `S&P 500 at ${formatted} indicates market stress (≤${rule.threshold.negative})`;
              } else {
                signal = 'neutral';
                reasoning = `S&P 500 at ${formatted} is in neutral range`;
              }
            } else {
              // For recession/crisis scenarios
              if (value <= rule.threshold.negative) {
                signal = 'confirm';
                reasoning = `S&P 500 at ${formatted} confirms market decline (≤${rule.threshold.negative})`;
              } else if (value >= rule.threshold.positive) {
                signal = 'contradict';
                reasoning = `S&P 500 at ${formatted} shows resilience (≥${rule.threshold.positive})`;
              } else {
                signal = 'neutral';
                reasoning = `S&P 500 at ${formatted} is in neutral range`;
              }
            }
          }
          break;

        case 'Dollar Index':
          value = marketData.dollarIndex;
          formatted = value !== null ? value.toFixed(2) : '';
          
          if (value !== null) {
            if (value >= rule.threshold.positive) {
              signal = selectedThesis === 'economic-transition' ? 'confirm' : 'contradict';
              reasoning = `Dollar Index at ${formatted} shows ${selectedThesis === 'economic-transition' ? 'dollar strength' : 'potential stress'} (≥${rule.threshold.positive})`;
            } else if (value <= rule.threshold.negative) {
              signal = selectedThesis === 'soft-landing' ? 'confirm' : 'contradict';
              reasoning = `Dollar Index at ${formatted} shows ${selectedThesis === 'soft-landing' ? 'balanced strength' : 'weakness'} (≤${rule.threshold.negative})`;
            } else {
              signal = 'neutral';
              reasoning = `Dollar Index at ${formatted} is in neutral range`;
            }
          }
          break;

        case 'Gold Price':
          value = marketData.gold;
          formatted = value !== null ? `$${value.toFixed(0)}` : '';
          
          if (value !== null) {
            if (selectedThesis === 'soft-landing') {
              if (value <= rule.threshold.negative) {
                signal = 'confirm';
                reasoning = `Gold at ${formatted} suggests economic confidence (≤$${rule.threshold.negative})`;
              } else if (value >= rule.threshold.positive) {
                signal = 'contradict';
                reasoning = `Gold at ${formatted} indicates safe-haven demand (≥$${rule.threshold.positive})`;
              } else {
                signal = 'neutral';
                reasoning = `Gold at ${formatted} is in neutral range`;
              }
            } else {
              // For stress scenarios, high gold is confirmatory
              if (value >= rule.threshold.positive) {
                signal = 'confirm';
                reasoning = `Gold at ${formatted} confirms safe-haven demand (≥$${rule.threshold.positive})`;
              } else if (value <= rule.threshold.negative) {
                signal = 'contradict';
                reasoning = `Gold at ${formatted} suggests risk appetite (≤$${rule.threshold.negative})`;
              } else {
                signal = 'neutral';
                reasoning = `Gold at ${formatted} is in neutral range`;
              }
            }
          }
          break;
      }

      metrics.push({
        name: indicatorName,
        currentSignal: signal,
        impact: determineImpactLevel(rule.weight),
        change: formatChangeValue(changeFromMarket),
        nextUpdate: getNextUpdateEstimate(indicatorName),
        value,
        reasoning,
        source: 'Market Data',
        formatted
      });
    });
  }

  return metrics;
}

/**
 * Generate basic key metrics (economic only)
 */
export function generateBasicKeyMetrics(
  selectedThesis: string,
  allThesisScoringRules: Record<string, ThesisScoringRules>,
  getLiveValue: GetLiveValueFunction
): BasicSignalData[] {
  const metrics: BasicSignalData[] = [];
  const rules = allThesisScoringRules[selectedThesis];

  if (!rules) {
    console.warn(`No scoring rules found for thesis (basic keyMetrics): ${selectedThesis}`);
    return [];
  }

  // Economic metrics only
  Object.entries(rules.economic).forEach(([metricName, rule]) => {
    const liveValue = getLiveValue(metricName);
    let signal: SignalType = 'neutral';
    let reasoning = 'No data available';

    if (liveValue?.value !== null && liveValue?.value !== undefined) {
      const value = liveValue.value;
      const formattedValue = liveValue.formatted || value.toFixed(0);

      if (value <= rule.threshold.positive) {
        signal = 'confirm';
        reasoning = `${formattedValue} supports thesis`;
      } else if (value >= rule.threshold.negative) {
        signal = 'contradict';
        reasoning = `${formattedValue} contradicts thesis`;
      } else {
        signal = 'neutral';
        reasoning = `${formattedValue} is neutral`;
      }
    }

    metrics.push({
      name: metricName,
      currentSignal: signal,
      impact: determineImpactLevel(rule.weight),
      change: formatChangeValue(liveValue?.change),
      nextUpdate: getNextUpdateEstimate(metricName),
      value: liveValue?.value,
      reasoning
    });
  });

  return metrics;
}

/**
 * Helper function to determine impact level based on weight
 */
export function determineImpactLevel(weight: number): ImpactLevel {
  if (weight >= 0.25) return 'high';
  if (weight >= 0.15) return 'medium';
  return 'low';
}

/**
 * Helper function to format change values
 */
export function formatChangeValue(change: number | undefined): string {
  if (change === undefined) return '→';
  
  if (change > 0) return `↑ +${Math.abs(change).toFixed(2)}`;
  if (change < 0) return `↓ -${Math.abs(change).toFixed(2)}`;
  return '→ 0.00';
}

/**
 * Helper function to create signal reasoning
 */
export function createSignalReasoning(
  value: number,
  formattedValue: string,
  thresholds: { positive: number; negative: number },
  metricName: string,
  signal: SignalType
): string {
  const positiveThresholdDisplay = (metricName === 'Initial Jobless Claims' && thresholds.positive >= 1000) ? 
                                   `${(thresholds.positive / 1000).toFixed(0)}K` : 
                                   thresholds.positive.toString();
  const negativeThresholdDisplay = (metricName === 'Initial Jobless Claims' && thresholds.negative >= 1000) ? 
                                   `${(thresholds.negative / 1000).toFixed(0)}K` : 
                                   thresholds.negative.toString();

  switch (signal) {
    case 'confirm':
      return `${formattedValue} supports thesis (≤${positiveThresholdDisplay})`;
    case 'contradict':
      return `${formattedValue} contradicts thesis (≥${negativeThresholdDisplay})`;
    default:
      return `${formattedValue} is neutral`;
  }
}