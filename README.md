# The Consistent Coders

Free, gamified developer job directory for students and early-career engineers in India.
Anyone can post a job (+1 point), anyone can apply (+1 point). Points rank members on a public leaderboard.

## Stack

- `frontend/` — React 19 + Vite + React Router 7. GSAP/Lenis animations. Clerk for sign-in.
- `backend/` — Express 5 + Mongoose. Runs as a Vercel serverless function via `api/[...path].js`, or standalone with `npm run dev`.

## Setup

```bash
# backend
cd backend && cp .env.example .env && npm install
# frontend
cd ../frontend && cp .env.example .env && npm install
```

Fill in:

| Variable | Where | Purpose |
|---|---|---|
| `MONGO_URI` | backend | MongoDB Atlas connection string |
| `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY` | backend | From dashboard.clerk.com → API keys |
| `VITE_CLERK_PUBLISHABLE_KEY` | frontend | Same publishable key |
| `ADMIN_EMAILS` | backend | Comma-separated emails that can moderate any job |
| `SITE_URL` / `VITE_SITE_URL` | both | Public origin for canonical URLs + sitemap |

Without Clerk keys the site runs read-only (browse jobs, blog, leaderboard); sign-in, posting and applying are disabled.

## Run

```bash
cd backend && npm run dev      # API on :5000
cd frontend && npm run dev     # Vite on :5173, proxies /api → :5000
```

## Build

```bash
cd frontend && npm run build
```

This does three things: builds the client bundle, builds an SSR bundle, then **prerenders every static route and blog post to real HTML** in `dist/` (see `scripts/prerender.mjs`). Job detail pages (`/jobs/:slug`) are rendered on request by `GET /api/seo/render/job/:slug`, which injects the title, meta, `JobPosting` JSON-LD and crawlable body into the SPA shell. `/sitemap.xml` is generated live from the database.

## Test

```bash
cd backend && npm test          # pure-function checks, no DB needed
cd frontend && npm run lint
```

## Gamification

Four arenas, each with 10 levels, all-time + weekly leaderboards, and a rival ("X pts to overtake …") on the dashboard. Rules live in one place: `backend/modules/points/points.service.js` (`POINT_RULES`).

| Arena | Action | Points |
|---|---|---|
| 📚 Learning | Tick off a learning-path checkpoint | +1 |
| | Finish a whole path | +5 |
| 🛠️ Building | Submit a project | +3 |
| | Your project gets an upvote | +1 |
| | Complete a mission (GitHub PR link) | +2 |
| 📣 Hiring | Post a job | +1 |
| | Your job gets its first applicant | +1 |
| | Review an applicant | +1 |
| 🎯 Applying | Apply to a job | +1 |
| | Get shortlisted | +2 |
| General | Daily check-in / add a headline (once) | +1 |

Every award is idempotent: a unique index on `(user, type, ref)` means nothing pays twice, even on double-clicks. Overall ranks: Rookie 0 · Contributor 5 · Builder 15 · Architect 40 · Legend 100. 15 badges.

## Deploy (Vercel)

Root `vercel.json` builds `frontend/`, serves `frontend/dist`, and routes `/api/*` to the Express app. Set the env variables above in the Vercel project. Point the domain's non-`www` host at `www` (301) in Vercel domain settings so canonicals match.
