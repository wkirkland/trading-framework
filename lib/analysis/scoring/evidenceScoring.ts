// lib/analysis/scoring/evidenceScoring.ts
// Evidence score calculation logic

import type {
  EvidenceScores,
  BasicEvidenceScores,
  MarketIndicators,
  GetLiveValueFunction,
  ThesisScoringRules
} from '../types/analysis.types';

/**
 * Calculate enhanced evidence scores including market data
 */
export function calculateEnhancedEvidenceScores(
  selectedThesis: string,
  allThesisScoringRules: Record<string, ThesisScoringRules>,
  marketData: MarketIndicators,
  getLiveValue: GetLiveValueFunction
): EvidenceScores {
  const rules = allThesisScoringRules[selectedThesis];

  if (!rules) {
    console.warn(`No scoring rules found for thesis (evidenceScores): ${selectedThesis}`);
    return { economic: 0, political: 0, social: 0, environmental: 0, market: 0, overall: 0 };
  }

  let economicScore = 0;
  let economicWeight = 0;
  Object.entries(rules.economic).forEach(([metricName, rule]) => {
    const liveValue = getLiveValue(metricName);
    if (liveValue?.value !== null && liveValue?.value !== undefined) {
      const value = liveValue.value;
      let score = 0;
      if (value <= rule.threshold.positive) score = 2;
      else if (value <= (rule.threshold.positive + rule.threshold.negative) / 2) score = 1;
      else if (value <= rule.threshold.negative) score = -1;
      else score = -2;
      economicScore += score * rule.weight;
      economicWeight += rule.weight;
    }
  });

  let marketScore = 0;
  let marketWeight = 0;
  if (rules.market) {
    if (marketData.vix !== null) {
      const vixRule = rules.market['VIX Index'];
      if (vixRule) {
        let vixScore = 0;
        if (selectedThesis === 'soft-landing') {
          vixScore = marketData.vix <= vixRule.threshold.positive ? 2 :
                     marketData.vix <= (vixRule.threshold.positive + vixRule.threshold.negative) / 2 ? 0 : -2;
        } else {
          vixScore = marketData.vix >= vixRule.threshold.positive ? 2 :
                     marketData.vix >= (vixRule.threshold.positive + vixRule.threshold.negative) / 2 ? 0 : -2;
        }
        marketScore += vixScore * vixRule.weight;
        marketWeight += vixRule.weight;
      }
    }
    if (marketData.sp500 !== null) {
      const sp500Rule = rules.market['S&P 500'];
      if (sp500Rule) {
        let sp500Score = 0;
        if (selectedThesis === 'soft-landing') {
          sp500Score = marketData.sp500 >= sp500Rule.threshold.positive ? 2 :
                       marketData.sp500 >= (sp500Rule.threshold.positive + sp500Rule.threshold.negative) / 2 ? 0 : -2;
        } else {
          sp500Score = marketData.sp500 <= sp500Rule.threshold.negative ? 2 :
                       marketData.sp500 <= (sp500Rule.threshold.positive + sp500Rule.threshold.negative) / 2 ? 0 : -2;
        }
        marketScore += sp500Score * sp500Rule.weight;
        marketWeight += sp500Rule.weight;
      }
    }
    if (marketData.dollarIndex !== null) {
      const dxyRule = rules.market['Dollar Index'];
      if (dxyRule) {
        let dxyScore = 0;
        if (marketData.dollarIndex >= dxyRule.threshold.positive) {
          dxyScore = selectedThesis === 'economic-transition' ? 1 : -1;
        } else if (marketData.dollarIndex <= dxyRule.threshold.negative) {
          dxyScore = selectedThesis === 'soft-landing' ? 1 : -1;
        }
        marketScore += dxyScore * dxyRule.weight;
        marketWeight += dxyRule.weight;
      }
    }
    if (marketData.gold !== null) {
      const goldRule = rules.market['Gold Price'];
      if (goldRule) {
        let goldScore = 0;
        if (selectedThesis === 'soft-landing') {
          goldScore = marketData.gold <= goldRule.threshold.negative ? 2 :
                      marketData.gold <= (goldRule.threshold.positive + goldRule.threshold.negative) / 2 ? 0 : -2;
        } else {
          goldScore = marketData.gold >= goldRule.threshold.positive ? 2 :
                      marketData.gold >= (goldRule.threshold.positive + goldRule.threshold.negative) / 2 ? 0 : -2;
        }
        marketScore += goldScore * goldRule.weight;
        marketWeight += goldRule.weight;
      }
    }
  }

  const normalizedEconomic = economicWeight > 0 ? economicScore / economicWeight : 0;
  const normalizedMarket = marketWeight > 0 ? marketScore / marketWeight : 0;
  const political = normalizedEconomic * 0.3;
  const social = normalizedEconomic * 0.2;
  const environmental = 0;
  const overall = (normalizedEconomic * 0.4 + normalizedMarket * 0.3 + political * 0.2 + social * 0.1);

  return {
    economic: normalizedEconomic,
    political,
    social,
    environmental,
    market: normalizedMarket,
    overall,
  };
}

/**
 * Calculate basic evidence scores (economic only)
 */
export function calculateBasicEvidenceScores(
  selectedThesis: string,
  allThesisScoringRules: Record<string, ThesisScoringRules>,
  getLiveValue: GetLiveValueFunction
): BasicEvidenceScores {
  const rules = allThesisScoringRules[selectedThesis];
  
  if (!rules) {
    console.warn(`No scoring rules found for thesis (basic evidenceScores): ${selectedThesis}`);
    return { economic: 0, political: 0, social: 0, environmental: 0, overall: 0 };
  }

  let economicScore = 0;
  let economicWeight = 0;
  Object.entries(rules.economic).forEach(([metricName, rule]) => {
    const liveValue = getLiveValue(metricName);
    if (liveValue?.value !== null && liveValue?.value !== undefined) {
      const value = liveValue.value;
      let score = 0;
      if (value <= rule.threshold.positive) score = 2;
      else if (value <= (rule.threshold.positive + rule.threshold.negative) / 2) score = 1;
      else if (value <= rule.threshold.negative) score = -1;
      else score = -2;
      economicScore += score * rule.weight;
      economicWeight += rule.weight;
    }
  });

  const normalizedEconomic = economicWeight > 0 ? economicScore / economicWeight : 0;
  const political = normalizedEconomic * 0.3;
  const social = normalizedEconomic * 0.2;
  const environmental = 0;
  const overall = (normalizedEconomic * 0.6 + political * 0.3 + social * 0.1);

  return {
    economic: normalizedEconomic,
    political,
    social,
    environmental,
    overall,
  };
}

/**
 * Helper function to calculate score based on value and thresholds
 */
export function calculateThresholdScore(
  value: number,
  thresholds: { positive: number; negative: number },
  isPositiveGood: boolean = true
): number {
  if (isPositiveGood) {
    if (value <= thresholds.positive) return 2;
    else if (value <= (thresholds.positive + thresholds.negative) / 2) return 1;
    else if (value <= thresholds.negative) return -1;
    else return -2;
  } else {
    if (value >= thresholds.positive) return 2;
    else if (value >= (thresholds.positive + thresholds.negative) / 2) return 1;
    else if (value >= thresholds.negative) return -1;
    else return -2;
  }
}

/**
 * Normalize weighted scores
 */
export function normalizeWeightedScore(score: number, totalWeight: number): number {
  return totalWeight > 0 ? score / totalWeight : 0;
}