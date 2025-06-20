// lib/hooks/useSignalAnalysis.ts

import { useState, useMemo } from 'react';

import { useLiveData } from '@/lib/context/DataContext';
import { THESIS_SCORING_RULES } from '@/lib/config/signalThesisRules';
import {
  calculatePocWeightOfEvidence,
  PocAnalysisOutput,
  PocMetricAnalysisDetail,
  ConflictAlert,
  ThresholdTrigger,
  BasicEvidenceScores
} from '@/lib/analysis';

// Interface for key metrics that matches SignalDashboard expectations
export interface SignalData {
  name: string;
  currentSignal: 'confirm' | 'contradict' | 'neutral';
  value: number | null;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  change: string;
  nextUpdate: string;
}

// Helper function for update frequency estimation
const getNextUpdateEstimate = (metricName: string): string => {
  const dailyMetrics = ['Fed Funds Rate', '10-Year Treasury Yield', 'VIX Index', 'S&P 500', 'Dollar Index'];
  const weeklyMetrics = ['Initial Jobless Claims'];
  const monthlyMetrics = ['Unemployment Rate (U-3)', 'Core PCE', 'Consumer Confidence Index'];
  
  if (dailyMetrics.includes(metricName)) return 'Daily';
  if (weeklyMetrics.includes(metricName)) return 'Weekly';
  if (monthlyMetrics.includes(metricName)) return 'Monthly';
  return 'Quarterly';
};

export function useSignalAnalysis() {
  const { loading, error, lastFetched, fetchData, getLiveValue } = useLiveData();
  const [selectedThesis, setSelectedThesis] = useState<string>('economic-transition');

  // Calculate evidence scores using POC analysis
  const evidenceScores = useMemo((): BasicEvidenceScores => {
    if (loading || typeof getLiveValue !== 'function') {
      return {
        economic: 0,
        political: 0,
        social: 0,
        environmental: 0,
        overall: 0,
      };
    }

    try {
      const { overallScore }: PocAnalysisOutput = calculatePocWeightOfEvidence(
        selectedThesis,
        THESIS_SCORING_RULES,
        getLiveValue
      );

      return {
        economic: overallScore,
        political: 0,
        social: 0,
        environmental: 0,
        overall: overallScore,
      };
    } catch (error) {
      return {
        economic: 0,
        political: 0,
        social: 0,
        environmental: 0,
        overall: 0,
      };
    }
  }, [selectedThesis, loading, getLiveValue]);

  // Generate key metrics with real signal analysis
  const keyMetrics = useMemo((): SignalData[] => {
    if (loading || typeof getLiveValue !== 'function') {
      return [];
    }

    try {
      const { metricDetails }: PocAnalysisOutput = calculatePocWeightOfEvidence(
        selectedThesis,
        THESIS_SCORING_RULES,
        getLiveValue
      );

      return metricDetails.map((detail: PocMetricAnalysisDetail): SignalData => {
        const liveData = getLiveValue(detail.name);
        let changeStr = '→';
        if (liveData?.change !== undefined && liveData.change !== null) {
          if (liveData.change > 0) changeStr = `↑ +${Math.abs(liveData.change).toFixed(2)}`;
          else if (liveData.change < 0) changeStr = `↓ -${Math.abs(liveData.change).toFixed(2)}`;
          else changeStr = '→ 0.00';
        }

        // Map signal to expected format
        let currentSignal: 'confirm' | 'contradict' | 'neutral' = 'neutral';
        if (detail.signal.toLowerCase().includes('support') || detail.signal.toLowerCase().includes('confirm')) {
          currentSignal = 'confirm';
        } else if (detail.signal.toLowerCase().includes('contradict') || detail.signal.toLowerCase().includes('oppose')) {
          currentSignal = 'contradict';
        }

        const reasoning = detail.reasoning || `Value: ${detail.currentValue !== null ? detail.currentValue.toFixed(2) : 'N/A'}. ${detail.signal}.`;

        return {
          name: detail.name,
          currentSignal,
          value: detail.currentValue,
          reasoning,
          impact: detail.weight >= 0.10 ? 'high' : detail.weight >= 0.05 ? 'medium' : 'low',
          change: changeStr,
          nextUpdate: getNextUpdateEstimate(detail.name),
        };
      });
    } catch (error) {
      return [];
    }
  }, [selectedThesis, loading, getLiveValue]);

  // Empty arrays for conflict alerts and threshold triggers (POC)
  const conflictAlerts = useMemo((): ConflictAlert[] => [], []);
  const thresholdTriggers = useMemo((): ThresholdTrigger[] => [], []);

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
    fetchData,
  };
}

