// lib/config/signalThesisRules.ts

export interface MetricRule {
  if_above?: number;
  if_below?: number;
  if_between?: [number, number]; // Using [inclusive_lower, exclusive_upper]
  signal: 'strong_confirm' | 'mild_confirm' | 'neutral' | 'mild_contradict' | 'strong_contradict';
  score: number;
}

export interface MetricRulesConfig {
  weight: number;
  rules: MetricRule[];
  interpretation_note?: string;
}

export type ThesisMetrics = Record<string, MetricRulesConfig>; // Metric Name (from metrics.ts) -> MetricRulesConfig

export interface ThesisScoringRules {
  [thesisName: string]: {
    metrics: ThesisMetrics;
    thesis_description?: string;
  };
}

export const THESIS_SCORING_RULES: ThesisScoringRules = {
  // =========================================================================================
  // THESIS 1: strong-growth-stable-inflation
  // =========================================================================================
  'strong-growth-stable-inflation': {
    thesis_description: "Economy humming. Good GDP growth (2.5-4%), inflation near target (2-3%), low unemployment, positive sentiment.",
    metrics: {
      'Real GDP Growth Rate': {
        weight: 0.12,
        interpretation_note: "Sustained high growth confirms; contraction strongly contradicts.",
        rules: [
          { if_above: 3.0, signal: 'strong_confirm', score: 2 },
          { if_between: [2.0, 3.0], signal: 'mild_confirm', score: 1 },
          { if_between: [1.0, 2.0], signal: 'neutral', score: 0 },
          { if_between: [0.0, 1.0], signal: 'mild_contradict', score: -1 },
          { if_below: 0.0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Manufacturing PMI': {
        weight: 0.07,
        interpretation_note: "Strong expansion (55+) confirms; contraction (<48) contradicts.",
        rules: [
          { if_above: 55, signal: 'strong_confirm', score: 2 },
          { if_between: [52, 55], signal: 'mild_confirm', score: 1 },
          { if_between: [48, 52], signal: 'neutral', score: 0 },
          { if_between: [45, 48], signal: 'mild_contradict', score: -1 },
          { if_below: 45, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Services PMI': {
        weight: 0.07,
        interpretation_note: "Strong expansion (55+) confirms; contraction (<48) contradicts.",
        rules: [
          { if_above: 55, signal: 'strong_confirm', score: 2 },
          { if_between: [52, 55], signal: 'mild_confirm', score: 1 },
          { if_between: [48, 52], signal: 'neutral', score: 0 },
          { if_between: [45, 48], signal: 'mild_contradict', score: -1 },
          { if_below: 45, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Industrial Production Index': {
        weight: 0.04,
        interpretation_note: "Solid YoY growth confirms.",
        rules: [
          { if_above: 3.0, signal: 'strong_confirm', score: 2 },
          { if_between: [1.5, 3.0], signal: 'mild_confirm', score: 1 },
          { if_between: [0.0, 1.5], signal: 'neutral', score: 0 },
          { if_between: [-1.5, 0.0], signal: 'mild_contradict', score: -1 },
          { if_below: -1.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Capacity Utilization Rate': {
        weight: 0.03,
        interpretation_note: "Healthy utilization (near 80%) without overheating.",
        rules: [
          { if_above: 82, signal: 'mild_contradict', score: -1 },
          { if_between: [79, 82], signal: 'strong_confirm', score: 2 },
          { if_between: [76, 79], signal: 'mild_confirm', score: 1 },
          { if_below: 76, signal: 'neutral', score: 0 }
        ]
      },
      'Unemployment Rate (U-3)': {
        weight: 0.10,
        interpretation_note: "Low and stable (3-4%) confirms.",
        rules: [
          { if_below: 3.5, signal: 'strong_confirm', score: 2 },
          { if_between: [3.5, 4.0], signal: 'mild_confirm', score: 1 },
          { if_between: [4.0, 4.5], signal: 'neutral', score: 0 },
          { if_between: [4.5, 5.0], signal: 'mild_contradict', score: -1 },
          { if_above: 5.0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Initial Jobless Claims': {
        weight: 0.06,
        interpretation_note: "Low claims (e.g., <250k) confirm strong labor market.",
        rules: [
          { if_below: 220, signal: 'strong_confirm', score: 2 },
          { if_between: [220, 270], signal: 'mild_confirm', score: 1 },
          { if_between: [270, 320], signal: 'neutral', score: 0 },
          { if_between: [320, 370], signal: 'mild_contradict', score: -1 },
          { if_above: 370, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Job Openings (JOLTS)': {
        weight: 0.05,
        interpretation_note: "High job openings (e.g., >9M) indicate strong labor demand.",
        rules: [
          { if_above: 9.5, signal: 'strong_confirm', score: 2 },
          { if_between: [8.5, 9.5], signal: 'mild_confirm', score: 1 },
          { if_between: [7.5, 8.5], signal: 'neutral', score: 0 },
          { if_below: 7.5, signal: 'mild_contradict', score: -1 }
        ]
      },
      'Labor Force Participation Rate': {
        weight: 0.02,
        interpretation_note: "Stable or rising participation is healthy.",
        rules: [
          { if_above: 62.8, signal: 'strong_confirm', score: 2 },
          { if_between: [62.4, 62.8], signal: 'mild_confirm', score: 1 },
          { if_below: 62.4, signal: 'neutral', score: 0 }
        ]
      },
      'Core CPI': {
        weight: 0.12,
        interpretation_note: "Inflation stable near target (1.8-2.5% YoY).",
        rules: [
          { if_between: [1.8, 2.5], signal: 'strong_confirm', score: 2 },
          { if_between: [2.5, 3.0], signal: 'mild_confirm', score: 1 },
          { if_between: [1.5, 1.8], signal: 'neutral', score: 0 },
          { if_above: 3.0, signal: 'mild_contradict', score: -1 },
          { if_below: 1.5, signal: 'mild_contradict', score: -1 }
        ]
      },
      '5Y5Y Forward Inflation Rate': {
        weight: 0.05,
        interpretation_note: "Expectations anchored near 2-2.5%.",
        rules: [
          { if_between: [2.0, 2.5], signal: 'strong_confirm', score: 2 },
          { if_above: 2.8, signal: 'mild_contradict', score: -1 },
          { if_below: 1.8, signal: 'mild_contradict', score: -1 },
          { if_between: [1.8, 2.0], signal: 'neutral', score: 0 }, // Added to make exhaustive
          { if_between: [2.5, 2.8], signal: 'neutral', score: 0 }  // Added to make exhaustive
        ]
      },
      'Consumer Confidence Index': {
        weight: 0.06,
        interpretation_note: "High confidence (>110) supports growth.",
        rules: [
          { if_above: 110, signal: 'strong_confirm', score: 2 },
          { if_between: [100, 110], signal: 'mild_confirm', score: 1 },
          { if_between: [90, 100], signal: 'neutral', score: 0 },
          { if_below: 90, signal: 'mild_contradict', score: -1 }
        ]
      },
      'Fed Funds Rate': {
        weight: 0.04,
        interpretation_note: "Policy rate is appropriate, not overly restrictive or loose.",
        rules: [
          { if_between: [2.0, 4.0], signal: 'strong_confirm', score: 2 },
          { if_above: 4.5, signal: 'mild_contradict', score: -1 },
          { if_between: [4.0, 4.5], signal: 'neutral', score: 0 }, // Added
          { if_between: [1.5, 2.0], signal: 'neutral', score: 0 }, // Added
          { if_below: 1.5, signal: 'neutral', score: 0 } 
        ]
      },
      '10-Year Treasury Yield': {
        weight: 0.04,
        interpretation_note: "Yields reflect healthy growth and stable inflation, not panic.",
        rules: [
          { if_between: [2.5, 4.5], signal: 'strong_confirm', score: 2 },
          { if_above: 5.0, signal: 'mild_contradict', score: -1 },
          { if_between: [4.5, 5.0], signal: 'neutral', score: 0 }, // Added
          { if_between: [2.0, 2.5], signal: 'neutral', score: 0 }, // Added
          { if_below: 2.0, signal: 'mild_contradict', score: -1 }
        ]
      },
      'VIX Index': {
        weight: 0.05,
        interpretation_note: "Low volatility (<18) reflects market calm.",
        rules: [
          { if_below: 18, signal: 'strong_confirm', score: 2 },
          { if_between: [18, 22], signal: 'mild_confirm', score: 1 },
          { if_between: [22, 28], signal: 'neutral', score: 0 },
          { if_above: 28, signal: 'strong_contradict', score: -2 }
        ]
      },
      'S&P 500': {
        weight: 0.06,
        interpretation_note: "Market trending upwards, reflecting positive outlook (YoY % or trend).",
        rules: [
          { if_above: 10, signal: 'strong_confirm', score: 2 },
          { if_between: [5, 10], signal: 'mild_confirm', score: 1 },
          { if_between: [-5, 5], signal: 'neutral', score: 0 },
          { if_below: -5, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Dollar Index': {
        weight: 0.02,
        interpretation_note: "Stable dollar, not excessively strong or weak.",
        rules: [
          { if_between: [95, 105], signal: 'strong_confirm', score: 2 },
          { if_above: 110, signal: 'mild_contradict', score: -1 },
          { if_between: [105, 110], signal: 'neutral', score: 0 }, // Added
          { if_between: [90, 95], signal: 'neutral', score: 0 },   // Added
          { if_below: 90, signal: 'mild_contradict', score: -1 }
        ]
      },
      'Conference Board LEI': {
        weight: 0.08,
        interpretation_note: "Strongly positive LEI confirms forward momentum.",
        rules: [
          { if_above: 0.4, signal: 'strong_confirm', score: 2 },
          { if_between: [0.1, 0.4], signal: 'mild_confirm', score: 1 },
          { if_between: [-0.2, 0.1], signal: 'neutral', score: 0 },
          { if_below: -0.2, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Goldman Sachs CAI': {
        weight: 0.03,
        interpretation_note: "Proxy indicating strong current activity.",
        rules: [
          { if_above: 65, signal: 'strong_confirm', score: 2 },
          { if_between: [50, 65], signal: 'mild_confirm', score: 1 },
          { if_between: [40, 50], signal: 'neutral', score: 0 }, // Added
          { if_below: 40, signal: 'mild_contradict', score: -1 } // Modified
        ]
      },
      'Chicago Fed CFNAI': {
        weight: 0.02,
        interpretation_note: "Positive CFNAI indicates above-trend growth.",
        rules: [
          { if_above: 0.20, signal: 'strong_confirm', score: 2 },
          { if_between: [0.0, 0.20], signal: 'mild_confirm', score: 1 },
          { if_between: [-0.20, 0.0], signal: 'neutral', score: 0 },
          { if_below: -0.20, signal: 'mild_contradict', score: -1 }
        ]
      }
    }
  },
  'moderate-growth-with-headwinds': {
    thesis_description: "Positive but subdued GDP growth (0.5-2%), inflation sticky (3-4.5%), unemployment low but maybe edging up. Cautious sentiment.",
    metrics: {
      'Real GDP Growth Rate': {
        weight: 0.12,
        rules: [
          { if_between: [0.5, 2.0], signal: 'strong_confirm', score: 2 },
          { if_between: [2.0, 3.0], signal: 'mild_confirm', score: 1 },
          { if_above: 3.0, signal: 'mild_contradict', score: -1 },
          { if_between: [-0.5, 0.5], signal: 'mild_contradict', score: -1 },
          { if_below: -0.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Manufacturing PMI': {
        weight: 0.07,
        rules: [
          { if_between: [48, 52], signal: 'strong_confirm', score: 2 },
          { if_between: [52, 55], signal: 'mild_confirm', score: 1 },
          { if_between: [45, 48], signal: 'mild_confirm', score: 1 },
          { if_above: 55, signal: 'mild_contradict', score: -1 },
          { if_below: 45, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Services PMI': {
        weight: 0.07,
        rules: [
          { if_between: [50, 54], signal: 'strong_confirm', score: 2 },
          { if_between: [54, 57], signal: 'mild_confirm', score: 1 },
          { if_above: 57, signal: 'mild_contradict', score: -1 },
          { if_between: [47, 50], signal: 'mild_contradict', score: -1 },
          { if_below: 47, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Industrial Production Index': {
        weight: 0.04,
        rules: [
          { if_between: [-0.5, 1.5], signal: 'strong_confirm', score: 2 },
          { if_above: 2.5, signal: 'mild_contradict', score: -1 },
          { if_between: [1.5, 2.5], signal: 'neutral', score: 0 }, // Added
          { if_between: [-1.5, -0.5], signal: 'mild_contradict', score: -1 }, // Added
          { if_below: -1.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Capacity Utilization Rate': {
        weight: 0.03,
        rules: [
          { if_between: [75, 78], signal: 'strong_confirm', score: 2 },
          { if_above: 80, signal: 'mild_contradict', score: -1 },
          { if_between: [78, 80], signal: 'neutral', score: 0 }, // Added
          { if_between: [73, 75], signal: 'neutral', score: 0 }, // Added
          { if_below: 73, signal: 'mild_contradict', score: -1 }
        ]
      },
      'Unemployment Rate (U-3)': {
        weight: 0.10,
        rules: [
          { if_between: [3.8, 4.5], signal: 'strong_confirm', score: 2 },
          { if_below: 3.5, signal: 'mild_confirm', score: 1 }, // Changed to mild_confirm
          { if_between: [3.5, 3.8], signal: 'mild_confirm', score: 1 }, // Added
          { if_between: [4.5, 4.8], signal: 'mild_contradict', score: -1 }, // Added
          { if_above: 4.8, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Initial Jobless Claims': {
        weight: 0.06,
        rules: [
          { if_between: [240, 300], signal: 'strong_confirm', score: 2 },
          { if_below: 220, signal: 'mild_contradict', score: -1 },
          { if_between: [220, 240], signal: 'neutral', score: 0 }, // Added
          { if_between: [300, 350], signal: 'mild_contradict', score: -1 }, // Added
          { if_above: 350, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Job Openings (JOLTS)': {
        weight: 0.05,
        rules: [
          { if_between: [7.5, 9.0], signal: 'strong_confirm', score: 2 },
          { if_above: 9.5, signal: 'mild_contradict', score: -1 },
          { if_between: [9.0, 9.5], signal: 'neutral', score: 0 }, // Added
          { if_between: [7.0, 7.5], signal: 'mild_contradict', score: -1 }, // Added
          { if_below: 7.0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Labor Force Participation Rate': {
        weight: 0.02,
        rules: [
          { if_between: [62.0, 62.5], signal: 'strong_confirm', score: 2 },
          { if_above: 62.5, signal: 'neutral', score: 0 }, // Added
          { if_below: 62.0, signal: 'mild_contradict', score: -1 } // Added
        ]
      },
      'Core CPI': {
        weight: 0.12,
        rules: [
          { if_between: [3.0, 4.5], signal: 'strong_confirm', score: 2 },
          { if_above: 4.5, signal: 'mild_confirm', score: 1 },
          { if_between: [2.5, 3.0], signal: 'mild_contradict', score: -1 },
          { if_below: 2.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      '5Y5Y Forward Inflation Rate': {
        weight: 0.05,
        rules: [
          { if_between: [2.4, 3.0], signal: 'strong_confirm', score: 2 },
          { if_above: 3.0, signal: 'mild_confirm', score: 1 }, // Higher is still stagflationary
          { if_below: 2.2, signal: 'strong_contradict', score: -2 },
          { if_between: [2.2, 2.4], signal: 'neutral', score: 0 } // Added
        ]
      },
      'Consumer Confidence Index': {
        weight: 0.06,
        rules: [
          { if_between: [85, 100], signal: 'strong_confirm', score: 2 },
          { if_above: 105, signal: 'mild_contradict', score: -1 },
          { if_between: [100, 105], signal: 'neutral', score: 0 }, // Added
          { if_between: [80, 85], signal: 'mild_contradict', score: -1 }, // Added
          { if_below: 80, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Fed Funds Rate': {
        weight: 0.04,
        rules: [
          { if_between: [4.5, 5.75], signal: 'strong_confirm', score: 2 },
          { if_above: 5.75, signal: 'mild_confirm', score: 1 },
          { if_below: 4.0, signal: 'strong_contradict', score: -2 },
          { if_between: [4.0, 4.5], signal: 'neutral', score: 0 } // Added
        ]
      },
      '10-Year Treasury Yield': {
        weight: 0.04,
        rules: [
          { if_between: [4.0, 5.0], signal: 'strong_confirm', score: 2 },
          { if_above: 5.0, signal: 'mild_confirm', score: 1 },
          { if_below: 3.5, signal: 'strong_contradict', score: -2 },
          { if_between: [3.5, 4.0], signal: 'neutral', score: 0 } // Added
        ]
      },
      'VIX Index': {
        weight: 0.05,
        rules: [
          { if_between: [17, 25], signal: 'strong_confirm', score: 2 },
          { if_above: 28, signal: 'mild_contradict', score: -1 },
          { if_between: [25, 28], signal: 'neutral', score: 0 }, // Added
          { if_between: [16, 17], signal: 'neutral', score: 0 }, // Added
          { if_below: 16, signal: 'mild_contradict', score: -1 }
        ]
      },
      'S&P 500': {
        weight: 0.06,
        rules: [
          { if_between: [-5, 8], signal: 'strong_confirm', score: 2 },
          { if_above: 10, signal: 'mild_contradict', score: -1 },
          { if_between: [8, 10], signal: 'neutral', score: 0 }, // Added
          { if_between: [-10, -5], signal: 'mild_contradict', score: -1 }, // Added
          { if_below: -10, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Dollar Index': {
        weight: 0.02,
        rules: [
          { if_between: [100, 108], signal: 'strong_confirm', score: 2 },
          { if_above: 108, signal: 'neutral', score: 0 }, // Added
          { if_below: 100, signal: 'neutral', score: 0 } // Added
        ]
      },
      'Conference Board LEI': {
        weight: 0.08,
        rules: [
          { if_between: [-0.4, 0.1], signal: 'strong_confirm', score: 2 },
          { if_above: 0.3, signal: 'strong_contradict', score: -2 },
          { if_between: [0.1, 0.3], signal: 'neutral', score: 0 }, // Added
          { if_between: [-0.6, -0.4], signal: 'mild_contradict', score: -1 }, // Added
          { if_below: -0.6, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Goldman Sachs CAI': {
        weight: 0.03,
        rules: [
          { if_between: [45, 60], signal: 'strong_confirm', score: 2 },
          { if_above: 65, signal: 'mild_contradict', score: -1 },
          { if_between: [60, 65], signal: 'neutral', score: 0 }, // Added
          { if_between: [40, 45], signal: 'mild_contradict', score: -1 }, // Added
          { if_below: 40, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Chicago Fed CFNAI': {
        weight: 0.02,
        rules: [
          { if_between: [-0.3, 0.1], signal: 'strong_confirm', score: 2 },
          { if_above: 0.25, signal: 'mild_contradict', score: -1 },
          { if_between: [0.1, 0.25], signal: 'neutral', score: 0 }, // Added
          { if_between: [-0.5, -0.3], signal: 'mild_contradict', score: -1 }, // Added
          { if_below: -0.5, signal: 'strong_contradict', score: -2 }
        ]
      }
    }
  },
  'recessionary-conditions': {
    thesis_description: "Negative GDP growth (-0.5% or worse), inflation falling, unemployment rising significantly. Poor sentiment.",
    metrics: {
      'Real GDP Growth Rate': {
        weight: 0.15,
        rules: [
          { if_below: -0.5, signal: 'strong_confirm', score: 2 },
          { if_between: [-0.5, 0.5], signal: 'mild_confirm', score: 1 },
          { if_above: 1.0, signal: 'strong_contradict', score: -2 },
          { if_between: [0.5, 1.0], signal: 'neutral', score: 0 } // Added
        ]
      },
      'Manufacturing PMI': {
        weight: 0.08,
        rules: [
          { if_below: 45, signal: 'strong_confirm', score: 2 },
          { if_between: [45, 48], signal: 'mild_confirm', score: 1 },
          { if_between: [48, 50], signal: 'neutral', score: 0 },
          { if_above: 50, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Services PMI': {
        weight: 0.08,
        rules: [
          { if_below: 47, signal: 'strong_confirm', score: 2 },
          { if_between: [47, 50], signal: 'mild_confirm', score: 1 },
          { if_between: [50, 51], signal: 'neutral', score: 0 }, // Added
          { if_above: 51, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Industrial Production Index': {
        weight: 0.05,
        rules: [
          { if_below: -2.0, signal: 'strong_confirm', score: 2 },
          { if_between: [-2.0, 0.0], signal: 'mild_confirm', score: 1 },
          { if_between: [0.0, 1.0], signal: 'neutral', score: 0 }, // Added
          { if_above: 1.0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Capacity Utilization Rate': {
        weight: 0.03,
        rules: [
          { if_below: 74, signal: 'strong_confirm', score: 2 },
          { if_between: [74, 77], signal: 'mild_confirm', score: 1 },
          { if_between: [77, 78], signal: 'neutral', score: 0 }, // Added
          { if_above: 78, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Unemployment Rate (U-3)': {
        weight: 0.12,
        rules: [
          { if_above: 5.0, signal: 'strong_confirm', score: 2 },
          { if_between: [4.5, 5.0], signal: 'mild_confirm', score: 1 },
          { if_between: [4.0, 4.5], signal: 'neutral', score: 0 },
          { if_below: 4.0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Initial Jobless Claims': {
        weight: 0.07,
        rules: [
          { if_above: 350, signal: 'strong_confirm', score: 2 },
          { if_between: [300, 350], signal: 'mild_confirm', score: 1 },
          { if_between: [250, 300], signal: 'neutral', score: 0 },
          { if_below: 250, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Job Openings (JOLTS)': {
        weight: 0.05,
        rules: [
          { if_below: 7.0, signal: 'strong_confirm', score: 2 },
          { if_between: [7.0, 8.0], signal: 'mild_confirm', score: 1 },
          { if_between: [8.0, 8.5], signal: 'neutral', score: 0 }, // Added
          { if_above: 8.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Labor Force Participation Rate': {
        weight: 0.01,
        rules: [
          { if_below: 62.0, signal: 'mild_confirm', score: 1 },
          { if_between: [62.0, 62.2], signal: 'neutral', score: 0 }, // Added
          { if_above: 62.2, signal: 'neutral', score: 0 } // Assuming not a strong contradictor for recession
        ]
      },
      'Core CPI': {
        weight: 0.07,
        rules: [
          { if_below: 2.0, signal: 'strong_confirm', score: 2 },
          { if_between: [2.0, 3.0], signal: 'mild_confirm', score: 1 },
          { if_between: [3.0, 3.5], signal: 'neutral', score: 0 }, // Added
          { if_above: 3.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      '5Y5Y Forward Inflation Rate': {
        weight: 0.03,
        rules: [
          { if_below: 2.0, signal: 'strong_confirm', score: 2 },
          { if_between: [2.0, 2.3], signal: 'mild_confirm', score: 1 },
          { if_between: [2.3, 2.5], signal: 'neutral', score: 0 }, // Added
          { if_above: 2.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Consumer Confidence Index': {
        weight: 0.06,
        rules: [
          { if_below: 80, signal: 'strong_confirm', score: 2 },
          { if_between: [80, 90], signal: 'mild_confirm', score: 1 },
          { if_between: [90, 95], signal: 'neutral', score: 0 }, // Added
          { if_above: 95, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Fed Funds Rate': {
        weight: 0.04,
        rules: [
          { if_below: 2.5, signal: 'strong_confirm', score: 2 },
          { if_between: [2.5, 4.0], signal: 'mild_confirm', score: 1 },
          { if_between: [4.0, 4.5], signal: 'neutral', score: 0 }, // Added
          { if_above: 4.5, signal: 'strong_contradict', score: -2 }
        ]
      },
      '10-Year Treasury Yield': {
        weight: 0.05,
        rules: [
          { if_below: 3.0, signal: 'strong_confirm', score: 2 },
          { if_between: [3.0, 3.8], signal: 'mild_confirm', score: 1 },
          { if_between: [3.8, 4.0], signal: 'neutral', score: 0 }, // Added
          { if_above: 4.0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'VIX Index': {
        weight: 0.06,
        rules: [
          { if_above: 28, signal: 'strong_confirm', score: 2 },
          { if_between: [22, 28], signal: 'mild_confirm', score: 1 },
          { if_between: [20, 22], signal: 'neutral', score: 0 }, // Added
          { if_below: 20, signal: 'strong_contradict', score: -2 }
        ]
      },
      'S&P 500': {
        weight: 0.07,
        rules: [
          { if_below: -15, signal: 'strong_confirm', score: 2 },
          { if_between: [-15, -5], signal: 'mild_confirm', score: 1 },
          { if_between: [-5, 0], signal: 'neutral', score: 0 }, // Added
          { if_above: 0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Dollar Index': {
        weight: 0.01,
        rules: [ // Behavior is complex, keeping simple
          { if_above: 105, signal: 'mild_confirm', score: 1 }, // Flight to safety often
          { if_between: [95, 105], signal: 'neutral', score: 0 },
          { if_below: 95, signal: 'neutral', score: 0 } // Could weaken if US outlook very bad
        ]
      },
      'Conference Board LEI': {
        weight: 0.10,
        rules: [
          { if_below: -0.5, signal: 'strong_confirm', score: 2 },
          { if_between: [-0.5, -0.2], signal: 'mild_confirm', score: 1 },
          { if_between: [-0.2, 0.0], signal: 'neutral', score: 0 }, // Added
          { if_above: 0, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Goldman Sachs CAI': {
        weight: 0.03,
        rules: [
          { if_below: 40, signal: 'strong_confirm', score: 2 },
          { if_between: [40, 50], signal: 'mild_confirm', score: 1 },
          { if_between: [50, 55], signal: 'neutral', score: 0 }, // Added
          { if_above: 55, signal: 'strong_contradict', score: -2 }
        ]
      },
      'Chicago Fed CFNAI': {
        weight: 0.02,
        rules: [
          { if_below: -0.70, signal: 'strong_confirm', score: 2 },
          { if_between: [-0.70, -0.25], signal: 'mild_confirm', score: 1 },
          { if_between: [-0.25, 0.0], signal: 'neutral', score: 0 }, // Added
          { if_above: 0, signal: 'strong_contradict', score: -2 }
        ]
      }
    }
  }
};


/*
// Thesis scoring logic based on real economic conditions
export const THESIS_SCORING_RULES = {
    'economic-transition': {
      economic: {
        'Real GDP Growth Rate': { weight: 0.3, threshold: { negative: -1, positive: 2 } },
        'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 4.5, positive: 3.5 } },
        'Core PCE': { weight: 0.2, threshold: { negative: 3.5, positive: 2.0 } },
        'Fed Funds Rate': { weight: 0.15, threshold: { negative: 3.0, positive: 5.5 } },
        'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 90, positive: 110 } }
      }
    },
    'soft-landing': {
      economic: {
        'Real GDP Growth Rate': { weight: 0.25, threshold: { negative: 0, positive: 3 } },
        'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 5, positive: 3 } },
        'Core PCE': { weight: 0.25, threshold: { negative: 4, positive: 1.5 } },
        'Fed Funds Rate': { weight: 0.15, threshold: { negative: 6, positive: 2 } },
        'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 85, positive: 105 } }
      }
    },
    'mild-recession': {
      economic: {
        'Real GDP Growth Rate': { weight: 0.3, threshold: { negative: 1, positive: -2 } },
        'Unemployment Rate (U-3)': { weight: 0.25, threshold: { negative: 3.5, positive: 6 } },
        'Core PCE': { weight: 0.2, threshold: { negative: 2, positive: 4 } },
        'Initial Jobless Claims': { weight: 0.15, threshold: { negative: 300, positive: 450 } },
        'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 100, positive: 70 } }
      }
    }
  };

  */