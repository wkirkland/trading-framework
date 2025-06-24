# Claude Code Session Memory

## Project Overview
Trading framework with real-time economic data visualization, signal analysis, and advanced analytics featuring historical trends and correlation analysis.

## Recent Critical Interface Fixes

### TypeScript Synchronization Issues (June 2025)
After modular refactoring of `analysisUtils.ts`, several interface mismatches caused deployment failures:

#### Root Cause
- Interface drift between refactored analysis modules and consuming components
- Missing type annotations causing TypeScript strict mode violations
- Import/export misalignment after module restructuring

#### Key Interface Dependencies
1. `lib/analysis/types/analysis.types.ts` - Central type definitions
2. `lib/hooks/useSignalAnalysis.ts` - Hook return types (must match SignalDashboard expectations)
3. `lib/analysis/index.ts` - Export consistency
4. `lib/monitoring/errorTracker.ts` - Error interface consistency
5. `components/dashboard/SignalDashboard.tsx` - Consumer interface expectations

#### Critical Interface Contracts
```typescript
// useSignalAnalysis hook MUST return:
{
  selectedThesis: string;
  setSelectedThesis: (thesis: string) => void;
  evidenceScores: BasicEvidenceScores;
  keyMetrics: SignalData[];
  conflictAlerts: ConflictAlert[];
  thresholdTriggers: ThresholdTrigger[];
  loading: boolean;
  error: any;
  lastFetched: Date | null;
  fetchData: () => void;
}

// ErrorContext interface does NOT include metadata
interface ErrorContext {
  component: string;
  operation?: string;
  // ... other props (no metadata)
}
```

#### Common TypeScript Pitfalls
- ❌ `totalWeightedScore` → ✅ `overallScore` (POC analysis)
- ❌ `matchedRuleCondition` → ✅ `reasoning` (analysis details)
- ❌ `metadata` on ErrorContext → ✅ metadata only on ErrorReport/PerformanceMetric
- ❌ Missing type annotations on empty arrays → ✅ `ConflictAlert[]`, `ThresholdTrigger[]`
- ❌ Importing from non-existent modules → ✅ Import from `@/lib/analysis`

#### Development Guidelines
1. **Always use explicit type annotations** for hook returns and component props
2. **Test interface compatibility** between modules before committing
3. **Never assume array types** - always provide explicit type annotations
4. **Use the analysis module exports** - avoid importing from non-existent utils files
5. **Maintain ErrorContext interface purity** - no metadata in context, only in reports

## Environment Variables (Vercel)
- `FRED_API_KEY`: Federal Reserve API key
- `ALPHA_VANTAGE_API_KEY`: RPLVHCHM9YZEQDN6 (for market data)

## Build Commands
- Development: `npm run dev`
- Production: `npm run build` (requires Next.js locally)
- Type checking: `npx tsc --noEmit --skipLibCheck` (requires TypeScript)

## Deployment Status
- Platform: Vercel
- URL: https://trading-framework.vercel.app/module1
- Auto-deploy: Enabled on main branch pushes
- Last successful build: After adding missing API routes and fixing client-side environment access
- Latest fix: Created /api/historical and /api/correlation endpoints, fixed TypeScript interface errors

## VS Code TypeScript Errors Fix
If you see "Cannot find module 'next'" errors in VS Code:
- Local Next.js installation may be incomplete (doesn't affect Vercel deployment)
- Temporary type declarations created in `types/next.d.ts`
- TypeScript config updated to include custom type declarations
- Errors are cosmetic - deployment compilation works correctly

## Testing Checklist
Before pushing changes that modify interfaces:
- [ ] Verify all imports resolve correctly
- [ ] Check hook return types match component expectations
- [ ] Ensure error tracking interfaces are consistent
- [ ] Test that analysis module exports align with usage
- [ ] Validate no metadata properties on ErrorContext

## Known Interface Locations
- **Analysis Types**: `lib/analysis/types/analysis.types.ts`
- **Hook Returns**: `lib/hooks/useSignalAnalysis.ts`
- **Component Expectations**: `components/dashboard/SignalDashboard.tsx`
- **Error Tracking**: `lib/monitoring/errorTracker.ts`
- **POC Analysis**: `lib/analysis/scoring/pocAnalysis.ts`

## Recent Major Fixes (June 2025)

### Client-Side Environment Variable Access Issue
**Problem**: "Environment variable validation failed for FRED_API_KEY" errors on client-side
**Root Cause**: FRED client, logger, and errorTracker were accessing `process.env` on client-side
**Solution**: Added `typeof window !== 'undefined'` checks to make these services server-side only
**Files Fixed**:
- `lib/http/fredClient.ts` - Added client-side check in constructor
- `lib/monitoring/errorTracker.ts` - Conditional environment access in captureError
- `lib/monitoring/logger.ts` - Conditional environment access in constructor
- `lib/services/apiHealthService.ts` - Server-side only API health checks

### Missing API Routes for Analytics Features
**Problem**: Historical trends and correlation analysis pages showing 503 errors
**Root Cause**: Analytics components calling `/api/historical` and `/api/correlation` endpoints that didn't exist
**Solution**: Created missing API routes
**New Endpoints**:
- `app/api/historical/route.ts` - Time-series data for charts (GET endpoint)
- `app/api/correlation/route.ts` - Metric correlation calculations (GET endpoint)

### Data Fetching Architecture Issues
**Problem**: React Query fetch calls hanging, falling back to static data
**Root Cause**: No timeout on fetch requests, API calls taking too long
**Solution**: Added proper timeout handling and retry logic
**Improvements**:
- 60-second timeout with AbortController
- Better error logging and debugging
- Improved React Query retry settings (3 retries, 1 second delay)

## Current Feature Status ✅

### ✅ Completed Features
- **Core Dashboard** (`/module1`) - Real-time economic metrics with thesis analysis
- **Signal Analysis** (`/signal-dashboard`) - Conflict detection and threshold triggers
- **Enhanced Dashboard** (`/enhanced-dashboard`) - Combined market and economic data
- **Historical Trends** (`/historical-trends`) - Time-series visualization with Recharts
- **Correlation Analysis** (`/correlation-analysis`) - Heat map and relationship analysis
- **Storage Viewer** (`/storage-viewer`) - Database inspection and cache statistics
- **API Health Monitoring** - Real-time API status indicators
- **Data Freshness Tracking** - Staleness warnings and update timestamps
- **Error Boundaries** - Graceful failure handling with retry logic
- **Local File Storage** - SQLite alternative for data persistence

### 🔧 API Endpoints
- `GET /api/fred-data` - Latest economic data from FRED and Alpha Vantage
- `GET /api/historical` - Historical time-series data for specific metrics
- `GET /api/correlation` - Correlation analysis between metric pairs
- `GET /api/storage` - Storage system inspection and statistics
- `GET /api/debug-client` - Client-side API testing endpoint

### 📊 Analytics Capabilities
- **Correlation Analysis**: Pearson correlation with strength categorization
- **Historical Trends**: Time-series charts with trend detection
- **Pattern Recognition**: Ready for implementation (correlation patterns exist)
- **Data Quality Monitoring**: Freshness tracking and API health status
- **Caching System**: File-based storage with frequency-based rules

## Next Development Priorities

1. **Pattern Recognition** - Implement automated detection of correlation patterns
2. **Real-time Alerts** - Threshold-based notifications for significant changes
3. **Export Capabilities** - Download charts and data for external analysis
4. **Multi-metric Overlays** - Chart multiple indicators on single graphs
5. **Predictive Indicators** - Early warning signals and basic forecasting