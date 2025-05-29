// lib/hooks/useSignalAnalysis.ts

import { useState, useEffect, useMemo } from 'react';
import { useLiveData } from './useLiveData';

interface SignalData {
  name: string;
  currentSignal: 'confirm' | 'contradict' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  change: string;
  nextUpdate: string;
  value?: number | null;
  reasoning?: string;
}

interface EvidenceScores {
  economic: number;
  political: number;
  social: number;
  environmental: number;
  overall: number;
}

interface ConflictAlert {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  isActive: boolean;
}

interface ThresholdTrigger {
  title: string;
  conditions: string[];
  status: 'Safe Zone' | 'Monitor Zone' | 'Alert Zone';
  triggered: string;
  statusColor: string;
  conditionsMet: number;
  totalConditions: number;
}

// Helper function - moved to top to avoid hoisting issues
const getNextUpdateEstimate = (metricName: string): string => {
  // Return estimated next update based on metric frequency
  const monthlyMetrics = ['Unemployment Rate (U-3)', 'Core PCE', 'Consumer Confidence Index'];
  const weeklyMetrics = ['Initial Jobless Claims'];
  const dailyMetrics = ['Fed Funds Rate', '10-Year Treasury Yield'];
  
  if (dailyMetrics.includes(metricName)) return 'Daily';
  if (weeklyMetrics.includes(metricName)) return 'Weekly';
  if (monthlyMetrics.includes(metricName)) return 'Monthly';
  return 'Quarterly';
};

// Thesis scoring logic based on real economic conditions
const THESIS_SCORING_RULES = {
  'economic-transition': {
    economic: {
      'Real GDP Growth Rate': { weight: 0.3, threshold: { negative: -1, positive: 2 } },
      'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 4.5, positive: 3.5 } },
      'Core PCE': { weight: 0.2, threshold: { negative: 3.5, positive: 2.0 } },
      'Fed Funds Rate': { weight: 0.15, threshold: { negative: 3.0, positive: 5.5 } },
      'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 90, positive: 110 } }
    }
  },
  'soft-landing': {
    economic: {
      'Real GDP Growth Rate': { weight: 0.25, threshold: { negative: 0, positive: 3 } },
      'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 5, positive: 3 } },
      'Core PCE': { weight: 0.25, threshold: { negative: 4, positive: 1.5 } },
      'Fed Funds Rate': { weight: 0.15, threshold: { negative: 6, positive: 2 } },
      'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 85, positive: 105 } }
    }
  },
  'mild-recession': {
    economic: {
      'Real GDP Growth Rate': { weight: 0.3, threshold: { negative: 1, positive: -2 } },
      'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 3.5, positive: 6 } },
      'Core PCE': { weight: 0.2, threshold: { negative: 2, positive: 4 } },
      'Initial Jobless Claims': { weight: 0.15, threshold: { negative: 300, positive: 450 } },
      'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 100, positive: 70 } }
    }
  }
};

export function useSignalAnalysis() {
  const { liveData, loading, error, lastFetched, fetchData, getLiveValue } = useLiveData();
  const [selectedThesis, setSelectedThesis] = useState<string>('economic-transition');

  // Calculate evidence scores based on real data
  const evidenceScores = useMemo((): EvidenceScores => {
    const rules = THESIS_SCORING_RULES[selectedThesis as keyof typeof THESIS_SCORING_RULES];
    if (!rules) {
      return { economic: 0, political: 0, social: 0, environmental: 0, overall: 0 };
    }

    let economicScore = 0;
    let totalWeight = 0;

    // Calculate economic score based on real data
    Object.entries(rules.economic).forEach(([metricName, rule]) => {
      const liveValue = getLiveValue(metricName);
      if (liveValue?.value !== null && liveValue?.value !== undefined) {
        const value = liveValue.value;
        let score = 0;

        // Score based on thresholds
        if (value <= rule.threshold.positive) {
          score = 2; // Strong positive
        } else if (value <= (rule.threshold.positive + rule.threshold.negative) / 2) {
          score = 1; // Mild positive
        } else if (value <= rule.threshold.negative) {
          score = -1; // Mild negative
        } else {
          score = -2; // Strong negative
        }

        economicScore += score * rule.weight;
        totalWeight += rule.weight;
      }
    });

    // Normalize economic score
    const normalizedEconomic = totalWeight > 0 ? economicScore / totalWeight : 0;

    // For now, political/social/environmental are placeholder
    // You could expand these with more data sources
    const political = normalizedEconomic * 0.3; // Correlated but weaker
    const social = normalizedEconomic * 0.2;
    const environmental = 0; // Neutral for now

    const overall = (normalizedEconomic + political + social + environmental) / 4;

    return {
      economic: normalizedEconomic,
      political,
      social,
      environmental,
      overall
    };
  }, [selectedThesis, liveData, getLiveValue]);

  // Generate key metrics with real signal analysis
  const keyMetrics = useMemo((): SignalData[] => {
    const metrics: SignalData[] = [];
    const rules = THESIS_SCORING_RULES[selectedThesis as keyof typeof THESIS_SCORING_RULES];
    
    if (rules) {
      Object.entries(rules.economic).forEach(([metricName, rule]) => {
        const liveValue = getLiveValue(metricName);
        let signal: 'confirm' | 'contradict' | 'neutral' = 'neutral';
        let reasoning = 'No data available';

        if (liveValue?.value !== null && liveValue?.value !== undefined) {
          const value = liveValue.value;
          
          if (value <= rule.threshold.positive) {
            signal = 'confirm';
            reasoning = `Value ${value.toFixed(2)} supports thesis (≤${rule.threshold.positive})`;
          } else if (value >= rule.threshold.negative) {
            signal = 'contradict';
            reasoning = `Value ${value.toFixed(2)} contradicts thesis (≥${rule.threshold.negative})`;
          } else {
            signal = 'neutral';
            reasoning = `Value ${value.toFixed(2)} is neutral`;
          }
        }

        metrics.push({
          name: metricName,
          currentSignal: signal,
          impact: rule.weight >= 0.25 ? 'high' : rule.weight >= 0.15 ? 'medium' : 'low',
          change: liveValue?.change ? 
            (liveValue.change > 0 ? `↑ +${Math.abs(liveValue.change).toFixed(2)}` : 
             liveValue.change < 0 ? `↓ -${Math.abs(liveValue.change).toFixed(2)}` : '→ 0.00') : '→',
          nextUpdate: getNextUpdateEstimate(metricName),
          value: liveValue?.value,
          reasoning
        });
      });
    }

    return metrics;
  }, [selectedThesis, liveData, getLiveValue]);

  // Generate conflict alerts based on real data
  const conflictAlerts = useMemo((): ConflictAlert[] => {
    const alerts: ConflictAlert[] = [];
    
    // GDP vs Employment conflict
    const gdpValue = getLiveValue('Real GDP Growth Rate');
    const unemploymentValue = getLiveValue('Unemployment Rate (U-3)');
    
    if (gdpValue?.value && unemploymentValue?.value) {
      const gdpNegative = gdpValue.value < 0;
      const unemploymentLow = unemploymentValue.value < 4.0;
      
      if (gdpNegative && unemploymentLow) {
        alerts.push({
          title: 'GDP vs Employment Divergence',
          severity: 'HIGH',
          description: `GDP contracting (${gdpValue.value.toFixed(1)}%) while unemployment remains low (${unemploymentValue.value.toFixed(1)}%) - unusual pattern`,
          isActive: true
        });
      }
    }

    // Inflation vs Fed Policy conflict
    const inflationValue = getLiveValue('Core PCE');
    const fedRateValue = getLiveValue('Fed Funds Rate');
    
    if (inflationValue?.value && fedRateValue?.value) {
      const inflationHigh = inflationValue.value > 3.0;
      const fedRateLow = fedRateValue.value < 4.0;
      
      if (inflationHigh && fedRateLow) {
        alerts.push({
          title: 'Inflation vs Fed Policy Mismatch',
          severity: 'MEDIUM',
          description: `Core inflation at ${inflationValue.value.toFixed(1)}% while Fed funds only ${fedRateValue.value.toFixed(1)}% - policy may be too accommodative`,
          isActive: true
        });
      }
    }

    return alerts;
  }, [liveData, getLiveValue]);

  // Generate threshold triggers
  const thresholdTriggers = useMemo((): ThresholdTrigger[] => {
    const triggers: ThresholdTrigger[] = [];
    
    // Recession triggers
    const gdpValue = getLiveValue('Real GDP Growth Rate');
    const unemploymentValue = getLiveValue('Unemployment Rate (U-3)');
    const claimsValue = getLiveValue('Initial Jobless Claims');
    
    let recessionConditionsMet = 0;
    const recessionConditions = [
      `GDP growth negative: ${gdpValue?.value ? (gdpValue.value < 0 ? '✓' : '✗') : '?'}`,
      `Unemployment rising >0.5%: ${unemploymentValue?.change ? (unemploymentValue.change > 0.5 ? '✓' : '✗') : '?'}`,
      `Initial claims >400K: ${claimsValue?.value ? (claimsValue.value > 400 ? '✓' : '✗') : '?'}`
    ];
    
    if (gdpValue?.value && gdpValue.value < 0) recessionConditionsMet++;
    if (unemploymentValue?.change && unemploymentValue.change > 0.5) recessionConditionsMet++;
    if (claimsValue?.value && claimsValue.value > 400) recessionConditionsMet++;
    
    triggers.push({
      title: 'Recession Warning Triggers',
      conditions: recessionConditions,
      status: recessionConditionsMet >= 2 ? 'Alert Zone' : recessionConditionsMet >= 1 ? 'Monitor Zone' : 'Safe Zone',
      triggered: `${recessionConditionsMet} of 3 triggered`,
      statusColor: recessionConditionsMet >= 2 ? '#ef4444' : recessionConditionsMet >= 1 ? '#f59e0b' : '#10b981',
      conditionsMet: recessionConditionsMet,
      totalConditions: 3
    });

    return triggers;
  }, [liveData, getLiveValue]);

  return {
    selectedThesis,
    setSelectedThesis,
    evidenceScores,
    keyMetrics,
    conflictAlerts,
    thresholdTriggers,
    loading,
    error,
    lastFetched,
    fetchData
  };
}