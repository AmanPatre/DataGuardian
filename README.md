## DataGuardian Chrome Extension (Frontend)

This is the Chrome extension UI for DataGuardian. It shows an easy privacy snapshot for the current site, counts tracker categories, and lets you switch privacy modes: Stealth, Research, or None. You can also block trackers by category for the current site.

The backend API (in `../backend/`) does the heavy lifting (headless visit + tracker detection + AI summary). This extension displays the results and applies your per‑site privacy choices.

---

## What You Get

- Simple popup that shows:
  - AI privacy one‑liners: what is collected, who it’s shared with, and a key risk
  - Tracker counts by category (Advertising, Analytics, Social, CDN/Utility, Tag Manager, Unknown)
  - A grade that reflects the site’s privacy score
- One‑click privacy modes:
  - Stealth: block known trackers aggressively
  - Research: reduce tracking identifiers while keeping sites usable
  - None: turn protections off for the current site
- Per‑site settings are remembered using `chrome.storage`

---

## Quick Start

1. Build the extension

```bash
cd frontend
npm install
npm run build
```

2. Load in Chrome

- Open `chrome://extensions`
- Turn on Developer Mode
- Click “Load unpacked” and select `frontend/dist`
- Pin “DataGuardian” and click the icon to open the popup

3. (Optional) Run the backend API

The popup can show richer data when the API is running. See the project root `README.md` for backend setup. Typical steps:

```bash
cd ../backend
npm install
npm run start
```

---

## Using the Popup

- Open any website, then click the DataGuardian icon.
- Read the AI Privacy Snapshot (3 short lines): Collects, Shares With, Key Risk.
- Review tracker category counts (e.g., Advertising: 6, Analytics: 3).
- Choose a mode:
  - Stealth: blocks known trackers; may break some site features.
  - Research: limits identifiers (pseudonymize/trim cookies/headers) to reduce tracking while keeping sites usable.
  - None: disables protections for this site.
- You can also toggle per‑category blocking (Ad, Analytics, Social) when available.

Changes are saved per site and take effect immediately (reloading the tab may be needed on some pages).

---

## Screenshots (placeholders)

Add your own images in each section.

### Extension Icon and Popup Entry

<!-- Add image: toolbar with pinned extension icon -->

### Popup – Privacy Snapshot

<!-- Add image: top section showing Collects / Shares With / Key Risk -->

### Popup – Tracker Categories

<!-- Add image: list of categories with counts and icons -->

### Popup – Mode Toggles

<!-- Add image: Stealth / Research / None buttons and description -->

### Full Report Navigation

<!-- Add image: button “View Full Report & Controls” -->

---

## Permissions (Why They’re Needed)

- `tabs`, `activeTab`: to read the current tab’s URL and update UI/actions per site
- `storage`: to remember your site‑specific settings
- `scripting`: to inject lightweight blocking/instrumentation (e.g., wrap fetch/XHR, script src guards)
- `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`: for rule‑based network filtering (where used)
- `webRequest`, `webRequestBlocking`: for additional request‑level controls on some pages
- `contentSettings`, `notifications`, `webNavigation`, `cookies`: to apply your choices for cookies/notifications and respond to navigation changes
- `host_permissions: <all_urls>`: to work on any site you visit

Note: Some Chrome pages (e.g., Chrome Web Store) restrict extension behavior by design.

---

## How It Works (Frontend)

- The popup UI is built with React + Vite.
- `src/pages/PopupView.jsx` renders:
  - AI one‑liners from the backend summary (if available)
  - Tracker category counts (derived from analysis)
  - Mode buttons and per‑category toggles
- `src/utils/privacyManager.js` handles:
  - Persisting settings by site (`chrome.storage.local`)
  - Applying settings (e.g., script guards; wrapping `fetch`/XHR) when enabled
  - “Research” mode helpers (strip IDs/cookies, add a stable per‑site pseudonym header)

---

## Backend Integration (API)

The extension expects the backend API to provide analysis results. Core endpoints:

- `POST /api/sites/analyze`

  - Body: `{ url: string, simplifiedPolicy?: string }`
  - Returns: `{ success, site: { url, trackers, score, grade, category, aiSummary } }`

- `GET /api/sites/network?url=<encodedUrl>`
  - Returns nodes/links describing the site→tracker network

If the backend is not running, the UI still works but shows limited information (no fresh AI summary).

---

## How It Works (End‑to‑End, Simple)

1. You open a website and click the DataGuardian icon.
2. The extension (or a client) sends the page URL to the backend: `POST /api/sites/analyze`.
3. The backend uses a headless browser to visit the page, watches network requests, and flags tracker domains.
4. The backend asks Google Gemini for an easy privacy summary (or uses a safe fallback when AI is unavailable).
5. The backend computes a score and grade, saves the result (if MongoDB is connected), and returns everything.
6. The popup shows the AI one‑liners, tracker counts by category, and your privacy mode options.

Notes:

- Successful AI results are cached for 48 hours; failed AI attempts are cached for 30 minutes to avoid retry storms.
- MongoDB is optional: if not connected, you still get live results, but they won’t be stored.

---

## Backend: Quick Overview

- Tech: Node.js, Express, Puppeteer, Mongoose, Google Generative AI (Gemini)
- Env vars (in `backend/.env`):
  - `PORT=5000`
  - `MONGO_URI=mongodb://localhost:27017/dataguardian` (optional but recommended)
  - `GEMINI_API_KEY=...` (optional; without it, the backend returns a sensible fallback summary)
- Security & performance:
  - Helmet security headers, request logging
  - Rate limit on `/api/` (100 req / 15 min / IP)
  - JSON body limit 10 MB
  - In‑memory AI response cache (24h)

### Main Endpoints (with examples)

- Analyze a site

```bash
curl -X POST http://localhost:5000/api/sites/analyze \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

Response (shape):

```json
{
  "success": true,
  "site": {
    "url": "https://example.com",
    "score": 72,
    "grade": "B-",
    "category": "Good",
    "trackers": ["doubleclick.net", "googletagmanager.com"],
    "trackerCount": 2,
    "simplifiedPolicy": null,
    "aiSummary": {
      "success": true,
      "summary": {
        "whatTheyCollect": ["Browsing behavior", "Device info"],
        "whoTheyShareWith": ["Google"],
        "howLongTheyKeep": "Varies by service",
        "keyRisks": ["Behavioral profiling for advertising"],
        "trackerBreakdown": ["doubleclick.net: Google's advertising network"]
      },
      "trackerCount": 2,
      "trackerDetails": [
        {
          "domain": "doubleclick.net",
          "name": "Google Ads",
          "category": "Advertising",
          "company": "Google"
        }
      ]
    },
    "lastAnalyzed": "2025-01-01T00:00:00.000Z",
    "summary": "This site has good privacy practices but uses some tracking (2 trackers). Your data may be shared with Google."
  }
}
```

- Network graph for a site

```bash
curl "http://localhost:5000/api/sites/network?url=https%3A%2F%2Fexample.com"
```

Response (shape):

```json
{
  "success": true,
  "nodes": [
    {
      "id": "https://example.com",
      "type": "site",
      "label": "example.com",
      "score": 72,
      "category": "Good"
    },
    {
      "id": "doubleclick.net",
      "type": "tracker",
      "label": "Google Ads",
      "category": "Advertising",
      "company": "Google"
    }
  ],
  "links": [
    {
      "source": "https://example.com",
      "target": "doubleclick.net",
      "type": "Advertising"
    }
  ],
  "aiSummary": {},
  "userSummary": "..."
}
```

---

## Scoring & Grades (Simple Rules)

- Trackers matter most (up to 40 points): fewer trackers → higher score.
- HTTPS adds up to 10 points.
- Policy hints (keywords) add or subtract up to 30 points.
- AI risk signals adjust up to ±20 points (e.g., fewer risks → bonus; high‑risk partners → penalties).
- Final score is 0–100, then mapped to grade (A+ → F) and category (Excellent → Very Poor).

Categories used for trackers include: Advertising, Analytics, Social, Tag Manager, CDN/Utility, and Unknown.

---

## Headless Analysis Notes (Puppeteer)

- Launches Chromium headless with safe defaults for CI/containers.
- Observes all requests and flags trackers by known lists and common URL patterns (e.g., `/analytics`, `pixel`, `telemetry`).
- Simulates small interactions (scroll, attempt cookie‑consent) to reveal lazy‑loaded trackers.

Tip: For deeper coverage, extend domain lists or increase waiting/interaction time in `backend/utility/trackerService.js`.

## Development

Dev server for React (optional – for UI iteration):

```bash
npm run dev
```

For the actual extension popup, build and load `dist` in Chrome (MV3).

---

## Troubleshooting

- No data/blank UI: ensure the popup is opened on a normal website (not system pages).
- Mode changes don’t apply: try reloading the active tab.
- AI summary missing: the backend may be down or lacks `GEMINI_API_KEY`.
- Tracker counts look low: trackers can be event‑driven; interact with the page (scroll, click) and re‑analyze on the backend.

---

## Folder Pointers

- `public/manifest.json` – Chrome MV3 permissions and entry points
- `public/background.js` – background service worker
- `public/content.js` – content script injected into pages
- `src/pages/PopupView.jsx` – main popup UI
- `src/utils/privacyManager.js` – per‑site settings and blocking helpers

---

## License

For research and educational use. Review for your compliance requirements before production.
