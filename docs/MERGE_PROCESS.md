# 🔄 Phase 6: CI Passes ⇒ Merge ➜ Main

## Overview
This phase enforces AI Coding Playbook gates through automated CI/CD pipeline validation before allowing merge to main branch.

## 🚦 Required CI Gates

### 1. Build-Test Gate
**Workflow:** `.github/workflows/ci-pipeline.yml` → `build-test` job

**Validations:**
- ✅ Node.js 18.x and 20.x compatibility
- ✅ All 48 security tests pass
- ✅ Test coverage meets thresholds (54.46% on security components)
- ✅ Application builds successfully
- ✅ Build artifacts generated

**Environment Variables:**
```env
FRED_API_KEY=test_key_for_ci
ALPHA_VANTAGE_API_KEY=test_key_for_ci
```

**Commands:**
```bash
npm ci
npm run test:ci
npm run build
```

### 2. Lint Gate
**Workflow:** `.github/workflows/ci-pipeline.yml` → `lint` job

**Validations:**
- ✅ ESLint rules pass (including security rules)
- ✅ TypeScript compilation succeeds
- ✅ Code style consistency maintained

**Commands:**
```bash
npm run lint
```

### 3. Leak-Scan Gate
**Workflow:** `.github/workflows/ci-pipeline.yml` → `leak-scan` job

**Validations:**
- ✅ Gitleaks secret scanning passes
- ✅ No API keys in source code
- ✅ Secure HTTP client usage verified
- ✅ No hardcoded secrets detected
- ✅ NPM dependency audit passes

**Tools:**
- **Gitleaks 8.18.4** - Secret detection
- **Custom API key checker** - Trading framework specific
- **npm audit** - Dependency security

### 4. Docker Build Gate
**Workflow:** `.github/workflows/ci-pipeline.yml` → `docker-build` job

**Validations:**
- ✅ Docker image builds successfully
- ✅ Container tests pass
- ✅ Multi-architecture support

### 5. Conventional Commit Gate
**Workflow:** `.github/workflows/ci-pipeline.yml` → `commit-check` job

**Validations:**
- ✅ All commit messages follow conventional format
- ✅ Commit history is atomic and reviewable
- ✅ No fixup or WIP commits in PR

## 🔐 Branch Protection Rules

### Required Configuration
Configure in **GitHub Settings → Branches → Add rule for `main`**:

```yaml
Branch Protection Settings:
  Branch name pattern: main
  
  Restrict pushes that create files:
    ✅ Enabled
  
  Require a pull request before merging:
    ✅ Enabled
    Required approving reviews: 1
    ✅ Dismiss stale reviews when new commits are pushed
    ✅ Require review from code owners
  
  Require status checks to pass:
    ✅ Enabled
    ✅ Require branches to be up to date before merging
    Required status checks:
      - build-test
      - lint  
      - leak-scan
      - playbook-gates
      - docker-build
  
  Require conversation resolution:
    ✅ Enabled
  
  Require signed commits:
    ✅ Enabled (recommended)
  
  Restrict pushes that create files:
    ✅ Enabled
  
  Allow force pushes:
    ❌ Disabled
  
  Allow deletions:
    ❌ Disabled
```

## 👥 Review Requirements

### Human Reviewer Checklist
- [ ] **Security Review**: No API keys exposed, secure patterns used
- [ ] **Code Quality**: TypeScript best practices, proper error handling
- [ ] **Architecture**: Follows established patterns, maintains compatibility
- [ ] **Testing**: Adequate coverage, security tests comprehensive
- [ ] **Documentation**: README updated, security notes included

### Code Owner Bot (Optional)
Configure in `.github/CODEOWNERS`:
```
# Security-critical components require security team review
lib/config/env.ts @security-team
lib/http/fredClient.ts @security-team  
lib/services/fredService.ts @security-team

# Infrastructure requires DevOps review
.github/workflows/ @devops-team
docker-compose.yml @devops-team
Dockerfile.dev @devops-team

# Global ownership
* @tech-leads
```

## 🔄 Merge Strategy: Squash Merge

### Why Squash Merge?
- **Clean history**: One commit per feature on main branch
- **Atomic changes**: Complete feature in single commit  
- **Easier rollbacks**: Simple to revert entire feature
- **Reduced noise**: No intermediate WIP commits on main

### Squash Merge Configuration
**GitHub Settings → General → Pull Requests:**
```yaml
Merge Options:
  ✅ Allow squash merging
  ❌ Allow merge commits  
  ❌ Allow rebase merging

Default merge message:
  ✅ Pull request title and description
```

### Squash Commit Message Format
```
🔒 Refactor: FRED Service Security - Remove API Key Exposure (#PR_NUMBER)

* feat(config): Add type-safe environment validation
* feat(http): Add secure FRED API client
* refactor(fred): Remove API key from URL, use secure client
* test(fred): Add security validation and API key leak tests
* build(test): Add Jest testing framework and scripts
* security(lint): Prevent API key exposure in code
* ci(security): Add automated security validation pipeline
* refactor(api): Integrate secure FRED service in API route
* feat(analysis): Enhance thesis-based signal analysis system
* feat(ui): Update components for secure data integration
* docs(security): Update README with security improvements
* docs(project): Add development playbook and security summary
* build(tooling): Add complete development tooling ecosystem
* docs(pr): Add pull request template and creation workflow

Security improvements:
- Eliminates API key exposure vulnerability in FRED service
- Implements secure HTTP client with URL redaction
- Adds comprehensive testing with 48 security-focused tests
- Includes complete development tooling (Docker, Husky, Gitleaks)
- Maintains backward compatibility with zero breaking changes

Co-authored-by: Claude <noreply@anthropic.com>
```

## 🎯 Merge Process Steps

### 1. CI Pipeline Completion
```bash
# All required jobs must pass:
✅ build-test (Node 18.x, 20.x)
✅ lint  
✅ leak-scan
✅ docker-build
✅ commit-check
✅ playbook-gates
```

### 2. Human Review
- Security team reviews security-critical changes
- Tech lead reviews overall architecture
- At least 1 approval required

### 3. Final Validation
```bash
# GitHub automatically checks:
✅ Branch is up to date with main
✅ All conversations resolved
✅ All status checks passed
✅ Required reviews completed
```

### 4. Squash and Merge
```bash
# Performed by maintainer via GitHub UI:
1. Click "Squash and merge"
2. Review squash commit message
3. Confirm merge
4. Delete feature branch
```

## 📊 Post-Merge Actions

### Automatic Cleanup
- Feature branch deletion
- PR closure
- Artifact cleanup (build artifacts, reports)

### Deployment Trigger
```yaml
# .github/workflows/deploy.yml (future)
on:
  push:
    branches: [main]
    
jobs:
  deploy:
    if: contains(github.event.head_commit.message, 'security') || contains(github.event.head_commit.message, 'refactor')
    # Deployment steps...
```

### Notifications
- Slack/Teams notification of successful merge
- Security team notification for security-related changes
- Documentation site rebuild (if applicable)

## 🚨 Failure Scenarios

### CI Gate Failures
**If any CI gate fails:**
1. **Block merge** - GitHub prevents merge button
2. **Notify author** - GitHub comments on PR
3. **Require fixes** - Author must address failures
4. **Re-run CI** - Automatic on new push

### Review Failures  
**If human review fails:**
1. **Request changes** - Reviewer blocks with specific feedback
2. **Author fixes** - Address feedback in new commits
3. **Re-request review** - Ping reviewer when ready
4. **Approve** - Reviewer approves after fixes

### Emergency Hotfixes
**For critical production issues:**
```bash
# Emergency bypass (admin only):
1. Create hotfix branch from main
2. Apply minimal fix
3. Use admin override for merge
4. Follow up with proper process
```

## 📈 Success Metrics

### CI Pipeline Health
- **Gate pass rate**: >95% for PRs
- **Build time**: <10 minutes total
- **False positive rate**: <5% for security scans

### Code Quality
- **Test coverage**: Maintained >50% overall
- **Security coverage**: 100% on critical components
- **Lint violations**: Zero on merge

### Process Compliance
- **Conventional commits**: 100% compliance
- **Documentation**: Updated for all feature PRs
- **Review coverage**: 100% of security changes reviewed

---

**🎉 Phase 6 ensures code quality, security, and process compliance before merge to main branch!**