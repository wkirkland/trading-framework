#!/bin/bash

# Create GitHub Issue for Integration Testing Validation
# Following AI Coding Playbook Phase 1: Capture & Document

set -e

echo "🎯 Creating GitHub Issue for Integration Testing Validation"
echo "========================================================"

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed or not in PATH"
    echo "Please install it from: https://cli.github.com/"
    exit 1
fi

# Create the issue
gh issue create \
  --title "Integration Testing: Validate Security Refactor with Real Data" \
  --body "$(cat <<'EOF'
## 🎯 Objective

Validate the comprehensive security refactor and production monitoring infrastructure with real-world data and scenarios.

## 🔍 Background

We've completed a comprehensive security refactor including:
- Fixed API key exposure vulnerability in FRED service
- Built secure HTTP client with proper authentication
- Added 48 security-focused tests
- Implemented production monitoring and health checks
- Created CI/CD security pipeline

**Now we need to validate this infrastructure works correctly with real data before adding new features.**

## 📋 Acceptance Criteria

### Phase 1: Environment Setup
- [ ] Configure integration test environment with real API keys
- [ ] Set up staging environment that mirrors production
- [ ] Ensure all monitoring and logging systems are active

### Phase 2: FRED API Integration Validation
- [ ] Test all FRED API endpoints with production keys
- [ ] Validate error handling with rate limits and API failures
- [ ] Confirm secure client prevents API key exposure in logs
- [ ] Test bulk data operations with real series

### Phase 3: Health Check & Monitoring Validation
- [ ] Validate health check endpoints with real API connectivity
- [ ] Test error tracking with real failure scenarios
- [ ] Confirm logging system properly redacts sensitive data
- [ ] Verify performance monitoring captures real metrics

### Phase 4: Deployment Verification
- [ ] Run `scripts/deploy-verify.sh` against staging environment
- [ ] Test all 4 verification gates (Build, Lint, Security, Docker)
- [ ] Validate rollback procedures work correctly
- [ ] Confirm CI/CD pipeline works end-to-end

### Phase 5: Documentation & Findings
- [ ] Document any issues found during testing
- [ ] Update runbook based on real-world scenarios
- [ ] Create recommendations for production deployment
- [ ] Validate security posture meets requirements

## 🧪 Test Scenarios

**Happy Path:**
- Normal FRED API operations with various series
- Health checks during normal operation
- Monitoring during typical load

**Error Scenarios:**
- Invalid API keys
- Rate limit exceeded
- Network timeouts
- Malformed responses

**Security Scenarios:**
- Confirm no API keys in logs
- Validate error messages don't expose secrets
- Test authentication failure handling

## 🎯 Success Criteria

- [ ] All existing functionality works with real data
- [ ] Security infrastructure prevents data exposure
- [ ] Monitoring systems capture real operational metrics
- [ ] Deployment verification passes in staging environment
- [ ] Zero critical security findings
- [ ] Performance meets baseline requirements

## 🔗 Related Work

- Security Refactor: #1
- Production Monitoring Infrastructure: commits `ccf7a2c` to `d74c704`
- CI/CD Pipeline: `.github/workflows/`

## 📊 Definition of Done

- [ ] All test scenarios pass
- [ ] Security validation complete
- [ ] Performance baselines established
- [ ] Documentation updated
- [ ] Ready for production deployment

## 🏷️ Labels

`enhancement`, `testing`, `security`, `integration`, `high-priority`

---

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" \
  --label "enhancement,testing,security,integration,high-priority"

echo ""
echo "✅ GitHub issue created successfully!"
echo "🔍 You can view and track progress in the GitHub Issues tab"