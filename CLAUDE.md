# Claude Code Session Memory

## Project Overview
FRED API security refactor for a trading framework with real-time economic data visualization and signal analysis.

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
- Last successful build: After comprehensive TypeScript interface sync fixes

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