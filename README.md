# RemindFlow v4.3.1

A production web application for client and content management, built for a community manager.
Used as a live QA laboratory — demonstrating test planning, API testing, automation, and formal QA documentation.

**Live:** https://remindflow-production.up.railway.app  
**Stack:** Node.js · Express · SQLite · JWT · SendGrid · Twilio · Railway  

---

## QA Portfolio

This repository contains a complete QA verification cycle for v4.3.1, including:

| Artefact | Location |
|---|---|
| Test Plan | [`docs/RemindFlow_Test_Plan_v1.md`](docs/RemindFlow_Test_Plan_v1.md) |
| Test Cases (28 cases) | [`docs/RemindFlow_Casos_Prueba_v1.md`](docs/RemindFlow_Casos_Prueba_v1.md) |
| QA Execution Report | [`docs/RemindFlow_QA_Reporte_Ejecucion_v1.md`](docs/RemindFlow_QA_Reporte_Ejecucion_v1.md) |
| Traceability Matrix | [`docs/RemindFlow_Traceability_Matrix_v1.md`](docs/RemindFlow_Traceability_Matrix_v1.md) |
| QA Metrics Report | [`docs/RemindFlow_QA_Metricas_v1.md`](docs/RemindFlow_QA_Metricas_v1.md) |
| QA Closure Document | [`docs/RemindFlow_QA_Cierre_v4.3.1.md`](docs/RemindFlow_QA_Cierre_v4.3.1.md) |
| Postman Collection | [`postman/RemindFlow_API.postman_collection.json`](postman/RemindFlow_API.postman_collection.json) |
| Newman HTML Report | [`docs/evidence/v4.3.1/newman/newman_report_w2.html`](docs/evidence/v4.3.1/newman/newman_report_w2.html) |
| Evidence Files | [`docs/evidence/v4.3.1/`](docs/evidence/v4.3.1/) |
| API Testing Manifesto | [`docs/API_Testing_Manifesto_v1.md`](docs/API_Testing_Manifesto_v1.md) |

### QA Results — v4.3.1

- **71 / 71 Newman assertions passing** — 0 failures
- **28 test cases** across 6 findings
- **100% pass rate** on fully verifiable cases
- **95.5% endpoint coverage**
- **6 security and reliability findings verified** in production

---

## Application Overview

RemindFlow is a CRM-style tool built for community managers. It manages clients, scheduled messages, social media credentials, and audit logs. All data operations are authenticated via JWT.

### Key Features

- Client management with full CRUD
- Gmail email sending via SendGrid API
- WhatsApp messaging via Twilio
- Scheduled message delivery with retry logic (backoff: 5min × 3, then 20min × 3)
- Social media credential tracking (access type — no passwords stored)
- Audit log for all system actions
- Twilio webhook with signature validation
- Content Security Policy (Phase 1)
- JWT authentication — RFC 7519 compliant, 8-hour expiry

---

## Project Structure

```
remindflow/
├── server.js               ← Express server — entry point
├── store.js                ← SQLite data layer (better-sqlite3)
├── schema.sql              ← Database schema
├── package.json
├── .env.example
├── index.html              ← Frontend (Vanilla JS — monolithic)
├── middleware/
│   └── auth.js             ← JWT verification middleware
├── routes/
│   ├── auth.js             ← POST /auth/login, GET /auth/me
│   ├── clients.js          ← /api/clients — full CRUD
│   ├── tasks.js            ← /api/tasks — full CRUD
│   ├── messages.js         ← /api/messages — Gmail, WhatsApp, schedule
│   ├── credenciales.js     ← /api/credenciales — access type tracking
│   ├── respuestas.js       ← /webhooks/twilio — incoming webhook
│   ├── audit.js            ← /api/audit — audit log
│   └── ...
├── services/
│   ├── gmail.js            ← SendGrid API integration
│   ├── whatsapp.js         ← Twilio WhatsApp integration
│   ├── scheduler.js        ← Cron-based message scheduler with retry
│   └── cipher.js           ← AES-256-GCM encryption service
├── tests/
│   └── login.spec.js       ← Playwright E2E test
├── postman/
│   └── RemindFlow_API.postman_collection.json  ← 20 requests, 71 assertions
└── docs/
    ├── evidence/v4.3.1/    ← QA evidence — screenshots and reports
    └── *.md                ← QA documents
```

---

## API Overview

All endpoints under `/api/` require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/login` | Authenticate — returns JWT |
| GET | `/auth/me` | Current user info |
| GET / POST | `/api/clients` | List / create clients |
| GET / PUT / DELETE | `/api/clients/:id` | Get / update / delete client |
| GET / POST | `/api/tasks` | List / create tasks |
| GET / PUT / DELETE | `/api/tasks/:id` | Get / update / delete task |
| POST | `/api/messages/gmail` | Send email via SendGrid |
| POST | `/api/messages/whatsapp` | Send WhatsApp via Twilio |
| GET / POST | `/api/messages/schedule` | List / create scheduled messages |
| GET / POST | `/api/credenciales` | List / create credential records |
| DELETE | `/api/credenciales/:id` | Delete credential record |
| GET | `/api/audit` | Audit log |
| GET | `/health` | Server health and version |
| POST | `/webhooks/twilio/webhook-twilio` | Incoming WhatsApp webhook |

---

## Running Locally

```bash
git clone https://github.com/asotomaturana/remindflow.git
cd remindflow
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### Environment Variables

```env
PORT=3000
APP_USERNAME=admin
APP_PASSWORD=your_password
JWT_SECRET=long_random_string
CIPHER_SECRET=generate_with_command_below
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM=your_verified_sender@gmail.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WEBHOOK_URL=https://your-server/webhooks/twilio/webhook-twilio
```

Generate CIPHER_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

---

## Running Tests

### Playwright (E2E)

```bash
npx playwright test
```

### Newman (API regression)

```bash
newman run postman/RemindFlow_API.postman_collection.json \
  -e postman/RemindFlow_Produccion.postman_environment.json
```

Expected: 71 assertions, 0 failures.

---

## Deployment

Deployed on Railway via Docker. Database persisted on Railway Volume at `/app/data/remindflow.db`.

CI/CD: GitHub Actions — Playwright tests run on every push to master.

---

## Known Technical Debt

| ID | Description |
|---|---|
| B-GMAIL-01 | Migrate SendGrid to Gmail OAuth2 |
| H-05 Phase 2 | CSP strict mode — requires index.html refactoring |
| DAT-001 | POST /api/clients does not validate duplicates |
| DAT-003 | DELETE returns 500 instead of 409 on active client |

Open issues tracked on the [GitHub Issues](https://github.com/asotomaturana/remindflow/issues) board.

---

## Author

**Alejandro Soto Maturana**  
QA Engineer · 15+ years in banking QA (Banco de Chile, Nexus Chile)  
Transitioning to test automation — Playwright, Postman, Newman, GitHub Actions  

[LinkedIn](https://linkedin.com/in/alejandro-soto-2209141b2) · [GitHub](https://github.com/asotomaturana)
