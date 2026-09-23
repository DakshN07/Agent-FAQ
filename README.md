#  FAQ Agent — Smart Omnichannel FAQ Bot

> **A full-stack FAQ management system with AI-powered semantic matching, built with Next.js, Node.js, and MongoDB. (Includes integrations for Discord, Slack, and Telegram)**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat&logo=vercel)](https://vercel.com)
[![Backend on Render](https://img.shields.io/badge/Backend%20on-Render-00ADD8?style=flat&logo=render)](https://render.com)
[![Database on MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=flat&logo=mongodb)](https://www.mongodb.com/atlas)

## 📋 Table of Contents

- [ Features](#-features)
- [ Current Status & Remaining Work](#-current-status--remaining-work)
- [ Tech Stack](#️-tech-stack)
- [ Project Structure](#-project-structure)
- [ Live Demo](#-live-demo)
- [ Quick Start](#-quick-start)
- [ Screenshots](#-screenshots)
- [ API Endpoints](#-api-endpoints)
- [ Database Schema](#-database-schema)
- [ Deployment](#-deployment)
- [ Contributing](#-contributing)
- [ License](#-license)
- [ Authors](#-authors)

---

##  Features

###  **Omnichannel Support**
- **Multiple Platforms**: Native adapters for Discord, Slack, and Telegram.
- **Unified Management**: Manage FAQs for all platforms from a single dashboard.

###  **AI-Powered FAQ Matching**
- **Semantic Similarity**: Uses embeddings to understand user intent
- **Smart Matching**: Finds relevant FAQs even with different wording
- **Configurable Threshold**: Adjustable similarity matching (0.1-1.0)

###  **Analytics Dashboard**
- **Real-time Statistics**: Total FAQs, unanswered questions, accuracy rates
- **Activity Tracking**: Monitor bot performance and user interactions
- **Visual Charts**: Beautiful graphs showing usage patterns

###  **Admin Management**
- **FAQ Management**: Add, edit, delete FAQs with rich text editor
- **Settings Configuration**: Customize bot behavior and appearance
- **User Management**: Team collaboration with role-based access

###  **Self-Learning System**
- **Unknown Question Tracking**: Automatically saves questions that don't match
- **AI Suggestions**: Generates suggested answers for frequent questions
- **Admin Training**: Notifies admins when questions are asked 3+ times

###  **Security & Authentication**
- **JWT Authentication**: Secure login system
- **Role-based Access**: Admin and member permissions
- **Team Invitations**: Secure team member onboarding

---

## 🚧 Current Status

The application is production-ready for live deployment. The frontend is a modern Next.js (App Router) application (`frontend`), backed by the Node.js/Express API (`server.js`).

**Implemented Features:**
- Authentication (Login / Register / Team Invitations)
- Dashboard with Overview, Inbox, AI Agent console, Knowledge (FAQ) management
- Events, Integrations, Team, and Moderation views
- Analytics dashboard (query volume, resolution rates, platform distribution)
- Settings configuration (similarity threshold, auto-response, notifications)
- AI Suggestions review (approve/reject AI-generated answers)
- Omnichannel adapters for Discord, Slack, and Telegram
- Security hardening: helmet, rate limiting, JWT auth, CORS lockdown, Sentry, graceful shutdown
- Session security: short-lived access tokens (15 min, in-memory on the frontend) + refresh sessions stored hashed in Redis, rotated on every use with replay rejection, delivered via an httpOnly cookie; password change and logout revoke sessions; brute-force limiters on login/register/password
- Live inbox: Server-Sent Events stream (`GET /api/events/:eventId/conversations/stream`) pushes new messages/conversations to the dashboard in real time
- Manual (human) replies: `POST /api/events/:eventId/conversations/:id/reply` sends through the connected channel bot
- Pagination on conversations and message endpoints (`?page=&limit=`, returns `{ data, total, page, totalPages }`)
- AI console answers run through the **same LangGraph workflow** as the channel bots (moderation → supervisor → FAQ/analytics with RAG) — no more answer divergence between channels and the dashboard
- Frontend observability: Sentry (client bootstrap + error boundaries on the root layout and dashboard)
- Answer-threshold resolution (per-event `faqThreshold` → global settings → 0.85) honored by the LangGraph agent and conversation status
- Vector-store reliability: single shared Qdrant wrapper, auto-created collection, deterministic point IDs, loud logging + Sentry capture on RAG failures, FAQ CRUD syncs to the vector store, `/health` reports vector-DB status
- Tests: backend health, auth, invite, session lifecycle (refresh rotation, logout, password change), threshold & vector-store suites

**Known limitations / roadmap:**
- Web-widget chat manual replies: conversations from the built-in web widget have no persistent channel transport yet, so `reply` returns a clear 409 until a web transport is added — Discord/Slack/Telegram replies work now.
- Cross-site refresh cookies (`SameSite=None; Secure`) work in Chrome/Firefox/Edge; Safari's ITP can block cross-site cookies, so users on Safari may need to sign in again after their refresh cookie expires.
- No public read-only API keys / billing yet (post-launch SaaS roadmap).

---

##  Tech Stack

### **Frontend (Next.js)**
-  **Next.js 15 (App Router)** — Modern React framework
-  **Tailwind CSS v4** — Utility-first styling
-  **TypeScript** — Type safety
-  **Framer Motion** — Fluid animations
-  **Lucide React** — Beautiful iconography

### **Backend**
-  **Node.js** — JavaScript runtime
-  **Express.js** — Web framework
-  **JWT** — Authentication
-  **Nodemailer** — Email notifications
-  **OpenAI/Gemini** — AI embeddings

### **Database**
-  **MongoDB Atlas** — Cloud database
-  **Mongoose** — ODM for MongoDB
-  **MongoDB Driver** — Database connectivity

### **Deployment**
-  **Vercel** — Frontend hosting
-  **Render** — Backend hosting
-  **MongoDB Atlas** — Database hosting

---

##  Project Structure

```text
Agent-FAQ/
├── 📁 adapters/               # Integration adapters (Discord, Slack, Telegram)
├── 📁 config/                 # Environment and app configuration
├── 📁 frontend/               # Next.js frontend application (Active)
├── 📁 models/                 # Database models (Mongoose)
├── 📁 routes/                 # Express API routes
├── 📁 services/               # Core business logic (IntegrationManager, AI)
├── 📁 middleware/             # Express middlewares (auth, error handling)
├── 📁 validations/            # Request validation schemas (Joi)
├── 📁 utils/                  # Utility functions (logger, email)
├── server.js                  # Main Express server file
├── package.json               # Backend dependencies
└── README.md                  # This file
```

---

## 🌐 Live Demo

### **Frontend (Dashboard)**
```
[http://agent-faq.vercel.app](https://agent-faq-seven.vercel.app/dashboard)
```

### **Backend API**
```
https://agent-faq.onrender.com
```
---

##  Quick Start

### **Prerequisites**
- Node.js 18+ installed
- MongoDB Atlas account
- GitHub account
- Vercel account (free)
- Render account (free)

### **1. Clone the Repository**
```bash
git clone https://github.com/DakshN07/Agent-FAQ.git
cd Agent-FAQ
```

### **2. Install Dependencies**
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### **3. Environment Setup**
Create a `.env` file in the root directory:
```env
# Database
MONGO_URI=your_mongodb_atlas_connection_string

# Authentication
JWT_SECRET=your_super_secret_jwt_key

# AI Services (MISTRAL_API_KEY is required for boot)
MISTRAL_API_KEY=your_mistral_api_key

# Optional AI providers
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key

# Redis (optional, for rate-limit stores)
REDIS_URL=

# CORS origins (comma-separated, required in production)
CORS_ORIGINS=

# Frontend base URL (for invite links and emails)
FRONTEND_URL=http://localhost:3000

# Discord Bot (optional)
DISCORD_TOKEN=your_discord_bot_token

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_FROM=your_email@gmail.com
```

Then create a `.env.local` in `frontend/`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### **4. Run Locally**
```bash
# Start backend server
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

### **5. Access the Application**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3000/api

---

## 🔧 API Endpoints

### **Authentication**
```http
POST /api/auth/register        # Register a new admin user
POST /api/auth/login           # User login
POST /api/auth/accept-invite   # Accept team invitation
GET  /api/auth/me              # Get current user
```

### **Events**
```http
GET    /api/events             # List events for current user
POST   /api/events             # Create an event
POST   /api/events/join        # Join an event via invite code
```

### **FAQ Management** (`/api/events/:eventId/faqs`)
```http
GET    /api/faqs             # Get all FAQs
POST   /api/faqs             # Create new FAQ
PUT    /api/faqs/:id         # Update FAQ
DELETE /api/faqs/:id         # Delete FAQ
```

### **Analytics & Settings**
```http
GET    /api/analytics        # Get analytics data
GET    /api/settings         # Get app settings
PUT    /api/settings         # Update settings
GET    /api/suggestions      # Get AI suggestions
GET    /api/unknown-questions # Get unknown questions
```

### **AI Agent**
```http
GET    /api/ai/ask?question=...&eventId=...   # Ask the AI agent (runs the same LangGraph pipeline as the bots)
```

### **Conversations (paginated)**
```http
GET    /api/events/:eventId/conversations?status=&page=&limit=  # List conversations
GET    /api/events/:eventId/conversations/stream?token=         # SSE live stream (inbox)
GET    /api/events/:eventId/conversations/:id/messages?page=&limit=  # Thread messages
POST   /api/events/:eventId/conversations/:id/reply             # Manual (human) reply via channel bot
```

### **Session / Auth**
```http
POST   /api/auth/refresh     # Rotate refresh token (httpOnly cookie) -> new access token
POST   /api/auth/logout      # Revoke refresh session + clear cookie
PUT    /api/auth/password    # Change password (revokes all refresh sessions)
```

### **System**
```http
GET    /health               # Health check (DB + vector-DB status)
GET    /api/health           # API health check
GET    /api-docs             # Swagger API docs (disabled in production)
```

---

##  Database Schema

### **User Model**
```javascript
{
  email: String,           // User email
  password: String,        // Hashed password
  name: String,           // User name
  role: String,           // 'admin' | 'member'
  createdAt: Date
}
```

### **FAQ Model**
```javascript
{
  question: String,        // FAQ question
  answer: String,         // FAQ answer
  guildId: String,        // Discord server ID
  embedding: [Number],    // AI embedding vector
  createdAt: Date
}
```

### **Settings Model**
```javascript
{
  similarityThreshold: Number,  // Matching threshold (0.1-1.0)
  maxSuggestions: Number,       // Max AI suggestions
  autoRespond: Boolean,         // Auto-response setting
  notificationEmail: String,    // Admin email
  createdAt: Date,
  updatedAt: Date
}
```

---

## Deployment

### **Frontend Deployment (Vercel)**

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"

2. **Import Repository**
   - Select your `Agent-FAQ` repository
   - Set root directory to `frontend/`
   - Vercel auto-detects the Next.js framework (see `frontend/vercel.json`)

3. **Configure Environment Variables**
   - Set `NEXT_PUBLIC_API_URL` to your deployed backend URL (e.g. `https://agent-faq.onrender.com`)

4. **Deploy**
   - Click "Deploy"
   - Get your live URL

### **Backend Deployment (Render)**

A `render.yaml` blueprint is included. Alternatively:

1. **Create Web Service**
   - Go to [render.com](https://render.com)
   - Click "New Web Service"
   - Connect your GitHub repo

2. **Configure Settings**
   - **Root Directory**: `/` (leave blank)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment**: Node

3. **Environment Variables**
   ```env
   # Required
   NODE_ENV=production
   MONGO_URI=your_mongodb_atlas_connection
   JWT_SECRET=your_strong_random_secret
   MISTRAL_API_KEY=your_mistral_key
   # Recommended
   CORS_ORIGINS=https://your-frontend.vercel.app
   FRONTEND_URL=https://your-frontend.vercel.app
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Wait for build completion

### **Database Setup (MongoDB Atlas)**

1. **Create Cluster**
   - Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
   - Create free cluster (M0)

2. **Database Access**
   - Create database user
   - Set username/password

3. **Network Access**
   - Allow access from anywhere (0.0.0.0/0)

4. **Get Connection String**
   - Click "Connect" on cluster
   - Choose "Connect your application"
   - Copy connection string

---

##  Configuration

### **CORS Setup**
In production the backend only allows origins listed in `CORS_ORIGINS` (comma-separated). Set it to your frontend URL:
```env
CORS_ORIGINS=https://your-frontend.vercel.app
```

### **Environment Variables**
All required environment variables are validated at boot by `config/env.js`. The service will refuse to start if `MONGO_URI`, `JWT_SECRET`, or `MISTRAL_API_KEY` are missing, or if `JWT_SECRET` uses the insecure default placeholder in production.

### **Semantic search (Qdrant / vector store)**
- The `faqs` Qdrant collection is **auto-created** with the correct vector dimensions on the first upsert — no manual collection setup needed.
- Point IDs are deterministic UUIDs derived from the FAQ MongoDB id, so re-learning or editing a FAQ updates the same point instead of duplicating it.
- Creating/editing/deleting FAQs through the API (and the onboarding generator) keeps the vector store in sync automatically.
- RAG failures are **loud**: failed embeddings or Qdrant calls are logged at error level and captured by Sentry, so a misconfigured vector store is never mistaken for a genuine "no match".
- `/health` includes a `vectorDb` struct (`ok` / `uninitialized` / `error`) so outages are visible in uptime monitoring.

### **Answer threshold resolution**
The confidence threshold used for auto-answering resolves in this order, replacing the previously hardcoded `0.85`:
1. Per-event `Event.faqThreshold` (when explicitly set),
2. Global `Settings.similarityThreshold` (the admin Settings UI),
3. `0.85` default.

The same resolved threshold drives both the LangGraph agent's RAG decision and the conversation's Answered/Escalated status.

---

##  Contributing

We welcome contributions! Here's how to get started:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit your changes**
   ```bash
   git commit -m 'Add amazing feature'
   ```
5. **Push to the branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### **Development Guidelines**
- Follow the existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass

---

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 DakshN07

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👥 Authors

[![GitHub: DakshN07](https://img.shields.io/badge/GitHub-DakshN07-181717?style=flat&logo=github)](https://github.com/DakshN07)
[![GitHub: AyushBurde](https://img.shields.io/badge/GitHub-AyushBurde-181717?style=flat&logo=github)](https://github.com/AyushBurde)

- **[Daksh Nayak](https://github.com/DakshN07)** - *Frontend development, database & deployment*
- **[Ayush Burde](https://github.com/AyushBurde)** - *Main project concept, backend & architecture*

---

##  Acknowledgments

- **OpenAI** for AI embeddings and suggestions
- **Google Gemini** for alternative AI services
- **Vercel** for frontend hosting
- **Render** for backend hosting
- **MongoDB Atlas** for database hosting
- **Discord.js** for Discord bot integration

---

##  Support

If you need help or have questions:

-  **Email**: [dakshnayak635@gmail.com] [aayuworks7@gmail.com]
-  **Issues**: [GitHub Issues](https://github.com/DakshN07/Agent-FAQ/issues)
-  **Discussions**: [GitHub Discussions](https://github.com/DakshN07/Agent-FAQ/discussions)

---

<div align="center">

** Star this repository if you found it helpful!**

** Built with ❤️ for the developer community**

</div>
