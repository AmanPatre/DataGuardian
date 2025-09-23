## Stealth & Research-Friendly Modes — Implementation Plan (2–3 days)

Goal: Add a single toggle in the popup to switch between two privacy modes that satisfy “enable fair data usage” and “privacy-preserving alternatives.”

- Stealth: Block all non-essential data and strip identifiers from any essential requests.
- Research-friendly: Allow requests but anonymize them (no link to a person), preserving utility for developers/researchers.

### 1) UI — Popup Mode Switch (frontend/src/pages/PopupView.jsx)

- Add a segmented control or switch: `Mode: Stealth | Research-friendly`.
- Persist selected mode in `chrome.storage.local` under `privacyMode`.
- Show a short description below the switch for clarity.
- Optional: Badge color change (e.g., red for Stealth, blue for Research-friendly).

Data shape in storage:

```json
{
  "privacyMode": "stealth" | "research",
  "lastModeChangeAt": 1737660000000
}
```

### 2) Policy Helpers — Privacy Manager (frontend/src/utils/privacyManager.js)

Add small, pure helpers (no side effects) used by background listeners:

- `isEssentialRequest({ url, initiator, method })` — allow same-origin and security-critical endpoints.
- `classifyTracker({ url, requestHeaders })` — returns `"tracker" | "unknown" | "first-party"` using rules from `privacy_rules.json`.
- `redactPIIInUrl(url)` — remove/normalize query keys: `email, e-mail, uid, user_id, device_id, ga, gclid, fbclid, ip, lat, lon`.
- `stripSensitiveHeaders(headers)` — remove `Cookie, Authorization, ETag, If-None-Match, X-Client-Id`.
- `getStablePseudonymForSite(origin)` — cached UUIDv4 per-site; stored in `chrome.storage.local` map.
- `pseudonymizeRequest({ url, headers, body, origin })` — apply redaction + header stripping + replace obvious IDs with the site pseudonym.
- Optional: `applyDifferentialPrivacyToCounters(obj, epsilon)` for noisy metrics export.

### 3) Enforcement — Background Listeners (frontend/public/background.js)

Use `chrome.webRequest` listeners. Minimal invasive path:

- On `onBeforeRequest`:
  - Read `privacyMode` from storage (cache in-memory; refresh on changes via `chrome.storage.onChanged`).
  - If `privacyMode === 'stealth'`:
    - Block if request is third-party or classified as tracker (return `{ cancel: true }`).
    - If essential, allow but sanitize URL via `redactPIIInUrl`.
  - If `privacyMode === 'research'`:
    - Allow, but mark for anonymization (set a flag in `requestId -> true` map).
- On `onBeforeSendHeaders`:
  - For Stealth: remove sensitive headers for any allowed essential request.
  - For Research: remove sensitive headers; add `X-Research-Pseudonym: <per-site-uuid>`.
- On `onHeadersReceived` (optional): normalize `Set-Cookie` to strip long-lived identifiers in Research mode.

Notes:

- Requires `webRequest`, `webRequestBlocking`, `declarativeNetRequest` (if used) permissions in `manifest.json`.
- Keep a small in-memory LRU cache for `privacyMode` and per-site pseudonyms to avoid async lag.

### 4) Rules — privacy_rules.json (frontend/public/privacy_rules.json)

- Add a `trackers` list (domains/patterns) and `purpose` tags if desired.
- Example additions:

```json
{
  "trackers": ["google-analytics.com", "facebook.net", "doubleclick.net"],
  "sensitiveQueryKeys": [
    "email",
    "uid",
    "user_id",
    "device_id",
    "fbclid",
    "gclid",
    "_ga",
    "ip",
    "lat",
    "lon"
  ]
}
```

### 5) Storage Schema (frontend/src/utils/cacheManager.js)

- Add helpers:
  - `getPrivacyMode()` / `setPrivacyMode(mode)`.
  - `getOrCreateSitePseudonym(origin)` -> UUIDv4, persisted under `sitePseudonyms[origin]`.
- Auto-prune pseudonyms older than N days if needed.

### 6) Minimal Telemetry Export (Optional, fast)

- Provide a button in the popup to export an anonymized session summary JSON (counts only):
  - Total requests by domain (no raw URLs), blocked vs allowed.
  - In Research mode, include pseudonym only, no user identifiers.
  - Optionally apply DP noise to counts.

### 7) QA / Test Plan (QUICK)

- Stealth:
  - Third-party to `google-analytics.com` blocked.
  - Same-origin fetch allowed; `Cookie`/`Authorization` removed.
  - URL with `?email=...&uid=...` has keys removed or normalized in outgoing request.
- Research-friendly:
  - Third-party allowed; `Cookie`/`Authorization` removed.
  - `X-Research-Pseudonym` header present and stable per-site.
  - PII query keys stripped; referrer reduced to origin.

### 8) Estimated Effort & Prompt Breakdown

- Prompt 1: Add popup UI and storage wiring (PopupView.jsx + cacheManager.js).
- Prompt 2: Add privacy helpers (privacyManager.js) with redaction/pseudonymization.
- Prompt 3: Add background listeners for block/strip/anonymize (background.js) + manifest permissions.
- Prompt 4 (optional): Export anonymized summary + tiny DP helper.

### 9) Deliverables Checklist

- [ ] Toggle in `PopupView.jsx` with persistent `privacyMode`.
- [ ] Helpers in `privacyManager.js` for classification/redaction/pseudonymization.
- [ ] WebRequest listeners in `public/background.js` enforcing Stealth/Research.
- [ ] Updated `manifest.json` permissions if needed.
- [ ] `privacy_rules.json` extended with trackers and sensitive query keys.
- [ ] (Optional) Anonymized export button in popup.

This plan is intentionally modular: Step 1 + 3 alone deliver Stealth; Step 2 + 3 deliver Research-friendly. We can ship incrementally in the 2–3 day window.
