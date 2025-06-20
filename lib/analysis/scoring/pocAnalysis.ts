// lib/analysis/scoring/pocAnalysis.ts
// POC (Proof of Concept) analysis scoring system

import type {
  PocAnalysisOutput,
  PocMetricAnalysisDetail,
  GetLiveValueFunction,
  PocMetricRule,
  POC_THESIS_SCORING_RULES_TYPE,
  CalculatePocAnalysisParams
} from '../types/analysis.types';

/**
 * Calculates the "Weight of Evidence" for a selected PoC thesis
 * based on the new rule structure defined in signalThesisRules.ts.
 */
export function calculatePocWeightOfEvidence(
  selectedThesisName: string,
  allPocThesisScoringRules: typeof POC_THESIS_SCORING_RULES_TYPE,
  getLiveValue: GetLiveValueFunction
): PocAnalysisOutput {
  const thesisRules = allPocThesisScoringRules[selectedThesisName];
  
  let overallScore = 0;
  let totalWeight = 0;
  const metricDetails: PocMetricAnalysisDetail[] = [];
  
  // Category breakdown tracking
  const categoryBreakdown = {
    economic: { score: 0, weight: 0, count: 0 },
    market: { score: 0, weight: 0, count: 0 }
  };

  // Summary tracking
  const summary = {
    confirming: 0,
    contradicting: 0,
    neutral: 0,
    dataAvailable: 0,
    totalMetrics: 0
  };

  if (!thesisRules || !thesisRules.metrics) {
    console.warn(`[calculatePocWeightOfEvidence] No PoC scoring rules found for thesis: ${selectedThesisName}`);
    return {
      overallScore: 0,
      totalWeight: 0,
      categoryBreakdown,
      metricDetails: [],
      summary
    };
  }

  // Iterate over the metrics defined in the THESIS_SCORING_RULES for the selected thesis
  for (const metricName in thesisRules.metrics) {
    if (Object.prototype.hasOwnProperty.call(thesisRules.metrics, metricName)) {
      const metricConfig = thesisRules.metrics[metricName];
      const liveData = getLiveValue(metricName);
      const currentValue = liveData?.value ?? null;

      summary.totalMetrics++;
      
      let individualScore = 0;
      let signal: PocMetricRule['signal'] | 'no_data' | 'neutral_no_match' = 'no_data';
      let reasoning = 'N/A (No Live Data)';

      if (currentValue !== null) {
        summary.dataAvailable++;
        signal = 'neutral_no_match';
        reasoning = `No rule matched for value: ${currentValue.toFixed(2)}`;

        // Process rules to find matching condition
        if (Array.isArray(metricConfig.rules)) {
          for (const rule of metricConfig.rules as PocMetricRule[]) {
            const matchResult = evaluateRuleCondition(rule, currentValue);
            
            if (matchResult.conditionMet) {
              individualScore = rule.score;
              signal = rule.signal;
              reasoning = matchResult.description;
              break;
            }
          }
        } else {
          console.warn(`[calculatePocWeightOfEvidence] No 'rules' array found for metric: ${metricName} in thesis: ${selectedThesisName}`);
        }
      }

      // Calculate weighted contribution
      const weightedContribution = individualScore * metricConfig.weight;
      overallScore += weightedContribution;
      totalWeight += metricConfig.weight;

      // Update category breakdown
      const category = determineMetricCategory(metricName);
      if (category in categoryBreakdown) {
        categoryBreakdown[category].score += weightedContribution;
        categoryBreakdown[category].weight += metricConfig.weight;
        categoryBreakdown[category].count++;
      }

      // Update summary counts
      updateSummaryCounts(signal, summary);

      metricDetails.push({
        name: metricName,
        currentValue,
        signal: signal as string,
        individualScore,
        weight: metricConfig.weight,
        weightedContribution,
        reasoning
      });
    }
  }

  return {
    overallScore,
    totalWeight,
    categoryBreakdown,
    metricDetails,
    summary
  };
}

/**
 * Evaluate a single rule condition against a value
 */
function evaluateRuleCondition(rule: PocMetricRule, value: number): {
  conditionMet: boolean;
  description: string;
} {
  let conditionMet = false;
  let description = '';

  if (rule.if_above !== undefined) {
    description = `value (${value.toFixed(2)}) > ${rule.if_above}`;
    conditionMet = value > rule.if_above;
  } else if (rule.if_below !== undefined) {
    description = `value (${value.toFixed(2)}) < ${rule.if_below}`;
    conditionMet = value < rule.if_below;
  } else if (rule.if_between && Array.isArray(rule.if_between) && rule.if_between.length === 2) {
    description = `value (${value.toFixed(2)}) >= ${rule.if_between[0]} AND value < ${rule.if_between[1]}`;
    conditionMet = value >= rule.if_between[0] && value < rule.if_between[1];
  }

  return { conditionMet, description };
}

/**
 * Determine metric category based on metric name
 */
function determineMetricCategory(metricName: string): 'economic' | 'market' {
  const marketMetrics = ['VIX Index', 'S&P 500', 'Dollar Index', 'Gold Price', '10-Year Treasury Yield'];
  return marketMetrics.includes(metricName) ? 'market' : 'economic';
}

/**
 * Update summary counts based on signal type
 */
function updateSummaryCounts(
  signal: PocMetricRule['signal'] | 'no_data' | 'neutral_no_match',
  summary: PocAnalysisOutput['summary']
): void {
  switch (signal) {
    case 'strong_confirm':
    case 'mild_confirm':
      summary.confirming++;
      break;
    case 'strong_contradict':
    case 'mild_contradict':
      summary.contradicting++;
      break;
    case 'neutral':
    case 'neutral_no_match':
    case 'no_data':
    default:
      summary.neutral++;
      break;
  }
}

/**
 * Calculate PoC analysis with enhanced metrics
 */
export function calculateEnhancedPocAnalysis(
  selectedThesis: string,
  allPocThesisScoringRules: typeof POC_THESIS_SCORING_RULES_TYPE,
  getLiveValue: GetLiveValueFunction,
  metricNames: string[]
): PocAnalysisOutput {
  const result = calculatePocWeightOfEvidence(selectedThesis, allPocThesisScoringRules, getLiveValue);
  
  // Filter metrics to only include specified ones if provided
  if (metricNames.length > 0) {
    result.metricDetails = result.metricDetails.filter(detail => 
      metricNames.includes(detail.name)
    );
    
    // Recalculate scores based on filtered metrics
    const filteredResult = recalculateScores(result.metricDetails);
    return {
      ...result,
      ...filteredResult
    };
  }

  return result;
}

/**
 * Recalculate scores based on filtered metric details
 */
function recalculateScores(metricDetails: PocMetricAnalysisDetail[]): {
  overallScore: number;
  totalWeight: number;
  categoryBreakdown: PocAnalysisOutput['categoryBreakdown'];
  summary: PocAnalysisOutput['summary'];
} {
  let overallScore = 0;
  let totalWeight = 0;
  
  const categoryBreakdown = {
    economic: { score: 0, weight: 0, count: 0 },
    market: { score: 0, weight: 0, count: 0 }
  };

  const summary = {
    confirming: 0,
    contradicting: 0,
    neutral: 0,
    dataAvailable: 0,
    totalMetrics: metricDetails.length
  };

  metricDetails.forEach(detail => {
    overallScore += detail.weightedContribution;
    totalWeight += detail.weight;
    
    if (detail.currentValue !== null) {
      summary.dataAvailable++;
    }

    const category = determineMetricCategory(detail.name);
    if (category in categoryBreakdown) {
      categoryBreakdown[category].score += detail.weightedContribution;
      categoryBreakdown[category].weight += detail.weight;
      categoryBreakdown[category].count++;
    }

    // Convert signal back to enum for counting
    const signal = detail.signal as PocMetricRule['signal'] | 'no_data' | 'neutral_no_match';
    updateSummaryCounts(signal, summary);
  });

  return {
    overallScore,
    totalWeight,
    categoryBreakdown,
    summary
  };
}

/**
 * Get PoC analysis summary statistics
 */
export function getPocAnalysisSummary(analysis: PocAnalysisOutput): {
  score: number;
  confidence: number;
  dataQuality: number;
  signalDistribution: { confirming: number; contradicting: number; neutral: number };
} {
  const normalizedScore = analysis.totalWeight > 0 ? analysis.overallScore / analysis.totalWeight : 0;
  const dataQuality = analysis.summary.totalMetrics > 0 ? 
    analysis.summary.dataAvailable / analysis.summary.totalMetrics : 0;
  
  const totalSignals = analysis.summary.confirming + analysis.summary.contradicting + analysis.summary.neutral;
  const signalDistribution = {
    confirming: totalSignals > 0 ? analysis.summary.confirming / totalSignals : 0,
    contradicting: totalSignals > 0 ? analysis.summary.contradicting / totalSignals : 0,
    neutral: totalSignals > 0 ? analysis.summary.neutral / totalSignals : 0
  };

  // Confidence based on data quality and signal clarity
  const signalClarity = Math.abs(signalDistribution.confirming - signalDistribution.contradicting);
  const confidence = dataQuality * signalClarity;

  return {
    score: normalizedScore,
    confidence,
    dataQuality,
    signalDistribution
  };
}