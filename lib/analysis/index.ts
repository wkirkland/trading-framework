// lib/analysis/index.ts
// Public API exports for the analysis system

// Types
export * from './types/analysis.types';

// Evidence Scoring
export {
  calculateEnhancedEvidenceScores,
  calculateBasicEvidenceScores,
  calculateThresholdScore,
  normalizeWeightedScore
} from './scoring/evidenceScoring';

// Signal Generation
export {
  generateEnhancedKeyMetrics,
  generateBasicKeyMetrics,
  getNextUpdateEstimate,
  determineImpactLevel,
  formatChangeValue,
  createSignalReasoning
} from './signals/signalGeneration';

// Conflict Detection
export {
  generateEnhancedConflictAlerts,
  checkGdpMarketDivergence,
  checkVixEquityDivergence,
  checkDollarGoldConflict,
  checkUnemploymentMarketDivergence,
  checkInflationBondDivergence,
  determineConflictSeverity,
  formatConflictDescription
} from './alerts/conflictDetection';

// Threshold Triggers
export {
  evaluateEnhancedThresholdTriggers,
  evaluateMarketStressTriggers,
  evaluateRecessionTriggers,
  evaluateInflationTriggers,
  evaluateGeopoliticalTriggers,
  determineStatus,
  getStatusColor,
  createCustomTrigger
} from './alerts/thresholdTriggers';

// POC Analysis
export {
  calculatePocWeightOfEvidence,
  calculateEnhancedPocAnalysis,
  getPocAnalysisSummary
} from './scoring/pocAnalysis';

// --- CONVENIENCE FUNCTIONS ---

// Import functions for use in convenience functions
import { calculateEnhancedEvidenceScores, calculateBasicEvidenceScores } from './scoring/evidenceScoring';
import { generateEnhancedKeyMetrics, generateBasicKeyMetrics } from './signals/signalGeneration';
import { generateEnhancedConflictAlerts } from './alerts/conflictDetection';
import { evaluateEnhancedThresholdTriggers } from './alerts/thresholdTriggers';
import { calculatePocWeightOfEvidence } from './scoring/pocAnalysis';

/**
 * Complete analysis pipeline - generates all analysis outputs
 */
export async function performCompleteAnalysis(params: {
  selectedThesis: string;
  allThesisScoringRules: any;
  allPocThesisScoringRules: any;
  marketData: any;
  getLiveValue: any;
  includePoC?: boolean;
}) {
  const {
    selectedThesis,
    allThesisScoringRules,
    allPocThesisScoringRules,
    marketData,
    getLiveValue,
    includePoC = false
  } = params;

  // Evidence scores
  const evidenceScores = calculateEnhancedEvidenceScores(
    selectedThesis,
    allThesisScoringRules,
    marketData,
    getLiveValue
  );

  // Key metrics
  const keyMetrics = generateEnhancedKeyMetrics(
    selectedThesis,
    allThesisScoringRules,
    marketData,
    getLiveValue
  );

  // Conflict alerts
  const conflictAlerts = generateEnhancedConflictAlerts(getLiveValue);

  // Threshold triggers
  const thresholdTriggers = evaluateEnhancedThresholdTriggers(getLiveValue);

  // POC analysis (optional)
  const pocAnalysis = includePoC ? 
    calculatePocWeightOfEvidence(selectedThesis, allPocThesisScoringRules, getLiveValue) : 
    null;

  return {
    evidenceScores,
    keyMetrics,
    conflictAlerts,
    thresholdTriggers,
    pocAnalysis
  };
}

/**
 * Basic analysis pipeline - economic data only
 */
export async function performBasicAnalysis(params: {
  selectedThesis: string;
  allThesisScoringRules: any;
  getLiveValue: any;
}) {
  const { selectedThesis, allThesisScoringRules, getLiveValue } = params;

  // Basic evidence scores (economic only)
  const evidenceScores = calculateBasicEvidenceScores(
    selectedThesis,
    allThesisScoringRules,
    getLiveValue
  );

  // Basic key metrics (economic only)
  const keyMetrics = generateBasicKeyMetrics(
    selectedThesis,
    allThesisScoringRules,
    getLiveValue
  );

  return {
    evidenceScores,
    keyMetrics
  };
}