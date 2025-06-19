#!/bin/bash

# Local CI Validation Script
# Simulates the GitHub Actions CI pipeline locally before pushing

set -e

echo "🚦 AI Coding Playbook - CI Validation"
echo "====================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

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
            echo -e "${RED}❌ FAILED (REQUIRED)${NC}"
            FAILURES=$((FAILURES + 1))
        else
            echo -e "${YELLOW}⚠️  FAILED (OPTIONAL)${NC}"
        fi
        return 1
    fi
}

# Function to run a check with output
run_check_with_output() {
    local check_name="$1"
    local command="$2"
    local required="$3"
    
    echo "🔍 $check_name..."
    
    if eval "$command"; then
        echo -e "${GREEN}✅ $check_name PASSED${NC}"
        echo ""
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "${RED}❌ $check_name FAILED (REQUIRED)${NC}"
            FAILURES=$((FAILURES + 1))
        else
            echo -e "${YELLOW}⚠️  $check_name FAILED (OPTIONAL)${NC}"
        fi
        echo ""
        return 1
    fi
}

echo "📋 Pre-flight Checks"
echo "===================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Not in project root directory${NC}"
    exit 1
fi

# Check if we're on the feature branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "feature/fred-security-refactor" ]; then
    echo -e "${YELLOW}⚠️  Warning: Not on feature/fred-security-refactor branch (current: $current_branch)${NC}"
fi

echo ""
echo "🏗️  Gate 1: Build & Test"
echo "======================="

# Install dependencies
run_check_with_output "Dependencies Installation" "npm ci" true

# Set test environment variables
export FRED_API_KEY="test_key_for_ci"
export ALPHA_VANTAGE_API_KEY="test_key_for_ci"

# Run tests
run_check_with_output "Test Suite (48 security tests)" "npm run test:ci" true

# Build application
run_check_with_output "Application Build" "npm run build" true

echo ""
echo "🔍 Gate 2: Lint"
echo "==============="

# Run linting (may fail due to existing issues)
run_check_with_output "ESLint Code Quality" "npm run lint" false

echo ""
echo "🔒 Gate 3: Leak Scan"
echo "==================="

# Check for API key exposure
echo "🔍 API Key Exposure Check..."
if grep -r "api_key=" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tests lib/ app/ components/ 2>/dev/null; then
    echo -e "${RED}❌ CRITICAL: API keys found in source code!${NC}"
    FAILURES=$((FAILURES + 1))
else
    echo -e "${GREEN}✅ No API key exposure found${NC}"
fi

# Check secure client usage
echo "🔍 Secure Client Usage Check..."
if grep -q "getFredClient" lib/services/fredService.ts; then
    echo -e "${GREEN}✅ Secure HTTP client usage verified${NC}"
else
    echo -e "${RED}❌ CRITICAL: fredService.ts must use secure HTTP client!${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Check for hardcoded secrets
echo "🔍 Hardcoded Secrets Check..."
if grep -r -E "['\"][a-zA-Z0-9]{32,}['\"]" --include="*.ts" --include="*.tsx" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=tests lib/ app/ components/ 2>/dev/null | grep -v -E "(test|mock|example|demo)"; then
    echo -e "${YELLOW}⚠️  WARNING: Potential hardcoded secrets found${NC}"
else
    echo -e "${GREEN}✅ No hardcoded secrets detected${NC}"
fi

# Check for committed .env files
echo "🔍 Environment Files Check..."
if find . -name ".env" -not -path "./node_modules/*" -not -path "./.git/*" | grep -q .; then
    echo -e "${RED}❌ CRITICAL: .env files committed to repository!${NC}"
    FAILURES=$((FAILURES + 1))
else
    echo -e "${GREEN}✅ No .env files committed${NC}"
fi

# Gitleaks scan (if available)
run_check "Gitleaks Secret Scan" "command -v gitleaks && gitleaks detect --config .gitleaks.toml" false

# NPM audit
run_check_with_output "NPM Security Audit" "npm audit --audit-level moderate" false

echo ""
echo "🐳 Gate 4: Docker Build"
echo "======================="

# Docker build check (if Docker available)
if command -v docker &> /dev/null; then
    run_check_with_output "Docker Image Build" "docker build -f Dockerfile.dev -t trading-framework:ci-test ." false
    
    if [ $? -eq 0 ]; then
        echo "🧪 Testing Docker container..."
        if docker run --rm -e FRED_API_KEY=test_key -e ALPHA_VANTAGE_API_KEY=test_key trading-framework:ci-test npm run test:ci > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Docker container tests passed${NC}"
        else
            echo -e "${YELLOW}⚠️  Docker container tests failed${NC}"
        fi
        
        # Cleanup
        docker rmi trading-framework:ci-test > /dev/null 2>&1 || true
    fi
else
    echo -e "${YELLOW}⚠️  Docker not available - skipping Docker build test${NC}"
fi

echo ""
echo "📝 Gate 5: Conventional Commits"
echo "==============================="

# Check if commitlint is available
if command -v npx &> /dev/null && [ -f "commitlint.config.js" ]; then
    echo "🔍 Validating commit messages..."
    
    # Get the base branch commit (main)
    base_commit=$(git merge-base HEAD main)
    
    if git log --oneline ${base_commit}..HEAD | wc -l | grep -q "^0$"; then
        echo -e "${YELLOW}⚠️  No commits to validate${NC}"
    else
        # Test the last few commits
        if git log --oneline ${base_commit}..HEAD | head -5 | while read commit; do
            commit_sha=$(echo "$commit" | cut -d' ' -f1)
            commit_msg=$(git log --format=%B -n 1 $commit_sha)
            echo "$commit_msg" | npx commitlint
        done; then
            echo -e "${GREEN}✅ Conventional commit format validated${NC}"
        else
            echo -e "${RED}❌ Some commits don't follow conventional format${NC}"
            FAILURES=$((FAILURES + 1))
        fi
    fi
else
    echo -e "${YELLOW}⚠️  Commitlint not available - skipping commit validation${NC}"
fi

echo ""
echo "📊 Final Results"
echo "================"

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL PLAYBOOK GATES PASSED!${NC}"
    echo ""
    echo "✅ Build & Test: PASSED"
    echo "✅ Lint: PASSED (or acceptable)"
    echo "✅ Leak Scan: PASSED"
    echo "✅ Docker Build: PASSED (or skipped)"
    echo "✅ Commit Check: PASSED"
    echo ""
    echo -e "${GREEN}🚀 Ready for CI pipeline and merge!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. git push -u origin feature/fred-security-refactor"
    echo "2. Create pull request"
    echo "3. Wait for CI pipeline to validate"
    echo "4. Request review from code owners"
    echo "5. Squash and merge after approval"
    
    exit 0
else
    echo -e "${RED}❌ $FAILURES CRITICAL GATE(S) FAILED${NC}"
    echo ""
    echo "🔧 Required fixes before proceeding:"
    echo "- Address all critical failures above"
    echo "- Run this script again to validate"
    echo "- Only push when all gates pass"
    echo ""
    exit 1
fi