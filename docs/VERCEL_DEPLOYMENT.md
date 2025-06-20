# Vercel Deployment Configuration

## Environment Variables Required

### 🔴 **CRITICAL - Required for Basic Functionality**

1. **FRED_API_KEY**
   - **Purpose**: Federal Reserve Economic Data API access
   - **Format**: 32-character alphanumeric string
   - **Example**: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
   - **Get Key**: https://fred.stlouisfed.org/docs/api/api_key.html
   - **Impact if Missing**: All economic data will fail to load

### 🟡 **IMPORTANT - Required for Complete Functionality**

2. **ALPHA_VANTAGE_API_KEY**
   - **Purpose**: Real-time market data (VIX, S&P 500, Dollar Index, Gold)
   - **Format**: Alphanumeric string
   - **Example**: `ABC123DEF456GHI789JKL012MNO345PQ`
   - **Get Key**: https://www.alphavantage.co/support/#api-key
   - **Impact if Missing**: Market data will use fallback values (outdated)

### 🟢 **OPTIONAL - System Configuration**

3. **FRED_BASE_URL** (Optional)
   - **Default**: `https://api.stlouisfed.org/fred`
   - **Only change if using custom FRED endpoint**

4. **NODE_ENV** (Optional)
   - **Default**: `production` (Vercel sets automatically)
   - **Options**: `development`, `production`, `test`

## Vercel Environment Variable Setup

### Via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your `trading-framework` project
3. Navigate to **Settings** → **Environment Variables**
4. Add each variable:
   - **Name**: Variable name (e.g., `FRED_API_KEY`)
   - **Value**: Your actual API key
   - **Environments**: Select `Production`, `Preview`, `Development`

### Via Vercel CLI
```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project
vercel link

# Add environment variables
vercel env add FRED_API_KEY production
vercel env add ALPHA_VANTAGE_API_KEY production

# List current environment variables
vercel env ls
```

## Deployment Issues & Solutions

### Issue: Build Failures
**Symptoms**: 
- `Module not found: Can't resolve '../shared/lib/utils'`
- Webpack compilation errors

**Solution**: 
- Fixed Next.js/React version compatibility in package.json
- Downgraded to stable versions:
  - Next.js: 15.1.0 (from 15.3.2)
  - React: 18.3.1 (from 19.0.0)

### Issue: Outdated Market Data
**Symptoms**:
- S&P 500 showing $4,385 (should be ~$5,950+)
- VIX showing outdated values
- Market data labeled as "(Fallback)"

**Root Cause**: Missing `ALPHA_VANTAGE_API_KEY` environment variable

**Solution**: 
1. Add Alpha Vantage API key to Vercel environment variables
2. Updated fallback data to current values (June 2025)

### Issue: API Errors in Production
**Symptoms**:
- 500 errors on `/api/fred-data` endpoint
- Console errors about missing API keys

**Solution**: 
- Ensure all required environment variables are set
- Check API key validity and rate limits

## Vercel Logs Access

### Method 1: Vercel CLI
```bash
# View recent logs
vercel logs

# View logs for specific deployment
vercel logs --follow

# View build logs
vercel logs --type build
```

### Method 2: Vercel Dashboard
1. Go to your project dashboard
2. Click on **Functions** tab
3. Click on any function to view logs
4. Or go to **Deployments** → Click deployment → View logs

### Method 3: Real-time Monitoring
```bash
# Follow logs in real-time
vercel logs --follow --type all
```

## Testing Deployment

### Local Testing
```bash
# Test build locally
npm run build

# Test production build locally  
npm run start

# Test API endpoints
curl http://localhost:3000/api/fred-data
```

### Production Testing
```bash
# Test live API
curl https://trading-framework.vercel.app/api/fred-data

# Check specific endpoint functionality
curl https://trading-framework.vercel.app/api/health
```

## Current Status (June 20, 2025)

✅ **Working**:
- FRED API integration (14 economic indicators)
- Basic application functionality
- Health monitoring endpoints

❌ **Issues Fixed**:
- ✅ Updated fallback market data to current values
- ✅ Fixed Next.js/React version compatibility
- ✅ Documented environment variable requirements

⚠️ **Needs Attention**:
- Alpha Vantage API key still needs to be added to Vercel
- Real-time market data currently using fallback values

## Next Steps

1. **Add Alpha Vantage API Key to Vercel**
   ```bash
   vercel env add ALPHA_VANTAGE_API_KEY production
   ```

2. **Trigger New Deployment**
   ```bash
   git push origin main  # Auto-deploys via Vercel GitHub integration
   ```

3. **Verify Deployment**
   - Check that market data shows "Alpha Vantage" as source instead of "Fallback Data"
   - Confirm S&P 500 shows current values (~$5,950+)

4. **Monitor Logs**
   ```bash
   vercel logs --follow
   ```

## Emergency Contacts & Resources

- **Vercel Status**: https://vercel-status.com/
- **FRED API Status**: https://fred.stlouisfed.org/docs/api/
- **Alpha Vantage Status**: https://www.alphavantage.co/support/#support
- **Project Repository**: https://github.com/wkirkland/trading-framework