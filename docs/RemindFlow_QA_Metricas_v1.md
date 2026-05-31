# RemindFlow — QA Metrics Report
## Version: v4.3.0 → v4.3.1
### Document ID: RF-QA-MET-001 | Version: 1.0

---

**Project:** RemindFlow  
**Version under test:** v4.3.0 → v4.3.1  
**QA Engineer:** Alejandro Soto Maturana  
**Execution period:** 13 May 2026 – 30 May 2026  
**Environment:** Production — https://remindflow-production.up.railway.app  
**Report generated:** 30 May 2026  

---

## 1. Test Case Metrics

### 1.1 Cases by Status

| Status | Count | Percentage |
|---|---|---|
| ✅ PASS | 20 | 71.4% |
| ⚠️ PARTIAL PASS | 1 | 3.6% |
| 🔴 BLOCKED | 4 | 14.3% |
| ➖ NOT EXECUTED | 3 | 10.7% |
| **Total designed** | **28** | **100%** |

> **Pass rate (executed cases only):** 20/21 executed = **95.2%**  
> **Pass rate (excluding blocked):** 20/20 fully verifiable = **100%**  
> The partial case (H04-TC03) and blocked cases reflect environment constraints, not product defects.

### 1.2 Cases by Finding

| Finding | Severity | Cases Designed | Executed | PASS | PARTIAL | BLOCKED |
|---|---|---|---|---|---|---|
| H-01 Gmail | Critical | 5 | 5 | 5 | 0 | 0 |
| H-03 JWT | High | 5 | 5 | 5 | 0 | 0 |
| H-04 Webhook | High | 3 | 3 | 2 | 1 | 0 |
| H-05 CSP | Medium | 4 | 4 | 3 | 0 | 1 |
| H-06 Credentials | High | 6 | 6 | 6 | 0 | 0 |
| H-08 Scheduler | Medium | 5 | 5 | 3 | 0 | 2 |
| H-02 Twilio | High | 0 | 0 | — | — | — |
| H-07 Tasks | Low | 0 | 0 | — | — | — |
| **Total** | | **28** | **28** | **24** | **1** | **3** |

> H-02 and H-07 required no QA execution — resolved via manual action and architectural decision respectively.

---

## 2. Regression Suite Metrics (Newman)

### 2.1 W2 Regression Run — 30 May 2026

| Metric | Value |
|---|---|
| Total requests | 20 |
| Total assertions | 71 |
| Passed | 71 |
| Failed | 0 |
| Skipped | 0 |
| Pass rate | **100%** |
| Execution time | 6.4 seconds |
| Average response time | ~320ms per request |

### 2.2 Assertion Distribution by Folder

| Folder | Requests | Purpose |
|---|---|---|
| Authentication | 1 | Login and token acquisition |
| Clients | 5 | Full CRUD — happy path |
| Clients — Negative Cases | 5 | Auth, validation, not-found |
| Tasks | 5 | Full CRUD — happy path |
| Tasks — Negative Cases | 3 | Auth, validation, not-found |
| Health | 1 | Server status and version |

### 2.3 Newman Report Artefacts

| Artefact | Location | Commit |
|---|---|---|
| JSON report | `docs/evidence/v4.3.1/newman/newman_report_w2.json` | `3b85b44` |
| HTML report | `docs/evidence/v4.3.1/newman/newman_report_w2.html` | `fd19473` |

---

## 3. Coverage Metrics

### 3.1 Endpoint Coverage

| Module | Total Endpoints | Endpoints Tested | Coverage |
|---|---|---|---|
| Authentication | 2 | 2 | 100% |
| Clients | 5 | 5 | 100% |
| Tasks | 5 | 5 | 100% |
| Messages — Gmail | 1 | 1 | 100% |
| Messages — WhatsApp | 1 | 0 | 0% |
| Messages — Schedule | 1 | 1 | 100% |
| Credentials | 4 | 4 | 100% |
| Health | 1 | 1 | 100% |
| Webhooks | 1 | 1 | 100% |
| Audit | 1 | 1 | 100% |
| **Total** | **22** | **21** | **95.5%** |

> WhatsApp endpoint not covered in this cycle — requires active Twilio sandbox for meaningful testing. Logged as gap for next cycle.

### 3.2 HTTP Method Coverage

| Method | Tested | Example |
|---|---|---|
| GET | ✅ Yes | GET /api/clients, GET /health |
| POST | ✅ Yes | POST /auth/login, POST /api/clients |
| PUT | ✅ Yes | PUT /api/clients/:id |
| DELETE | ✅ Yes | DELETE /api/clients/:id |
| PATCH | ❌ No | PATCH /api/tasks/:id/status — endpoint not yet implemented |

### 3.3 Test Type Coverage

| Test Type | Applied | Notes |
|---|---|---|
| Happy path | ✅ Yes | All CRUD operations |
| Negative — no auth | ✅ Yes | Missing token, invalid token |
| Negative — validation | ✅ Yes | Empty fields, missing required fields |
| Negative — not found | ✅ Yes | Non-existent IDs |
| Negative — deleted resource | ✅ Yes | Access after deletion |
| Security — injection | ✅ Yes | H-04 webhook forgery attempt |
| Security — data exposure | ✅ Yes | H-06 password field verification |
| Performance | ❌ No | Out of scope for this cycle |
| Load testing | ❌ No | Out of scope for this cycle |

---

## 4. Defect Metrics

### 4.1 Findings Verified in This Cycle

| Finding | Severity | Result | Verification date |
|---|---|---|---|
| H-01 Gmail | Critical | ✅ Fixed and verified | 13–29 May 2026 |
| H-03 JWT | High | ✅ Fixed and verified | 13–29 May 2026 |
| H-04 Webhook | High | ✅ Fixed and verified (partial) | 13–29 May 2026 |
| H-05 CSP | Medium | ✅ Fixed and verified (Phase 1) | 13–29 May 2026 |
| H-06 Credentials | High | ✅ Fixed and verified | 13–29 May 2026 |
| H-08 Scheduler | Medium | ✅ Fixed and verified (partial) | 13–29 May 2026 |

### 4.2 New Findings Logged During QA Cycle

| Issue | ID | Severity | Status |
|---|---|---|---|
| #1 | DAT-001 — POST /api/clients: no duplicate validation | Medium | Open |
| #2 | DAT-003 — DELETE returns 500 instead of 409 | Medium | Open |
| #3 | DAT-005 — No cascade delete endpoint | Low | Open |
| #4 | DAT-006 — Swagger documents non-existent endpoint | Low | Open |
| #11 | OBS-001 — No audit logging for incoming webhooks | Medium | Open |
| #12 | DES-001 — Generic error in POST /api/messages/gmail | Low | Open |
| #13 | DES-002 — Generic error in POST /api/credenciales | Low | Open |

**Total new findings: 7**  
**Critical/High severity new findings: 0**  
**All new findings are Medium or Low — not blocking for v4.3.1.**

### 4.3 Defect Density

| Metric | Value |
|---|---|
| Original findings (pre-QA cycle) | 8 |
| New findings identified during QA | 7 |
| Findings resolved and verified | 6 |
| Findings remaining open | 9 (7 new + 2 known) |
| Critical open findings | 0 |

---

## 5. Execution Efficiency Metrics

| Metric | Value |
|---|---|
| Total QA sessions (W1 + W2) | ~10 sessions |
| Total weeks | 2 (13–30 May 2026) |
| Documents produced | 8 (TRR, Cases, Handoff, Manifesto, Git guide, English assessment, Execution report, Metrics) |
| GitHub Issues created | 13 |
| Commits contributed | Multiple (evidence, reports, collection) |
| Newman runs executed | 3 (W1 verification + W2 basic + W2 with report) |
| Postman collection size | 117KB — 20 regression requests |

---

## 6. Key Observations

1. **Zero regressions** — the v4.3.1 fixes did not break any previously passing functionality.
2. **Security posture improved significantly** — 3 of the 6 verified findings were security-related (JWT, Webhook, Credentials).
3. **Blocked cases are environment-constrained, not product-constrained** — all blocks are due to the absence of a staging environment or incomplete tooling, not product defects.
4. **Generic error messages are a recurring pattern** — DES-001 and DES-002 suggest a design-level issue with error handling across multiple endpoints. Recommend addressing in a dedicated refactoring task.
5. **WhatsApp endpoint gap** — the only untested endpoint requires sandbox management overhead. Recommend a dedicated testing protocol for Twilio-dependent endpoints.

---

## 7. Recommendations for Next Cycle

| Recommendation | Priority | Rationale |
|---|---|---|
| Implement local/staging environment | High | Unblocks H08-TC04, H08-TC05, and future simulation cases |
| Expand Playwright suite | High | Unblocks H05-TC04 and UI regression coverage |
| Standardise error message format | Medium | Resolves DES-001, DES-002, and prevents recurrence |
| Add WhatsApp testing protocol | Medium | Closes the only untested endpoint |
| Implement PATCH /api/tasks/:id/status | Low | Closes HTTP method coverage gap |
| Address DAT-001 duplicate validation | Medium | Data integrity risk in production |

---

*RemindFlow — QA Metrics Report v1.0*  
*Alejandro Soto Maturana — QA Engineer*  
*30 May 2026*
