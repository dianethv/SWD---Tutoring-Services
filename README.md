# TutorCoogs

> A queue, not a line. Built for the tutoring center that's tired of clipboards, sticky notes, and "who was next?"

TutorCoogs (codename **QueueSmart** in coursework) is a real-time queue manager for a university tutoring service. Students join a queue from their phone, watch their position update live, and get pinged when they're close to the front. Admins run the service from a single dashboard — open and close offerings, mark no-shows, reorder a line, pull reports.

This repo is the team's deliverable for **COSC 4353 / Software Design**, assembled across five assignments (A1 design → A5 integration). Each commit corresponds to a real piece of that journey, not a clean greenfield.

---

## The 30-second tour

```
┌───────────────────────────┐        REST/JSON         ┌──────────────────────────┐
│  React 19 + Vite (SPA)    │  ───────────────────►    │  Express 4 API           │
│  • Student & Admin views  │                          │  • Auth (bcrypt)         │
│  • Context-driven state   │  ◄───────────────────    │  • Queue ordering        │
│  • Tailwind v4            │       JSON responses     │  • Notifications         │
└───────────────────────────┘                          │  • History / reports     │
                                                       └──────────┬───────────────┘
                                                                  │ mysql2/promise
                                                                  ▼
                                                       ┌──────────────────────────┐
                                                       │  MySQL 8                 │
                                                       │  6 tables, FK-enforced   │
                                                       └──────────────────────────┘
```

There is no Redux, no GraphQL, no microservice mesh, and no JWT plumbing — by design. The whole thing is meant to be readable in one afternoon.

---

## What it actually does

**As a student** you can register, log in, browse open services, join a queue, leave it, watch your position, see an estimated wait, get notifications when you're #1 or #2, and review your history of past sessions (served, cancelled, no-show).

**As an admin** you manage the *services* the center offers, open or close them, watch every active queue in real time, serve the next person, mark no-shows, reorder a line, and (in the reporting module) export usage data as CSV/PDF for the supervisor's weekly review.

The app does **not** replace the human at the desk. It replaces the *paper* on the desk.

---

## Repo layout

```
.
├── api/                   ← thin Vercel entrypoint, just re-exports backend/server
├── backend/
│   ├── server.js          ← Express app: routers + /api/health + global error handler
│   ├── routes/            ← one router per resource: auth, services, queue, history,
│   │                        notifications, users
│   ├── data/
│   │   ├── store.js       ← factory: returns memoryStore (tests) or mysqlStore (prod)
│   │   ├── mysqlStore.js  ← all SQL lives here; nothing else touches the DB directly
│   │   ├── memoryStore.js ← in-memory mirror used by mocha tests
│   │   ├── schema.sql     ← single source of truth for the database
│   │   └── seed.js        ← idempotent seed script (INSERT IGNORE)
│   ├── tests/             ← mocha + supertest, hits the live Express app
│   └── loadEnv.js         ← dotenv wrapper that no-ops on Vercel
├── src/                   ← React app
│   ├── App.jsx            ← routes + role-based <ProtectedRoute>
│   ├── context/AppContext.jsx   ← single global store; every page reads from here
│   ├── components/        ← Layout, Navbar, Sidebar (the chrome)
│   └── pages/
│       ├── Login.jsx, Register.jsx
│       ├── user/          ← Dashboard, JoinQueue, QueueStatus, History
│       └── admin/         ← AdminDashboard, ServiceManagement, QueueManagement
├── vercel.json            ← rewrites: /api/* → api/index.js, everything else → index.html
└── vite.config.mjs        ← React + Tailwind v4 plugin
```

Every file in `src/pages/` is intentionally a single self-contained component. We don't break a page into a dozen files until it earns it — most pages are < 350 lines and easy to read top-to-bottom.

---

## The data model in one paragraph

A `user` is either a *student* or an *admin*. A `service` (e.g. *Calculus Help*, *CS Tutoring*) has an expected duration and a flag for whether it's accepting students right now. Each open service has exactly one `queue`. A student joining a queue creates a `queue_entry` with a `position` and a `priority` (`normal` or `high`). When an admin serves, no-shows, or the student leaves, the entry's status changes and a row is written to `history`. Every state change that affects a student also creates a `notification` row owned by that user.

The full schema (with FKs, indexes, and the `position >= 1` check constraint) lives in [`backend/data/schema.sql`](backend/data/schema.sql). Read that file before touching the data layer.

### Two IDs per row, on purpose

Every table has both an internal `BIGINT` `id` (used for foreign keys, indexes, joins) and an opaque public `public_id` like `u1737000000_a3f9c2` (used in URLs and JSON responses). The frontend never sees a numeric primary key. This means we can renumber, shard, or migrate the database without touching a single API consumer.

---

## API surface

All routes live under `/api`. Auth is intentionally minimal — pass a `userId` in request bodies and let the server validate it exists. Sessions/JWTs were skipped because the assignment scope is integration, not security hardening.

| Method | Path | What it does |
|---|---|---|
| POST | `/auth/register` | Create a user (`student` or `admin`), bcrypt-hashed password |
| POST | `/auth/login` | Returns the user object minus password |
| GET  | `/services` | List all services |
| POST | `/services` | Create a service (admin) |
| PUT  | `/services/:id` | Update a service or toggle `isOpen` |
| GET  | `/queue` `?serviceId=...` | List waiting entries |
| GET  | `/queue/wait-time/:serviceId/:position` | Estimate wait |
| POST | `/queue/join` | Student joins; auto-creates a notification |
| POST | `/queue/leave/:id` | Student leaves; logs to history |
| POST | `/queue/serve/:serviceId` | Admin serves the next person; notifies the new top-2 |
| POST | `/queue/no-show/:id` | Admin marks no-show; logs to history |
| PUT  | `/queue/reorder/:id` | Move an entry up or down |
| GET  | `/history` `?userId=...` | Past sessions |
| GET  | `/notifications` `?userId=...` | A user's notifications |
| PUT  | `/notifications/:id/read` | Mark one read |
| PUT  | `/notifications/read-all/:userId` | Mark all read |
| GET  | `/users` / `/users/:id` | List or fetch a user (no password) |
| GET  | `/health` | Returns DB connectivity for uptime checks |

Validation is done in the route handlers themselves — explicit, boring, easy to test. We didn't reach for a validation framework because every route ends up needing custom rules anyway.

---

## How priority actually works

When a student joins a queue, we do **not** insert at the bottom and call it a day. We:

1. Insert with a temporary `position`.
2. Recompute every position for that service, ordered by `(priority DESC, joined_at ASC)`.
3. A `high`-priority student therefore lands ahead of every `normal`-priority student already waiting, but behind anyone who already has high priority (FIFO within tier).

The recompute is one SQL statement plus a loop. It's cheap because queues are small (tens of entries), but worth understanding before changing anything in `recalcPositions()`.

---

## Running locally

You'll need Node 18+ and a MySQL 8 instance. The project assumes one process per layer (frontend Vite dev server on `:5173`, backend Express on `:5000`).

### 1. Database

```bash
mysql -u root -p < backend/data/schema.sql
```

This creates the `tutorcoogs` database and all six tables.

### 2. Environment

Create `.env` at the repo root (the backend reads it via `loadEnv.js`):

```bash
DATABASE_URL=mysql://user:password@host:3306/tutorcoogs
PORT=5000
```

Either `DATABASE_URL` (Railway/Vercel style) or the discrete `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` variables work — see `backend/data/database.js`.

### 3. Seed (optional but recommended)

```bash
cd backend
node data/seed.js
```

Adds 4 students, 2 admins, and 6 services. Default credentials:

- Student: `jordan@university.edu` / `password123`
- Admin: `admin@university.edu` / `admin123`

### 4. Run

```bash
# terminal 1 — backend
cd backend
npm install
npm start

# terminal 2 — frontend
npm install
npm run dev
```

Open http://localhost:5173 and log in.

---

## Tests

We use **mocha + supertest**, hitting the live Express app over an in-memory store. No DB required to run the suite.

```bash
cd backend
npm test
```

The `store.js` factory looks at `NODE_ENV`. If it's `test`, every router transparently talks to `memoryStore.js` instead of MySQL. Tests don't mock — they exercise the real Express app end to end.

---

## Deployment

The whole project deploys as a single Vercel project:

- `vercel.json` rewrites `/api/*` to `api/index.js` (which just re-exports `backend/server.js` — Express works as a Vercel serverless function with no changes).
- Everything else falls through to `index.html` so the React Router SPA handles client-side routing.
- The MySQL database lives on Railway. Set `DATABASE_URL` in the Vercel project's environment.
- `loadEnv.js` swallows the dotenv import error in production because Vercel injects env vars directly.

---

## Design notes (the boring-but-important bit)

A few decisions that aren't obvious from skimming the code:

**Two stores, one interface.** `memoryStore.js` and `mysqlStore.js` expose the exact same async API. Routes never know which one they're talking to. This is what makes tests fast (no DB) without forking the route logic into "test code" and "real code."

**The frontend has one context, not five.** `AppContext.jsx` holds the entire client-side state — user, services, queue, history, notifications, stats — and exposes typed-by-convention methods (`joinQueue`, `serveNext`, `markNoShow`, etc.). Pages are dumb; the context is the API client.

**Notifications are server-generated.** The frontend never creates a notification. When you join, the backend writes a `Joined Queue` row. When someone is served, the backend writes a row for the new #1 and #2 saying "you're next." This means the notification list is consistent across devices without any push infrastructure.

**Wait-time estimates are deliberately simple… for now.** The current formula is `(position − 1) × expectedDuration`. The Smart Feature module (A5) replaces this with a model that mixes the static estimate with the rolling average wait time pulled from `history`, weighted by recency. That code lives next to the route, not buried in a service layer, so it stays auditable.

**Status enums use underscores in MySQL, hyphens in JSON.** `no_show` in the DB, `no-show` in the API. The mapping is centralized in `mysqlStore.js` (`toDbStatus` / `fromDbStatus`) so the rest of the codebase only ever sees the API form.

---

## What's intentionally out of scope

- **Real authentication.** No JWT, no refresh tokens, no CSRF. The frontend stores the logged-in user in `localStorage` and trusts it. Adequate for a class project; *not* what you'd ship.
- **Real-time push.** No websockets. The frontend re-fetches after every mutation. Polling could be added in 20 lines but wasn't needed for the demo.
- **Role-based access on the API.** The API trusts the client to send the right `userId`. The frontend enforces role gating via `<ProtectedRoute>`.
- **Internationalization, accessibility audit, dark mode.** All possible, none done.

---

## Team & assignment trail

Built by the COSC 4353 team across five assignments. The contribution history is in the GitHub commit log; each member's branch (`mark`, `dianeth`, `Bao`, `cody`, `user-screens-bao`) shows their slice of work. The team submission writeup, coverage screenshot, and example generated report live in the `/submission/` folder of each assignment's Canvas upload — not in this repo.

If you're a TA reading this: start with `backend/data/schema.sql`, then `backend/server.js`, then `src/context/AppContext.jsx`. Those three files explain 80% of the system.
