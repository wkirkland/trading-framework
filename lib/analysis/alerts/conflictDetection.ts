// lib/analysis/alerts/conflictDetection.ts
// Conflict detection and alert generation logic

import type {
  ConflictAlert,
  GetLiveValueFunction,
  AlertSeverity,
  GenerateConflictAlertsParams
} from '../types/analysis.types';

/**
 * Generate enhanced conflict alerts for market divergences
 */
export function generateEnhancedConflictAlerts(
  getLiveValue: GetLiveValueFunction
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

  return alerts;
}

/**
 * Check for GDP vs Market divergence
 */
export function checkGdpMarketDivergence(
  getLiveValue: GetLiveValueFunction,
  sp500Threshold: number = 4400
): ConflictAlert | null {
  const gdpValue = getLiveValue('Real GDP Growth Rate');
  const sp500Value = getLiveValue('S&P 500');

  if (gdpValue?.value !== null && sp500Value?.value !== null && 
      gdpValue?.value !== undefined && sp500Value?.value !== undefined) {
    const gdpNegative = gdpValue.value < 0;
    const sp500Strong = sp500Value.value > sp500Threshold;

    if (gdpNegative && sp500Strong) {
      return {
        title: 'GDP vs Market Divergence',
        severity: 'HIGH',
        description: `GDP contracting (${gdpValue.formatted || gdpValue.value.toFixed(1)}%) while S&P 500 remains strong at ${sp500Value.formatted || sp500Value.value.toFixed(0)} - unusual divergence.`,
        isActive: true,
        marketBased: true
      };
    }
  }

  return null;
}

/**
 * Check for VIX vs Equity divergence
 */
export function checkVixEquityDivergence(
  getLiveValue: GetLiveValueFunction,
  vixThreshold: number = 25,
  sp500Threshold: number = 4400
): ConflictAlert | null {
  const vixValue = getLiveValue('VIX Index');
  const sp500Value = getLiveValue('S&P 500');

  if (vixValue?.value !== null && sp500Value?.value !== null && 
      vixValue?.value !== undefined && sp500Value?.value !== undefined) {
    const vixHigh = vixValue.value > vixThreshold;
    const sp500Strong = sp500Value.value > sp500Threshold;

    if (vixHigh && sp500Strong) {
      return {
        title: 'VIX-Equity Divergence',
        severity: 'MEDIUM',
        description: `VIX elevated at ${vixValue.formatted || vixValue.value.toFixed(1)} while S&P 500 remains strong at ${sp500Value.formatted || sp500Value.value.toFixed(0)} - suggests hidden market stress.`,
        isActive: true,
        marketBased: true
      };
    }
  }

  return null;
}

/**
 * Check for Dollar vs Gold conflict
 */
export function checkDollarGoldConflict(
  getLiveValue: GetLiveValueFunction,
  dollarThreshold: number = 105,
  goldThreshold: number = 2000
): ConflictAlert | null {
  const dollarValue = getLiveValue('Dollar Index');
  const goldValue = getLiveValue('Gold Price');

  if (dollarValue?.value !== null && goldValue?.value !== null && 
      dollarValue?.value !== undefined && goldValue?.value !== undefined) {
    const dollarStrong = dollarValue.value > dollarThreshold;
    const goldHigh = goldValue.value > goldThreshold;

    if (dollarStrong && goldHigh) {
      return {
        title: 'Dollar-Gold Conflict',
        severity: 'MEDIUM',
        description: `Strong dollar (${dollarValue.formatted || dollarValue.value.toFixed(1)}) typically pressures gold, but gold remains elevated at ${goldValue.formatted || (goldValue.value ? '$' + goldValue.value.toFixed(0) : 'N/A')} - suggests underlying uncertainty.`,
        isActive: true,
        marketBased: true
      };
    }
  }

  return null;
}

/**
 * Check for unemployment vs market divergence
 */
export function checkUnemploymentMarketDivergence(
  getLiveValue: GetLiveValueFunction,
  unemploymentThreshold: number = 5.0,
  sp500Threshold: number = 4400
): ConflictAlert | null {
  const unemploymentValue = getLiveValue('Unemployment Rate (U-3)');
  const sp500Value = getLiveValue('S&P 500');

  if (unemploymentValue?.value !== null && sp500Value?.value !== null && 
      unemploymentValue?.value !== undefined && sp500Value?.value !== undefined) {
    const unemploymentHigh = unemploymentValue.value > unemploymentThreshold;
    const sp500Strong = sp500Value.value > sp500Threshold;

    if (unemploymentHigh && sp500Strong) {
      return {
        title: 'Unemployment-Market Divergence',
        severity: 'HIGH',
        description: `Unemployment elevated at ${unemploymentValue.formatted || unemploymentValue.value.toFixed(1)}% while S&P 500 remains strong at ${sp500Value.formatted || sp500Value.value.toFixed(0)} - markets may be disconnected from employment reality.`,
        isActive: true,
        marketBased: true
      };
    }
  }

  return null;
}

/**
 * Check for inflation vs bond yield divergence
 */
export function checkInflationBondDivergence(
  getLiveValue: GetLiveValueFunction,
  inflationThreshold: number = 3.0,
  yieldThreshold: number = 4.0
): ConflictAlert | null {
  const inflationValue = getLiveValue('Core PCE');
  const yieldValue = getLiveValue('10-Year Treasury Yield');

  if (inflationValue?.value !== null && yieldValue?.value !== null && 
      inflationValue?.value !== undefined && yieldValue?.value !== undefined) {
    const inflationHigh = inflationValue.value > inflationThreshold;
    const yieldLow = yieldValue.value < yieldThreshold;

    if (inflationHigh && yieldLow) {
      return {
        title: 'Inflation-Bond Yield Divergence',
        severity: 'MEDIUM',
        description: `Core PCE inflation at ${inflationValue.formatted || inflationValue.value.toFixed(1)}% while 10-year yield only ${yieldValue.formatted || yieldValue.value.toFixed(1)}% - bond markets may be pricing different inflation expectations.`,
        isActive: true,
        marketBased: false
      };
    }
  }

  return null;
}

/**
 * Determine conflict severity based on magnitude of divergence
 */
export function determineConflictSeverity(
  metric1Value: number,
  metric2Value: number,
  threshold1: number,
  threshold2: number,
  multiplier: number = 1.5
): AlertSeverity {
  const divergence1 = Math.abs(metric1Value - threshold1) / threshold1;
  const divergence2 = Math.abs(metric2Value - threshold2) / threshold2;
  const totalDivergence = (divergence1 + divergence2) / 2;

  if (totalDivergence > multiplier * 0.2) return 'HIGH';
  if (totalDivergence > multiplier * 0.1) return 'MEDIUM';
  return 'LOW';
}

/**
 * Format conflict description with proper value formatting
 */
export function formatConflictDescription(
  title: string,
  metric1Name: string,
  metric1Value: string,
  metric2Name: string,
  metric2Value: string,
  explanation: string
): string {
  return `${metric1Name} at ${metric1Value} while ${metric2Name} at ${metric2Value} - ${explanation}`;
}