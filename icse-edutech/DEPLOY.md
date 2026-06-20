# ICSE Edutech — Deployment Guide
# Vercel (frontend) + Railway (API + Graph Engine)

## Overview

| Service | Platform | Free tier |
|---------|----------|-----------|
| Next.js frontend | Vercel | Yes — unlimited |
| Express API | Railway | Yes — 500 hrs/mo |
| Go graph engine | Railway | Yes — 500 hrs/mo |

Total cost to start: $0

---

## Step 1 — Push to GitHub

If not already done:

    git init
    git add .
    git commit -m "initial commit"
    gh repo create icse-edutech --private --push

Or push to an existing GitHub repo. Railway and Vercel both pull from GitHub.

---

## Step 2 — Deploy the Express API on Railway

1. Go to https://railway.app and sign in with GitHub
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repo → set **Root Directory** to `apps/api`
4. Railway auto-detects Node.js and runs the commands in `apps/api/railway.toml`
5. Once deployed, go to **Settings → Networking → Generate Domain**
   - Copy the URL, e.g. `https://icse-api-production.up.railway.app`
6. Set these environment variables in Railway (Settings → Variables):

        NODE_ENV=production
        JWT_SECRET=<generate a strong random string>
        CORS_ORIGIN=https://<your-vercel-app>.vercel.app

   (You will fill in the Vercel URL after Step 4 — come back and update this)

---

## Step 3 — Deploy the Go Graph Engine on Railway

1. In Railway, click **+ New Service** inside the same project
2. **Deploy from GitHub repo** → same repo → set **Root Directory** to `packages/graph-engine`
3. Railway builds with `go build -o graph-engine .` and starts `./graph-engine`
4. Go to **Settings → Networking → Generate Domain**
   - Copy the URL, e.g. `https://icse-graph-production.up.railway.app`

No extra env vars needed for the graph engine by default.

---

## Step 4 — Deploy the Next.js Frontend on Vercel

1. Go to https://vercel.com and sign in with GitHub
2. Click **Add New → Project** → import your repo
3. Vercel auto-detects Next.js. Override these build settings:
   - **Root Directory**: `apps/web`
   - (Leave Build Command and Output Dir as auto-detected)
4. Add these environment variables before deploying:

        NEXT_PUBLIC_API_URL=https://<your-railway-api-domain>
        NEXT_PUBLIC_GRAPH_URL=https://<your-railway-graph-domain>

5. Click **Deploy**
6. Copy your Vercel URL (e.g. `https://icse-edutech.vercel.app`)

---

## Step 5 — Update CORS on the API

Go back to your Railway API service → Variables, and update:

    CORS_ORIGIN=https://icse-edutech.vercel.app

Railway will auto-redeploy. Your frontend can now talk to the API.

---

## Step 6 — Smoke test

Visit your Vercel URL and check:

- `/` — home page loads
- `/dashboard` — shows subjects
- `/subjects/10/mathematics` — chapter list loads
- `/guide/10/mathematics/Commercial_Mathematics_Complete_Unit` — theory + tips show

Also hit the API health check directly:

    curl https://<your-railway-api-domain>/api/health

Should return `{"success":true,"data":{"status":"ok",...}}`

---

## Local dev (unchanged)

    # Terminal 1 — API
    cd apps/api && npm run dev

    # Terminal 2 — Graph engine
    cd packages/graph-engine && go run .

    # Terminal 3 — Frontend
    cd apps/web && npm run dev

Frontend reads NEXT_PUBLIC_API_URL from apps/web/.env.local
Copy apps/web/.env.local.example to apps/web/.env.local for local defaults.

---

## Custom domain (later)

When you buy a domain (e.g. icseedutech.in):
1. In Vercel: Settings → Domains → Add `icseedutech.in`
2. Update DNS at your registrar to point to Vercel
3. Update CORS_ORIGIN on Railway to include `https://icseedutech.in`

---

## Environment variable reference

### apps/api (Railway)

| Variable | Description |
|----------|-------------|
| PORT | Set automatically by Railway |
| NODE_ENV | Set to `production` |
| JWT_SECRET | Strong random string for auth tokens |
| CORS_ORIGIN | Comma-separated allowed frontend origins |

### apps/web (Vercel)

| Variable | Description |
|----------|-------------|
| NEXT_PUBLIC_API_URL | Full URL of Railway API service |
| NEXT_PUBLIC_GRAPH_URL | Full URL of Railway graph engine service |
