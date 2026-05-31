# Postman Collection — RemindFlow API v4.3

API testing collection for RemindFlow v4.3.1. Covers authentication, full CRUD for clients and tasks, negative cases, and QA verification cases for all findings verified in the v4.3.1 cycle.

---

## Collection Stats

| Metric | Value |
|---|---|
| Total requests | 20 (regression) + QA verification cases |
| Total assertions | 71 (regression suite) |
| Newman pass rate | 71 / 71 — 0 failures |
| Execution time | ~6.4 seconds |
| File size | 117KB |
| Last updated | 30 May 2026 |

---

## Folder Structure

```
RemindFlow API v4.3
├── Authentication/              ← POST /auth/login — token auto-saved
├── Clients/                     ← GET list, POST create, GET by ID, PUT update, DELETE
├── Clients — Negative Cases/    ← No token, invalid token, empty fields, not found, deleted
├── Tasks/                       ← GET list, POST create, GET by ID, PUT update, DELETE
├── Tasks — Negative Cases/      ← No token, empty fields, not found
├── Messages/                    ← (pending — Gmail, WhatsApp, Schedule)
├── Health/                      ← GET /health
├── Cleanup/                     ← Deletes test data created during the run
├── DEV Fixes & Verification/    ← Diagnostic requests used during H-01 to H-08 verification
│   ├── Auth/
│   ├── H-03 JWT/
│   ├── H-01 Gmail/
│   ├── H-02 WhatsApp/
│   ├── Diagnostics/
│   ├── H-04 — Twilio Webhook/
│   ├── H-05 — CSP/
│   └── H-06 — Credentials/
├── QA Verification/             ← Formal test cases for H-01 to H-08
│   ├── H-03 JWT/
│   ├── H-01 Gmail/
│   ├── H-04 Webhook/
│   ├── H-05 CSP/
│   ├── H-06 Credentials/
│   └── H-08 Scheduler/
└── Utility Requests/            ← Helper GETs without assertions for inspection
    ├── GET All Clients
    ├── GET All Tasks
    ├── GET All Credentials
    ├── GET Audit Log
    └── GET Scheduled Messages
```

---

## Environment Variables

| Variable | How populated | Description |
|---|---|---|
| `base_url` | Manual — set in Initial Value | Production or local base URL |
| `token` | Auto — POST Login test script | JWT Bearer token |
| `clienteId` | Auto — POST Create Client test script | UUID of test client |
| `tareaId` | Auto — POST Create Task test script | UUID of test task |
| `credencialId` | Auto — POST H06-TC01 test script | UUID of first test credential |
| `credencialId2` | Auto — POST H06-TC02 test script | UUID of second test credential |

---

## How to Use

### In Postman

1. Import `RemindFlow_API.postman_collection.json`
2. Import the environment file (`RemindFlow_Produccion` or `RemindFlow_Local`)
3. Select the environment in the top-right dropdown
4. Run `POST Login` first — token is saved automatically
5. Run individual requests or use Collection Runner

### With Newman (command line)

```bash
newman run RemindFlow_API.postman_collection.json \
  -e RemindFlow_Produccion.postman_environment.json
```

Expected output: 71 assertions, 0 failures, ~6.4 seconds.

### With Newman + HTML report

```bash
newman run RemindFlow_API.postman_collection.json \
  -e RemindFlow_Produccion.postman_environment.json \
  --reporters cli,htmlextra \
  --reporter-htmlextra-export newman_report.html
```

Requires `newman-reporter-htmlextra`:
```bash
npm install -g newman-reporter-htmlextra
```

---

## Naming Conventions

All requests follow these standards established in W1:

- **Language:** English only
- **Format:** `HTTP_METHOD Title Case Name` — e.g. `GET List Clients`, `POST Create Client`
- **Assertions:** one `pm.test` block per verification — never multiple checks in one block
- **Assertion style:** `.to.equal()` when exact value is known — never `.to.be.a('string')` for known values
- **Variables:** environment variables for all dynamic values — no hardcoded IDs or tokens

---

## QA Evidence

Evidence for all test cases executed against this collection is in:
[`docs/evidence/v4.3.1/`](../docs/evidence/v4.3.1/)

Full Newman HTML report:
[`docs/evidence/v4.3.1/newman/newman_report_w2.html`](../docs/evidence/v4.3.1/newman/newman_report_w2.html)

---

## Important Notes

- **No staging environment** — all tests run against production. Always run the `Cleanup` folder after test sessions to remove test data.
- **Token expiry** — JWT expires after 8 hours. Re-run `POST Login` if you get unexpected 401 responses.
- **Rate limit** — production is limited to 120 requests/minute per IP. Newman at natural speed is well within this limit.
- **Twilio sandbox** — WhatsApp tests require an active sandbox. Send `join deer-invented` to `+1 415 523 8886` to reactivate.
