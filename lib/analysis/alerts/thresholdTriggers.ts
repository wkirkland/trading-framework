// lib/analysis/alerts/thresholdTriggers.ts
// Threshold trigger evaluation and monitoring logic

import type {
  ThresholdTrigger,
  GetLiveValueFunction,
  TriggerStatus,
  CategoryType,
  EvaluateThresholdTriggersParams
} from '../types/analysis.types';

/**
 * Evaluate enhanced threshold triggers for economic and market conditions
 */
export function evaluateEnhancedThresholdTriggers(
  getLiveValue: GetLiveValueFunction
): ThresholdTrigger[] {
  const triggers: ThresholdTrigger[] = [];

  // Market stress triggers
  let marketStressConditionsMet = 0;
  const vixValue = getLiveValue('VIX Index');
  const dollarValue = getLiveValue('Dollar Index');
  const sp500Value = getLiveValue('S&P 500');

  const marketConditionsDisplay = [
    `VIX Spike >25: ${vixValue?.value ? (vixValue.value > 25 ? '✓' : '✗') : '?'}`,
    `S&P 500 Correction <4000: ${sp500Value?.value ? (sp500Value.value < 4000 ? '✓' : '✗') : '?'}`,
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
  const claimsValue = getLiveValue('Initial Jobless Claims');

  const recessionConditionsDisplay = [
    `GDP growth negative: ${gdpValue?.value ? (gdpValue.value < 0 ? '✓' : '✗') : '?'}`,
    `Unemployment rising >0.5% (change): ${unemploymentValue?.change ? (unemploymentValue.change > 0.5 ? '✓' : '✗') : '?'}`,
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

  return triggers;
}

/**
 * Evaluate market stress triggers specifically
 */
export function evaluateMarketStressTriggers(
  getLiveValue: GetLiveValueFunction,
  vixThreshold: number = 25,
  sp500Threshold: number = 4000,
  dollarThreshold: number = 105
): ThresholdTrigger {
  let conditionsMet = 0;
  const vixValue = getLiveValue('VIX Index');
  const dollarValue = getLiveValue('Dollar Index');
  const sp500Value = getLiveValue('S&P 500');

  const conditions = [
    `VIX Spike >${vixThreshold}: ${vixValue?.value ? (vixValue.value > vixThreshold ? '✓' : '✗') : '?'}`,
    `S&P 500 Correction <${sp500Threshold}: ${sp500Value?.value ? (sp500Value.value < sp500Threshold ? '✓' : '✗') : '?'}`,
    `Dollar Strength >${dollarThreshold}: ${dollarValue?.value ? (dollarValue.value > dollarThreshold ? '✓' : '✗') : '?'}`,
  ];

  if (vixValue?.value && vixValue.value > vixThreshold) conditionsMet++;
  if (sp500Value?.value && sp500Value.value < sp500Threshold) conditionsMet++;
  if (dollarValue?.value && dollarValue.value > dollarThreshold) conditionsMet++;

  return {
    title: 'Market Stress Triggers',
    conditions,
    status: determineStatus(conditionsMet, 3),
    triggered: `${conditionsMet} of 3 triggered`,
    statusColor: getStatusColor(conditionsMet, 3),
    conditionsMet,
    totalConditions: 3,
    category: 'market'
  };
}

/**
 * Evaluate economic recession triggers specifically
 */
export function evaluateRecessionTriggers(
  getLiveValue: GetLiveValueFunction,
  unemploymentChangeThreshold: number = 0.5,
  claimsThreshold: number = 400000
): ThresholdTrigger {
  let conditionsMet = 0;
  const gdpValue = getLiveValue('Real GDP Growth Rate');
  const unemploymentValue = getLiveValue('Unemployment Rate (U-3)');
  const claimsValue = getLiveValue('Initial Jobless Claims');

  const conditions = [
    `GDP growth negative: ${gdpValue?.value ? (gdpValue.value < 0 ? '✓' : '✗') : '?'}`,
    `Unemployment rising >${unemploymentChangeThreshold}% (change): ${unemploymentValue?.change ? (unemploymentValue.change > unemploymentChangeThreshold ? '✓' : '✗') : '?'}`,
    `Initial claims >${claimsThreshold / 1000}K: ${claimsValue?.value ? (claimsValue.value > claimsThreshold ? '✓' : '✗') : '?'}`,
  ];

  if (gdpValue?.value && gdpValue.value < 0) conditionsMet++;
  if (unemploymentValue?.change && unemploymentValue.change > unemploymentChangeThreshold) conditionsMet++;
  if (claimsValue?.value && claimsValue.value > claimsThreshold) conditionsMet++;

  return {
    title: 'Economic Recession Triggers',
    conditions,
    status: determineStatus(conditionsMet, 3),
    triggered: `${conditionsMet} of 3 triggered`,
    statusColor: getStatusColor(conditionsMet, 3),
    conditionsMet,
    totalConditions: 3,
    category: 'economic'
  };
}

/**
 * Evaluate inflation pressure triggers
 */
export function evaluateInflationTriggers(
  getLiveValue: GetLiveValueFunction,
  coreInflationThreshold: number = 3.0,
  fedRateThreshold: number = 5.0,
  yieldThreshold: number = 4.5
): ThresholdTrigger {
  let conditionsMet = 0;
  const coreInflationValue = getLiveValue('Core PCE');
  const fedRateValue = getLiveValue('Fed Funds Rate');
  const yieldValue = getLiveValue('10-Year Treasury Yield');

  const conditions = [
    `Core PCE >${coreInflationThreshold}%: ${coreInflationValue?.value ? (coreInflationValue.value > coreInflationThreshold ? '✓' : '✗') : '?'}`,
    `Fed Funds Rate >${fedRateThreshold}%: ${fedRateValue?.value ? (fedRateValue.value > fedRateThreshold ? '✓' : '✗') : '?'}`,
    `10-Year Yield >${yieldThreshold}%: ${yieldValue?.value ? (yieldValue.value > yieldThreshold ? '✓' : '✗') : '?'}`,
  ];

  if (coreInflationValue?.value && coreInflationValue.value > coreInflationThreshold) conditionsMet++;
  if (fedRateValue?.value && fedRateValue.value > fedRateThreshold) conditionsMet++;
  if (yieldValue?.value && yieldValue.value > yieldThreshold) conditionsMet++;

  return {
    title: 'Inflation Pressure Triggers',
    conditions,
    status: determineStatus(conditionsMet, 3),
    triggered: `${conditionsMet} of 3 triggered`,
    statusColor: getStatusColor(conditionsMet, 3),
    conditionsMet,
    totalConditions: 3,
    category: 'economic'
  };
}

/**
 * Evaluate geopolitical stress triggers
 */
export function evaluateGeopoliticalTriggers(
  getLiveValue: GetLiveValueFunction,
  goldThreshold: number = 2000,
  vixThreshold: number = 30,
  dollarThreshold: number = 110
): ThresholdTrigger {
  let conditionsMet = 0;
  const goldValue = getLiveValue('Gold Price');
  const vixValue = getLiveValue('VIX Index');
  const dollarValue = getLiveValue('Dollar Index');

  const conditions = [
    `Gold Safe Haven >$${goldThreshold}: ${goldValue?.value ? (goldValue.value > goldThreshold ? '✓' : '✗') : '?'}`,
    `VIX Crisis Mode >${vixThreshold}: ${vixValue?.value ? (vixValue.value > vixThreshold ? '✓' : '✗') : '?'}`,
    `Dollar Flight-to-Quality >${dollarThreshold}: ${dollarValue?.value ? (dollarValue.value > dollarThreshold ? '✓' : '✗') : '?'}`,
  ];

  if (goldValue?.value && goldValue.value > goldThreshold) conditionsMet++;
  if (vixValue?.value && vixValue.value > vixThreshold) conditionsMet++;
  if (dollarValue?.value && dollarValue.value > dollarThreshold) conditionsMet++;

  return {
    title: 'Geopolitical Stress Triggers',
    conditions,
    status: determineStatus(conditionsMet, 3),
    triggered: `${conditionsMet} of 3 triggered`,
    statusColor: getStatusColor(conditionsMet, 3),
    conditionsMet,
    totalConditions: 3,
    category: 'geopolitical'
  };
}

/**
 * Helper function to determine trigger status
 */
export function determineStatus(conditionsMet: number, totalConditions: number): TriggerStatus {
  const ratio = conditionsMet / totalConditions;
  if (ratio >= 0.67) return 'Alert Zone';  // 2/3 or more
  if (ratio >= 0.33) return 'Monitor Zone'; // 1/3 or more
  return 'Safe Zone';
}

/**
 * Helper function to get status color
 */
export function getStatusColor(conditionsMet: number, totalConditions: number): string {
  const ratio = conditionsMet / totalConditions;
  if (ratio >= 0.67) return '#ef4444'; // Red
  if (ratio >= 0.33) return '#f59e0b'; // Orange
  return '#10b981'; // Green
}

/**
 * Create a custom threshold trigger
 */
export function createCustomTrigger(
  title: string,
  conditions: Array<{
    metric: string;
    threshold: number;
    operator: '>' | '<' | '>=' | '<=' | '=';
    description: string;
  }>,
  getLiveValue: GetLiveValueFunction,
  category: CategoryType = 'economic'
): ThresholdTrigger {
  let conditionsMet = 0;
  const conditionDisplays: string[] = [];

  conditions.forEach(condition => {
    const value = getLiveValue(condition.metric);
    let isMet = false;

    if (value?.value !== null && value?.value !== undefined) {
      switch (condition.operator) {
        case '>':
          isMet = value.value > condition.threshold;
          break;
        case '<':
          isMet = value.value < condition.threshold;
          break;
        case '>=':
          isMet = value.value >= condition.threshold;
          break;
        case '<=':
          isMet = value.value <= condition.threshold;
          break;
        case '=':
          isMet = value.value === condition.threshold;
          break;
      }
    }

    if (isMet) conditionsMet++;
    conditionDisplays.push(`${condition.description}: ${isMet ? '✓' : '✗'}`);
  });

  return {
    title,
    conditions: conditionDisplays,
    status: determineStatus(conditionsMet, conditions.length),
    triggered: `${conditionsMet} of ${conditions.length} triggered`,
    statusColor: getStatusColor(conditionsMet, conditions.length),
    conditionsMet,
    totalConditions: conditions.length,
    category
  };
}