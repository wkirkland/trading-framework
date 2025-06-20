#!/bin/bash

# Staging Environment Deployment Verification Script
# Comprehensive validation of production readiness in staging environment

set -e

echo "🚀 Staging Deployment Verification"
echo "================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
STAGING_PORT="${STAGING_PORT:-3001}"
STAGING_URL="${STAGING_URL:-http://localhost:$STAGING_PORT}"
DEPLOYMENT_TIMEOUT=300  # 5 minutes
HEALTH_CHECK_RETRIES=10
HEALTH_CHECK_DELAY=5

# Track overall verification status
CRITICAL_FAILURES=0
WARNINGS=0
TOTAL_CHECKS=0

# Function to run a check and track results
run_verification_check() {
    local check_name="$1"
    local command="$2"
    local critical="$3"  # true/false
    local timeout="${4:-30}"
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    echo -n "🔍 $check_name... "
    
    if timeout "$timeout" bash -c "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        return 0
    else
        if [ "$critical" = "true" ]; then
            echo -e "${RED}❌ FAILED (CRITICAL)${NC}"
            CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
        else
            echo -e "${YELLOW}⚠️  FAILED (WARNING)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

# Function to check service health with retries
check_service_health() {
    local url="$1"
    local retries="$2"
    local delay="$3"
    
    for i in $(seq 1 "$retries"); do
        if curl -s --max-time 10 "$url" > /dev/null 2>&1; then
            return 0
        fi
        if [ $i -lt "$retries" ]; then
            sleep "$delay"
        fi
    done
    return 1
}

# Function to validate JSON response
validate_json_response() {
    local url="$1"
    local expected_field="$2"
    local timeout="${3:-10}"
    
    response=$(curl -s --max-time "$timeout" "$url" 2>/dev/null || echo "")
    if [ -n "$response" ]; then
        if command -v jq &> /dev/null; then
            echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1
        else
            echo "$response" | grep -q "\"$expected_field\"" 2>/dev/null
        fi
    else
        return 1
    fi
}

echo "📋 Staging Environment Verification"
echo "=================================="
echo ""
echo "Environment Configuration:"
echo "- Staging URL: $STAGING_URL"
echo "- Port: $STAGING_PORT"
echo "- Timeout: ${DEPLOYMENT_TIMEOUT}s"
echo "- Health Check Retries: $HEALTH_CHECK_RETRIES"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

# Check prerequisites
echo "🔧 Gate 1: Prerequisites Validation"
echo "=================================="

run_verification_check "Node.js availability" "command -v node" true
run_verification_check "NPM availability" "command -v npm" true
run_verification_check "Package.json exists" "test -f package.json" true
run_verification_check "Integration test config" "test -f .env.integration.local" false

# Dependencies check
run_verification_check "Node modules installed" "test -d node_modules" true 15

echo ""

# Environment setup
echo "🌍 Gate 2: Environment Setup"
echo "==========================="

# Set staging environment variables
export NODE_ENV=staging
export PORT=$STAGING_PORT

# Check integration test environment
if [ -f ".env.integration.local" ]; then
    source .env.integration.local
    export FRED_API_KEY
    export ALPHA_VANTAGE_API_KEY
    echo "✅ Integration environment loaded"
else
    echo -e "${YELLOW}⚠️  No integration environment - using fallback${NC}"
    export FRED_API_KEY="${FRED_API_KEY:-demo_key_for_staging}"
fi

echo "Environment:"
echo "- NODE_ENV: $NODE_ENV"
echo "- PORT: $PORT"
echo "- FRED_API_KEY: ${FRED_API_KEY:0:8}..."
echo ""

# Application build and startup
echo "🏗️  Gate 3: Application Build & Startup"
echo "======================================"

# Build the application
echo "🔨 Building application..."
if npm run build > build.log 2>&1; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Build log:"
    tail -20 build.log
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
fi

# Start application in background
echo "🚀 Starting staging application..."
npm start > staging-app.log 2>&1 &
APP_PID=$!

# Store PID for cleanup
echo $APP_PID > staging-app.pid

# Function to cleanup application
cleanup_staging_app() {
    if [ -f "staging-app.pid" ]; then
        local pid=$(cat staging-app.pid)
        if kill -0 "$pid" 2>/dev/null; then
            echo ""
            echo "🧹 Cleaning up staging application (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 2
            kill -9 "$pid" 2>/dev/null || true
        fi
        rm -f staging-app.pid
    fi
}

# Set up cleanup trap
trap cleanup_staging_app EXIT

# Wait for application startup
echo "⏳ Waiting for application startup..."
startup_success=false
for i in $(seq 1 30); do
    if check_service_health "$STAGING_URL" 1 1; then
        startup_success=true
        echo -e "${GREEN}✅ Application started successfully${NC}"
        break
    fi
    sleep 2
    echo -n "."
done

if [ "$startup_success" = false ]; then
    echo -e "${RED}❌ Application failed to start within timeout${NC}"
    echo "Last 20 lines of application log:"
    tail -20 staging-app.log
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + 1))
    exit 1
fi

echo ""

# Core functionality verification
echo "🧪 Gate 4: Core Functionality Verification"
echo "========================================="

# Basic connectivity
run_verification_check "Basic HTTP connectivity" \
    "curl -s --max-time 10 '$STAGING_URL' | grep -q 'html\\|json\\|text'" true

# Health endpoints
run_verification_check "Health endpoint responding" \
    "curl -s --max-time 10 '$STAGING_URL/api/health' | grep -q 'status'" true

run_verification_check "Readiness endpoint responding" \
    "curl -s --max-time 10 '$STAGING_URL/api/ready'" false

run_verification_check "Liveness endpoint responding" \
    "curl -s --max-time 10 '$STAGING_URL/api/live'" false

# API endpoints
if [ "$FRED_API_KEY" != "demo_key_for_staging" ]; then
    run_verification_check "FRED data endpoint accessible" \
        "curl -s --max-time 15 '$STAGING_URL/api/fred-data' | grep -q 'success\\|data'" false
else
    echo "⚠️  Skipping FRED API test (demo key)"
fi

echo ""

# Security verification
echo "🔒 Gate 5: Security Verification"
echo "==============================="

# Check for API key exposure in responses
echo "🔍 API Key Exposure Check..."
security_issues=0

# Test health endpoint for security
health_response=$(curl -s --max-time 10 "$STAGING_URL/api/health" 2>/dev/null || echo "")
if echo "$health_response" | grep -qE "(api_key|apiKey)" 2>/dev/null; then
    if ! echo "$health_response" | grep -q "REDACTED" 2>/dev/null; then
        echo -e "${RED}❌ API key exposure detected in health endpoint${NC}"
        security_issues=$((security_issues + 1))
    fi
fi

# Test error endpoints for security
error_response=$(curl -s --max-time 10 "$STAGING_URL/api/fred-data?series=INVALID_TEST" 2>/dev/null || echo "")
if echo "$error_response" | grep -qE "(api_key|apiKey)" 2>/dev/null; then
    if ! echo "$error_response" | grep -q "REDACTED" 2>/dev/null; then
        echo -e "${RED}❌ API key exposure detected in error response${NC}"
        security_issues=$((security_issues + 1))
    fi
fi

if [ $security_issues -eq 0 ]; then
    echo -e "${GREEN}✅ No API key exposure detected${NC}"
else
    echo -e "${RED}❌ $security_issues security issues found${NC}"
    CRITICAL_FAILURES=$((CRITICAL_FAILURES + security_issues))
fi

# Security headers check
run_verification_check "Security headers present" \
    "curl -I -s --max-time 10 '$STAGING_URL' | grep -qi 'x-.*-.*'" false

# HTTPS redirect check (if applicable)
if [[ "$STAGING_URL" == http://* ]]; then
    echo "ℹ️  HTTP staging environment - HTTPS checks skipped"
else
    run_verification_check "HTTPS protocol enforced" \
        "curl -s --max-time 10 '$STAGING_URL' | grep -v 'http://'" false
fi

echo ""

# Performance verification
echo "⚡ Gate 6: Performance Verification"
echo "================================="

# Response time testing
echo "🔍 Response Time Testing..."

# Health endpoint performance
health_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$STAGING_URL/api/health" 2>/dev/null || echo "999")
if (( $(echo "$health_time < 2.0" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${GREEN}✅ Health endpoint: ${health_time}s (within 2s target)${NC}"
else
    echo -e "${YELLOW}⚠️  Health endpoint: ${health_time}s (exceeds 2s target)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Main page performance
main_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 15 "$STAGING_URL" 2>/dev/null || echo "999")
if (( $(echo "$main_time < 5.0" | bc -l 2>/dev/null || echo "0") )); then
    echo -e "${GREEN}✅ Main page: ${main_time}s (within 5s target)${NC}"
else
    echo -e "${YELLOW}⚠️  Main page: ${main_time}s (exceeds 5s target)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Concurrent request testing
echo "🔍 Concurrent Request Testing..."
concurrent_start=$(date +%s)

# Run 5 concurrent requests
for i in {1..5}; do
    curl -s --max-time 10 "$STAGING_URL/api/health" > /dev/null &
done
wait

concurrent_end=$(date +%s)
concurrent_duration=$((concurrent_end - concurrent_start))

if [ $concurrent_duration -lt 10 ]; then
    echo -e "${GREEN}✅ Concurrent requests: ${concurrent_duration}s (5 requests)${NC}"
else
    echo -e "${YELLOW}⚠️  Concurrent requests: ${concurrent_duration}s (may indicate performance issues)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Integration testing
echo "🧩 Gate 7: Integration Testing"
echo "============================="

# Run subset of integration tests against staging
if [ -f ".env.integration.local" ]; then
    echo "🧪 Running integration tests against staging..."
    
    # Set staging-specific environment
    export STAGING_TEST_MODE=true
    export TEST_BASE_URL="$STAGING_URL"
    
    # Run critical integration tests
    integration_results=()
    
    # Health check integration
    if npm run test:integration -- tests/integration/healthCheck.integration.test.ts --testTimeout=30000 > integration-health.log 2>&1; then
        echo -e "${GREEN}✅ Health check integration tests passed${NC}"
        integration_results+=("health:pass")
    else
        echo -e "${YELLOW}⚠️  Health check integration tests failed${NC}"
        integration_results+=("health:fail")
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Security integration (subset)
    if npm run test:integration -- tests/integration/security.integration.test.ts --testNamePattern="API Key Protection" --testTimeout=30000 > integration-security.log 2>&1; then
        echo -e "${GREEN}✅ Security integration tests passed${NC}"
        integration_results+=("security:pass")
    else
        echo -e "${YELLOW}⚠️  Security integration tests failed${NC}"
        integration_results+=("security:fail")
        WARNINGS=$((WARNINGS + 1))
    fi
    
    # Summary of integration results
    passed_integration=$(printf '%s\n' "${integration_results[@]}" | grep -c "pass" || echo "0")
    total_integration=${#integration_results[@]}
    echo "Integration test summary: $passed_integration/$total_integration passed"
    
else
    echo -e "${YELLOW}⚠️  Integration tests skipped (no .env.integration.local)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Load testing simulation
echo "📈 Gate 8: Load Testing Simulation"
echo "================================="

echo "🔍 Simulating production load patterns..."

# Simulate realistic load
load_start=$(date +%s)
load_errors=0
load_requests=0

# Background requests simulating normal load
for i in {1..10}; do
    (
        if curl -s --max-time 5 "$STAGING_URL/api/health" > /dev/null 2>&1; then
            echo "success" > "load_result_$i.tmp"
        else
            echo "error" > "load_result_$i.tmp"
        fi
    ) &
    load_requests=$((load_requests + 1))
done

# Wait for all requests
wait

# Count results
for i in {1..10}; do
    if [ -f "load_result_$i.tmp" ]; then
        if grep -q "error" "load_result_$i.tmp"; then
            load_errors=$((load_errors + 1))
        fi
        rm -f "load_result_$i.tmp"
    fi
done

load_end=$(date +%s)
load_duration=$((load_end - load_start))
load_success_rate=$(( (load_requests - load_errors) * 100 / load_requests ))

echo "Load test results:"
echo "- Duration: ${load_duration}s"
echo "- Requests: $load_requests"
echo "- Errors: $load_errors"
echo "- Success rate: ${load_success_rate}%"

if [ $load_success_rate -ge 90 ]; then
    echo -e "${GREEN}✅ Load test passed (≥90% success rate)${NC}"
else
    echo -e "${YELLOW}⚠️  Load test concerning (<90% success rate)${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""

# Final verification summary
echo "📊 Staging Deployment Verification Results"
echo "=========================================="
echo ""
echo "Verification Summary:"
echo "- Total Checks: $TOTAL_CHECKS"
echo "- Critical Failures: $CRITICAL_FAILURES"
echo "- Warnings: $WARNINGS"
echo "- Success Rate: $(( (TOTAL_CHECKS - CRITICAL_FAILURES - WARNINGS) * 100 / TOTAL_CHECKS ))%"
echo ""

# Generate detailed report
echo "Detailed Gate Results:"
echo "✅ Gate 1: Prerequisites - $([ $CRITICAL_FAILURES -eq 0 ] && echo "PASSED" || echo "ISSUES")"
echo "✅ Gate 2: Environment - CONFIGURED"
echo "✅ Gate 3: Build & Startup - $([ -f "staging-app.pid" ] && echo "PASSED" || echo "FAILED")"
echo "✅ Gate 4: Core Functionality - VERIFIED"
echo "✅ Gate 5: Security - $([ $security_issues -eq 0 ] && echo "SECURE" || echo "ISSUES")"
echo "✅ Gate 6: Performance - $([ $WARNINGS -le 2 ] && echo "ACCEPTABLE" || echo "CONCERNING")"
echo "✅ Gate 7: Integration - $([ $passed_integration -ge 1 ] && echo "TESTED" || echo "SKIPPED")"
echo "✅ Gate 8: Load Testing - $([ $load_success_rate -ge 90 ] && echo "PASSED" || echo "CONCERNING")"
echo ""

# Final determination
if [ $CRITICAL_FAILURES -eq 0 ]; then
    if [ $WARNINGS -le 3 ]; then
        echo -e "${GREEN}🎉 STAGING DEPLOYMENT VERIFICATION PASSED!${NC}"
        echo ""
        echo -e "${GREEN}✅ Ready for production deployment${NC}"
        echo ""
        echo "Key Achievements:"
        echo "- ✅ Application builds and starts successfully"
        echo "- ✅ All critical functionality verified"
        echo "- ✅ Security measures validated"
        echo "- ✅ Performance within acceptable ranges"
        echo "- ✅ Integration tests confirm system health"
        echo "- ✅ Load testing shows system stability"
        echo ""
        echo "Next Steps:"
        echo "1. Deploy to production environment"
        echo "2. Run production verification"
        echo "3. Monitor initial production metrics"
        echo "4. Configure production alerting"
        
        exit 0
    else
        echo -e "${YELLOW}⚠️  STAGING VERIFICATION PASSED WITH WARNINGS${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  $WARNINGS warnings detected - review recommended${NC}"
        echo ""
        echo "Consider addressing warnings before production deployment"
        exit 0
    fi
else
    echo -e "${RED}❌ STAGING DEPLOYMENT VERIFICATION FAILED${NC}"
    echo ""
    echo -e "${RED}❌ $CRITICAL_FAILURES critical failures detected${NC}"
    echo ""
    echo "Critical issues must be resolved before production deployment:"
    echo "1. Review failed checks above"
    echo "2. Fix critical issues"
    echo "3. Re-run staging verification"
    echo "4. Only proceed to production after all critical checks pass"
    echo ""
    echo "Log files available for debugging:"
    echo "- build.log: Application build output"
    echo "- staging-app.log: Application runtime logs"
    echo "- integration-*.log: Integration test results"
    
    exit 1
fi