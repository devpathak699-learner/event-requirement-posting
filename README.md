# Event Requirement Posting Flow

A multi-step flow for posting an event requirement and hiring an **Event Planner**, a **Performer** or **Crew**. Each submission is saved in MongoDB and filed under its category.

| | |
|---|---|
| **Live app** | `https://event-requirement-posting.vercel.app` |
| **API** | `https://event-requirements-api.onrender.com/api/health` |
| **Stack** | Next.js 16 (App Router, TypeScript, Tailwind CSS 4) · Node.js + Express 5 · MongoDB + Mongoose 9 · Zod 4 |

---

## What it does

1. **Step 1: Event basics.** Event name, event type, a single date or a date range, location, an optional venue, and the category (Planner / Performer / Crew).
2. **Steps 2 & 3: Category-specific details.** The questions and step titles change with the category picked in Step 1:

   | Category | Step 2 | Step 3 |
   |---|---|---|
   | Event Planner | *Planning scope*: services needed (multi-select), guest count, planning stage | *Budget & preferences*: budget range, theme, notes |
   | Performer | *Performance details*: performer type, genre, audience size | *Logistics & budget*: duration, sound system provided?, fee range, notes |
   | Crew | *Crew roles*: dynamic list of role + head-count | *Shift & budget*: shift timings (overnight supported), experience level, pay/person/day, notes |

3. **Step 4: Review & submit.** A read-only summary with *Edit* links. Submitting sends `POST /api/requirements`, and the requirement is stored with `category: "planner" | "performer" | "crew"`.
4. **Browse page (`/requirements`).** Lists posted requirements with a tab per category (with live counts) and pagination. It shows that each submission is filed under the right category.

### UX details
- Errors appear per field when you press *Continue*, update live as you type, and focus moves to the first invalid field.
- If the server rejects the submission (`400 VALIDATION_ERROR`), the wizard returns to the step that has the error and shows the server's message next to the field.
- **Draft autosave** to `localStorage`, so a refresh doesn't lose your progress. Each category's details are kept separately, so switching category in Step 1 and switching back doesn't wipe what you typed.
- Double-submit protection, a loading state, a 15s request timeout, and friendly network or timeout messages (useful because Render's free tier has cold starts).
- Responsive layout and accessible markup (labels, `aria-invalid`, `aria-describedby`, `role="alert"`, keyboard-usable pill selectors).

---

## Architecture

```
.
├── frontend/                      Next.js app (deployed to Vercel)
│   └── src/
│       ├── app/                   Routes: / , /post , /requirements
│       ├── components/
│       │   ├── wizard/            RequirementWizard (state + navigation + submit),
│       │   │   └── steps/         EventBasics, Planner*, Performer*, Crew*, Review
│       │   ├── requirements/      RequirementsBrowser (category tabs + list)
│       │   └── ui/fields.tsx      Accessible form primitives
│       └── lib/
│           ├── form.ts            Form state types, step titles, buildPayload()
│           ├── validation.ts      Per-step client validation + server-error mapping
│           ├── api.ts             Typed fetch client with ApiError
│           ├── draft.ts           localStorage draft persistence
│           ├── format.ts          Display formatting (INR, dates, detail rows)
│           └── options.ts         Enum values + labels (mirrors backend constants)
│
├── backend/                       Express API (deployed to Render)
│   ├── src/
│   │   ├── app.js                 createApp(): middleware, routes, error handling
│   │   ├── server.js              Connects to MongoDB, starts HTTP server
│   │   ├── models/Requirement.js  Base model + 3 category discriminators
│   │   ├── validators/            Zod schemas (source of truth for input rules)
│   │   ├── controllers/           Request handlers
│   │   ├── routes/                Router + rate limiter
│   │   └── middleware/errors.js   Uniform error responses
│   ├── scripts/dev-memory.js      Run the API on an in-memory MongoDB
│   └── tests/                     API integration tests
└── render.yaml                    Render blueprint for the API
```

### Data flow

```
Wizard state (strings, per category)
   │  buildPayload(): trim, convert numbers, drop other categories' data
   ▼
POST /api/requirements  (JSON)
   │  Zod discriminatedUnion on `category` → validates basics + that category's `details`
   │  unknown fields stripped, dates checked (not past, end ≥ start, span ≤ 30 days)
   ▼
categoryModels[category].create(payload)   ← Mongoose discriminator model
   ▼
MongoDB `requirements` collection, document tagged with `category`
```

### Why one collection with Mongoose discriminators?
- Every requirement shares the same "Step 1" fields, and only `details` differs. Discriminators keep **one `requirements` collection** where each document is tagged `category: planner | performer | crew` and **validated against its own sub-schema**.
- Listing across all categories, or within one, is a single indexed query (`{ category: 1, createdAt: -1 }`) with no joins or `$unionWith`.
- Adding a fourth category means adding one discriminator and one Zod branch.
- The alternative (three separate collections) makes "show me everything" and shared stats awkward, and a single loosely typed collection loses validation per category.

### Validation strategy
- **The backend is the source of truth.** Zod `discriminatedUnion("category", …)` makes sure, for example, that a `crew` payload can't carry planner details. Mongoose schema validation is a second safety net.
- **Frontend validation is a UX layer**: instant feedback with the same rules. Server errors are mapped back to the right step and field (`locateServerError`).

---

## API

Base URL: `http://localhost:5000` locally. All responses are JSON.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | `200 {status:"ok", db:true}`, or `503` if the DB is disconnected |
| `POST` | `/api/requirements` | Create a requirement (rate limited: 30 / 15 min / IP) |
| `GET` | `/api/requirements?category=crew&page=1&limit=10` | List, newest first; `category` optional; `limit` ≤ 50 |
| `GET` | `/api/requirements/stats` | Counts per category |
| `GET` | `/api/requirements/:id` | One requirement |

### `POST /api/requirements`

Request:
```json
{
  "eventName": "Sharma Wedding Sangeet",
  "eventType": "wedding",
  "startDate": "2026-12-12",
  "endDate": "2026-12-13",
  "location": "Jaipur",
  "venue": "Rambagh Palace",
  "category": "performer",
  "details": {
    "performerType": "dj",
    "genre": "Bollywood",
    "audienceSize": 300,
    "performanceDurationMins": 180,
    "soundSystemProvided": false,
    "budget": { "min": 40000, "max": 80000 },
    "notes": "Need a mix of retro and current hits"
  }
}
```

`201 Created`:
```json
{
  "data": {
    "id": "6adda46baf5fb439a5c048e2",
    "category": "performer",
    "eventName": "Sharma Wedding Sangeet",
    "eventType": "wedding",
    "startDate": "2026-12-12T00:00:00.000Z",
    "endDate": "2026-12-13T00:00:00.000Z",
    "location": "Jaipur",
    "venue": "Rambagh Palace",
    "status": "open",
    "details": { "performerType": "dj", "...": "...", "budget": { "min": 40000, "max": 80000, "currency": "INR" } },
    "createdAt": "2026-10-25T06:40:43.602Z",
    "updatedAt": "2026-10-25T06:40:43.602Z"
  }
}
```

`400 Bad Request` (shape shared by every error):
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some fields are invalid",
    "details": [
      { "path": "startDate", "message": "Event date cannot be in the past" },
      { "path": "details.budget.max", "message": "Maximum budget must be greater than or equal to the minimum" }
    ]
  }
}
```
Other error codes: `INVALID_JSON` (400), `NOT_FOUND` (404), `PAYLOAD_TOO_LARGE` (413), `RATE_LIMITED` (429), `INTERNAL_ERROR` (500).

<details>
<summary>Category <code>details</code> shapes</summary>

```jsonc
// planner
{ "services": ["full_planning", "vendor_management"], "guestCount": 250,
  "planningStage": "just_started" | "venue_booked" | "mostly_planned",
  "theme": "optional", "budget": { "min": 0, "max": 500000 }, "notes": "optional" }

// performer
{ "performerType": "singer|band|dj|dancer|comedian|magician|anchor_emcee|instrumentalist|other",
  "genre": "optional", "audienceSize": 400, "performanceDurationMins": 90 /* 15–720 */,
  "soundSystemProvided": true, "budget": { "min": 50000, "max": 120000 }, "notes": "optional" }

// crew
{ "roles": [{ "role": "photographer", "count": 2 }] /* unique roles */,
  "shift": { "startTime": "08:00", "endTime": "20:00" } /* HH:MM, end < start = overnight */,
  "experienceLevel": "any|intermediate|expert", "budget": { "min": 3000, "max": 6000 }, "notes": "optional" }
```
</details>

---

## Running locally

Requirements: Node.js 20+.

```bash
# 1. API
cd backend
npm install
npm run dev:memory        # in-memory MongoDB, no install needed (data resets on exit)
# or, with a real MongoDB / Atlas:
cp .env.example .env      # set MONGODB_URI
npm run dev

# 2. Frontend (new terminal)
cd frontend
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev                  # http://localhost:3000
```

### Tests

```bash
cd backend && npm test           # 19 API integration tests (node:test + supertest + mongodb-memory-server)
cd frontend && npx tsc --noEmit && npm run lint && npm run build
```

The backend tests cover:
- creating one requirement per category, and checking the raw MongoDB document for the `category` tag
- unknown categories, and a category paired with another category's details
- missing fields, past dates, inverted ranges and impossible dates (`2027-02-30`)
- budget max below min, duplicate crew roles, unknown fields being stripped (no mass-assignment of `status`), and malformed JSON
- list pagination, the category filter, stats, get-by-id and 404s
- rate limiting and the health check

---

## Deployment

1. **MongoDB Atlas.** Create a free M0 cluster and a database user, and allow network access from `0.0.0.0/0` (Render has no static IPs on the free tier). Copy the `mongodb+srv://…` URI.
2. **API on Render.** Click *New → Blueprint* and pick this repo (it uses `render.yaml`), or create a *Web Service* with root `backend`, build `npm ci --omit=dev` and start `npm start`. Set `MONGODB_URI`, and set `CORS_ORIGINS` to the Vercel URL. Check that `/api/health` returns `ok`.
3. **Frontend on Vercel.** Import the repo, set the root directory to `frontend`, and set the env var `NEXT_PUBLIC_API_URL=https://<your-api>.onrender.com`. Then deploy.

---

## Assumptions

- **No authentication.** Posting is anonymous, as the brief only covers the posting flow. In a real product, requirements would belong to a logged-in host.
- **Currency is INR**, stored with each budget (`currency: "INR"`) so other currencies can be added later. Budgets are ranges, because hosts rarely know an exact figure.
- **Dates are calendar days** (`YYYY-MM-DD`), stored as UTC midnight. They're always formatted in UTC so they never shift by a day across timezones. The server allows one day of slack on "not in the past" to cover clients ahead of UTC.
- An event spans at most 30 days, and starts within the next 2 years.
- A crew shift whose end is earlier than its start is treated as **overnight**, not as an error.
- Steps 2 & 3 split each category's fields into *what you need* and *logistics/budget*, which keeps every step short.

## Edge cases handled
- Switching category after filling details: each category's data is kept separately, and only the selected category's data is submitted.
- Refreshing mid-way: the draft is restored (with a *Start over* option). Old or corrupt drafts are merged over the defaults or ignored.
- Clearing a number field leaves it empty instead of turning it into `0`. Numeric inputs only accept digits.
- Duplicate crew roles are blocked: roles already used are hidden in the other rows' dropdowns, and the API rejects duplicates too.
- Double-clicking submit, network failure, server timeout or cold start, server-side validation errors, a 50kb body limit, and rate limiting.
- Leading and trailing whitespace is trimmed, empty optional strings are dropped, and unknown fields are stripped.

## Limitations & what I'd improve next
- **Shared validation package.** The enum values and rules exist in both `backend/src/constants.js` and `frontend/src/lib/options.ts`. With a workspace monorepo, I'd share one Zod schema between the two.
- **Frontend tests.** Add unit tests for `validation.ts` and `buildPayload` (Vitest), and a Playwright E2E test for the full flow for each category.
- **Auth & ownership** (host accounts, edit/close own requirements, `status` changes) and contact details on the requirement.
- **Location autocomplete** (Google Places), and storing coordinates with a geo index for "near me" search.
- **Idempotency keys** on `POST` to make retries after a timeout fully safe. Today the button is disabled while a request is in flight, but a retry after a timeout could create a duplicate.
- Search, filtering by date or budget, and notifying matching vendors when a requirement is posted.
- Observability: structured logging (pino), request IDs and error tracking (Sentry).
