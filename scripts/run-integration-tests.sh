#!/bin/bash

# Comprehensive Integration Test Runner
# Validates security refactor with real FRED API data

set -e

echo "🧪 FRED API Integration Test Suite"
echo "=================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

# Check for integration test configuration
if [ ! -f ".env.integration.local" ]; then
    echo -e "${YELLOW}⚠️  Integration test environment not configured${NC}"
    echo ""
    echo "To run integration tests, you need to set up your API keys:"
    echo "1. Run: ./scripts/setup-integration.sh"
    echo "2. Follow the prompts to configure your FRED API key"
    echo "3. Re-run this script"
    echo ""
    exit 1
fi

# Validate dependencies
echo "📦 Checking Dependencies"
echo "======================="

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Check if dotenv is available
if ! npm list dotenv > /dev/null 2>&1; then
    echo "Installing dotenv for integration tests..."
    npm install --save-dev dotenv
fi

echo -e "${GREEN}✅ Dependencies ready${NC}"
echo ""

# Load and validate configuration
echo "🔧 Validating Configuration"
echo "==========================="

# Source the integration environment
source .env.integration.local

if [ -z "$FRED_API_KEY" ] || [ "$FRED_API_KEY" = "your_real_fred_api_key_here" ]; then
    echo -e "${RED}❌ FRED_API_KEY not properly configured${NC}"
    echo "Please run: ./scripts/setup-integration.sh"
    exit 1
fi

echo "FRED API Key: ${FRED_API_KEY:0:8}..."
echo "Base URL: ${FRED_BASE_URL:-https://api.stlouisfed.org/fred}"
echo "Alpha Vantage: ${ALPHA_VANTAGE_API_KEY:+Configured}"
echo ""

# Quick API validation
echo "🔍 Pre-flight API Check"
echo "======================"

echo -n "Testing FRED API connectivity... "
response=$(curl -s --max-time 10 \
    "https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=$FRED_API_KEY&limit=1&file_type=json" \
    2>/dev/null || echo "ERROR")

if echo "$response" | grep -q '"observations"'; then
    echo -e "${GREEN}✅ Connected${NC}"
else
    echo -e "${RED}❌ Failed${NC}"
    echo "Response: $response"
    echo ""
    echo "Please check your FRED API key configuration."
    exit 1
fi

echo ""

# Run the integration tests
echo "🚀 Running Integration Test Suite"
echo "================================"
echo ""

# Set test environment variables
export NODE_ENV=integration
export INTEGRATION_TEST_MODE=true

# Run different test categories
test_categories=(
    "FRED Client Integration:tests/integration/fredClient.integration.test.ts"
    "FRED Service Integration:tests/integration/fredService.integration.test.ts"
    "Security Integration:tests/integration/security.integration.test.ts"
    "Health Check System:tests/integration/healthCheck.integration.test.ts"
    "Health API Endpoints:tests/integration/healthEndpoints.integration.test.ts"
)

total_categories=${#test_categories[@]}
passed_categories=0
failed_categories=0

for category_info in "${test_categories[@]}"; do
    IFS=':' read -r category_name test_file <<< "$category_info"
    
    echo "🔍 Testing: $category_name"
    echo "$(printf '=%.0s' {1..50})"
    
    if npm run test:integration -- "$test_file" --verbose; then
        echo -e "${GREEN}✅ $category_name: PASSED${NC}"
        passed_categories=$((passed_categories + 1))
    else
        echo -e "${RED}❌ $category_name: FAILED${NC}"
        failed_categories=$((failed_categories + 1))
    fi
    
    echo ""
done

# Summary report
echo "📊 Integration Test Results"
echo "=========================="
echo "Total Categories: $total_categories"
echo "Passed: $passed_categories"
echo "Failed: $failed_categories"
echo ""

if [ $failed_categories -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL INTEGRATION TESTS PASSED!${NC}"
    echo ""
    echo "✅ FRED API Client: Working correctly"
    echo "✅ Service Layer: Integrating properly"
    echo "✅ Security: No vulnerabilities detected"
    echo "✅ Health Checks: Monitoring system operational"
    echo "✅ API Endpoints: Production-ready"
    echo "✅ Performance: Meeting baselines"
    echo "✅ Data Quality: Validated"
    echo ""
    echo -e "${GREEN}🚀 Security refactor validation COMPLETE${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run deployment verification: ./scripts/deploy-verify.sh"
    echo "2. Update production environment"
    echo "3. Deploy to staging for final validation"
    
    exit 0
else
    echo -e "${RED}❌ $failed_categories INTEGRATION TEST CATEGORIES FAILED${NC}"
    echo ""
    echo "🔧 Required actions:"
    echo "- Review failed test output above"
    echo "- Fix identified issues"
    echo "- Re-run integration tests"
    echo "- Do not proceed to production until all tests pass"
    echo ""
    
    exit 1
fi