# Deployment Guide

This app deploys as three separate services: a static frontend on Vercel, a Python API on Render, and a PostgreSQL database on Supabase. All three are available on free/starter tiers.

---

## 1. Database — Supabase

Set this up first so you have the credentials for the other two services.

### Create the project

1. Sign in at [supabase.com](https://supabase.com) and click **New project**
2. Choose a name, region, and database password — save the password somewhere safe
3. Wait for the project to spin up (~2 minutes)

### Run the schema

1. Go to **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste the entire contents of `supabase/migrations/001_initial.sql` and click **Run**
4. Verify the `profiles`, `trips`, and `itinerary_days` tables appear in **Table Editor**

### Verify RLS

1. Open **Authentication → Policies** (or **Database → Policies** depending on your Supabase version)
2. Confirm each table has RLS enabled and the following policies exist:
   - `profiles` — `Users access own profile`
   - `trips` — `Users access own trips`
   - `itinerary_days` — `Users access own itinerary days`

If the policies are missing, re-run the migration SQL or add them manually.

### Collect credentials

Go to **Project Settings → API** and note:

| Setting | Where to find it | Used by |
|---|---|---|
| Project URL | Settings → API → Project URL | Backend `SUPABASE_URL`, Frontend `VITE_SUPABASE_URL` |
| `anon` public key | Settings → API → Project API keys | Backend `SUPABASE_ANON_KEY`, Frontend `VITE_SUPABASE_ANON_KEY` |
| JWT Secret | Settings → API → JWT Settings | Backend `SUPABASE_JWT_SECRET` only |

> **Security note:** Never expose `SUPABASE_JWT_SECRET` or the `service_role` key in the frontend or in public repositories.

### Configure auth (optional)

- Go to **Authentication → Providers** to enable Email/Password sign-in (enabled by default)
- Under **Authentication → Email Templates**, customise confirmation and reset emails for production
- Under **Authentication → URL Configuration**, add your production frontend URL to **Site URL** and **Redirect URLs**

---

## 2. Backend — Render

### Create the service

1. Sign in at [render.com](https://render.com) and click **New → Web Service**
2. Connect your GitHub repository
3. Set the **Root Directory** to `backend`
4. Render detects `render.yaml` automatically and pre-fills:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health check path:** `/api/v1/health`
5. Choose **Starter** plan (or free for initial testing)

### Set environment variables

In the Render dashboard under **Environment**, add the following. All are marked `sync: false` in `render.yaml`, meaning they must be set manually:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_JWT_SECRET` | JWT Secret from Supabase settings |
| `SUPABASE_ANON_KEY` | Supabase anon key |
| `GEMINI_API_KEY` | Your Google Gemini API key |
| `USE_MOCK_AI` | `false` (or `true` for demo deployments) |
| `DATABASE_URL` | Supabase PostgreSQL connection string (from **Project Settings → Database → Connection string → URI**) — use the connection pooler URL for production |
| `FRONTEND_ORIGIN` | Your Vercel frontend URL, e.g. `https://your-app.vercel.app` |
| `DEMO_MODE` | `false` |

> **Important:** Set `FRONTEND_ORIGIN` to your exact Vercel URL. Trailing slashes and `www` vs non-`www` differences will cause CORS failures.

### Verify the deployment

Once deployed, visit `https://<your-service>.onrender.com/api/v1/health`. You should see:
```json
{"status": "ok", "version": "1.0.0"}
```

Render shows deployment logs in the **Logs** tab. Common issues:
- **`ModuleNotFoundError`** — the Root Directory is probably set to the repo root instead of `backend/`
- **Startup timeout** — first deploy on the free tier can be slow; check logs for the actual error

### Auto-deploy

Render redeploys automatically on every push to your default branch. You can disable this or configure branch-specific deploys in **Settings → Auto-Deploy**.

---

## 3. Frontend — Vercel

### Import the project

1. Sign in at [vercel.com](https://vercel.com) and click **Add New → Project**
2. Import your GitHub repository
3. Set the **Root Directory** to `frontend`
4. Vercel detects Vite automatically and reads `vercel.json` for:
   - Build command: `npm run build`
   - Output directory: `dist`
   - SPA rewrites: all routes → `index.html`
   - Asset cache headers: 1-year immutable for hashed assets

### Set environment variables

In the Vercel project settings under **Settings → Environment Variables**, add:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | Your Render backend URL + `/api/v1`, e.g. `https://travel-planner-api.onrender.com/api/v1` |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |

Make sure these are set for **Production**, **Preview**, and **Development** environments as needed.

### Deploy

Click **Deploy**. Vercel builds the project and deploys to a `.vercel.app` subdomain. Subsequent pushes to the main branch trigger automatic redeployments.

### Custom domain (optional)

Go to **Settings → Domains** to add your own domain. Vercel provisions an SSL certificate automatically.

---

## 4. Environment Variables Checklist

Use this checklist to make sure nothing is missing before going live.

### Supabase

- [ ] `profiles`, `trips`, `itinerary_days` tables created
- [ ] RLS enabled and policies verified on all three tables
- [ ] Project URL, anon key, and JWT secret collected

### Backend (Render)

- [ ] `SUPABASE_URL` set
- [ ] `SUPABASE_JWT_SECRET` set
- [ ] `SUPABASE_ANON_KEY` set
- [ ] `GEMINI_API_KEY` set (or `USE_MOCK_AI=true`)
- [ ] `USE_MOCK_AI` set (`true` or `false`)
- [ ] `DATABASE_URL` set to Supabase connection string
- [ ] `FRONTEND_ORIGIN` set to exact Vercel URL
- [ ] `DEMO_MODE` set (`true` or `false`)
- [ ] Health check returns 200

### Frontend (Vercel)

- [ ] `VITE_API_BASE_URL` points to Render backend
- [ ] `VITE_SUPABASE_URL` set
- [ ] `VITE_SUPABASE_ANON_KEY` set
- [ ] Sign-up and login work end-to-end
- [ ] Trip creation returns a populated itinerary

---

## Updating and Rollbacks

### Render

Push to your default branch to trigger a redeploy. Roll back in the Render dashboard under **Deploys** — click any previous deploy and select **Rollback to this deploy**.

### Vercel

Push to your default branch to trigger a redeploy. Roll back in the Vercel dashboard under **Deployments** — click any deployment and select **Promote to Production**.

---

## Scaling Notes

- **Render Starter** handles moderate traffic. Upgrade to a Standard or Pro plan for more RAM and CPU, or to avoid cold starts on the free tier.
- **Supabase free tier** has a 500 MB database limit and pauses after 1 week of inactivity. Upgrade to Pro for production workloads.
- To scale the FastAPI backend beyond a single process, add `--workers 4` to the start command in `render.yaml`. Ensure the database connection pool is sized accordingly.
- Vercel scales automatically with no configuration needed.
