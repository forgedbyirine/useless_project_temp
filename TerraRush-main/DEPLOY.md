# TerraRush — Deployment Guide

Deploy the **server** to Railway (free, supports WebSockets) and the **client** to Vercel (free, static hosting).

---

## Prerequisites

- GitHub account — https://github.com
- Railway account — https://railway.app (sign up with GitHub)
- Vercel account — https://vercel.com (sign up with GitHub)

---

## Step 1 — Push to GitHub

You need the code on GitHub so Railway and Vercel can pull it.

### Create the GitHub repo

1. Go to https://github.com/new
2. Name it `TerraRush`
3. Set it to **Private** (or Public — your choice)
4. **Do NOT** tick "Add a README" — leave it empty
5. Click **Create repository**

### Push your local code

GitHub will show you commands after creating the repo. Run these in your TerraRush folder:

```
cd C:\Users\ADMIN\OneDrive\Documents\TerraRush

git remote add origin https://github.com/YOUR_USERNAME/TerraRush.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

Verify it worked: refresh your GitHub repo page — you should see all the files.

---

## Step 2 — Deploy the Server to Railway

### Create the Railway project

1. Go to https://railway.app/new
2. Click **Deploy from GitHub repo**
3. Authorize Railway to access your GitHub if prompted
4. Select your `TerraRush` repository
5. When asked which folder to deploy, set the **Root Directory** to `server`
6. Click **Deploy Now**

Railway will auto-detect Node.js, run `npm run build && npm start`, and give you a public URL.

### Set environment variables on Railway

Once deployed, go to your Railway service → **Variables** tab → add:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `CLIENT_ORIGIN` | *(leave blank for now — fill in after Vercel deploy)* |

> You'll come back and set `CLIENT_ORIGIN` after Step 3.

### Get your Railway URL

Go to your Railway service → **Settings** → **Networking** → **Generate Domain**.

It will look like:
```
https://terrarush-server-production.up.railway.app
```

**Copy this URL — you need it for Step 3.**

### Test the server

Open your Railway URL in a browser. You should see:
```json
{ "name": "TerraRush Server", "status": "online", "version": "1.0.0" }
```

---

## Step 3 — Deploy the Client to Vercel

### Set the production server URL

Open `client/.env.production` in VS Code and replace the placeholder:

```
VITE_SERVER_URL=https://YOUR-RAILWAY-URL.up.railway.app
```

For example:
```
VITE_SERVER_URL=https://terrarush-server-production.up.railway.app
```

Save the file. Then commit and push:

```
cd C:\Users\ADMIN\OneDrive\Documents\TerraRush
git add client/.env.production
git commit -m "set production server URL"
git push
```

> **Note:** `.env.production` is in `.gitignore` by default to protect secrets.
> For TerraRush the server URL is not secret, so it's safe to commit.
> To allow git to track it, run: `git rm --cached client/.env.production` is NOT needed here —
> just remove `*.env.production` from `.gitignore` first:

Run this one-time fix so Vercel can read the env file from the repo:

```
cd C:\Users\ADMIN\OneDrive\Documents\TerraRush
```

Edit `.gitignore` — remove the line `.env.production`, then:

```
git add .gitignore client/.env.production
git commit -m "allow .env.production to be tracked for Vercel"
git push
```

**OR** — skip the file entirely and set it as a Vercel environment variable instead (see below).

### Create the Vercel project

1. Go to https://vercel.com/new
2. Click **Import Git Repository** → select `TerraRush`
3. Vercel will detect it as a Vite project automatically
4. Under **Root Directory** click **Edit** and set it to `client`
5. Under **Environment Variables** add:

| Name | Value |
|------|-------|
| `VITE_SERVER_URL` | `https://YOUR-RAILWAY-URL.up.railway.app` |

6. Click **Deploy**

Vercel builds the client and gives you a URL like:
```
https://terrarush.vercel.app
```

**Copy this URL — you need it for Step 4.**

---

## Step 4 — Connect Server CORS to Client URL

Go back to Railway → your service → **Variables** tab.

Set:

| Variable | Value |
|----------|-------|
| `CLIENT_ORIGIN` | `https://terrarush.vercel.app` |

Railway will automatically redeploy. This tells the server to only accept WebSocket connections from your Vercel frontend.

---

## Step 5 — Verify Everything Works

1. Open your Vercel URL: `https://terrarush.vercel.app`
2. Click **CREATE GAME** — you should get a game code
3. Open a second browser tab, click **JOIN GAME**, enter the code
4. Both players appear in the lobby
5. Click **START GAME** — game begins
6. Try **DEMO MODE** — 6 bots should start playing immediately

If the game loads but players can't connect, check:
- Railway logs (Railway dashboard → your service → **Logs**)
- Browser console (F12 → Console) for WebSocket errors
- That `CLIENT_ORIGIN` on Railway exactly matches your Vercel URL (no trailing slash)

---

## Redeployment

Every time you push to GitHub `main`, both Railway and Vercel **automatically redeploy**.

```
git add .
git commit -m "your change"
git push
```

That's all it takes.

---

## Summary of URLs

| Thing | Where |
|-------|-------|
| Live game | `https://terrarush.vercel.app` |
| Projector view | `https://terrarush.vercel.app` → 📺 Projector |
| Admin dashboard | `https://terrarush.vercel.app` → ⚙️ Admin |
| Server health | `https://YOUR-RAILWAY-URL.up.railway.app` |

---

## Free Tier Limits

| Platform | Limit |
|----------|-------|
| Railway | $5 free credit/month (~500 hrs). Server sleeps after inactivity on free plan — first request takes ~5s to wake up. Upgrade to Hobby ($5/mo) for always-on. |
| Vercel | Unlimited for static sites on free tier |

For a **hackathon demo**, Railway free tier is fine — just open the server URL once before the demo to wake it up.
