# Production Runbook

## 🚨 Emergency Procedures & Operational Runbook

### Quick Reference

| Scenario | Severity | Response Time | Action |
|----------|----------|---------------|---------|
| Application Down | Critical | Immediate | [App Down](#application-down) |
| API Errors >5% | High | 5 minutes | [API Issues](#api-error-spike) |
| Memory Leak | High | 10 minutes | [Memory Issues](#memory-leak) |
| Slow Response | Medium | 15 minutes | [Performance](#slow-response-times) |
| Security Alert | Critical | Immediate | [Security](#security-incident) |

---

## 🚨 Critical Incidents

### Application Down

**Symptoms:**
- Health checks failing
- 5xx errors on all endpoints
- No response from application

**Immediate Actions:**
1. **Check application status**
   ```bash
   curl -I https://your-app.com/api/health
   ```

2. **Check recent deployments**
   ```bash
   git log --oneline -5
   ```

3. **Check application logs**
   ```bash
   # If using Docker
   docker logs container-name --tail 100
   
   # If using PM2
   pm2 logs --lines 100
   ```

4. **Rollback if recent deployment**
   ```bash
   # Rollback to previous version
   git checkout HEAD~1
   ./scripts/deploy.sh
   ```

5. **If rollback doesn't work**
   - Check infrastructure (server, database, network)
   - Restart application services
   - Contact infrastructure team

### API Error Spike

**Symptoms:**
- Error rate >5% in monitoring
- 4xx/5xx responses increasing
- User reports of failures

**Investigation Steps:**
1. **Check error distribution**
   - Which endpoints are failing?
   - What error codes are being returned?
   - Any patterns in timing?

2. **Check FRED API status**
   ```bash
   curl -I "https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=YOUR_KEY&limit=1"
   ```

3. **Check application health**
   ```bash
   curl https://your-app.com/api/health | jq '.'
   ```

4. **Review recent changes**
   - Any configuration changes?
   - New deployments?
   - Environment variable changes?

**Resolution:**
- If external API issue: Implement fallback/caching
- If application issue: Identify and fix bug, deploy hotfix
- If configuration issue: Revert configuration

### Memory Leak

**Symptoms:**
- Memory usage continuously increasing
- Application becomes unresponsive
- Out of memory errors

**Investigation:**
1. **Check memory usage**
   ```bash
   # Memory usage over time
   curl https://your-app.com/api/health | jq '.checks.memory'
   ```

2. **Monitor heap usage**
   - Check for objects not being garbage collected
   - Look for memory usage patterns

3. **Check for common causes**
   - Unclosed database connections
   - Event listener leaks
   - Large object accumulation

**Resolution:**
1. **Immediate relief**
   ```bash
   # Restart application
   pm2 restart app-name
   # or
   docker restart container-name
   ```

2. **Long-term fix**
   - Identify memory leak source in code
   - Implement proper cleanup
   - Add memory monitoring

---

## ⚡ Performance Issues

### Slow Response Times

**Symptoms:**
- Response times >500ms P95
- Timeouts occurring
- User complaints about slowness

**Investigation:**
1. **Check response times by endpoint**
   ```bash
   # Test specific endpoints
   time curl https://your-app.com/api/fred-data?series=UNRATE
   ```

2. **Check external API performance**
   ```bash
   time curl "https://api.stlouisfed.org/fred/series/observations?series_id=UNRATE&api_key=YOUR_KEY"
   ```

3. **Check database performance** (if applicable)
   - Slow queries
   - Connection pool exhaustion
   - Index usage

**Resolution:**
- **Immediate:** Increase timeouts, add caching
- **Long-term:** Optimize queries, add database indexes, implement connection pooling

### High CPU Usage

**Symptoms:**
- CPU usage >80% sustained
- Application response degradation
- Process slow or hanging

**Actions:**
1. **Identify CPU-intensive operations**
   - Check for infinite loops
   - Review recent algorithm changes
   - Look for inefficient data processing

2. **Scale horizontally** (if possible)
   ```bash
   # Add more application instances
   pm2 scale app-name +2
   ```

3. **Optimize hot paths**
   - Profile code execution
   - Cache expensive calculations
   - Optimize data structures

---

## 🔒 Security Incidents

### Security Alert

**Symptoms:**
- Security scanning alerts
- Unusual API access patterns
- Potential data breach indicators

**Immediate Actions:**
1. **Assess threat level**
   - Is this a false positive?
   - What data might be compromised?
   - Is the attack ongoing?

2. **Contain the threat**
   ```bash
   # If API keys compromised
   # 1. Rotate API keys immediately
   # 2. Update environment variables
   # 3. Redeploy application
   ```

3. **Investigate**
   - Check access logs
   - Review authentication failures
   - Analyze unusual patterns

4. **Document and report**
   - Create incident report
   - Notify stakeholders
   - Plan prevention measures

### API Key Exposure

**Critical Actions:**
1. **Immediate key rotation**
   ```bash
   # Generate new FRED API key
   # Update production environment variables
   # Redeploy application
   ```

2. **Audit exposure scope**
   - How long was key exposed?
   - What services were affected?
   - Any unauthorized usage?

3. **Implement monitoring**
   - Set up API usage alerts
   - Monitor for unusual patterns
   - Add key rotation schedule

---

## 🔧 Maintenance Procedures

### Planned Deployments

**Pre-deployment Checklist:**
- [ ] All tests passing
- [ ] Security scan complete
- [ ] Performance benchmarks met
- [ ] Rollback plan prepared
- [ ] Stakeholders notified

**Deployment Process:**
1. **Deploy to staging**
   ```bash
   git checkout feature-branch
   ./scripts/deploy-staging.sh
   ```

2. **Run verification tests**
   ```bash
   ./scripts/deploy-verify.sh
   ```

3. **Deploy to production**
   ```bash
   git checkout main
   ./scripts/deploy-production.sh
   ```

4. **Post-deployment verification**
   ```bash
   ./scripts/deploy-verify.sh --env=production
   ```

### Database Maintenance

**If using database:**
1. **Backup before changes**
   ```bash
   pg_dump database_name > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Run migrations**
   ```bash
   npm run db:migrate
   ```

3. **Verify data integrity**
   ```bash
   npm run db:verify
   ```

### Monitoring Setup

**Key Metrics to Monitor:**
- Response time (P50, P95, P99)
- Error rate by endpoint
- Memory usage trends
- CPU utilization
- API rate limit usage
- Security event frequency

**Alerting Thresholds:**
- Error rate >5% for 5 minutes
- Response time P95 >1000ms for 10 minutes
- Memory usage >80% for 15 minutes
- API rate limit >80% usage
- Any security events

---

## 📞 Escalation Procedures

### Severity Levels

**Critical (P0):**
- Application completely down
- Security breach
- Data loss
- Response: Immediate, 24/7

**High (P1):**
- Major feature broken
- Performance severely degraded
- Response: Within 1 hour, business hours

**Medium (P2):**
- Minor feature issues
- Performance degradation
- Response: Within 4 hours, business hours

**Low (P3):**
- Enhancement requests
- Non-critical bugs
- Response: Next business day

### Contact Information

**On-Call Engineer:** [Phone/Email]
**Security Team:** [Emergency Contact]
**Infrastructure Team:** [Contact Info]
**Management:** [Escalation Contact]

---

## 📊 Post-Incident Procedures

### Incident Report Template

1. **Incident Summary**
   - What happened?
   - When did it occur?
   - How long did it last?
   - What was the impact?

2. **Timeline**
   - Detection time
   - Response time
   - Resolution time
   - Communication timeline

3. **Root Cause Analysis**
   - Primary cause
   - Contributing factors
   - How it could have been prevented

4. **Action Items**
   - Immediate fixes implemented
   - Long-term prevention measures
   - Process improvements
   - Responsible parties and deadlines

5. **Lessons Learned**
   - What went well?
   - What could be improved?
   - Documentation updates needed

### Follow-up Actions

- [ ] Schedule post-mortem meeting
- [ ] Update runbook based on lessons learned
- [ ] Implement prevention measures
- [ ] Update monitoring and alerting
- [ ] Share learnings with team

---

## 🛠️ Useful Commands

### Health Checks
```bash
# Basic health check
curl https://your-app.com/api/health

# Detailed health with formatting
curl https://your-app.com/api/health | jq '.'

# Check all endpoints
curl https://your-app.com/api/ready
curl https://your-app.com/api/live
```

### Log Analysis
```bash
# Search for errors in logs
grep -i "error" app.log | tail -50

# Search for specific time period
grep "2024-01-15 14:" app.log

# Count error frequencies
grep -i "error" app.log | sort | uniq -c | sort -nr
```

### Performance Testing
```bash
# Simple load test
for i in {1..100}; do
  curl -s https://your-app.com/api/health > /dev/null &
done
wait

# Response time test
time curl https://your-app.com/api/fred-data?series=UNRATE
```

### Environment Management
```bash
# Check environment variables
env | grep -E "(FRED|ALPHA_VANTAGE)"

# Validate configuration
npm run validate:env

# Test API connections
npm run test:integration
```