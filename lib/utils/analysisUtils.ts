// lib/utils/analysisUtils.ts

// --- TYPE DEFINITIONS ---
// These types are used by both utility functions below.

// Type for the getLiveValue function signature (from useLiveData via DataContext)
interface LiveMetricData {
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
// Type for the returned evidence scores
export interface EvidenceScores {
economic: number;
political: number;
social: number;
environmental: number;
market: number;
overall: number;
}
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
export interface BasicEvidenceScores {
  economic: number;
  political: number;
  social: number;
  environmental: number;
  overall: number;
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
  // --- POC TYPE DEFINITIONS START ---
// We import MetricRule from where it's defined to ensure consistency.
// We also import the type of the THESIS_SCORING_RULES object itself for strong typing.
import type {
  MetricRule as PocMetricRule, // Using 'as' to alias, assuming MetricRule is exported from signalThesisRules
  THESIS_SCORING_RULES as POC_THESIS_SCORING_RULES_TYPE // Type of the exported object
} from '@/lib/config/signalThesisRules'; // Ensure this path is correct

export interface PocMetricAnalysisDetail {
  name: string;
  currentValue: number | null;
  signal: string;
  individualScore: number;
  weight: number;
  weightedContribution: number;
  matchedRuleCondition?: string;
}

export interface PocAnalysisOutput {
  totalWeightedScore: number;
  metricDetails: PocMetricAnalysisDetail[];
}
// --- POC TYPE DEFINITIONS END ---

  // --- UTILITY FUNCTIONS ---
  
  /**
   * Calculates evidence scores based on selected thesis, rules, market data, and live values.
   */
  export function calculateEnhancedEvidenceScores(
    selectedThesis: string,
    allThesisScoringRules: Record<string, ThesisScoringRules>,// This ThesisScoringRules is your OLD one
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
   * Helper function to estimate the next update frequency for a metric.
   */
  const getNextUpdateEstimate = (metricName: string): string => {
    const dailyMetrics = ['Fed Funds Rate', '10-Year Treasury Yield', 'VIX Index', 'S&P 500', 'Dollar Index', 'Gold Price'];
    const weeklyMetrics = ['Initial Jobless Claims'];
    const monthlyMetrics = ['Unemployment Rate (U-3)', 'Core PCE', 'Consumer Confidence Index'];
  
    if (dailyMetrics.includes(metricName)) return 'Real-time';
    if (weeklyMetrics.includes(metricName)) return 'Weekly';
    if (monthlyMetrics.includes(metricName)) return 'Monthly';
    return 'Quarterly';
  };
  
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
        let signal: 'confirm' | 'contradict' | 'neutral' = 'neutral';
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
          impact: rule.weight >= 0.25 ? 'high' : rule.weight >= 0.15 ? 'medium' : 'low',
          change: liveValue?.change !== undefined ?
            (liveValue.change > 0 ? `↑ +${Math.abs(liveValue.change).toFixed(2)}` :
             liveValue.change < 0 ? `↓ -${Math.abs(liveValue.change).toFixed(2)}` : '→ 0.00') : '→',
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
        let signal: 'confirm' | 'contradict' | 'neutral' = 'neutral';
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
                signal = value <= rule.threshold.positive ? 'confirm' : value >= rule.threshold.negative ? 'contradict' : 'neutral';
                reasoning = `VIX ${value.toFixed(1)} ${signal === 'confirm' ? 'shows market confidence' : signal === 'contradict' ? 'shows elevated stress' : 'is neutral'}`;
              } else {
                signal = value >= rule.threshold.positive ? 'confirm' : value <= rule.threshold.negative ? 'contradict' : 'neutral';
                reasoning = `VIX ${value.toFixed(1)} ${signal === 'confirm' ? 'confirms market stress' : signal === 'contradict' ? 'shows complacency' : 'is neutral'}`;
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
                signal = value >= rule.threshold.positive ? 'confirm' : value <= rule.threshold.negative ? 'contradict' : 'neutral';
                reasoning = `S&P 500 at ${value.toFixed(0)} ${signal === 'confirm' ? 'shows market confidence' : signal === 'contradict' ? 'shows weakness' : 'is neutral'}`;
              } else {
                signal = value <= rule.threshold.negative ? 'confirm' : value >= rule.threshold.positive ? 'contradict' : 'neutral';
                reasoning = `S&P 500 at ${value.toFixed(0)} ${signal === 'confirm' ? 'confirms economic stress' : signal === 'contradict' ? 'shows resilience' : 'is neutral'}`;
              }
            }
            break;
          case 'Dollar Index':
            const dxyLiveValue = getLiveValue('Dollar Index');
            value = dxyLiveValue?.value || null;
            formatted = dxyLiveValue?.formatted || (value !== null ? value.toFixed(1) : '');
            changeFromMarket = dxyLiveValue?.change;
            if (value !== null) {
              signal = value >= rule.threshold.positive ? 'confirm' : value <= rule.threshold.negative ? 'contradict' : 'neutral';
              reasoning = `Dollar Index ${value.toFixed(1)} ${signal === 'confirm' ? 'shows USD strength' : signal === 'contradict' ? 'shows USD weakness' : 'is neutral'}`;
            }
            break;
          case 'Gold Price':
            const goldLiveValue = getLiveValue('Gold Price');
            value = goldLiveValue?.value || null;
            formatted = goldLiveValue?.formatted || (value !== null ? value.toFixed(0) : '');
            changeFromMarket = goldLiveValue?.change;
            if (value !== null) {
              if (selectedThesis === 'soft-landing') {
                signal = value <= rule.threshold.negative ? 'confirm' : value >= rule.threshold.positive ? 'contradict' : 'neutral';
                reasoning = `Gold at $${value.toFixed(0)} ${signal === 'confirm' ? 'shows low uncertainty' : signal === 'contradict' ? 'shows high uncertainty' : 'is neutral'}`;
              } else {
                signal = value >= rule.threshold.positive ? 'confirm' : value <= rule.threshold.negative ? 'contradict' : 'neutral';
                reasoning = `Gold at $${value.toFixed(0)} ${signal === 'confirm' ? 'shows safe haven demand' : signal === 'contradict' ? 'shows low uncertainty' : 'is neutral'}`;
              }
            }
            break;
        }
  
        metrics.push({
          name: indicatorName,
          currentSignal: signal,
          impact: rule.weight >= 0.25 ? 'high' : rule.weight >= 0.15 ? 'medium' : 'low',
          change: changeFromMarket !== undefined ?
                  (changeFromMarket > 0 ? `↑ +${Math.abs(changeFromMarket).toFixed(2)}` :
                   changeFromMarket < 0 ? `↓ -${Math.abs(changeFromMarket).toFixed(2)}` : '→ 0.00') : '→',
          nextUpdate: 'Real-time',
          value,
          reasoning,
          source: 'Market Data',
          formatted
        });
      });
    }
    return metrics;
  }

  // ConflictAlert interface (ensure this matches what your hook and UI expect)
export interface ConflictAlert {
    title: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    description: string;
    isActive: boolean;
    marketBased?: boolean; // Specific to enhanced alerts
  }
  
  // generateEnhancedConflictAlerts function
  export function generateEnhancedConflictAlerts(
    getLiveValue: GetLiveValueFunction // Reuses GetLiveValueFunction defined earlier in this file
  ): ConflictAlert[] {
    const alerts: ConflictAlert[] = [];
  
    // GDP vs Market conflicts
    const gdpValue = getLiveValue('Real GDP Growth Rate');
    const sp500Value = getLiveValue('S&P 500');
  
    if (gdpValue?.value !== null && sp500Value?.value !== null && gdpValue?.value !== undefined && sp500Value?.value !== undefined) {
      const gdpNegative = gdpValue.value < 0;
      const sp500Strong = sp500Value.value > 4400; // Example threshold
  
      if (gdpNegative && sp500Strong) {
        alerts.push({
          title: 'GDP vs Market Divergence',
          severity: 'HIGH',
          description: `GDP contracting (${gdpValue.formatted || gdpValue.value.toFixed(1)}%) while S&P 500 remains strong at ${sp500Value.formatted || sp500Value.value.toFixed(0)} - unusual divergence.`,
          isActive: true,
          marketBased: true
        });
      }
    }
  
    // VIX vs Equity conflict
    const vixValue = getLiveValue('VIX Index');
    // sp500Value is already fetched above
  
    if (vixValue?.value !== null && sp500Value?.value !== null && vixValue?.value !== undefined && sp500Value?.value !== undefined) {
      const vixHigh = vixValue.value > 25; // Example threshold
      const sp500Strong = sp500Value.value > 4400; // Example threshold
  
      if (vixHigh && sp500Strong) {
        alerts.push({
          title: 'VIX-Equity Divergence',
          severity: 'MEDIUM',
          description: `VIX elevated at ${vixValue.formatted || vixValue.value.toFixed(1)} while S&P 500 remains strong at ${sp500Value.formatted || sp500Value.value.toFixed(0)} - suggests hidden market stress.`,
          isActive: true,
          marketBased: true
        });
      }
    }
  
    // Dollar vs Gold conflict
    const dollarValue = getLiveValue('Dollar Index');
    const goldValue = getLiveValue('Gold Price');
  
    if (dollarValue?.value !== null && goldValue?.value !== null && dollarValue?.value !== undefined && goldValue?.value !== undefined) {
      const dollarStrong = dollarValue.value > 105; // Example threshold
      const goldHigh = goldValue.value > 2000;    // Example threshold
  
      if (dollarStrong && goldHigh) {
        alerts.push({
          title: 'Dollar-Gold Conflict',
          severity: 'MEDIUM',
          description: `Strong dollar (${dollarValue.formatted || dollarValue.value.toFixed(1)}) typically pressures gold, but gold remains elevated at ${goldValue.formatted || (goldValue.value ? '$' + goldValue.value.toFixed(0) : 'N/A')} - suggests underlying uncertainty.`,
          isActive: true,
          marketBased: true
        });
      }
    }
    // Add any other conflict alert logic you had here if it was in the original hook
  
    return alerts;
  }

  // ThresholdTrigger interface
export interface ThresholdTrigger {
    title: string;
    conditions: string[];
    status: 'Safe Zone' | 'Monitor Zone' | 'Alert Zone';
    triggered: string;
    statusColor: string;
    conditionsMet: number;
    totalConditions: number;
    category: 'economic' | 'market' | 'geopolitical'; // Ensure this matches your hook's definition
  }
  
  // evaluateEnhancedThresholdTriggers function
  export function evaluateEnhancedThresholdTriggers(
    getLiveValue: GetLiveValueFunction // Reuses GetLiveValueFunction defined earlier in this file
  ): ThresholdTrigger[] {
    const triggers: ThresholdTrigger[] = [];
  
    // Market stress triggers
    let marketStressConditionsMet = 0; // Renamed for clarity
    const vixValue = getLiveValue('VIX Index');
    const dollarValue = getLiveValue('Dollar Index');
    const sp500Value = getLiveValue('S&P 500');
  
    const marketConditionsDisplay = [ // Renamed for clarity
      `VIX Spike >25: ${vixValue?.value ? (vixValue.value > 25 ? '✓' : '✗') : '?'}`,
      `S&P 500 Correction <4000: ${sp500Value?.value ? (sp500Value.value < 4000 ? '✓' : '✗') : '?'}`, // Clarified condition
      `Dollar Strength >105: ${dollarValue?.value ? (dollarValue.value > 105 ? '✓' : '✗') : '?'}`,
    ];
  
    if (vixValue?.value && vixValue.value > 25) marketStressConditionsMet++;
    if (sp500Value?.value && sp500Value.value < 4000) marketStressConditionsMet++;
    if (dollarValue?.value && dollarValue.value > 105) marketStressConditionsMet++;
  
    triggers.push({
      title: 'Market Stress Triggers',
      conditions: marketConditionsDisplay,
      status: marketStressConditionsMet >= 2 ? 'Alert Zone' : marketStressConditionsMet >= 1 ? 'Monitor Zone' : 'Safe Zone',
      triggered: `${marketStressConditionsMet} of 3 triggered`,
      statusColor: marketStressConditionsMet >= 2 ? '#ef4444' : marketStressConditionsMet >= 1 ? '#f59e0b' : '#10b981',
      conditionsMet: marketStressConditionsMet,
      totalConditions: 3,
      category: 'market'
    });
  
    // Economic recession triggers
    let recessionConditionsMet = 0;
    const gdpValue = getLiveValue('Real GDP Growth Rate');
    const unemploymentValue = getLiveValue('Unemployment Rate (U-3)');
    const claimsValue = getLiveValue('Initial Jobless Claims'); // Value used for 'Initial claims >400K' trigger
  
    const recessionConditionsDisplay = [ // Renamed for clarity
      `GDP growth negative: ${gdpValue?.value ? (gdpValue.value < 0 ? '✓' : '✗') : '?'}`,
      `Unemployment rising >0.5% (change): ${unemploymentValue?.change ? (unemploymentValue.change > 0.5 ? '✓' : '✗') : '?'}`, // Clarified using 'change'
      `Initial claims >400K: ${claimsValue?.value ? (claimsValue.value > 400000 ? '✓' : '✗') : '?'}`,
    ];
  
    if (gdpValue?.value && gdpValue.value < 0) recessionConditionsMet++;
    if (unemploymentValue?.change && unemploymentValue.change > 0.5) recessionConditionsMet++;
    if (claimsValue?.value && claimsValue.value > 400000) recessionConditionsMet++;
  
    triggers.push({
      title: 'Economic Recession Triggers',
      conditions: recessionConditionsDisplay,
      status: recessionConditionsMet >= 2 ? 'Alert Zone' : recessionConditionsMet >= 1 ? 'Monitor Zone' : 'Safe Zone',
      triggered: `${recessionConditionsMet} of 3 triggered`,
      statusColor: recessionConditionsMet >= 2 ? '#ef4444' : recessionConditionsMet >= 1 ? '#f59e0b' : '#10b981',
      conditionsMet: recessionConditionsMet,
      totalConditions: 3,
      category: 'economic'
    });
    // Add any other threshold trigger logic you had here
  
    return triggers;
  }

  export interface BasicEvidenceScores {
    economic: number;
    political: number;
    social: number;
    environmental: number;
    overall: number;
  }

  export function calculateBasicEvidenceScores(
    selectedThesis: string,
    allBasicThesisScoringRules: Record<string, Omit<ThesisScoringRules, 'market'>>, // Rules specific to basic
    getLiveValue: GetLiveValueFunction
  ): BasicEvidenceScores {
    const rules = allBasicThesisScoringRules[selectedThesis];
    if (!rules || !rules.economic) { // Ensure economic rules exist
      console.warn(`No basic scoring rules found for thesis (evidenceScores): ${selectedThesis}`);
      return { economic: 0, political: 0, social: 0, environmental: 0, overall: 0 };
    }
  
    let economicScore = 0;
    let totalWeight = 0;
  
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
        totalWeight += rule.weight;
      }
    });
  
    const normalizedEconomic = totalWeight > 0 ? economicScore / totalWeight : 0;
    const political = normalizedEconomic * 0.3;
    const social = normalizedEconomic * 0.2;
    const environmental = 0;
    const overall = (normalizedEconomic + political + social + environmental) / 4;
  
    return {
      economic: normalizedEconomic,
      political,
      social,
      environmental,
      overall
    };
  }

  // Type for basic signal data (no source/formatted from market data)
export interface BasicSignalData {
    name: string;
    currentSignal: 'confirm' | 'contradict' | 'neutral';
    impact: 'high' | 'medium' | 'low';
    change: string;
    nextUpdate: string;
    value?: number | null;
    reasoning?: string;
  }
  
  // Generates key metrics for the basic signal analysis
  export function generateBasicKeyMetrics(
    selectedThesis: string,
    // Assuming ThesisScoringRules might have an optional 'market' property,
    // or your basic rules object simply won't have it.
    allBasicThesisScoringRules: Record<string, Pick<ThesisScoringRules, 'economic'>>, // Ensure only economic rules are expected
    getLiveValue: GetLiveValueFunction
  ): BasicSignalData[] {
    const metrics: BasicSignalData[] = [];
    const rules = allBasicThesisScoringRules[selectedThesis];
  
    if (!rules || !rules.economic) {
      console.warn(`No basic scoring rules found for thesis (keyMetrics): ${selectedThesis}`);
      return [];
    }
  
    Object.entries(rules.economic).forEach(([metricName, rule]) => {
      const liveValue = getLiveValue(metricName);
      let signal: 'confirm' | 'contradict' | 'neutral' = 'neutral';
      let reasoning = 'No data available';
  
      if (liveValue?.value !== null && liveValue?.value !== undefined) {
        const value = liveValue.value;
        const formattedValue = liveValue.formatted || value.toFixed(0); // For reasoning
  
        // Using raw thresholds from allBasicThesisScoringRules.economic[metricName].threshold
        // Ensure your signalThesisRules.ts uses raw numbers for thresholds if you made that change for enhanced.
        const positiveThresholdDisplay = (metricName === 'Initial Jobless Claims' && rule.threshold.positive >= 1000) ?
                                         `${(rule.threshold.positive / 1000).toFixed(0)}K` :
                                         rule.threshold.positive.toString();
        const negativeThresholdDisplay = (metricName === 'Initial Jobless Claims' && rule.threshold.negative >= 1000) ?
                                         `${(rule.threshold.negative / 1000).toFixed(0)}K` :
                                         rule.threshold.negative.toString();
  
        if (value <= rule.threshold.positive) {
          signal = 'confirm';
          reasoning = `${formattedValue} supports thesis (≤${positiveThresholdDisplay})`;
        } else if (value >= rule.threshold.negative) {
          signal = 'contradict';
          reasoning = `${formattedValue} contradicts thesis (≥${negativeThresholdDisplay})`;
        } else {
          signal = 'neutral';
          reasoning = `${formattedValue} is neutral`;
        }
      }
  
      metrics.push({
        name: metricName,
        currentSignal: signal,
        impact: rule.weight >= 0.25 ? 'high' : rule.weight >= 0.15 ? 'medium' : 'low',
        change: liveValue?.change !== undefined ?
          (liveValue.change > 0 ? `↑ +${Math.abs(liveValue.change).toFixed(2)}` :
           liveValue.change < 0 ? `↓ -${Math.abs(liveValue.change).toFixed(2)}` : '→ 0.00') : '→',
        nextUpdate: getNextUpdateEstimate(metricName), // Uses getNextUpdateEstimate from this file
        value: liveValue?.value,
        reasoning
        // No 'source' or 'formatted' field for BasicSignalData
      });
    });
    return metrics;
  }

  // --- POC ANALYSIS FUNCTIONS START ---

/**
 * Calculates the "Weight of Evidence" for a selected PoC thesis
 * based on the new rule structure defined in signalThesisRules.ts.
 */             
export function calculatePocWeightOfEvidence(
  selectedThesisName: string,
  // This uses the imported type of your actual THESIS_SCORING_RULES object
  allPocThesisScoringRules: typeof POC_THESIS_SCORING_RULES_TYPE, // This type comes from the import at the top of analysisUtils.ts
  getLiveValue: GetLiveValueFunction // This type is defined at the top of your analysisUtils.ts file
): PocAnalysisOutput { // This type is defined in your "POC TYPE DEFINITIONS START" section in analysisUtils.ts
  const thesisRules = allPocThesisScoringRules[selectedThesisName];

  let totalWeightedScore = 0;
  const metricDetails: PocMetricAnalysisDetail[] = []; // This type is defined in your "POC TYPE DEFINITIONS START" section

  if (!thesisRules || !thesisRules.metrics) {
    console.warn(`[calculatePocWeightOfEvidence] No PoC scoring rules found for thesis: ${selectedThesisName}`);
    return { totalWeightedScore: 0, metricDetails: [] };
  }

  // Iterate over the metrics defined in the THESIS_SCORING_RULES for the selected thesis
  for (const metricName in thesisRules.metrics) {
    // Ensure we are iterating over own properties, not from prototype chain
    if (Object.prototype.hasOwnProperty.call(thesisRules.metrics, metricName)) {
      const metricConfig = thesisRules.metrics[metricName];
      const liveData = getLiveValue(metricName);
      const currentValue = liveData?.value ?? null; // Use nullish coalescing for null or undefined

      let metricMatchedThisIteration = false; 
      let individualScore = 0;
      // Use the imported PocMetricRule['signal'] type and add our custom 'no_data'/'neutral_no_match'
      let signal: PocMetricRule['signal'] | 'no_data' | 'neutral_no_match' = 'no_data';
      let matchedRuleConditionText = 'N/A (No Live Data)';

      if (currentValue !== null) {
        signal = 'neutral_no_match'; // Default if value exists but no rule matches
        matchedRuleConditionText = `No rule matched for value: ${currentValue.toFixed(2)}`; 

        // Ensure metricConfig.rules is an array before iterating
        if (Array.isArray(metricConfig.rules)) {
          for (const rule of metricConfig.rules as PocMetricRule[]) { // Type assertion for rule using imported PocMetricRule
            let conditionMet = false;
            let conditionTextForThisRule = '';

            if (rule.if_above !== undefined) {
              conditionTextForThisRule = `value (${currentValue.toFixed(2)}) > ${rule.if_above}`;
              if (currentValue > rule.if_above) {
                conditionMet = true;
              }
            } else if (rule.if_below !== undefined) {
              conditionTextForThisRule = `value (${currentValue.toFixed(2)}) < ${rule.if_below}`;
              if (currentValue < rule.if_below) {
                conditionMet = true;
              }
            } else if (rule.if_between && Array.isArray(rule.if_between) && rule.if_between.length === 2) {
              // Convention: [inclusive_lower, exclusive_upper]
              conditionTextForThisRule = `value (${currentValue.toFixed(2)}) >= ${rule.if_between[0]} AND value < ${rule.if_between[1]}`;
              if (currentValue >= rule.if_between[0] && currentValue < rule.if_between[1]) {
                conditionMet = true;
              }
            }

            if (conditionMet) {
              individualScore = rule.score;
              signal = rule.signal;
              matchedRuleConditionText = conditionTextForThisRule; 
              metricMatchedThisIteration = true;
              break; 
            }
          }
        } else {
            console.warn(`[calculatePocWeightOfEvidence] No 'rules' array found for metric: ${metricName} in thesis: ${selectedThesisName}`);
        }
      }
      
      const weightedContribution = individualScore * metricConfig.weight;
      totalWeightedScore += weightedContribution;

      metricDetails.push({
        name: metricName,
        currentValue: currentValue,
        // Cast signal to string because its type is a union including 'no_data' etc. 
        // which PocMetricAnalysisDetail's 'signal' field (if strictly typed to PocMetricRule['signal']) might not expect.
        // It's safer to have PocMetricAnalysisDetail.signal as just `string`.
        signal: signal as string, 
        individualScore: individualScore,
        weight: metricConfig.weight,
        weightedContribution: weightedContribution,
        matchedRuleCondition: matchedRuleConditionText,
      });
    }
  }

  return { totalWeightedScore, metricDetails };
}
// --- POC ANALYSIS FUNCTIONS END ---