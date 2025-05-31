// lib/config/enhancedThesisRules.ts
export const ENHANCED_THESIS_SCORING_RULES = {
    'economic-transition': {
      economic: {
        'Real GDP Growth Rate': { weight: 0.25, threshold: { negative: -1, positive: 2 } },
        'Unemployment Rate (U-3)': { weight: 0.2, threshold: { negative: 4.5, positive: 3.5 } },
        'Core PCE': { weight: 0.15, threshold: { negative: 3.5, positive: 2.0 } },
        'Fed Funds Rate': { weight: 0.15, threshold: { negative: 3.0, positive: 5.5 } },
        'Consumer Confidence Index': { weight: 0.1, threshold: { negative: 90, positive: 110 } },
        'Initial Jobless Claims': { weight: 0.15, threshold: { negative: 300000, positive: 450000 } }
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
        'Initial Jobless Claims': { weight: 0.15, threshold: { negative: 300000, positive: 450000 } },
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