#!/bin/bash

# Production Deployment Verification Script
# Validates that a deployed application is working correctly

set -e

echo "🚀 Production Deployment Verification"
echo "===================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_TIMEOUT=30
MAX_RETRIES=5
RETRY_DELAY=10

# Default values
BASE_URL="${DEPLOY_URL:-http://localhost:3000}"
API_KEY_TEST="${FRED_API_KEY:-}"
ENVIRONMENT="${NODE_ENV:-production}"

# Track failures
FAILURES=0
WARNINGS=0

# Function to run a check and track results
run_check() {
    local check_name="$1"
    local command="$2"
    local required="$3"  # true/false
    
    echo -n "🔍 $check_name... "
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PASSED${NC}"
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ FAILED (CRITICAL)${NC}"
            FAILURES=$((FAILURES + 1))
        else
            echo -e "${YELLOW}⚠️  FAILED (WARNING)${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
        return 1
    fi
}

# Function to make HTTP request with retry
http_check() {
    local url="$1"
    local expected_status="$2"
    local timeout="${3:-10}"
    
    if command -v curl &> /dev/null; then
        curl -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" | grep -q "^$expected_status$"
    elif command -v wget &> /dev/null; then
        wget -q --timeout="$timeout" --spider "$url" 2>&1 | grep -q "200 OK"
    else
        echo -e "${RED}❌ Neither curl nor wget available for HTTP checks${NC}"
        return 1
    fi
}

# Function to check JSON response
json_check() {
    local url="$1"
    local expected_field="$2"
    local timeout="${3:-10}"
    
    if command -v curl &> /dev/null; then
        response=$(curl -s --max-time "$timeout" "$url" 2>/dev/null)
        if command -v jq &> /dev/null; then
            echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1
        else
            echo "$response" | grep -q "\"$expected_field\"" 2>/dev/null
        fi
    else
        return 1
    fi
}

echo "📋 Pre-flight Configuration"
echo "==========================="
echo "Base URL: $BASE_URL"
echo "Environment: $ENVIRONMENT"
echo "Health Check Timeout: ${HEALTH_CHECK_TIMEOUT}s"
echo ""

echo "🏥 Gate 1: Health Checks"
echo "======================="

# Basic connectivity
echo "🔍 Basic Connectivity..."
for i in $(seq 1 $MAX_RETRIES); do
    if http_check "$BASE_URL" "200"; then
        echo -e "${GREEN}✅ Application responding${NC}"
        break
    else
        if [ $i -eq $MAX_RETRIES ]; then
            echo -e "${RED}❌ Application not responding after $MAX_RETRIES attempts${NC}"
            FAILURES=$((FAILURES + 1))
        else
            echo -e "${YELLOW}⏳ Attempt $i/$MAX_RETRIES failed, retrying in ${RETRY_DELAY}s...${NC}"
            sleep $RETRY_DELAY
        fi
    fi
done

# Health endpoint
echo "🔍 Health Endpoint..."
if http_check "$BASE_URL/api/health" "200"; then
    echo -e "${GREEN}✅ Health endpoint responding${NC}"
    
    # Check health status
    if json_check "$BASE_URL/api/health" "status"; then
        echo -e "${GREEN}✅ Health status available${NC}"
    else
        echo -e "${YELLOW}⚠️  Health status format unexpected${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${RED}❌ Health endpoint not responding${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Ready endpoint (Kubernetes readiness)
echo "🔍 Readiness Endpoint..."
if http_check "$BASE_URL/api/ready" "200"; then
    echo -e "${GREEN}✅ Readiness endpoint responding${NC}"
else
    echo -e "${YELLOW}⚠️  Readiness endpoint not available${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Live endpoint (Kubernetes liveness)
echo "🔍 Liveness Endpoint..."
if http_check "$BASE_URL/api/live" "200"; then
    echo -e "${GREEN}✅ Liveness endpoint responding${NC}"
else
    echo -e "${YELLOW}⚠️  Liveness endpoint not available${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "🔌 Gate 2: API Integration Tests"
echo "==============================="

# FRED API integration (if API key available)
if [ -n "$API_KEY_TEST" ] && [ "$API_KEY_TEST" != "test_key_for_ci" ]; then
    echo "🔍 FRED API Integration..."
    if http_check "$BASE_URL/api/fred-data?series=UNRATE&limit=1" "200"; then
        echo -e "${GREEN}✅ FRED API integration working${NC}"
        
        # Check response format
        if json_check "$BASE_URL/api/fred-data?series=UNRATE&limit=1" "observations"; then
            echo -e "${GREEN}✅ FRED API response format correct${NC}"
        else
            echo -e "${YELLOW}⚠️  FRED API response format unexpected${NC}"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}❌ FRED API integration failed${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}⚠️  FRED API key not available - skipping integration test${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Dashboard endpoints
echo "🔍 Dashboard Endpoints..."
dashboard_endpoints=(
    "/api/dashboard/metrics"
    "/api/dashboard/status"
)

for endpoint in "${dashboard_endpoints[@]}"; do
    if http_check "$BASE_URL$endpoint" "200"; then
        echo -e "${GREEN}✅ $endpoint responding${NC}"
    else
        echo -e "${YELLOW}⚠️  $endpoint not responding${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
done

echo ""
echo "⚡ Gate 3: Performance Validation"
echo "==============================="

# Response time check
echo "🔍 Response Time Check..."
if command -v curl &> /dev/null; then
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 10 "$BASE_URL" 2>/dev/null || echo "999")
    response_time_ms=$(echo "$response_time * 1000" | bc 2>/dev/null || echo "999")
    
    if (( $(echo "$response_time < 2.0" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${GREEN}✅ Response time: ${response_time}s${NC}"
    elif (( $(echo "$response_time < 5.0" | bc -l 2>/dev/null || echo "0") )); then
        echo -e "${YELLOW}⚠️  Response time: ${response_time}s (acceptable)${NC}"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${RED}❌ Response time: ${response_time}s (too slow)${NC}"
        FAILURES=$((FAILURES + 1))
    fi
else
    echo -e "${YELLOW}⚠️  curl not available - skipping response time check${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Memory usage (if accessible)
echo "🔍 Memory Usage Check..."
if json_check "$BASE_URL/api/health" "checks.memory"; then
    echo -e "${GREEN}✅ Memory usage data available${NC}"
else
    echo -e "${YELLOW}⚠️  Memory usage data not available${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "🔒 Gate 4: Security Validation"
echo "=============================="

# Check for exposed secrets in responses
echo "🔍 Secret Exposure Check..."
if command -v curl &> /dev/null; then
    response=$(curl -s --max-time 10 "$BASE_URL/api/health" 2>/dev/null || echo "")
    if echo "$response" | grep -qE "(api_key|apiKey|secret|password|token)" 2>/dev/null; then
        echo -e "${RED}❌ Potential secrets exposed in API responses${NC}"
        FAILURES=$((FAILURES + 1))
    else
        echo -e "${GREEN}✅ No secrets exposed in API responses${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot check for secret exposure${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Security headers check
echo "🔍 Security Headers Check..."
if command -v curl &> /dev/null; then
    headers=$(curl -s -I --max-time 10 "$BASE_URL" 2>/dev/null || echo "")
    
    security_headers=("X-Content-Type-Options" "X-Frame-Options" "X-XSS-Protection")
    missing_headers=()
    
    for header in "${security_headers[@]}"; do
        if ! echo "$headers" | grep -qi "$header"; then
            missing_headers+=("$header")
        fi
    done
    
    if [ ${#missing_headers[@]} -eq 0 ]; then
        echo -e "${GREEN}✅ Security headers present${NC}"
    else
        echo -e "${YELLOW}⚠️  Missing security headers: ${missing_headers[*]}${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠️  Cannot check security headers${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

echo ""
echo "📊 Final Verification Results"
echo "============================="

total_checks=$((FAILURES + WARNINGS))

if [ $FAILURES -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}🎉 DEPLOYMENT VERIFICATION PASSED!${NC}"
        echo ""
        echo "✅ All critical checks passed"
        echo "✅ No warnings detected"
        echo ""
        echo -e "${GREEN}🚀 Application ready for production traffic${NC}"
        
        # Output deployment summary
        echo ""
        echo "📋 Deployment Summary:"
        echo "- Base URL: $BASE_URL"
        echo "- Environment: $ENVIRONMENT"
        echo "- Health Status: ✅ Healthy"
        echo "- API Integration: ✅ Working"
        echo "- Performance: ✅ Acceptable"
        echo "- Security: ✅ Validated"
        
        exit 0
    else
        echo -e "${YELLOW}⚠️  DEPLOYMENT VERIFICATION PASSED WITH WARNINGS${NC}"
        echo ""
        echo "✅ All critical checks passed"
        echo "⚠️  $WARNINGS warnings detected"
        echo ""
        echo -e "${YELLOW}🚀 Application ready for production with monitoring${NC}"
        
        exit 0
    fi
else
    echo -e "${RED}❌ DEPLOYMENT VERIFICATION FAILED${NC}"
    echo ""
    echo "❌ $FAILURES critical failures detected"
    echo "⚠️  $WARNINGS warnings detected"
    echo ""
    echo -e "${RED}🛑 Application not ready for production traffic${NC}"
    echo ""
    echo "Required actions:"
    echo "1. Review failed checks above"
    echo "2. Fix critical issues"
    echo "3. Redeploy application"
    echo "4. Run verification again"
    
    exit 1
fi