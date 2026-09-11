# FieldReady — Flood Damage Assessment

FieldReady is an offline-first TypeScript monorepo for Madison County field teams assessing flood damage at chicken farms.

## Repository structure

```text
apps/frontend/   React + Vite mobile field application
apps/backend/    Node.js + Express + PostgreSQL API
packages/shared/ Shared TypeScript validation, types, and domain constants
```

## Run locally

```bash
cp apps/backend/.env.example apps/backend/.env
npm install
npm run dev
```

Set `DATABASE_URL` in `apps/backend/.env` to the PostgreSQL connection string you provide. Run `npm run db:migrate --workspace @fieldready/backend` before the first API request. This uses the configured PostgreSQL connection directly, so the `psql` command-line tool is not required. The application does not create or manage a local database container.

Create an admin account after the migration by setting `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally `ADMIN_NAME` in the same `.env`, then run `npm run db:seed-admin --workspace @fieldready/backend`. Public registration creates assessor accounts only; admin privileges are never accepted from the browser.

Frontend: `http://localhost:5174` · API health: `http://localhost:4100/api/health`

Use `npm run dev` to start both servers. Use `npm run dev:setup` for a one-command local startup that runs database migrations first and then starts both servers. Admin seeding remains a separate one-time command so normal startup never changes credentials.

Useful commands: `npm run build`, `npm test`, `npm run format`, and `npm run lint`.

## Free deployment: Vercel frontend + Render backend

Deploy the two applications as separate services from this same monorepo:

1. Push the repository to GitHub. Never commit `apps/backend/.env`; it is ignored by Git.
2. Create a Render Web Service using `render.yaml`, or configure it manually:
   - Build command: `npm install && npm run build --workspace @fieldready/shared && npm run build --workspace @fieldready/backend`
   - Start command: `npm run start --workspace @fieldready/backend`
   - Health check path: `/api/health`
   - Environment variables: `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`
3. Set Render's `FRONTEND_URL` to the final Vercel URL, for example `https://fieldready.vercel.app`.
4. Run the migration and admin seed once against the production database. These commands can be run locally using the production `DATABASE_URL` in `apps/backend/.env`:

```bash
npm run db:migrate --workspace @fieldready/backend
npm run db:seed-admin --workspace @fieldready/backend
```

5. Create a Vercel project from the same repository:
   - Build command: `npm install && npm run build --workspace @fieldready/shared && npm run build --workspace @fieldready/frontend`
   - Output directory: `apps/frontend/dist`
   - Environment variable: `VITE_API_URL=https://your-render-service.onrender.com/api`

The root `vercel.json` keeps client-side routes such as `/login` and `/admin/login` working after a browser refresh. Vercel only receives the public `VITE_API_URL`; keep `DATABASE_URL` and `JWT_SECRET` in Render's environment settings.

## Database

The application uses PostgreSQL via the `pg` driver. `DATABASE_URL` configures the connection. The migration creates the `assessments` table with typed location, condition, chicken count, status, timestamps, and JSONB photo evidence columns. PostgreSQL is the backend source of truth; the frontend local queue is only a temporary offline buffer.

## Requirements covered

- Required site data: latitude, longitude, address, farm condition, chicken count, and farm photos.
- Additional field features: assessor, access status, urgency, structural damage, poultry impact, notes, photo evidence, county summary, and follow-up flags.
- Limited connectivity: records save to a local sync queue when offline and retry when the browser comes online. The UI shows network and queued-record status.
- Network status: the online/offline badge reflects the browser's network state; API, CORS, or database failures are reported separately and do not falsely mark the device offline.
- Backend: REST endpoints for assessment CRUD, status changes, health, and county summary reporting. CRUD is separated into routes, controllers, services, and the PostgreSQL repository; reporting has its own route/controller/service.
- Authentication: Zod-validated registration/login, bcrypt password hashing, eight-hour JWTs, bearer-token middleware, and admin-only review endpoints.
- Data isolation: every new assessment is assigned to the authenticated user's `users.id` through `assessments.created_by`. Assessor list, update, status, delete, and summary queries are owner-scoped; administrators can view and manage all assessments.
- Admin analytics: the admin panel supports search and filters for review status, condition, urgency, and access, with filtered metric cards and condition/review breakdown bar charts.
- Registration protection: PostgreSQL-backed limit of 20 successful accounts per source IP. This is an abuse-control layer, not an identity guarantee; production should also use email verification and CAPTCHA, and configure proxy trust carefully when deployed behind a load balancer.
- Git/CI: `.gitignore`, `.gitattributes`, Prettier configuration, and GitHub Actions workflow for install, format check, build, and tests.

## Assumptions and production follow-up

Photo evidence is currently sent as data URLs and stored in PostgreSQL JSONB to keep the interview demo self-contained. A production deployment should move photos to object storage, add authentication/authorization, encrypt local offline data, use a durable IndexedDB queue, and implement conflict resolution/audit history.
