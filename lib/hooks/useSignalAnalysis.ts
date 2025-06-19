// lib/hooks/useSignalAnalysis.ts (PoC Version)

import { useState, useMemo } from 'react';

import { useLiveData } from '@/lib/context/DataContext'; // Assuming correct path
import { THESIS_SCORING_RULES } from '@/lib/config/signalThesisRules'; // Our NEW PoC rules
import {
  calculatePocWeightOfEvidence, // Our NEW PoC calculation function
  PocAnalysisOutput,            // Type for the output of the new function
  PocMetricAnalysisDetail,      // Type for detailed metric analysis
  // GetLiveValueFunction,    // Already available via useLiveData
} from '@/lib/utils/analysisUtils'; // Assuming correct path
// Note: We might not need to import GetLiveValueFunction type explicitly if useLiveData provides it typed.

// Define a type for the key metrics our UI will consume for the PoC
// This can be adapted from the old SignalData or be a new structure.
// Let's make it similar to the old one but based on new data.
export interface PocKeyMetricUI {
  name: string;
  currentSignal: string; // From PocMetricAnalysisDetail.signal
  value: number | null;
  reasoning: string; // We'll construct this
  impact: 'high' | 'medium' | 'low'; // Determined by weight
  change: string; // Formatted change
  nextUpdate: string; // From a helper
  // Add other fields if your UI expects them
}

// Helper function (can be moved to analysisUtils.ts if used elsewhere, or kept local)
// This version is simplified for the PoC and assumes metrics.ts might have frequency data.
// For now, let's use a simplified version.
const getNextUpdateEstimateForPoc = (metricName: string): string => {
  // TODO: Enhance this to use frequency from metrics.ts if available for more accuracy
  const dailyMetrics = ['Fed Funds Rate', '10-Year Treasury Yield', 'VIX Index', 'S&P 500', 'Dollar Index'];
  const weeklyMetrics = ['Initial Jobless Claims'];
  // Most others are monthly or quarterly
  if (dailyMetrics.includes(metricName)) return 'Daily/Real-time';
  if (weeklyMetrics.includes(metricName)) return 'Weekly';
  return 'Monthly/Quarterly';
};

export function useSignalAnalysis() {
  const { loading, error, lastFetched, fetchData, getLiveValue } = useLiveData();
  // Default to one of our 3 PoC thesis names
  const [selectedThesis, setSelectedThesis] = useState<string>('strong-growth-stable-inflation');

  const analysisResults = useMemo((): {
    weightOfEvidence: number;
    keyMetricsForUI: PocKeyMetricUI[];
  } => {
    // Ensure getLiveValue is available and data isn't loading to prevent errors during initial render
    if (loading || typeof getLiveValue !== 'function') {
      return {
        weightOfEvidence: 0,
        keyMetricsForUI: [],
      };
    }

    // Call the new PoC-specific calculation function
    const { totalWeightedScore, metricDetails }: PocAnalysisOutput = calculatePocWeightOfEvidence(
      selectedThesis,
      THESIS_SCORING_RULES, // Pass the imported PoC rules
      getLiveValue
    );

    // Format metricDetails into PocKeyMetricUI for the dashboard
    const formattedKeyMetrics: PocKeyMetricUI[] = metricDetails.map(
      (detail: PocMetricAnalysisDetail): PocKeyMetricUI => {
        const liveData = getLiveValue(detail.name); // Get full live data for change, etc.
        let changeStr = '→';
        if (liveData?.change !== undefined && liveData.change !== null) {
          if (liveData.change > 0) changeStr = `↑ +${Math.abs(liveData.change).toFixed(2)}`;
          else if (liveData.change < 0) changeStr = `↓ -${Math.abs(liveData.change).toFixed(2)}`;
          else changeStr = '→ 0.00';
        }

        // Basic reasoning for PoC
        let reasoning = `Value: ${detail.currentValue !== null ? detail.currentValue.toFixed(2) : 'N/A'}. Signal: ${detail.signal}. Matched: ${detail.matchedRuleCondition || 'N/A'}`;
        if (detail.signal === 'no_data') {
            reasoning = 'No live data available for this metric.';
        } else if (detail.signal === 'neutral_no_match'){
            reasoning = `Live value ${detail.currentValue !== null ? detail.currentValue.toFixed(2) : 'N/A'} did not match specific rules; considered neutral.`;
        }


        return {
          name: detail.name,
          currentSignal: detail.signal,
          value: detail.currentValue,
          reasoning: reasoning,
          impact: detail.weight >= 0.10 ? 'high' : detail.weight >= 0.05 ? 'medium' : 'low', // Example impact from weight
          change: changeStr,
          nextUpdate: getNextUpdateEstimateForPoc(detail.name),
        };
      }
    );

    return {
      weightOfEvidence: totalWeightedScore,
      keyMetricsForUI: formattedKeyMetrics,
    };
  }, [selectedThesis, loading, getLiveValue]); // Add other relevant dependencies from useLiveData if they affect values used

  // For PoC, conflictAlerts and thresholdTriggers are out of scope for this core hook.
  // They can be separate hooks or added back later if their logic is updated.
  const conflictAlerts = useMemo(() => [], []); // Empty array for PoC
  const thresholdTriggers = useMemo(() => [], []); // Empty array for PoC

  return {
    selectedThesis,
    setSelectedThesis,
    evidenceScores: { // Adapt to the old 'evidenceScores' structure if UI expects it, or update UI
        overall: analysisResults.weightOfEvidence,
        economic: analysisResults.weightOfEvidence, // For PoC, overall and economic might be the same
        market: 0, // No separate market score in PoC's primary calculation
        political: 0,
        social: 0,
        environmental: 0,
    },
    keyMetrics: analysisResults.keyMetricsForUI, // This is the new detailed list
    conflictAlerts,    // Kept for API compatibility with UI, but empty for PoC
    thresholdTriggers, // Kept for API compatibility with UI, but empty for PoC
    loading,
    error,
    lastFetched,
    fetchData,
  };
}

/*
// lib/hooks/useSignalAnalysis.ts (FIXED for deployment)

import { useState, useMemo } from 'react';
import { useLiveData } from '@/lib/context/DataContext';
import { THESIS_SCORING_RULES } from '@/lib/config/signalThesisRules';
import { calculateBasicEvidenceScores } from '@/lib/utils/analysisUtils';
import { BasicEvidenceScores } from '@/lib/utils/analysisUtils';



interface SignalData {
  name: string;
  currentSignal: 'confirm' | 'contradict' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  change: string;
  nextUpdate: string;
  value?: number | null;
  reasoning?: string;
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


export function useSignalAnalysis() {
  const { loading, error, lastFetched, fetchData, getLiveValue } = useLiveData();
  const [selectedThesis, setSelectedThesis] = useState<string>('economic-transition');

  const evidenceScores = useMemo((): BasicEvidenceScores => { // Use the imported BasicEvidenceScores type
    return calculateBasicEvidenceScores(
      selectedThesis,
      THESIS_SCORING_RULES, // These are the basic rules imported from signalThesisRules.ts
      getLiveValue
    );
  }, [selectedThesis, getLiveValue]); // Dependencies for the new call

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
  }, [selectedThesis, getLiveValue]);

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
  }, [getLiveValue]);

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
  }, [getLiveValue]);

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
} */