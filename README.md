# FAQ Agent — AI Support Bot

An AI assistant that answers your users' questions automatically.

You give it a list of FAQs. It reads each incoming question, figures out the *meaning* (not just the keywords), and replies with the right answer — on **Discord**, **Slack**, **Telegram**, or your own website.

---

## Table of contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [What you need to install](#what-you-need-to-install)
- [Step 1 — Start the database services](#step-1--start-the-database-services)
- [Step 2 — Configure the backend](#step-2--configure-the-backend)
- [Step 3 — Start the backend](#step-3--start-the-backend)
- [Step 4 — Start the frontend](#step-4--start-the-frontend)
- [Step 5 — Get your AI key](#step-5--get-your-ai-key)
- [Understanding the ports](#understanding-the-ports)
- [How the AI actually answers](#how-the-ai-actually-answers)
- [Troubleshooting](#troubleshooting)
- [Deploying](#deploying)
- [Project layout](#project-layout)
- [API reference](#api-reference)

---

## What it does

- **Semantic matching** — a user asking "how do I reset my pwd?" matches an FAQ titled "Password reset". No keyword lists.
- **Answers from your FAQs only** — if nothing matches closely enough, it says so instead of inventing an answer.
- **Live inbox** — new questions arrive in the dashboard in real time, and you can reply as a human.
- **Unanswered questions get collected** — anything the bot can't answer is saved so you know what to write an FAQ for next.
- **Moderation** — spam and abuse are filtered before your users reach a real person.

---

## Quick start

```bash
git clone https://github.com/DakshN07/Agent-FAQ.git
cd Agent-FAQ

npm install                # backend
cd frontend && npm install && cd ..   # frontend

cp .env.example .env       # then edit it (see Step 2)
cp frontend/.env.example frontend/.env.local

docker compose up -d       # starts MongoDB, Qdrant, Redis

npm run dev                          # terminal 1 — API on :4000
cd frontend && npm run dev           # terminal 2 — UI on :3000
```

Open **http://localhost:3000**, create an account, and paste your AI key when asked.

---

## What you need to install

| Tool | Version | Why |
|------|---------|-----|
| [Node.js](https://nodejs.org) | 18 or newer | Runs the backend and frontend |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | any | Runs MongoDB, Qdrant, Redis — saves you installing three databases by hand |
| A [Mistral](https://mistral.ai) account | free tier | The AI that answers questions. You get a free API key. |

You also need Docker's memory to be at least 2 GB (Docker Desktop → Settings → Resources).

---

## Step 1 — Start the database services

The app needs three supporting services. `docker compose` starts all of them at once:

```bash
docker compose up -d
```

That starts:

| Service | Port | What it's for |
|---------|------|----------------|
| **MongoDB** | 27017 | Stores your FAQs, users, conversations |
| **Qdrant** | 6333 | Stores FAQ "meanings" so the AI can match questions |
| **Redis** | 6379 | Keeps you signed in across server restarts (optional) |

> **Redis is genuinely optional.** If you skip it, sessions live in memory and you just have to log in again whenever the server restarts. Qdrant is **not** optional — without it the AI cannot match answers.

To start only what you need:

```bash
docker compose up -d mongo qdrant    # skip Redis
```

Check they're healthy:

```bash
docker compose ps
```

### Using a hosted Qdrant instead of Docker

Qdrant Cloud has a free tier with 1 GB — plenty for thousands of FAQs.

1. Create a free cluster at [qdrant.tech](https://qdrant.tech)
2. Copy the cluster URL and API key
3. Put them in `.env`:

```env
QDRANT_URL=https://your-cluster.cloud.qdrant.io:6333
QDRANT_API_KEY=your_api_key
```

You do **not** need to create a collection — Agent-FAQ creates the `faqs` collection automatically the first time it saves a FAQ.

---

## Step 2 — Configure the backend

Copy the example file and open it:

```bash
cp .env.example .env
```

For local development you only need to change one thing:

```env
JWT_SECRET=<paste any long random string>
```

Generate one with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Everything else already has a working default. The full list, with what each one is for:

| Variable | Required? | What it does |
|----------|-----------|--------------|
| `MONGO_URI` | **yes** | Where your data lives. Defaults to local MongoDB. |
| `JWT_SECRET` | **yes** | Signs your login sessions. Use a long random string. |
| `PORT` | no | Which port the API listens on. Defaults to `4000`. |
| `CORS_ORIGINS` | in production | Which website may call the API. Set to your frontend's URL. |
| `FRONTEND_URL` | no | Used to build links in invite emails. |
| `QDRANT_URL` | no | Where Qdrant is. Defaults to `http://localhost:6333`. |
| `REDIS_URL` | no | Shared session store. Leave blank locally. |
| `MISTRAL_API_KEY` | no | Shared AI key. **You usually don't need this** — see Step 5. |
| `GEMINI_API_KEY` | no | Only used to auto-write starter FAQs. Optional. |
| `SENTRY_DSN` | no | Error tracking. Optional. |
| `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET` | no | Lets users connect a Discord server with one click. See "Connecting channels". |
| `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` | no | Same, for a Slack workspace. |
| `SLACK_SIGNING_SECRET` | no | **Required** for Slack to deliver messages. Without it Slack requests are rejected. |
| `TELEGRAM_BOT_TOKEN` | no | Fallback bot token. Not needed when users connect their own. |

The server refuses to start if `MONGO_URI` or `JWT_SECRET` is missing, and will refuse a known placeholder `JWT_SECRET` in production.

---

## Step 3 — Start the backend

```bash
npm run dev
```

You should see:

```
info: 🚀 API Server running in development mode on port 4000
info: ✅ MongoDB Connected to mongodb://localhost:27017/agentfaq
```

Verify it works:

```bash
curl http://localhost:4000/health
```

A healthy response looks like this:

```json
{
  "status": "ok",
  "database": "connected",
  "ai": {
    "mistralKeyConfigured": false,
    "note": "No shared MISTRAL_API_KEY. Users must add their own from the dashboard."
  },
  "vectorDb": { "status": "uninitialized", "exists": false, "latencyMs": 12 }
}
```

- `vectorDb.status: "uninitialized"` is **fine** at this point — it just means no FAQ has been saved yet. The collection is created on the first save.
- `vectorDb.status: "error"` means Qdrant isn't reachable. See [Troubleshooting](#troubleshooting).

---

## Step 4 — Start the frontend

In a **second terminal**:

```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** and create your account.

### The frontend config file

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

`NEXT_PUBLIC_API_URL` must point at the **backend** port, not the frontend port.

---

## Step 5 — Get your AI key

This is the step that switches the AI from off to on.

### Why you need one

The AI matches questions to FAQs by converting both into a numeric "meaning" (an *embedding*). That requires an AI model, which requires an API key. Rather than requiring the server operator to supply one, Agent-FAQ uses **your own key** — so usage is billed to you, and you can revoke it anytime.

Mistral's free tier is more than enough to evaluate this project.

### Getting it

1. Sign up at [mistral.ai](https://mistral.ai)
2. Go to the [API keys page](https://console.mistral.ai/api-keys)
3. Click **Create new key**, give it any name, copy it

### Adding it

When you create your account, the app walks you straight to a **"Connect your AI"** step with a box to paste it in. If you skipped it, go to **Settings → API Keys** any time.

When you paste a key, the server **verifies it against Mistral before saving it**. If the key is wrong you get an error immediately instead of silent failures later.

### How your key is handled

- Verified live against Mistral, then encrypted with **AES-256-GCM** before being stored
- Marked `select: false` in the database, so it can't leak into an ordinary query
- **Never sent back to the browser** — not even masked-and-returned
- Decrypted only at the moment of an API call

### Don't want to manage a key per user?

Leave `MISTRAL_API_KEY` in `.env` and every user shares it. Handy for demos and small teams.

---

## Connecting channels (Discord, Slack, Telegram)

This is the **Integrations** page in the dashboard. A user clicks **Connect**, approves
the provider's own screen, and lands back on your site with the button showing *Connected*.

```
Dashboard                Your API                  Discord / Slack          Back to your site
   │                        │                             │                        │
   │ POST /api/oauth/       │                             │                        │
   │   :platform/connect    │                             │                        │
   │───────────────────────►│                             │                        │
   │  { authorizeUrl }      │                             │                        │
   │◄───────────────────────│                             │                        │
   │                                                                │                        │
   │  browser goes straight to the provider ─────────────────────► │                        │
   │                                                  user picks server/workspace        │
   │                                                  and approves permissions          │
   │                                                                │                        │
   │  ◄──────────────────────────────────────────────────────────────┤                        │
   │      GET /api/oauth/:platform/callback?code=…&state=…           │                        │
   │                        │  verify state, swap code for a token,   │                        │
   │                        │  store it encrypted, start the bot     │                        │
   │  ◄─────────────────────────────────────────────────────────     │                        │
   │      302 → /dashboard/integrations?connected=discord           │                        │
```

Only **one** redirect, straight to the provider. Nothing is copied around by hand.

### What each platform asks for

| Platform | Scopes requested | Why |
|----------|------------------|-----|
| Discord | View channel, Send messages, Read history | The minimum to read a question and reply to it. **Not** Administrator. |
| Slack | `chat:write`, `chat:write.public`, `channels:history`, `channels:read` | Needed to read messages and post replies. |
| Telegram | *(none — you paste a token)* | Telegram has no bot OAuth at all. |

### Telegram works differently, and it has to

Telegram simply does not offer an OAuth screen for bots. The flow is:

1. The user messages **@BotFather** and creates a bot.
2. They paste the token into a dialog.
3. We verify the token against Telegram *before* saving it.

Step 3 matters — without it a typo gets saved and produces a bot that looks connected
but never replies.

### Setting up Discord

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → **New Application**.
2. **OAuth2** → **URL Redirect** → paste `https://your-api.com/api/oauth/discord/callback`.
3. Copy the **Client ID** and **Client Secret** into `.env` as `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`.

### Setting up Slack

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → **New App From Scratch** → pick a workspace.
2. **OAuth & Permissions** → **Bot Token Scopes** → add the four scopes above.
3. **Event Subscriptions** → enable, and subscribe to `message.channels` and `message.groups`.
4. Copy the **Client ID** and **Client Secret** into `.env` as `SLACK_CLIENT_ID` / `SLACK_CLIENT_SECRET`.
5. Copy the **Signing Secret** into `.env` as `SLACK_SIGNING_SECRET`. **Slack won't deliver
   messages without this** — the backend rejects unsigned requests rather than trusting them.

### Importing FAQs you already wrote

Once a channel is connected, **Import FAQs** pulls in questions you've already answered
there. A *pinned message with a reply* becomes one FAQ: the pin is the question, the first
reply is the answer. That matches how people already use pins, so it's predictable.

**Telegram can't do this.** The Telegram Bot API gives bots no access to chat history —
there is nothing to read. The app says so rather than offering a button that can't work.

---

## Understanding the ports

Two servers run at once, so they use different ports:

| Port | What's on it | Start it with |
|------|--------------|---------------|
| **3000** | The website you look at | `cd frontend && npm run dev` |
| **4000** | The API the website talks to | `npm run dev` |

Running both on 3000 is the single most common setup mistake — the second one fails to start, and the first ends up calling itself. If you change one port, change it in three places:

| What | Where |
|------|-------|
| API port | `PORT` in `.env` |
| Where the website looks for the API | `NEXT_PUBLIC_API_URL` in `frontend/.env.local` |
| Who may call the API | `CORS_ORIGINS` in `.env` (set this to the **frontend** URL) |

---

## How the AI actually answers

When a question arrives, it passes through four agents in sequence:

1. **Moderation** — is this spam, abuse, or a scam? Flags it and stops.
2. **Supervisor** — route it to the right specialist.
3. **FAQ agent** — turn the question into a vector, search Qdrant for the closest FAQs, and answer using only what it found. If the best match is below your similarity threshold, it declines instead of guessing.
4. **Analytics agent** — for admin questions about usage.

**Your similarity threshold** is how confident the match must be. It's set per event, falls back to the global setting, and defaults to `0.85`. Higher means the bot only answers when it's very sure — fewer wrong answers, more escalations. Lower means it answers more, but may stretch.

A question the bot can't confidently answer gets saved to **Unknown Questions** so you can turn it into a real FAQ.

---

## Troubleshooting

### `vectorDb.status: "error"` / "fetch failed"

Qdrant isn't running.

```bash
docker compose up -d qdrant
docker compose ps          # confirm it's up
```

Still failing? Check `QDRANT_URL` in `.env` matches what Qdrant reports at `http://localhost:6333`.

### The AI answers everything with "I couldn't find a verified answer"

The bot found no FAQ above your threshold. In order of likelihood:

1. **No AI key saved** — check Settings → API Keys.
2. **Qdrant is down**, so there are no vectors to search. Check `/health`.
3. **Your FAQs have no embeddings** — this happens if they were imported before an AI key existed. Regenerate them:

   ```bash
   node scripts/backfill-embeddings.js
   ```

4. **Your threshold is too high** — lower it in Settings.

### `Port 4000 is already in use`

Something else is on that port:

```bash
# Windows
netstat -ano | findstr :4000
# macOS / Linux
lsof -i :4000
```

Or change `PORT` in `.env` and update the two other places listed above.

### `MongooseServerSelectionError`

MongoDB isn't running or `MONGO_URI` is wrong.

```bash
docker compose up -d mongo
```

### The website loads but every request fails

Almost always `NEXT_PUBLIC_API_URL`. Check `frontend/.env.local` points at the **API** port (4000 locally). Restart Next.js after changing it — env vars are read at startup.

### Creating an event is slow or hangs

Starter FAQ generation calls an AI provider. It now runs in the background and no longer blocks, but if it's very slow the provider key is probably missing. It works fine without one.

---

## Deploying

### Frontend → Vercel

1. Push to GitHub, then import the repo at [vercel.com](https://vercel.com)
2. Set **Root Directory** to `frontend`
3. Add `NEXT_PUBLIC_API_URL=https://your-api.onrender.com`

### Backend → Render

A [`render.yaml`](./render.yaml) blueprint is included. Otherwise create a Web Service with:

| Setting | Value |
|---------|-------|
| Build command | `npm install` |
| Start command | `node server.js` |

Environment variables:

```env
NODE_ENV=production
MONGO_URI=<your MongoDB Atlas URI>
JWT_SECRET=<64+ random characters>
CORS_ORIGINS=https://your-frontend.vercel.app
FRONTEND_URL=https://your-frontend.vercel.app
QDRANT_URL=<your Qdrant URL>
QDRANT_API_KEY=<your Qdrant key>
REDIS_URL=<your Redis URL>
```

> Set `CORS_ORIGINS` to your **frontend** URL. This is the most common production misconfiguration, and it presents as "every API call fails in the browser but works in curl".

### Everything with Docker

```bash
docker compose up -d --build
```

The website is then on **http://localhost**.

---

## Project layout

```
Agent-FAQ/
├── adapters/          Channel bots (Discord, Slack, Telegram)
├── config/            Environment validation, Swagger
├── frontend/          Next.js dashboard
├── libs/              Shared clients (DB, Redis, sessions)
├── middleware/        Auth, validation, error handling
├── models/            MongoDB schemas
├── routes/            API endpoints
├── services/
│   ├── langgraph/     The four AI agents
│   ├── ai.js          Starter FAQ generation
│   ├── embedding.js   Question → vector
│   ├── mistralKey.js  Per-user AI key handling
│   └── vectorStore.js Qdrant wrapper
├── utils/             Logger, crypto, helpers
├── server.js          API entry point
└── tests/             Test suite
```

---

## API reference

Interactive docs are at **http://localhost:4000/api-docs** (disabled in production).

### Health

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/health` | Database, AI-key, and vector-store status |

### Authentication

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| POST | `/api/auth/refresh` | Rotate the session token |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/auth/password` | Change password |
| POST | `/api/auth/accept-invite` | Join a team |
| GET | `/api/auth/mistral-key` | Is an AI key configured? |
| PUT | `/api/auth/mistral-key` | Save an AI key (verified first) |
| DELETE | `/api/auth/mistral-key` | Remove the AI key |

### Events

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/events` | Your events |
| POST | `/api/events` | Create an event |
| GET | `/api/events/:id` | One event |
| POST | `/api/events/join` | Join with an invite code |

### Channel integrations

> Connecting uses a browser redirect, so `eventId` goes in the **body** — not the path.
> Only status reads are nested under the event.

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/oauth/:platform/connect` | Start a connection. Returns `{ authorizeUrl }` |
| GET | `/api/oauth/:platform/callback` | Where the provider sends the user back |
| GET | `/api/oauth/:platform/status` | Is this platform configured on the server? |
| POST | `/api/oauth/telegram/connect` | Save a Telegram bot token |
| POST | `/api/oauth/telegram/verify` | Check a token before saving it |
| DELETE | `/api/oauth/:platform/disconnect` | Disconnect and delete stored credentials |
| GET | `/api/events/:id/integrations` | Connection state per platform (no tokens) |
| POST | `/api/events/:id/integrations/:platform/reconnect` | Retry a connection that failed |
| GET | `/api/events/:id/integrations/:platform/import-sources` | Channels available to import from |
| POST | `/api/events/:id/integrations/:platform/import-faqs` | Import pinned Q&A as FAQs |

`:platform` is `discord`, `slack`, or `telegram`. Import endpoints only work for Discord
and Slack.

### FAQs

> FAQs live under `/api/faqs` and are scoped by an `eventId` — **not** nested under `/api/events/:id/faqs`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/faqs?eventId=...` | List an event's FAQs |
| POST | `/api/faqs` | Create a FAQ |
| PUT | `/api/faqs/:id` | Update a FAQ |
| DELETE | `/api/faqs/:id` | Delete a FAQ |

### Conversations

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/events/:eventId/conversations` | List conversations (paginated) |
| GET | `/api/events/:eventId/conversations/stream` | Live updates (SSE) |
| GET | `/api/events/:eventId/conversations/:id/messages` | Read a thread |
| POST | `/api/events/:eventId/conversations/:id/reply` | Reply as a human |

### AI

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/ai/ask?question=...&eventId=...` | Ask the assistant |
| GET | `/api/analytics?eventId=...` | Usage statistics |
| GET | `/api/unknown-questions?eventId=...` | Questions the bot couldn't answer |
| GET | `/api/settings` · PUT `/api/settings` | Read and update settings |

---

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start the API |
| `npm run build:frontend` | Build the dashboard for production |
| `npm test` | Run the test suite |
| `node scripts/backfill-embeddings.js` | Regenerate embeddings for existing FAQs |
| `docker compose up -d` | Start MongoDB, Qdrant, Redis |

---

## Known limitations

- **Web-widget replies** — the bot answers on your website, but human replies from the dashboard are only supported for Discord, Slack, and Telegram. The web widget returns a clear 409 until a transport is added.
- **Telegram FAQ import** — Telegram bots get no access to chat history through the Bot API, so there is nothing to import. Add Telegram FAQs by hand.
- **Telegram needs a token, not a click** — unlike Discord and Slack, Telegram offers no bot OAuth screen, so connecting it means pasting a token from @BotFather. This is a Telegram limitation, not a design choice.
- **Safari and session cookies** — cross-site refresh cookies can be blocked by Safari's ITP. Chrome, Firefox, and Edge are unaffected. Affected users just sign in again.
- **Single-process OAuth state** — the one-time connection tokens are held in memory, so a server restart mid-connection (or running more than one API instance) invalidates a flow already in progress. Users just click Connect again.

---

## License

MIT — see [LICENSE](./LICENSE).

Built by [Daksh Nayak](https://github.com/DakshN07) and [Ayush Burde](https://github.com/AyushBurde).