// lib/hooks/useEnhancedSignalAnalysis.ts

import { useState, useMemo } from 'react';
import { useLiveData } from './useLiveData';

interface SignalData {
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

interface EvidenceScores {
  economic: number;
  political: number;
  social: number;
  environmental: number;
  market: number; // New market indicators category
  overall: number;
}

interface MarketIndicators {
  vix: number | null;
  sp500: number | null;
  dollarIndex: number | null;
  gold: number | null;
}

interface ConflictAlert {
  title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  isActive: boolean;
  marketBased?: boolean;
}

interface ThresholdTrigger {
  title: string;
  conditions: string[];
  status: 'Safe Zone' | 'Monitor Zone' | 'Alert Zone';
  triggered: string;
  statusColor: string;
  conditionsMet: number;
  totalConditions: number;
  category: 'economic' | 'market' | 'geopolitical';
}

// Enhanced thesis scoring with market indicators
const ENHANCED_THESIS_SCORING_RULES = {
  'economic-transition': {
    economic: {
      'Real GDP Growth Rate': { weight: 0.25, threshold: { negative: -1, positive: 2 } },
      'Unemployment Rate (U-3)': { weight: 0.2, threshold: { negative: 4.5, positive: 3.5 } },
      'Core PCE': { weight: 0.15, threshold: { negative: 3.5, positive: 2.0 } },
      'Fed Funds Rate': { weight: 0.15, threshold: { negative: 3.0, positive: 5.5 } },
      'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 90, positive: 110 } },
      'Initial Jobless Claims': { weight: 0.15, threshold: { negative: 300, positive: 450 } }
    },
    market: {
      'VIX Index': { weight: 0.3, threshold: { negative: 15, positive: 30 } },
      'S&P 500': { weight: 0.25, threshold: { negative: 3800, positive: 4500 } },
      'Dollar Index': { weight: 0.25, threshold: { negative: 95, positive: 105 } },
      'Gold Price': { weight: 0.2, threshold: { negative: 1800, positive: 2100 } }
    }
  },
  'soft-landing': {
    economic: {
      'Real GDP Growth Rate': { weight: 0.25, threshold: { negative: 0, positive: 3 } },
      'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 5, positive: 3 } },
      'Core PCE': { weight: 0.25, threshold: { negative: 4, positive: 1.5 } },
      'Fed Funds Rate': { weight: 0.15, threshold: { negative: 6, positive: 2 } },
      'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 85, positive: 105 } }
    },
    market: {
      'VIX Index': { weight: 0.3, threshold: { negative: 25, positive: 12 } },
      'S&P 500': { weight: 0.3, threshold: { negative: 3500, positive: 4800 } },
      'Dollar Index': { weight: 0.2, threshold: { negative: 110, positive: 95 } },
      'Gold Price': { weight: 0.2, threshold: { negative: 2000, positive: 1700 } }
    }
  },
  'mild-recession': {
    economic: {
      'Real GDP Growth Rate': { weight: 0.3, threshold: { negative: 1, positive: -2 } },
      'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 3.5, positive: 6 } },
      'Core PCE': { weight: 0.2, threshold: { negative: 2, positive: 4 } },
      'Initial Jobless Claims': { weight: 0.15, threshold: { negative: 300, positive: 500 } },
      'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 100, positive: 70 } }
    },
    market: {
      'VIX Index': { weight: 0.35, threshold: { negative: 20, positive: 40 } },
      'S&P 500': { weight: 0.25, threshold: { negative: 4200, positive: 3200 } },
      'Dollar Index': { weight: 0.2, threshold: { negative: 90, positive: 110 } },
      'Gold Price': { weight: 0.2, threshold: { negative: 1700, positive: 2200 } }
    }
  }
};

const getNextUpdateEstimate = (metricName: string): string => {
  const dailyMetrics = ['Fed Funds Rate', '10-Year Treasury Yield', 'VIX Index', 'S&P 500', 'Dollar Index', 'Gold Price'];
  const weeklyMetrics = ['Initial Jobless Claims'];
  const monthlyMetrics = ['Unemployment Rate (U-3)', 'Core PCE', 'Consumer Confidence Index'];
  
  if (dailyMetrics.includes(metricName)) return 'Real-time';
  if (weeklyMetrics.includes(metricName)) return 'Weekly';
  if (monthlyMetrics.includes(metricName)) return 'Monthly';
  return 'Quarterly';
};

export function useEnhancedSignalAnalysis() {
  const { liveData, loading, error, lastFetched, fetchData, getLiveValue } = useLiveData();
  const [selectedThesis, setSelectedThesis] = useState<string>('economic-transition');

  // Extract market data from your live data system
  const marketData = useMemo((): MarketIndicators => {
    return {
      vix: getLiveValue('VIX Index')?.value || null,
      sp500: getLiveValue('S&P 500')?.value || null,
      dollarIndex: getLiveValue('Dollar Index')?.value || null,
      gold: getLiveValue('Gold Price')?.value || null
    };
  }, [liveData, getLiveValue]);

  // Calculate enhanced evidence scores with market indicators
  const evidenceScores = useMemo((): EvidenceScores => {
    const rules = ENHANCED_THESIS_SCORING_RULES[selectedThesis as keyof typeof ENHANCED_THESIS_SCORING_RULES];
    if (!rules) {
      return { economic: 0, political: 0, social: 0, environmental: 0, market: 0, overall: 0 };
    }

    // Economic score calculation
    let economicScore = 0;
    let economicWeight = 0;

            Object.entries(rules.economic).forEach(([metricName, rule]) => {
      const liveValue = getLiveValue(metricName);
      if (liveValue?.value !== null && liveValue?.value !== undefined) {
        const value = liveValue.value;
        let score = 0;

        if (value <= rule.threshold.positive) {
          score = 2;
        } else if (value <= (rule.threshold.positive + rule.threshold.negative) / 2) {
          score = 1;
        } else if (value <= rule.threshold.negative) {
          score = -1;
        } else {
          score = -2;
        }

        economicScore += score * rule.weight;
        economicWeight += rule.weight;
      }
    });

    // Market score calculation (using your live market data)
    let marketScore = 0;
    let marketWeight = 0;

    if (rules.market) {
      // VIX scoring
      if (marketData.vix !== null) {
        const vixRule = rules.market['VIX Index'];
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

      // S&P 500 scoring
      if (marketData.sp500 !== null) {
        const sp500Rule = rules.market['S&P 500'];
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

      // Dollar Index scoring
      if (marketData.dollarIndex !== null) {
        const dxyRule = rules.market['Dollar Index'];
        let dxyScore = 0;
        
        if (marketData.dollarIndex >= dxyRule.threshold.positive) {
          dxyScore = selectedThesis === 'economic-transition' ? 1 : -1;
        } else if (marketData.dollarIndex <= dxyRule.threshold.negative) {
          dxyScore = selectedThesis === 'soft-landing' ? 1 : -1;
        }
        
        marketScore += dxyScore * dxyRule.weight;
        marketWeight += dxyRule.weight;
      }

      // Gold scoring
      if (marketData.gold !== null) {
        const goldRule = rules.market['Gold Price'];
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

    // Normalize scores
    const normalizedEconomic = economicWeight > 0 ? economicScore / economicWeight : 0;
    const normalizedMarket = marketWeight > 0 ? marketScore / marketWeight : 0;
    
    // Placeholder for other categories
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
      overall
    };
  }, [selectedThesis, liveData, marketData, getLiveValue]);

  // Enhanced key metrics including market indicators
  const keyMetrics = useMemo((): SignalData[] => {
    const metrics: SignalData[] = [];
    const rules = ENHANCED_THESIS_SCORING_RULES[selectedThesis as keyof typeof ENHANCED_THESIS_SCORING_RULES];
    
    if (rules) {
      // Economic metrics (existing)
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
          reasoning,
          source: 'Economic Data',
          formatted: liveValue?.formatted
        });
      });

      // Market indicators (new - using your live market data)
      if (rules.market) {
        Object.entries(rules.market).forEach(([indicatorName, rule]) => {
          let value: number | null = null;
          let formatted: string = '';
          let signal: 'confirm' | 'contradict' | 'neutral' = 'neutral';
          let reasoning = 'No data available';

          // Map indicator names to your live data
          switch (indicatorName) {
            case 'VIX Index':
              const vixData = getLiveValue('VIX Index');
              value = vixData?.value || null;
              formatted = vixData?.formatted || '';
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
              const sp500Data = getLiveValue('S&P 500');
              value = sp500Data?.value || null;
              formatted = sp500Data?.formatted || '';
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
              const dxyData = getLiveValue('Dollar Index');
              value = dxyData?.value || null;
              formatted = dxyData?.formatted || '';
              if (value !== null) {
                signal = value >= rule.threshold.positive ? 'confirm' : value <= rule.threshold.negative ? 'contradict' : 'neutral';
                reasoning = `Dollar Index ${value.toFixed(1)} ${signal === 'confirm' ? 'shows USD strength' : signal === 'contradict' ? 'shows USD weakness' : 'is neutral'}`;
              }
              break;
            case 'Gold Price':
              const goldData = getLiveValue('Gold Price');
              value = goldData?.value || null;
              formatted = goldData?.formatted || '';
              if (value !== null) {
                if (selectedThesis === 'soft-landing') {
                  signal = value <= rule.threshold.negative ? 'confirm' : value >= rule.threshold.positive ? 'contradict' : 'neutral';
                  reasoning = `Gold at ${value.toFixed(0)} ${signal === 'confirm' ? 'shows low uncertainty' : signal === 'contradict' ? 'shows high uncertainty' : 'is neutral'}`;
                } else {
                  signal = value >= rule.threshold.positive ? 'confirm' : value <= rule.threshold.negative ? 'contradict' : 'neutral';
                  reasoning = `Gold at ${value.toFixed(0)} ${signal === 'confirm' ? 'shows safe haven demand' : signal === 'contradict' ? 'shows low uncertainty' : 'is neutral'}`;
                }
              }
              break;
          }

          metrics.push({
            name: indicatorName,
            currentSignal: signal,
            impact: rule.weight >= 0.25 ? 'high' : rule.weight >= 0.15 ? 'medium' : 'low',
            change: '→', // Market data change would need historical data
            nextUpdate: 'Real-time',
            value,
            reasoning,
            source: 'Market Data',
            formatted
          });
        });
      }
    }

    return metrics;
  }, [selectedThesis, liveData, marketData, getLiveValue]);

  // Enhanced conflict alerts with market-based conflicts
  const conflictAlerts = useMemo((): ConflictAlert[] => {
    const alerts: ConflictAlert[] = [];
    
    // GDP vs Market conflicts
    const gdpValue = getLiveValue('Real GDP Growth Rate');
    const sp500Value = getLiveValue('S&P 500');
    
    if (gdpValue?.value !== null && sp500Value?.value !== null && gdpValue?.value !== undefined && sp500Value?.value !== undefined) {
      const gdpNegative = gdpValue.value < 0;
      const sp500Strong = sp500Value.value > 4400;
      
      if (gdpNegative && sp500Strong) {
        alerts.push({
          title: 'GDP vs Market Divergence',
          severity: 'HIGH',
          description: `GDP contracting (${gdpValue.value.toFixed(1)}%) while S&P 500 remains strong at ${sp500Value.value.toFixed(0)} - unusual divergence suggests hidden stress`,
          isActive: true,
          marketBased: true
        });
      }
    }

    // VIX vs Equity conflict
    const vixValue = getLiveValue('VIX Index');
    if (vixValue?.value !== null && sp500Value?.value !== null && vixValue?.value !== undefined && sp500Value?.value !== undefined) {
      const vixHigh = vixValue.value > 25;
      const sp500Strong = sp500Value.value > 4400;
      
      if (vixHigh && sp500Strong) {
        alerts.push({
          title: 'VIX-Equity Divergence',
          severity: 'MEDIUM',
          description: `VIX elevated at ${vixValue.value.toFixed(1)} while S&P 500 remains strong at ${sp500Value.value.toFixed(0)} - suggests hidden market stress`,
          isActive: true,
          marketBased: true
        });
      }
    }

    // Dollar vs Gold conflict
    const dollarValue = getLiveValue('Dollar Index');
    const goldValue = getLiveValue('Gold Price');
    
    if (dollarValue?.value !== null && goldValue?.value !== null && dollarValue?.value !== undefined && goldValue?.value !== undefined) {
      const dollarStrong = dollarValue.value > 105;
      const goldHigh = goldValue.value > 2000;
      
      if (dollarStrong && goldHigh) {
        alerts.push({
          title: 'Dollar-Gold Conflict',
          severity: 'MEDIUM',
          description: `Strong dollar (${dollarValue.value.toFixed(1)}) typically pressures gold, but gold remains elevated at ${goldValue.value.toFixed(0)} - suggests underlying uncertainty`,
          isActive: true,
          marketBased: true
        });
      }
    }

    return alerts;
  }, [liveData, getLiveValue]);

  // Enhanced threshold triggers
  const thresholdTriggers = useMemo((): ThresholdTrigger[] => {
    const triggers: ThresholdTrigger[] = [];
    
    // Market stress triggers
    let marketStressConditions = 0;
    const vixValue = getLiveValue('VIX Index');
    const dollarValue = getLiveValue('Dollar Index');
    const sp500Value = getLiveValue('S&P 500');
    
    const marketConditions = [
      `VIX Spike >25: ${vixValue?.value ? (vixValue.value > 25 ? '✓' : '✗') : '?'}`,
      `S&P 500 Correction: ${sp500Value?.value ? (sp500Value.value < 4000 ? '✓' : '✗') : '?'}`,
      `Dollar Strength >105: ${dollarValue?.value ? (dollarValue.value > 105 ? '✓' : '✗') : '?'}`
    ];
    
    if (vixValue?.value && vixValue.value > 25) marketStressConditions++;
    if (sp500Value?.value && sp500Value.value < 4000) marketStressConditions++;
    if (dollarValue?.value && dollarValue.value > 105) marketStressConditions++;
    
    triggers.push({
      title: 'Market Stress Triggers',
      conditions: marketConditions,
      status: marketStressConditions >= 2 ? 'Alert Zone' : marketStressConditions >= 1 ? 'Monitor Zone' : 'Safe Zone',
      triggered: `${marketStressConditions} of 3 triggered`,
      statusColor: marketStressConditions >= 2 ? '#ef4444' : marketStressConditions >= 1 ? '#f59e0b' : '#10b981',
      conditionsMet: marketStressConditions,
      totalConditions: 3,
      category: 'market'
    });

    // Economic recession triggers
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
      title: 'Economic Recession Triggers',
      conditions: recessionConditions,
      status: recessionConditionsMet >= 2 ? 'Alert Zone' : recessionConditionsMet >= 1 ? 'Monitor Zone' : 'Safe Zone',
      triggered: `${recessionConditionsMet} of 3 triggered`,
      statusColor: recessionConditionsMet >= 2 ? '#ef4444' : recessionConditionsMet >= 1 ? '#f59e0b' : '#10b981',
      conditionsMet: recessionConditionsMet,
      totalConditions: 3,
      category: 'economic'
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
    marketData,
    loading,
    error,
    lastFetched,
    fetchData
  };
}