// lib/hooks/useEnhancedSignalAnalysis.ts

import { useState, useMemo } from 'react';
import { useLiveData } from '@/lib/context/DataContext';
import { ENHANCED_THESIS_SCORING_RULES } from '@/lib/config/enhancedThesisRules';
import {
  calculateEnhancedEvidenceScores,
  generateEnhancedKeyMetrics,
  generateEnhancedConflictAlerts,
  evaluateEnhancedThresholdTriggers // NEW IMPORT
} from '@/lib/utils/analysisUtils';
import type {
  EvidenceScores,
  MarketIndicators,
  SignalData,
  ConflictAlert,
  ThresholdTrigger // NEW IMPORT FOR TYPE
} from '@/lib/utils/analysisUtils';

// All local interface definitions (SignalData, MarketIndicators, EvidenceScores, ConflictAlert, ThresholdTrigger)
// can now be removed from this file as they are imported from analysisUtils.ts (or should be if they aren't already)

export function useEnhancedSignalAnalysis() {
  const { loading, error, lastFetched, fetchData, getLiveValue } = useLiveData();
  const [selectedThesis, setSelectedThesis] = useState<string>('economic-transition');

  const marketData = useMemo((): MarketIndicators => {
    return {
      vix: getLiveValue('VIX Index')?.value || null,
      sp500: getLiveValue('S&P 500')?.value || null,
      dollarIndex: getLiveValue('Dollar Index')?.value || null,
      gold: getLiveValue('Gold Price')?.value || null
    };
  }, [getLiveValue]);

  const evidenceScores = useMemo((): EvidenceScores => {
    return calculateEnhancedEvidenceScores(
      selectedThesis,
      ENHANCED_THESIS_SCORING_RULES,
      marketData,
      getLiveValue
    );
  }, [selectedThesis, marketData, getLiveValue]);

  const keyMetrics = useMemo((): SignalData[] => {
    return generateEnhancedKeyMetrics(
      selectedThesis,
      ENHANCED_THESIS_SCORING_RULES,
      marketData,
      getLiveValue
    );
  }, [selectedThesis, marketData, getLiveValue]);

  const conflictAlerts = useMemo((): ConflictAlert[] => {
    return generateEnhancedConflictAlerts(
      getLiveValue
    );
  }, [getLiveValue]);

  // THIS BLOCK IS NOW REPLACED for thresholdTriggers
  const thresholdTriggers = useMemo((): ThresholdTrigger[] => {
    return evaluateEnhancedThresholdTriggers(
      getLiveValue
    );
  }, [getLiveValue]);

  return {
    selectedThesis,
    setSelectedThesis,
    evidenceScores,
    keyMetrics,
    conflictAlerts,
    thresholdTriggers,
    marketData,
    loading,
    error,
    lastFetched,
    fetchData,
  };
}