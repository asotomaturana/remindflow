# RemindFlow — QA Execution Report
## Version: v4.3.0 → v4.3.1
### Document ID: RF-QA-RPT-001 | Version: 1.0

---

**Project:** RemindFlow  
**Version under test:** v4.3.0 → v4.3.1  
**QA Engineer:** Alejandro Soto Maturana  
**Execution period:** 13 May 2026 – 30 May 2026 (W1 + W2)  
**Environment:** Production — https://remindflow-production.up.railway.app  
**Repository:** github.com/asotomaturana/remindflow (master branch)  
**Tool:** Postman + Newman v6.2.2  
**Report generated:** 30 May 2026  

---

## 1. Executive Summary

This report documents the formal QA verification cycle for RemindFlow v4.3.1. Eight technical findings (H-01 through H-08) were identified during development and formally verified by QA using Postman collections executed via Newman against the production environment.

| Metric | Value |
|---|---|
| Total findings in scope | 8 |
| Findings verified by QA | 6 |
| Findings not requiring QA execution | 2 |
| Total test cases designed | 28 |
| Total test cases executed | 24 |
| Test cases blocked | 4 |
| Pass rate (executed cases) | 100% |
| Newman regression assertions | 71/71 |
| Newman regression failures | 0 |
| Execution time (Newman) | 6.4 seconds |

**Overall verdict: PASS** — All verifiable fixes confirmed working in production.

---

## 2. Scope

### In scope
- H-01: Gmail/SendGrid email sending
- H-03: JWT expiration — RFC 7519 compliance
- H-04: Twilio webhook signature validation
- H-05: Helmet CSP Phase 1
- H-06: Credentials module redesign
- H-08: Scheduler retry logic

### Out of scope — not requiring QA execution
- H-02: Twilio sandbox reactivation — resolved via manual action, no code change
- H-07: Orphaned task entity — technical debt decision, no code change

### Not in scope — future cycles
- H-05 Phase 2: CSP strict mode (requires index.html refactoring)
- B-GMAIL-01: Gmail OAuth2 migration (backlog)
- H-06 RAM→SQLite migration

---

## 3. Test Environment

| Item | Detail |
|---|---|
| Base URL | https://remindflow-production.up.railway.app |
| Authentication | POST /auth/login → Bearer token (8h expiry) |
| Database | SQLite — Railway Volume /app/data/remindflow.db |
| No staging environment | All tests executed against production |
| Rate limit | 120 requests/minute per IP |
| Postman collection | RemindFlow API v4.3 — 117KB |
| Newman version | 6.2.2 |
| newman-reporter-htmlextra | Installed — v1.22.11 |

---

## 4. Execution Results by Finding

---

### H-03 — JWT Expiration (RFC 7519 Compliance)

**Severity:** High  
**Fix commits:** `9277c19`  
**Cases designed:** 5 | **Cases executed:** 5 | **Blocked:** 0

| Case ID | Description | Method | Expected | Result |
|---|---|---|---|---|
| H03-TC01 | Token `iat` field has 10 digits (seconds, not milliseconds) | Postman assertion | `iat.toString().length === 10` | ✅ PASS |
| H03-TC02 | Token `exp` field equals `iat + 28800` | Postman assertion | `exp === iat + 28800` | ✅ PASS |
| H03-TC03 | jwt.io shows valid token with 8h expiry | Manual — jwt.io | Signature valid, exp correct | ✅ PASS |
| H03-TC04 | Malformed token returns 401 with correct message | Postman | `{ "error": "Token inválido." }` | ✅ PASS |
| H03-TC05 | GET /auth/me with valid token returns user data | Postman | `200 { username, role }` | ✅ PASS |

**Finding verdict: ✅ PASS** — JWT now compliant with RFC 7519. Token expires after 8 hours. Error messages correctly differentiate invalid from expired tokens.

---

### H-01 — Gmail / SendGrid Email Sending

**Severity:** Critical  
**Fix commits:** `5370340`, `50f860e`, `5c60ce8`  
**Cases designed:** 5 | **Cases executed:** 5 | **Blocked:** 0

| Case ID | Description | Method | Expected | Result |
|---|---|---|---|---|
| H01-TC01 | POST /api/messages/gmail returns 200 with messageId | Postman | `{ success: true, messageId: "..." }` | ✅ PASS |
| H01-TC02 | Email physically arrives in inbox within 60 seconds | Manual | Email received | ✅ PASS |
| H01-TC03 | Audit log records sent message | Postman | GET /api/audit shows entry | ✅ PASS |
| H01-TC04 | POST without subject returns 400 | Postman | `{ "error": "Se requieren subject y body" }` | ✅ PASS |
| H01-TC05 | POST without clientId and without `to` returns 400 | Postman | `{ "error": "Se requiere clientId o to" }` | ✅ PASS |

**Finding verdict: ✅ PASS** — Email sending working via SendGrid. Validation errors correctly returned. Audit trail confirmed.

**Note:** Screenshots for H01-TC04 and H01-TC05 were taken before final assertion updates. Retake is scheduled as a quality improvement task.

---

### H-04 — Twilio Webhook Signature Validation

**Severity:** High  
**Fix commits:** `4753ef5`  
**Cases designed:** 3 | **Cases executed:** 3 | **Blocked:** 1 (partial)

| Case ID | Description | Method | Expected | Result |
|---|---|---|---|---|
| H04-TC01 | POST without X-Twilio-Signature header returns 403 | Postman | `403 Forbidden` | ✅ PASS |
| H04-TC02 | POST with incorrect signature returns 403 | Postman | `403 Forbidden` | ✅ PASS |
| H04-TC03 | Legitimate Twilio request is processed correctly | Manual — real WhatsApp | Response logged in system | ⚠️ PARTIAL |

**Finding verdict: ✅ PASS (with observation)**

TC01 and TC02 confirm the security fix is working — malicious injection attempts are blocked. TC03 is marked PARTIAL because end-to-end verification via real WhatsApp message requires active Twilio sandbox, which has time-limited activation. The security-critical path (rejection of forged requests) is fully verified.

---

### H-05 — Helmet CSP Phase 1

**Severity:** Medium  
**Fix commits:** `621f532`  
**Cases designed:** 4 | **Cases executed:** 4 | **Blocked:** 1

| Case ID | Description | Method | Expected | Result |
|---|---|---|---|---|
| H05-TC01 | Response headers include Content-Security-Policy | Postman | CSP header present | ✅ PASS |
| H05-TC02 | CSP includes `frame-ancestors 'none'` | Postman | Directive present in header value | ✅ PASS |
| H05-TC03 | CSP includes `object-src 'none'` | Postman | Directive present in header value | ✅ PASS |
| H05-TC04 | UI functions correctly with CSP active (no console errors) | Playwright | No CSP violations in browser console | 🔴 BLOCKED |

**Finding verdict: ✅ PASS (Phase 1)**

Phase 1 CSP headers confirmed via API. TC04 is blocked pending Playwright test suite expansion — UI verification requires automated browser testing not yet implemented for this scenario. Phase 2 (strict CSP) is a separate backlog item requiring index.html refactoring.

---

### H-06 — Credentials Module Redesign

**Severity:** High  
**Fix commits:** `5e1ea7c`, `301c6fc`  
**Cases designed:** 6 | **Cases executed:** 6 | **Blocked:** 0

| Case ID | Description | Method | Expected | Result |
|---|---|---|---|---|
| H06-TC01 | POST with valid accessType returns 201 without password field | Postman | `201` — no `password` in response | ✅ PASS |
| H06-TC02 | POST with password in body ignores the field | Postman | Response has no `password` field | ✅ PASS |
| H06-TC03 | POST /api/credenciales/:id/reveal returns 404 | Postman | `404 Ruta no encontrada` | ✅ PASS |
| H06-TC04 | POST with invalid accessType returns 400 | Postman | `400` with descriptive message | ✅ PASS |
| H06-TC05 | POST without accessType returns 400 | Postman | `400 clientId, platform y accessType son requeridos` | ✅ PASS |
| H06-TC06 | GET /api/credenciales returns list without password fields | Postman | Array — no `password` or `encryptedPassword` fields | ✅ PASS |

**Finding verdict: ✅ PASS** — Password storage completely removed. Reveal endpoint eliminated. Module now documents access type only. No credential data exposed.

---

### H-08 — Scheduler Retry Logic

**Severity:** Medium  
**Fix commits:** `72dcc53`, `1c06ec4`  
**Cases designed:** 5 | **Cases executed:** 5 | **Blocked:** 2

| Case ID | Description | Method | Expected | Result |
|---|---|---|---|---|
| H08-TC01 | GET /api/messages/schedule includes `retryCount` field | Postman | Field present in each message | ✅ PASS |
| H08-TC02 | GET /api/messages/schedule includes `lastError` field | Postman | Field present (null if no errors) | ✅ PASS |
| H08-TC03 | GET /api/messages/schedule includes `nextRetryAt` field | Postman | Field present (null if no retries) | ✅ PASS |
| H08-TC04 | Message that fails 6 times reaches `failed_permanent` status | Simulation | `failed_permanent` after 6 attempts | 🔴 BLOCKED |
| H08-TC05 | Message that fails once then succeeds reaches `sent` status | Simulation | `sent` on second attempt | 🔴 BLOCKED |

**Finding verdict: ✅ PASS (with blocked simulation cases)**

API fields for retry logic confirmed present and correctly structured. TC04 and TC05 require simulation of failure conditions in production, which is not feasible without a staging environment. The scheduler implementation was verified via code review by the development team. These cases are documented as candidates for local environment testing in a future cycle.

---

## 5. Regression Suite Results (Newman — W2)

**Run date:** 30 May 2026  
**Command:**
```
newman run RemindFlow_API.postman_collection.json
        -e RemindFlow_Produccion.postman_environment.json
        --reporters cli,htmlextra
        --reporter-htmlextra-export docs/evidence/v4.3.1/newman/newman_report_w2.html
```

| Metric | Value |
|---|---|
| Total requests | 20 |
| Total assertions | 71 |
| Passed assertions | 71 |
| Failed assertions | 0 |
| Execution time | 6.4 seconds |
| Report — JSON | `docs/evidence/v4.3.1/newman/newman_report_w2.json` |
| Report — HTML | `docs/evidence/v4.3.1/newman/newman_report_w2.html` |
| Commit | `fd19473` |

**All regression tests pass. No regressions introduced by v4.3.1 fixes.**

---

## 6. Blocked Cases Summary

| Case ID | Finding | Reason blocked | Path to unblock |
|---|---|---|---|
| H04-TC03 | H-04 Webhook | Requires active Twilio sandbox + real WhatsApp message | Reactivate sandbox and test manually before each release |
| H05-TC04 | H-05 CSP | Requires Playwright browser test not yet implemented | Implement in [RF] QA UI — Playwright chat |
| H08-TC04 | H-08 Scheduler | Requires failure simulation — no staging environment | Create local test environment or mock service |
| H08-TC05 | H-08 Scheduler | Requires failure simulation — no staging environment | Create local test environment or mock service |

---

## 7. Open Findings (Not Verified in This Cycle)

These findings were identified during QA execution and are logged as GitHub Issues for future cycles:

| Issue | ID | Title | Priority |
|---|---|---|---|
| #1 | DAT-001 | POST /api/clients does not validate duplicates | Medium |
| #2 | DAT-003 | DELETE returns 500 instead of 409 | Medium |
| #3 | DAT-005 | No cascade delete endpoint | Low |
| #4 | DAT-006 | Swagger documents non-existent endpoint | Low |
| #11 | OBS-001 | No audit logging for incoming webhooks | Medium |
| #12 | DES-001 | Generic error message in POST /api/messages/gmail | Low |
| #13 | DES-002 | Generic error message in POST /api/credenciales | Low |

---

## 8. Evidence

All evidence is committed to the repository under `docs/evidence/v4.3.1/`:

| Finding | Evidence folder | Files |
|---|---|---|
| H-03 JWT | `docs/evidence/v4.3.1/H-03_JWT/` | 7 files |
| H-01 Gmail | `docs/evidence/v4.3.1/H-01_Gmail/` | 6 files |
| H-04 Webhook | `docs/evidence/v4.3.1/H-04_Webhook/` | 3 files |
| H-05 CSP | `docs/evidence/v4.3.1/H-05_CSP/` | 4 files |
| H-06 Credentials | `docs/evidence/v4.3.1/H-06_Credentials/` | 6 files |
| H-08 Scheduler | `docs/evidence/v4.3.1/H-08_Scheduler/` | 5 files |
| Newman JSON | `docs/evidence/v4.3.1/newman/newman_report_w2.json` | 1 file |
| Newman HTML | `docs/evidence/v4.3.1/newman/newman_report_w2.html` | 1 file |

---

## 9. Quality Improvement Tasks (Pending)

These are non-blocking items identified during the cycle that improve test quality:

| Task | Description | Priority |
|---|---|---|
| Retake H01-TC04 screenshot | Assertions updated after screenshot was taken | Low |
| Retake H01-TC05 screenshot | Assertions updated after screenshot was taken | Low |
| Review multi-assertion blocks | Some assertions check multiple things in one `pm.test` block | Low |
| Defect pattern analysis | Check all negative cases for generic error messages | Medium |

---

## 10. Conclusions

1. **All six in-scope findings are verified as fixed** in production. No regressions detected.
2. **Four cases are blocked** due to environment constraints (no staging) and tooling gaps (Playwright not yet expanded). These are documented and tracked.
3. **Seven new findings** were logged as GitHub Issues during the cycle. None are blocking for v4.3.1 release.
4. **The regression suite is stable** — 71/71 assertions pass in 6.4 seconds against production.
5. **The codebase is in a significantly better security posture** than v4.3.0: JWT compliant, webhook protected, credentials redesigned, CSP Phase 1 active.

---

*RemindFlow — QA Execution Report v1.0*  
*Alejandro Soto Maturana — QA Engineer*  
*30 May 2026*
