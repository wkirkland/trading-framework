# Trading Framework

A sophisticated real-time economic analysis and trading framework built with Next.js that tracks macroeconomic indicators, analyzes market thesis alignment, and provides automated signal detection for trading decisions.

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Configuration](#environment-configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Core Components](#core-components)
- [API Integration](#api-integration)
- [Signal Analysis System](#signal-analysis-system)
- [Dashboard Features](#dashboard-features)
- [Development](#development)
- [Testing](#testing)
- [Contributing](#contributing)

## Overview

This trading framework is designed to provide systematic, data-driven analysis of economic conditions and market trends. It integrates multiple economic data sources (FRED Economic Data, Alpha Vantage) to evaluate the strength of evidence for different economic thesis scenarios such as "soft landing," "recession," or "strong growth with stable inflation."

The system continuously monitors 20+ key economic indicators including GDP growth, unemployment, inflation metrics, PMI indices, and market indicators like VIX and S&P 500 to provide real-time analysis and conflict detection.

## Key Features

### 🔄 Real-Time Data Integration
- **FRED Economic Data**: GDP, unemployment, inflation, interest rates, and composite indices
- **Alpha Vantage**: Market indicators (VIX, S&P 500, market sentiment)
- **Automated data fetching** with intelligent caching and rate limiting
- **Fallback mechanisms** for data availability issues

### 📊 Signal Analysis Engine
- **Weight of Evidence scoring** based on configurable thesis rules
- **Multi-thesis evaluation**: Economic transition, soft landing, recession scenarios
- **Conflict detection** between economic indicators and market signals
- **Threshold triggers** for predefined economic conditions

### 📈 Interactive Dashboard
- **Real-time signal dashboard** with live status indicators
- **Evidence scoring visualization** across economic categories
- **Conflict alerts** for contradictory market signals
- **Metric detail tables** with reasoning and data sources

### ⚡ Advanced Analytics
- **Configurable scoring rules** for different economic scenarios
- **Automated signal classification** (confirm/contradict/neutral)
- **Market stress and recession triggers**
- **Historical change tracking** and trend analysis

## Architecture

### Technology Stack

```
Frontend:           Next.js 15, React 19, TailwindCSS
Backend:            Next.js API Routes (Node.js)
State Management:   React Query (TanStack Query)
Data Sources:       FRED API, Alpha Vantage API
Styling:            TailwindCSS, Custom CSS
Charts:             Recharts
Icons:              Heroicons, Lucide React
```

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dashboard UI  │    │   API Routes    │    │  Data Services  │
│   (React)       │◄──►│   (Next.js)     │◄──►│   (FRED/AV)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Signal Analysis │    │ Thesis Scoring  │    │ External APIs   │
│   Engine        │    │     Rules       │    │ (FRED/Alpha)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Components

- **`fredService`**: FRED Economic Data integration with caching and rate limiting
- **`multiSourceDataService`**: Alpha Vantage market data integration
- **`signalThesisRules`**: Configurable scoring rules for economic scenarios
- **`analysisUtils`**: Core analysis engine for signal processing
- **`SignalDashboard`**: Main UI component for real-time monitoring

## Prerequisites

- Node.js >= 18.0.0
- npm >= 8.0.0 or yarn >= 1.22.0
- FRED API Key (free registration at https://fred.stlouisfed.org/docs/api/api_key.html)
- Alpha Vantage API Key (free registration at https://www.alphavantage.co/support/#api-key)

## Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd trading-framework
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual API keys
   ```

4. **Configure API keys** (see Environment Configuration below)

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Open the application:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

```env
# Required: FRED Economic Data API
FRED_API_KEY=your_fred_api_key_here

# Required: Alpha Vantage Market Data API
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_key_here

# Optional: Development settings
NODE_ENV=development
```

### API Key Setup

#### FRED API Key
1. Visit [FRED API Registration](https://fred.stlouisfed.org/docs/api/api_key.html)
2. Create a free account
3. Generate an API key
4. Add to `.env.local` as `FRED_API_KEY`

#### Alpha Vantage API Key
1. Visit [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Sign up for a free account
3. Generate an API key
4. Add to `.env.local` as `ALPHA_VANTAGE_API_KEY`

## Security

### 🔒 API Key Security

This project implements secure API key handling to prevent exposure of sensitive credentials:

#### ✅ **Security Measures Implemented**

- **No API keys in URLs**: API keys are never exposed in query parameters or logs
- **Secure HTTP client**: Custom `fredClient` handles authentication securely
- **Environment validation**: Type-safe environment variable validation with `env.ts`
- **ESLint security rules**: Automated prevention of API key exposure patterns
- **CI security checks**: GitHub Actions workflow validates code for security issues

#### 🛡️ **Security Best Practices**

1. **Never commit API keys**: Always use `.env.local` (which is git-ignored)
2. **Use different keys per environment**: Separate keys for development/production
3. **Rotate keys regularly**: Update API keys periodically
4. **Monitor usage**: Check API key usage for unusual activity
5. **Read-only permissions**: Use the minimum required permissions for API keys

#### ⚠️ **Security Warnings**

- **Never include API keys in code, URLs, or logs**
- **Don't commit `.env`, `.env.local`, or any files with real secrets**
- **Be careful when sharing code or screenshots that might expose keys**
- **Use secure channels when sharing credentials with team members**

#### 🔍 **Security Validation**

Run security checks locally:
```bash
# Check for exposed API keys
npm run lint

# Run security-focused tests
npm run test -- --testNamePattern="Security"

# Manual security audit
grep -r "api_key=" --include="*.ts" --include="*.tsx" . || echo "✅ No exposed API keys found"
```

## Usage

### Starting the Application

```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

### Accessing the Dashboard

1. **Main Dashboard**: Navigate to `/signal-dashboard` for the primary trading interface
2. **Alternative Views**: 
   - `/enhanced-dashboard` - Enhanced analytics view
   - `/module1` - Additional analysis modules

### Core Workflows

#### 1. Economic Thesis Analysis
- Select an economic thesis from the dropdown (e.g., "Strong Growth with Stable Inflation")
- Monitor real-time evidence scores across economic categories
- Review conflict alerts for contradictory signals

#### 2. Signal Monitoring
- Track 20+ key economic indicators in real-time
- View signal classification (confirm/contradict/neutral) for each metric
- Monitor threshold triggers for predefined economic conditions

#### 3. Market Analysis
- Analyze market indicators (VIX, S&P 500, Dollar Index)
- Detect conflicts between economic data and market behavior
- Track market stress and recession probability indicators

## Project Structure

```
trading-framework/
├── app/                          # Next.js app directory
│   ├── api/                      # API routes
│   │   └── fred-data/           # Economic data endpoint
│   ├── signal-dashboard/        # Main trading dashboard
│   ├── enhanced-dashboard/      # Enhanced analytics view
│   └── layout.tsx              # Root layout
├── components/                  # React components
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── SignalDashboard.tsx # Main dashboard component
│   │   └── MetricsTable.tsx    # Metrics display table
│   ├── debug/                  # Debug and testing components
│   └── layout/                 # Layout components
├── lib/                        # Core application logic
│   ├── services/               # External API integrations
│   │   ├── fredService.ts      # FRED Economic Data service
│   │   └── multiSourceDataService.ts # Alpha Vantage integration
│   ├── config/                 # Configuration files
│   │   └── signalThesisRules.ts # Economic scoring rules
│   ├── data/                   # Data definitions
│   │   └── metrics.ts          # Economic metrics configuration
│   ├── hooks/                  # Custom React hooks
│   │   ├── useSignalAnalysis.ts # Main analysis hook
│   │   └── useLiveData.ts      # Data fetching hook
│   ├── utils/                  # Utility functions
│   │   └── analysisUtils.ts    # Core analysis algorithms
│   └── context/                # React context providers
└── public/                     # Static assets
```

## Core Components

### Economic Data Services

#### FRED Service (`lib/services/fredService.ts`)
- Integrates with Federal Reserve Economic Data API
- Handles 15+ economic indicators including GDP, unemployment, inflation
- Features intelligent caching, rate limiting, and fallback data
- Supports bulk data fetching for efficient API usage

#### Multi-Source Data Service (`lib/services/multiSourceDataService.ts`)
- Integrates with Alpha Vantage for market data
- Handles VIX, S&P 500, and other market indicators
- Implements proper rate limiting for free tier API limits
- Provides formatted market data with change calculations

### Analysis Engine

#### Signal Thesis Rules (`lib/config/signalThesisRules.ts`)
Configurable scoring system supporting multiple economic scenarios:

- **Strong Growth with Stable Inflation**: GDP 2.5-4%, inflation 2-3%, low unemployment
- **Moderate Growth with Headwinds**: Subdued growth 0.5-2%, sticky inflation 3-4.5%
- **Recessionary Conditions**: Negative GDP, falling inflation, rising unemployment

#### Analysis Utils (`lib/utils/analysisUtils.ts`)
Core analysis algorithms including:
- Weight of evidence calculation
- Signal classification (confirm/contradict/neutral)
- Conflict detection between indicators
- Threshold trigger evaluation

### Dashboard Components

#### Signal Dashboard (`components/dashboard/SignalDashboard.tsx`)
Main trading interface featuring:
- Real-time thesis evaluation
- Evidence score visualization
- Active conflict alerts
- Threshold trigger monitoring
- Comprehensive metrics table

## API Integration

### Economic Data Endpoint (`/api/fred-data`)

**GET Request**: Returns comprehensive economic data
```json
{
  "success": true,
  "data": {
    "Real GDP Growth Rate": {
      "value": 2.8,
      "formatted": "2.8%",
      "date": "2024-03-01",
      "change": 0.2,
      "source": "FRED",
      "units": "% QoQ SAAR"
    },
    "Unemployment Rate (U-3)": {
      "value": 3.9,
      "formatted": "3.9%",
      "date": "2024-05-01",
      "source": "FRED"
    }
  },
  "debug": {
    "fetchedMetricsCount": {
      "fredFetchedSuccessfully": 12,
      "alphaVantageFetchedSuccessfully": 3
    }
  }
}
```

**POST Request**: Debug endpoint for API testing
```json
{
  "success": true,
  "tests": {
    "fredTest": { "success": true, "result": {...} },
    "alphaVantageTest": { "success": true, "result": {...} }
  }
}
```

### Data Flow Architecture

1. **Data Collection**: Services fetch data from FRED and Alpha Vantage APIs
2. **Processing**: Raw data is normalized and formatted in API routes
3. **Analysis**: Analysis engine applies thesis rules to generate signals
4. **Visualization**: Dashboard displays real-time results with conflict detection

## Signal Analysis System

### Thesis Evaluation Process

1. **Data Collection**: Gather 20+ economic indicators from multiple sources
2. **Rule Application**: Apply configurable scoring rules based on selected thesis
3. **Signal Generation**: Classify each indicator as confirm/contradict/neutral
4. **Weight Calculation**: Compute weighted evidence scores across categories
5. **Conflict Detection**: Identify contradictory signals between indicators

### Scoring Methodology

Each metric receives a score based on its alignment with the selected thesis:
- **Strong Confirm (+2)**: Metric strongly supports the thesis
- **Mild Confirm (+1)**: Metric moderately supports the thesis  
- **Neutral (0)**: Metric neither supports nor contradicts
- **Mild Contradict (-1)**: Metric moderately contradicts the thesis
- **Strong Contradict (-2)**: Metric strongly contradicts the thesis

Final scores are weighted by indicator importance and normalized across categories.

### Example: Strong Growth Thesis Rules

```typescript
'Real GDP Growth Rate': {
  weight: 0.12,
  rules: [
    { if_above: 3.0, signal: 'strong_confirm', score: 2 },
    { if_between: [2.0, 3.0], signal: 'mild_confirm', score: 1 },
    { if_between: [1.0, 2.0], signal: 'neutral', score: 0 },
    { if_below: 0.0, signal: 'strong_contradict', score: -2 }
  ]
}
```

## Dashboard Features

### Real-Time Status Indicators
- **Live Data Status**: Shows connection status and last update time
- **Data Quality Metrics**: Indicates how many indicators have live data
- **Refresh Controls**: Manual refresh capability with loading states

### Evidence Visualization
- **Category Scores**: Economic, political, social, environmental evidence
- **Overall Assessment**: Weighted combination of all evidence categories
- **Progress Bars**: Visual representation of evidence strength and direction

### Conflict Alert System
- **High/Medium/Low Severity**: Prioritized conflict detection
- **Market vs Economic**: Detects divergence between market and economic signals
- **Threshold Monitoring**: Alerts when key economic thresholds are breached

### Metrics Table
- **Signal Classification**: Clear confirm/contradict/neutral indicators
- **Value Display**: Current values with formatting and units
- **Change Tracking**: Recent changes with directional indicators
- **Reasoning**: Explanation of why each signal was classified
- **Source Attribution**: Clear indication of data sources

## Development

### Project Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server
npm run lint        # Run ESLint

# With Turbopack (faster development)
npm run dev -- --turbo
```

### Adding New Economic Indicators

1. **Define the metric** in `lib/data/metrics.ts`:
```typescript
{
  category: 'economic',
  name: 'New Economic Indicator',
  description: 'Description of the indicator',
  apiIdentifier: { fred: 'FRED_SERIES_ID' },
  apiSource: 'FRED',
  isPocMetric: true
}
```

2. **Add scoring rules** in `lib/config/signalThesisRules.ts`:
```typescript
'New Economic Indicator': {
  weight: 0.08,
  rules: [
    { if_above: 5.0, signal: 'strong_confirm', score: 2 },
    { if_below: 2.0, signal: 'strong_contradict', score: -2 }
  ]
}
```

3. **Test the integration** using the debug endpoint at `/api/fred-data` (POST)

### Customizing Thesis Rules

Economic thesis rules are highly configurable. To add a new thesis:

1. **Define the thesis** in `signalThesisRules.ts`
2. **Set metric weights** based on importance for your thesis
3. **Configure thresholds** for each indicator's confirm/contradict levels
4. **Add to dashboard** thesis selector options

### Extending Data Sources

To add new data sources:

1. **Create a service** similar to `fredService.ts`
2. **Update metrics configuration** with new API identifiers
3. **Modify API route** to handle the new service
4. **Add fallback data** for reliability

## Testing

### Automated Testing Framework

The project includes comprehensive Jest-based testing with focus on security and reliability:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run CI tests (non-interactive)
npm run test:ci
```

#### Test Categories

1. **Unit Tests**: Core functionality testing
   - `tests/fredClient.test.ts` - HTTP client security and functionality
   - `tests/fredService.test.ts` - Service layer business logic
   - `tests/env.test.ts` - Environment configuration validation

2. **Security Tests**: API key exposure prevention
   - URL security validation
   - Header injection testing  
   - Environment variable protection

3. **Integration Tests**: End-to-end workflow testing
   - API integration testing
   - Error handling validation
   - Cache functionality verification

#### Test Coverage

Current test coverage targets:
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Manual Testing

1. **API Endpoint Testing**:
   ```bash
   # Test data fetching
   curl http://localhost:3000/api/fred-data
   
   # Test debug endpoint
   curl -X POST http://localhost:3000/api/fred-data
   ```

2. **Dashboard Testing**:
   - Navigate to `/signal-dashboard`
   - Test thesis switching
   - Verify real-time data updates
   - Check conflict alert generation

3. **Security Testing**:
   ```bash
   # Verify no API keys in logs
   npm run dev 2>&1 | grep -i "api.*key" && echo "❌ API key exposed!" || echo "✅ No API keys in logs"
   
   # Run security lint checks
   npm run lint
   ```

### Environment Testing

Test with missing API keys to verify fallback behavior:
```bash
# Remove API keys temporarily
unset FRED_API_KEY
unset ALPHA_VANTAGE_API_KEY
npm run dev
```

## Contributing

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** following the existing code patterns
4. **Test thoroughly** with both live and fallback data
5. **Submit a pull request** with clear description of changes

### Code Style Guidelines

- **TypeScript**: Use strict typing throughout
- **Component Structure**: Follow the existing component patterns
- **Error Handling**: Implement comprehensive error handling with fallbacks
- **Documentation**: Add comments for complex analysis logic
- **Performance**: Consider API rate limits and caching strategies

### Adding Features

When adding new features:
- **Maintain backward compatibility** with existing thesis rules
- **Add comprehensive error handling** for API failures
- **Include fallback data** for reliability
- **Update documentation** with usage examples
- **Test with various economic conditions**

---

## Support

For questions, issues, or contributions:
- **Documentation**: Check this README and inline code comments
- **Issues**: Use GitHub Issues for bug reports and feature requests
- **Development**: Follow the contributing guidelines above

## License

This project is for educational and research purposes. Ensure you comply with the terms of service for FRED and Alpha Vantage APIs when using this framework.

---

*Built with Next.js 15, React 19, and real-time economic data integration for systematic trading analysis.*