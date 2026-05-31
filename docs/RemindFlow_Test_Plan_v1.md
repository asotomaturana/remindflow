# RemindFlow — Test Plan
## Version: v4.3.0 → v4.3.1
### Document ID: RF-QA-TPL-001 | Version: 1.0

---

**Project:** RemindFlow  
**Version under test:** v4.3.0 → v4.3.1  
**QA Engineer:** Alejandro Soto Maturana  
**Created:** 13 May 2026  
**Last updated:** 30 May 2026  
**Environment:** Production — https://remindflow-production.up.railway.app  
**Repository:** github.com/asotomaturana/remindflow (master branch)  

---

## 1. Introduction

### 1.1 Purpose

This document defines the test strategy, scope, approach, and resources for the QA verification cycle of RemindFlow v4.3.1. It covers the formal verification of eight technical findings (H-01 through H-08) identified during the development audit of May 2026.

### 1.2 Background

RemindFlow is a web application for client and content management built for a community manager client. It is a live production system with no staging environment. The v4.3.1 audit identified eight technical findings across security, data integrity, and reliability categories. This test plan governs the QA response to those findings.

### 1.3 References

| Document | Location |
|---|---|
| Technical findings handoff | `docs/remindflow_qa_handoff_v1.md` |
| Test cases | `docs/RemindFlow_Casos_Prueba_v1.md` |
| Test Readiness Review | `docs/RemindFlow_TRR_v1.md` |
| Execution report | `docs/RemindFlow_QA_Reporte_Ejecucion_v1.md` |
| Metrics report | `docs/RemindFlow_QA_Metricas_v1.md` |
| Traceability matrix | `docs/RemindFlow_Traceability_Matrix_v1.md` |
| Postman collection | `postman/RemindFlow_API.postman_collection.json` |
| Newman HTML report | `docs/evidence/v4.3.1/newman/newman_report_w2.html` |

---

## 2. Scope

### 2.1 In Scope

**Findings under verification:**

| Finding | Title | Severity |
|---|---|---|
| H-01 | Gmail / SendGrid email sending | Critical |
| H-02 | Twilio sandbox reactivation | High |
| H-03 | JWT expiration — RFC 7519 compliance | High |
| H-04 | Twilio webhook signature validation | High |
| H-05 | Helmet CSP Phase 1 | Medium |
| H-06 | Credentials module redesign | High |
| H-07 | Orphaned task entity | Low |
| H-08 | Scheduler retry logic | Medium |

**Modules covered:**
- Authentication (`/auth/`)
- Clients (`/api/clients`)
- Tasks (`/api/tasks`)
- Messages — Gmail (`/api/messages/gmail`)
- Messages — Schedule (`/api/messages/schedule`)
- Credentials (`/api/credenciales`)
- Webhooks (`/webhooks/twilio/`)
- Audit (`/api/audit`)
- Health (`/health`)

### 2.2 Out of Scope

- Performance and load testing
- WhatsApp message sending (requires active Twilio sandbox — covered partially)
- H-05 Phase 2 — CSP strict mode (requires index.html refactoring — future cycle)
- B-GMAIL-01 — Gmail OAuth2 migration (backlog)
- UI / end-to-end testing beyond what Playwright covers in current suite
- Security penetration testing

---

## 3. Test Strategy

### 3.1 Testing Approach

This QA cycle uses a **verification-based approach**: each finding has defined acceptance criteria from the development team. QA designs test cases against those criteria, executes them, and produces formal pass/fail evidence.

The approach is not exploratory — findings and acceptance criteria are pre-defined. However, new findings identified during execution are logged as GitHub Issues for future cycles.

### 3.2 Test Levels

| Level | Applied | Tool | Notes |
|---|---|---|---|
| API testing | ✅ Yes | Postman + Newman | Primary testing method for all findings |
| Manual testing | ✅ Yes | Browser + email client | Email delivery, jwt.io verification |
| UI / E2E testing | ⚠️ Partial | Playwright | login.spec.js only — expanding in next cycle |
| Unit testing | ❌ No | — | Out of scope for this cycle |
| Performance testing | ❌ No | — | Out of scope for this cycle |

### 3.3 Test Types Applied

| Type | Purpose | Applied to |
|---|---|---|
| Functional — happy path | Verify correct behaviour with valid inputs | All findings |
| Functional — negative | Verify correct rejection of invalid inputs | H-01, H-03, H-06 |
| Security | Verify security controls are enforced | H-03, H-04, H-06 |
| Integration | Verify end-to-end flows across services | H-01, H-04 |
| Regression | Verify no new failures introduced by fixes | Full suite via Newman |

### 3.4 Entry Criteria

Before QA execution begins, the following must be true:

- [ ] All findings marked as resolved by the development team
- [ ] Fix commits identified and documented in handoff
- [ ] Production environment healthy — `GET /health` returns 200
- [ ] Postman collection loaded with correct environment variables
- [ ] Newman installed and collection runs without errors
- [ ] Test cases formally documented and reviewed

### 3.5 Exit Criteria

QA cycle is considered complete when:

- [ ] All in-scope test cases executed (PASS, PARTIAL, or BLOCKED — no NOT RUN)
- [ ] All blocked cases documented with justification and unblock path
- [ ] Newman regression suite passes 100% — 0 failures
- [ ] All evidence committed to repository
- [ ] Execution report, metrics, traceability matrix, and closure document produced
- [ ] All new findings logged as GitHub Issues

---

## 4. Test Environment

### 4.1 Production Environment

| Item | Detail |
|---|---|
| Base URL | https://remindflow-production.up.railway.app |
| Hosting | Railway — Docker container |
| Database | SQLite — Railway Volume `/app/data/remindflow.db` |
| Authentication | JWT — Bearer token, 8h expiry |
| Email service | SendGrid API |
| WhatsApp service | Twilio sandbox |
| Rate limit | 120 requests/minute per IP |

> **Important:** There is no staging environment. All tests run against production. Test data must be cleaned up after each session. The Cleanup folder in the Postman collection handles this automatically when run via Newman.

### 4.2 Local Tooling

| Tool | Version | Purpose |
|---|---|---|
| Postman | Latest | Test design and manual execution |
| Newman | 6.2.2 | Automated collection runner |
| newman-reporter-htmlextra | Latest | HTML report generation |
| Git | Latest | Version control |
| GitHub | — | Repository and issue tracking |

### 4.3 Test Data

| Data | Value | Notes |
|---|---|---|
| Test client | Sotoro — `500538de-181d-4027-b419-d71349006d34` | Real client — do not delete |
| Test credentials | Created and deleted per session | Use Cleanup folder after each run |
| Test email recipient | `alejandrosotomaturana@gmail.com` | Used for H-01 email delivery test |
| Twilio sandbox | `+1 415 523 8886` | Activation code: `join deer-invented` |

---

## 5. Test Cases Summary

Full test cases are documented in `docs/RemindFlow_Casos_Prueba_v1.md`.

| Finding | Cases | PASS | PARTIAL | BLOCKED |
|---|---|---|---|---|
| H-01 Gmail | 5 | 5 | 0 | 0 |
| H-03 JWT | 5 | 5 | 0 | 0 |
| H-04 Webhook | 3 | 2 | 1 | 0 |
| H-05 CSP | 4 | 3 | 0 | 1 |
| H-06 Credentials | 6 | 6 | 0 | 0 |
| H-08 Scheduler | 5 | 3 | 0 | 2 |
| **Total** | **28** | **24** | **1** | **3** |

---

## 6. Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| No staging environment | Certain | High | Clean up test data after every session. Use Cleanup folder in Newman run. |
| Twilio sandbox expiry | High | Medium | Reactivate before each WhatsApp-related test. Document reactivation steps. |
| Production data contamination | Medium | High | All test credentials use identifiable names (`@test_qa_*`). Delete via Cleanup folder. |
| Rate limiting during Newman run | Low | Medium | Newman runs at natural speed — 20 requests in 6.4s is well within the 120/min limit. |
| Token expiry during long sessions | Low | Low | Token expires after 8h. Re-run POST /auth/login if 401 errors appear unexpectedly. |
| Scheduler simulation not possible | Certain | Low | Blocked cases documented. Acceptable for this cycle — flagged for staging environment implementation. |

---

## 7. Defect Management

### 7.1 Defect Classification

| Severity | Definition | Example |
|---|---|---|
| Critical | System unusable or data loss | Email not sending, authentication broken |
| High | Major feature broken, security risk | JWT not expiring, webhook unprotected |
| Medium | Feature degraded, workaround exists | Generic error messages, missing validation |
| Low | Minor issue, cosmetic, documentation | Swagger inaccuracy, naming inconsistency |

### 7.2 Defect Lifecycle

```
Identified → Logged (GitHub Issue) → Triaged → Assigned → Fixed → Verified → Closed
```

### 7.3 Defect Tracking

All defects are tracked as GitHub Issues in the repository. The kanban board `RemindFlow QA Sprint 1` tracks verification status.

---

## 8. Roles and Responsibilities

| Role | Person | Responsibilities |
|---|---|---|
| QA Engineer | Alejandro Soto Maturana | Test design, execution, evidence, reporting |
| Developer | Alejandro Soto Maturana | Fix implementation, technical handoff |
| Product Owner | Alejandro Soto Maturana | Acceptance criteria, priority decisions |

> This is a solo project. All roles are held by one person. In a team context, these responsibilities would be separated.

---

## 9. Test Deliverables

| Deliverable | Document ID | Status |
|---|---|---|
| Test Readiness Review | RF-QA-TRR-001 | ✅ Complete |
| Test Cases | RF-QA-TC-001 | ✅ Complete — 28 cases |
| QA Execution Report | RF-QA-RPT-001 | ✅ Complete |
| QA Metrics Report | RF-QA-MET-001 | ✅ Complete |
| Traceability Matrix | RF-QA-TRM-001 | ✅ Complete |
| Test Plan | RF-QA-TPL-001 | ✅ This document |
| QA Closure Document | RF-QA-CLO-001 | ✅ Complete |
| Newman JSON Report | — | ✅ `newman_report_w2.json` |
| Newman HTML Report | — | ✅ `newman_report_w2.html` |
| Evidence files | — | ✅ 31 files in `docs/evidence/v4.3.1/` |

---

## 10. Schedule

| Phase | Activity | Period |
|---|---|---|
| W1 — Foundations | Postman collection, environments, CRUD, negative cases, Newman | 13–15 May 2026 |
| W1 — QA Execution | Test case design, finding verification, evidence capture, GitHub Issues | 15–29 May 2026 |
| W1 — Standards | Collection renamed to English, repository structure established | 29 May 2026 |
| W2 — Closure | Newman reports, closure documents, README updates | 30 May 2026 |

---

*RemindFlow — Test Plan v1.0*  
*Alejandro Soto Maturana — QA Engineer*  
*30 May 2026*
