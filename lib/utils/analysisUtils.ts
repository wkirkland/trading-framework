// lib/utils/analysisUtils.ts

// --- TYPE DEFINITIONS ---
// These types are used by both utility functions below.

// Type for the getLiveValue function signature (from useLiveData via DataContext)
// If you have a central types file, you could import this.
interface LiveMetricData {
    value: number | null;
    formatted: string;
    date: string;
    change?: number;
    lastUpdated: string;
  }
  
  // Making GetLiveValueFunction exportable in case it's useful elsewhere, though not strictly necessary
  // if only used internally by functions within this file.
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
  
  // Type for a single rule within THESIS_SCORING_RULES (economic or market part)
  interface ScoringRuleDetail {
    weight: number;
    threshold: { negative: number; positive: number };
  }
  
  // Type for the structure of rules for a single thesis
  export interface ThesisScoringRules { // Exporting in case other modules might need this structure
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
  
  // --- UTILITY FUNCTIONS ---
  
  /**
   * Calculates evidence scores based on selected thesis, rules, market data, and live values.
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