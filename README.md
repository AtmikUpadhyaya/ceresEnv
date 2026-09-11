# FieldReady

FieldReady is a mobile-friendly, offline-first flood damage assessment platform for field teams inspecting chicken farms in Madison County, North Carolina. It replaces paper-based reporting with a secure digital workflow for capturing site conditions, evidence, review decisions, and county-level operational metrics.

The project is intentionally organized as a TypeScript monorepo. The React field application, Node.js API, PostgreSQL data layer, shared domain types, validation rules, tests, and deployment configuration live together while remaining independently deployable.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for diagrams and detailed system flows.

## Core capabilities

### Field assessor portal

- Create assessor accounts using name, email, and password.
- Sign in with JWT-based authentication.
- Capture farm name, address, latitude, longitude, condition, chicken count, access, urgency, structural damage, poultry impact, notes, and up to five photos.
- Use the browser geolocation API to help capture coordinates.
- Save drafts or complete assessments.
- Continue working when connectivity is unavailable.
- Automatically synchronize queued records when the browser comes back online.
- View only assessments owned by the signed-in assessor.
- See administrative review status and comments on owned records.
- Edit or delete pending records; reviewed records become read-only.

### Administrator portal

- Use a separate `/admin/login` entry point while sharing the authentication service.
- View all assessment records across all assessors.
- Filter by review status, farm condition, urgency, and access status.
- Search by site name, address, or assessor.
- View filtered metric cards for sites, completed records, immediate-response sites, chickens affected, and approved records.
- View condition and review-status bar charts plus a condition-distribution donut chart.
- Mark records as pending, approved, failed, or flagged.
- Add or update an administrative comment.
- Review actions are protected by backend admin authorization.

### Security and reliability

- Passwords are hashed with `bcryptjs`; plaintext passwords are never stored.
- JWTs expire after eight hours and are required for protected APIs.
- Admin privileges are assigned server-side and cannot be selected during registration.
- Zod validates authentication, assessment, and review payloads.
- Assessments are owner-scoped using `assessments.created_by`.
- Ownership is enforced in PostgreSQL queries, not only in the UI.
- Registration is limited to 20 successful accounts per source IP using PostgreSQL.
- Reviewed assessments cannot be edited through the API.
- Async route failures are forwarded to a global Express error handler.
- Generic error responses avoid exposing stack traces or database details.
- Environment files and key material are excluded by `.gitignore`.

## Technology stack

| Area              | Technology          | Purpose                                         |
| ----------------- | ------------------- | ----------------------------------------------- |
| Language          | TypeScript          | Type-safe application and API code              |
| Frontend          | React 18            | Component-based user interface                  |
| Frontend tooling  | Vite                | Fast development server and production bundling |
| Backend           | Node.js + Express   | REST API and HTTP middleware                    |
| Database          | PostgreSQL          | Durable relational source of truth              |
| Database driver   | `pg`                | PostgreSQL connection pooling and queries       |
| Validation        | Zod                 | Runtime validation at API boundaries            |
| Authentication    | JSON Web Token      | Stateless bearer-token sessions                 |
| Password security | `bcryptjs`          | Password hashing and comparison                 |
| Identifiers       | `uuid`              | Assessment and request identifiers              |
| Browser storage   | `localStorage`      | Temporary per-user offline queue                |
| Formatting        | Prettier            | Consistent formatting across the monorepo       |
| Linting           | ESLint              | JavaScript and JSX quality checks               |
| Tests             | Node.js test runner | Lightweight automated validation tests          |
| CI                | GitHub Actions      | Install, format, build, and test checks         |
| Frontend hosting  | Vercel              | Static React/Vite deployment                    |
| Backend hosting   | Render              | Node.js web service deployment                  |

## Repository structure

```text
.
├── apps/
│   ├── frontend/
│   │   ├── src/api/              API client modules
│   │   ├── src/components/       Authentication and admin components
│   │   ├── src/storage/          Per-user offline queue
│   │   ├── src/main.tsx          Field application and workflow UI
│   │   └── src/styles.css        Responsive application styling
│   └── backend/
│       ├── src/config/           Environment loading
│       ├── src/controllers/      HTTP request/response handlers
│       ├── src/db/               Pool, migrations, and admin seed
│       ├── src/middleware/       Authentication and error handling
│       ├── src/repositories/     PostgreSQL queries
│       ├── src/routes/            Endpoint registration
│       ├── src/services/          Business rules
│       ├── src/utils/             Small backend utilities
│       ├── src/validators/        Zod request schemas
│       └── test/                  Automated tests
├── packages/shared/              Shared types, constants, and validation
├── .github/workflows/ci.yml      Continuous integration
├── render.yaml                   Render backend configuration
├── vercel.json                   Vercel SPA route fallback
├── package.json                  Workspace scripts
└── ARCHITECTURE.md               Architecture diagrams and decisions
```

## Local setup

Requirements: Node.js 20 or newer and access to a PostgreSQL database. A local PostgreSQL installation or Docker is not required; the application connects directly to the `DATABASE_URL` you provide.

```bash
git clone https://github.com/AtmikUpadhyaya/ceresEnv.git
cd ceresEnv
npm install
cp apps/backend/.env.example apps/backend/.env
```

Edit `apps/backend/.env`:

```env
PORT=4100
FRONTEND_URL=http://localhost:5174
DATABASE_URL=your_postgresql_connection_string
JWT_SECRET=your_long_random_secret
ADMIN_NAME=FieldReady Administrator
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-a-strong-password
```

Run migrations once, then create the administrator:

```bash
npm run db:migrate --workspace @fieldready/backend
npm run db:seed-admin --workspace @fieldready/backend
```

Start both applications without repeating migrations:

```bash
npm run dev
```

Or run migrations before startup:

```bash
npm run dev:setup
```

Open the portals:

```text
Assessor: http://localhost:5174/login
Admin:    http://localhost:5174/admin/login
API:      http://localhost:4100/api/health
```

`npm run dev` starts the backend and frontend together. The backend listens on port 4100 locally, while Vite serves the frontend on port 5174. Render supplies its own production `PORT` automatically.

## Database and migrations

PostgreSQL stores users, assessments, review decisions, and registration-IP counters. Assessment photos are currently stored as data URLs in a PostgreSQL JSONB column for this self-contained assessment project.

Migrations are applied in filename order:

1. `001_create_assessments.sql` creates the assessment table.
2. `002_auth_and_reviews.sql` adds users, ownership, and review fields.
3. `003_registration_limits.sql` adds registration-IP tracking.
4. `004_assessment_ownership_idx.sql` indexes ownership lookups.

The migration runner is idempotent and can be run again safely. Existing legacy assessments with no `created_by` value are not exposed to assessors; administrators can still review them.

## API overview

All protected endpoints require:

```http
Authorization: Bearer <jwt>
```

| Method | Endpoint                      | Access        | Description                                         |
| ------ | ----------------------------- | ------------- | --------------------------------------------------- |
| GET    | `/api/health`                 | Public        | Service health check                                |
| POST   | `/api/auth/register`          | Public        | Create assessor account                             |
| POST   | `/api/auth/login`             | Public        | Sign in and receive JWT                             |
| GET    | `/api/assessments`            | Authenticated | List owned records or all records for admins        |
| POST   | `/api/assessments`            | Authenticated | Create or update an owned assessment                |
| PATCH  | `/api/assessments/:id/status` | Authenticated | Change draft/complete status within ownership rules |
| DELETE | `/api/assessments/:id`        | Authenticated | Delete an owned assessment                          |
| GET    | `/api/reports/summary`        | Authenticated | Return owner-scoped or admin-wide summary           |
| PATCH  | `/api/reviews/:id/review`     | Admin         | Save review status and comment                      |

## Offline behavior

The frontend uses `navigator.onLine` and a per-user local-storage queue named like `fieldready-sync-queue-v1:<user-id>`. If a submission is made without connectivity, it is retained locally. When an `online` event fires, the current user’s queue is submitted to the API. Successful records are removed; failed network submissions remain queued.

HTTP validation and authorization failures are shown to the user and are not queued as offline records. This prevents bad data or expired sessions from being misrepresented as connectivity problems.

The current queue is suitable for a prototype and interview demonstration. Production hardening should use IndexedDB, encrypted local storage, retry backoff, a durable sync marker, and idempotency keys.

## Testing and quality checks

```bash
npm test
npm run format:check
npm run lint
npm run build
```

Run all checks together:

```bash
npm run format:check && npm run lint && npm run build && npm test
```

The test suite currently contains 15 validation cases. GitHub Actions runs installation, formatting, build, and tests for every pushed commit or pull request.

## Deployment

The recommended free deployment separates the services while keeping one GitHub repository:

```text
Vercel → React/Vite frontend
Render → Node/Express backend
Neon or another external PostgreSQL provider → database
```

### Vercel

- Root directory: `.`
- Build command: `npm install && npm run build --workspace @fieldready/shared && npm run build --workspace @fieldready/frontend`
- Output directory: `apps/frontend/dist`
- Public configuration variable: `VITE_API_URL=https://your-render-service.onrender.com/api`

`vercel.json` provides the SPA fallback needed for `/login` and `/admin/login` refreshes. `VITE_API_URL` is public by design; never put database credentials or JWT secrets in Vercel.

### Render

- Root directory: blank or repository root
- Build command: `npm install && npm run build --workspace @fieldready/shared && npm run build --workspace @fieldready/backend`
- Start command: `npm run start --workspace @fieldready/backend`
- Health check: `/api/health`
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`

Set `FRONTEND_URL` to the exact Vercel origin, including `https://` and without a trailing slash. Render supplies `PORT`; do not hard-code a production port.

Run migrations and seed the production admin against the production database before first use. Do not commit `apps/backend/.env`.

## Future AI integration possibilities

AI is not currently part of the runtime and no external AI service is required. The assessment workflow creates several useful, consent-sensitive integration points for a later phase:

- **Photo damage triage:** classify visible structural or flood damage from uploaded farm photos and return a confidence score for human review.
- **Assessment assistance:** suggest condition, urgency, structural-damage categories, or poultry-impact notes from the assessor’s text and images.
- **Report generation:** turn approved assessment records into a county summary, executive briefing, or incident report.
- **Prioritization:** rank sites for field follow-up using urgency, access, condition, chicken count, and historical review outcomes.
- **Data quality checks:** identify conflicting coordinates, duplicate sites, improbable chicken counts, or missing evidence.
- **Natural-language analytics:** allow administrators to ask questions such as “Which blocked sites need immediate response?” and map the question to safe, read-only filters.
- **Geospatial risk analysis:** combine assessment coordinates with flood maps, rainfall, road closures, or elevation data to improve prioritization.

Recommended AI architecture: keep the backend as the policy and authorization boundary, send only the minimum necessary data to an AI service, store model output separately from human-reviewed values, retain confidence and model-version metadata, and require administrator approval before AI suggestions affect official status. Images and personally identifiable information should be handled with explicit retention, consent, and access policies.

## Git and secrets

Before pushing:

```bash
git check-ignore -v apps/backend/.env
git status
```

The repository includes `.gitignore` rules for `.env`, private keys, uploads, build output, and dependencies. The committed `.env.example` contains deliberately invalid demonstration values and a note that they are not real credentials.

If a real credential was ever committed or exposed, rotate it immediately. Rewriting Git history does not replace rotating the affected database password, JWT secret, or API key.

## Project status

This project is an interview-ready field assessment application. The core workflow, role-based access, PostgreSQL persistence, offline queue, review controls, analytics dashboard, validation, CI, and deployment configuration are implemented. Object storage for photos, durable offline sync, audit history, email verification, CAPTCHA, rate limiting beyond registration protection, and AI capabilities remain production follow-up work.
