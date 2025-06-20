// lib/analysis/types/analysis.types.ts
// Type definitions for the analysis system

// --- CORE DATA TYPES ---

// Type for the getLiveValue function signature (from useLiveData via DataContext)
export interface LiveMetricData {
  value: number | null;
  formatted: string;
  date: string;
  change?: number;
  lastUpdated: string;
}

export type GetLiveValueFunction = (metricName: string) => LiveMetricData | null;

// Type for marketData object
export interface MarketIndicators {
  vix: number | null;
  sp500: number | null;
  dollarIndex: number | null;
  gold: number | null;
}

// --- EVIDENCE SCORE TYPES ---

// Type for the returned evidence scores
export interface EvidenceScores {
  economic: number;
  political: number;
  social: number;
  environmental: number;
  market: number;
  overall: number;
}

export interface BasicEvidenceScores {
  economic: number;
  political: number;
  social: number;
  environmental: number;
  overall: number;
}

// --- SIGNAL DATA TYPES ---

// Type for individual key metric data
export interface SignalData {
  name: string;
  currentSignal: 'confirm' | 'contradict' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  change: string;
  nextUpdate: string;
  value?: number | null;
  reasoning?: string;
  source?: string;
  formatted?: string;
}

export interface BasicSignalData {
  name: string;
  currentSignal: 'confirm' | 'contradict' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  change: string;
  nextUpdate: string;
  value?: number | null;
  reasoning?: string;
}

// --- ALERT TYPES ---

export interface ConflictAlert {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  isActive: boolean;
  marketBased?: boolean;
}

export interface ThresholdTrigger {
  title: string;
  conditions: string[];
  status: 'Safe Zone' | 'Monitor Zone' | 'Alert Zone';
  triggered: string;
  statusColor: string;
  conditionsMet: number;
  totalConditions: number;
  category: 'economic' | 'market' | 'geopolitical';
}

// --- LEGACY SCORING RULE TYPES ---

// Type for a single rule within THESIS_SCORING_RULES (economic or market part) - OLD STRUCTURE
interface ScoringRuleDetail {
  weight: number;
  threshold: { negative: number; positive: number };
}

// Type for the structure of rules for a single thesis - OLD STRUCTURE
export interface ThesisScoringRules {
  economic: Record<string, ScoringRuleDetail>;
  market?: Record<string, ScoringRuleDetail>;
}

// --- POC ANALYSIS TYPES ---

// Import POC types from configuration
import type {
  MetricRule as PocMetricRule,
  THESIS_SCORING_RULES as POC_THESIS_SCORING_RULES_TYPE
} from '@/lib/config/signalThesisRules';

export interface PocMetricAnalysisDetail {
  name: string;
  currentValue: number | null;
  signal: string;
  individualScore: number;
  weight: number;
  weightedContribution: number;
  reasoning: string;
}

export interface PocAnalysisOutput {
  overallScore: number;
  totalWeight: number;
  categoryBreakdown: {
    economic: { score: number; weight: number; count: number };
    market: { score: number; weight: number; count: number };
  };
  metricDetails: PocMetricAnalysisDetail[];
  summary: {
    confirming: number;
    contradicting: number;
    neutral: number;
    dataAvailable: number;
    totalMetrics: number;
  };
}

// --- FUNCTION PARAMETER TYPES ---

export interface CalculateEvidenceScoresParams {
  getLiveValue: GetLiveValueFunction;
  marketData?: MarketIndicators;
  selectedThesis?: string;
}

export interface GenerateKeyMetricsParams {
  getLiveValue: GetLiveValueFunction;
  marketData?: MarketIndicators;
  selectedThesis?: string;
}

export interface GenerateConflictAlertsParams {
  getLiveValue: GetLiveValueFunction;
  marketData: MarketIndicators;
}

export interface EvaluateThresholdTriggersParams {
  getLiveValue: GetLiveValueFunction;
  marketData: MarketIndicators;
}

export interface CalculatePocAnalysisParams {
  getLiveValue: GetLiveValueFunction;
  selectedThesis: string;
  metricNames: string[];
}

// --- UTILITY TYPES ---

export type SignalType = 'confirm' | 'contradict' | 'neutral';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type AlertSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type TriggerStatus = 'Safe Zone' | 'Monitor Zone' | 'Alert Zone';
export type CategoryType = 'economic' | 'market' | 'geopolitical';

// --- RE-EXPORT POC TYPES ---

export type { PocMetricRule };
export type { POC_THESIS_SCORING_RULES_TYPE };