## DataGuardian – Privacy Analysis API + Chrome Extension

DataGuardian helps users understand and control how websites track them. It combines:

- A backend API that visits sites in a headless browser, detects tracker domains, and generates AI-powered privacy summaries.
- A Chrome extension frontend that presents a clear privacy snapshot, lets users toggle protection modes, and optionally blocks or limits tracking behavior per-site.

---

## Key Features

- **Tracker detection (server-side)**: Uses a hardened headless Chromium session to load the target page, observe all network activity, and infer trackers from domain lists, URL/pattern heuristics, and behavior.
- **AI privacy summaries**: Calls Google Gemini to turn the tracker list into an actionable, user-friendly summary with what’s collected, who data is shared with, retention, and key risks. Caches results to reduce latency and cost.
- **Privacy score and grade**: Computes a 0–100 score and letter grade based on HTTPS usage, tracker volume, policy hints, and AI risk signals. Groups results into categories like “Excellent”, “Good”, etc.
- **Network graph API**: Builds a simple graph for the site and its trackers for visualization (nodes and edges with inferred categories and companies).
- **Chrome extension UI**: Clean popup with AI one‑liners, tracker category counts, and quick privacy mode toggles: Stealth, Research, or None.
- **Per‑site controls**: Persisted site settings via `chrome.storage`. Optionally blocks trackers and/or specific tracker categories with lightweight in‑page guards.

---

## Architecture Overview

### Backend (Node.js + Express)

- `backend/server.js`

  - Express app with CORS, JSON limits, security headers, request logging, rate limiting, health check, and `/api/sites/*` routes.
  - Connects to MongoDB (via `backend/config/db.js`).

- `backend/routes/siteRoutes.js`

  - Routes:
    - `POST /api/sites/analyze` – Analyze a URL for trackers and compute score/summary.
    - `GET /api/sites/network?url=` – Return nodes/links for the site→tracker graph.
    - `GET /api/sites/:url` (or `?url=` in controller) – Fetch a site’s last stored result.
    - `GET /api/sites/` – List stored sites, most recent first.

- `backend/controllers/siteController.js`

  - Calls `detectTrackers(url)` to run a headless session and capture tracker domains.
  - Calls `generateAIPrivacySummary(trackers, url)` for a structured AI summary.
  - Computes `score`, `grade`, and `category`; persists into Mongo when available.
  - Implements smart caching rules: reuse recent successful AI results for 48h (30m for failed AI) to avoid redundant re‑analysis.
  - Exposes graph data that classifies trackers into categories and companies with fallbacks if AI detail is unavailable.

- `backend/utility/trackerService.js`

  - Puppeteer logic to launch Chromium, set viewport and UA, listen to all requests, and classify trackers using:
    - Known tracker domain lists (Google, Meta, ad networks, analytics, social, etc.).
    - Heuristic patterns (e.g., `/analytics`, `/collect`, `pixel`, `telemetry`), and subdomain patterns (e.g., `.ads.`).
  - Simulates realistic behavior (scroll, cookie-consent acceptance) to trigger lazy trackers.

- `backend/services/geminiService.js`

  - Wraps Google Generative AI to convert a tracker list into a structured summary.
  - Extracts and validates JSON, with robust fallbacks if AI is unavailable or parsing fails.
  - Adds popup vs full variants (sentence‑aware truncation), returns per‑tracker details, and caches responses in‑memory for 24h.

- `backend/models/Site.js`
  - MongoDB schema for analyzed sites: `url`, `trackers`, AI summary, score/grade/category, timestamps, and helper virtuals/methods.

### Frontend (Chrome Extension + React + Vite)

- `frontend/public/manifest.json` (MV3)

  - Declares permissions like `declarativeNetRequest`, `webRequest`, and `<all_urls>` host access for analysis and optional blocking.
  - Points to `background.js`, `content.js`, and React popup (`index.html`).

- React app (Vite) under `frontend/src/`
  - `pages/PopupView.jsx` – Popup UI with:
    - AI Privacy Snapshot: one‑liner “Collects”, “Shares With”, and “Key Risk”.
    - Tracker category counts (Advertising, Analytics, Social, CDN/Utility, Tag Manager, Unknown).
    - Quick mode toggles: Stealth (block all trackers), Research (pseudonymize/limit), None.
  - `utils/privacyManager.js` – Site‑scoped settings stored via `chrome.storage`, helpers to:
    - Toggle blocking (all or by category) with in‑page guards (wrap fetch/XHR, script creation) for known tracker domains.
    - Enforce cookie/notification preferences when possible.
    - Provide pseudonymization utilities for “Research” mode (strip IDs/headers and add a stable per‑site pseudonym header).

---

## How It Works (End‑to‑End)

1. The extension or a client POSTs `url` (and optional `simplifiedPolicy`) to `POST /api/sites/analyze`.
2. The backend launches a headless browser, visits the URL, observes requests, and flags likely tracker domains.
3. The backend requests an AI privacy summary from Gemini (or generates a fallback) and computes a score/grade/category.
4. Results are persisted in MongoDB (if available) and returned to the client, alongside a user‑friendly summary string.
5. In the extension popup, users see the AI one‑liners and detected tracker categories. Users can toggle site privacy mode:
   - **Stealth**: block known trackers aggressively.
   - **Research**: reduce tracking identifiers (pseudonymize, trim cookies/headers) while allowing site function.
   - **None**: disable protections for that site.
6. Settings persist per‑site and can trigger in‑page instrumentation to block/limit calls to known tracker domains.

---

## API Reference (Core Endpoints)

- `POST /api/sites/analyze`

  - Body: `{ url: string, simplifiedPolicy?: string }`
  - Returns: `{ success, site: { url, trackers, score, grade, category, aiSummary, summary, lastAnalyzed } }`

- `GET /api/sites/network?url=<encodedUrl>`

  - Returns nodes/links describing the site→tracker network plus summaries.

- `GET /api/sites?url=<encodedUrl>` or `GET /api/sites/:url`

  - Returns last stored analysis for a site.

- `GET /health`
  - Simple service health status.

Notes:

- The controller includes a 48h cache window for successful AI runs (30m for failed), reducing external calls and ensuring responsiveness.

---

## Setup & Installation

### Prerequisites

- Node.js 18+
- MongoDB (local or hosted)
- A Google Gemini API key for enhanced summaries (optional, but recommended)

### Backend

1. Create `backend/.env` with at least:
   - `PORT=5000`
   - `MONGO_URI=mongodb://localhost:27017/dataguardian`
   - `GEMINI_API_KEY=your_api_key_here` (optional; without it, fallbacks are used)
2. Install dependencies and start the API:

```bash
cd backend
npm install
npm run start # or: node server.js
```

The server logs a health URL like `http://localhost:5000/health`.

### Frontend (Chrome Extension)

1. Install dependencies and build:

```bash
cd frontend
npm install
npm run build
```

2. Load in Chrome:

   - Open `chrome://extensions` → Enable Developer mode → Load unpacked → select `frontend/dist`.
   - Pin “DataGuardian” and click the icon to open the popup.

3. Development mode (optional):
   - `npm run dev` serves the React app; for the extension popup, prefer building and loading `dist` to match MV3 expectations.

---

## Configuration & Environment

- CORS in the backend allows `http://localhost:5173`, `http://localhost:3000`, and `chrome-extension://*` by default.
- Puppeteer is launched headless with sandbox‑relaxing flags suitable for containerized or CI environments.
- AI caching is in‑memory; if you run multiple instances, consider an external cache.

---

## Security & Privacy Notes

- Tracker blocking and pseudonymization are best‑effort. Websites change frequently and may use new domains or obfuscation techniques.
- “Research” mode aims to reduce linkability by stripping IDs/cookies and adding a stable per‑site pseudonym header for measurement. It is not an anonymity guarantee.
- Headless analysis loads third‑party content; run the backend in a constrained environment. Review Puppeteer flags and network egress policies as needed.
- Respect site terms of service and robots directives. Use reasonable rate limits; the code includes basic waiting and delay strategies.

---

## Troubleshooting

- Backend fails to start: verify `MONGO_URI` and that MongoDB is reachable; without Mongo, the API still returns live analysis results but cannot persist.
- AI summary missing: ensure `GEMINI_API_KEY` is set; otherwise, you’ll see a fallback, cached response.
- No trackers detected: some trackers are event‑driven; try increasing interaction time or toggling `waitForInteractions` in `detectTrackers` options.
- Extension controls not applying: re‑load the active tab after mode changes; MV3 restrictions can limit some APIs on certain pages (e.g., Chrome Web Store).

---

## Project Structure

```
backend/
  config/            # DB and env validation
  controllers/       # Express controllers (analysis, lookup, graph)
  models/            # Mongoose schemas
  routes/            # API routes
  services/          # Gemini AI, in‑memory cache
  utility/           # Puppeteer tracker detection
  server.js          # Express app bootstrap

frontend/
  public/            # MV3 manifest, background/content scripts, assets
  src/               # React app for the extension popup
  dist/              # Build output to load as unpacked extension
```

---

## License

This project is provided as‑is for research and educational purposes. Review and adapt for your compliance and jurisdictional requirements before production use.
