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