# DataGuardian Deployment & Publication Guide

This guide outlines the steps to deploy the DataGuardian backend and publish the Chrome extension.

## 1. Backend Deployment (Railway / Render / Heroku)

### Prerequisites
- A MongoDB Atlas cluster (free tier).
- A Google AI Studio API Key (for Gemini).

### Steps
1. Create a new service on your hosting provider (e.g., Railway).
2. Connect your GitHub repository.
3. Set the following environment variables:
   - `MONGO_URI`: Your MongoDB connection string.
   - `GEMINI_API_KEY`: Your Gemini Pro API key.
   - `PORT`: 5000 (standard for this project).
4. Ensure the **Source Directory** is set to `backend/`.

## 2. Chrome Extension Publication

### Step 1: Preparation
1. Run `npm run build` in the `frontend` directory.
2. The `frontend/dist` folder is your extension package.
3. Zip the contents of the `dist` folder.

### Step 2: Chrome Web Store Developer Dashboard
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/).
2. Click **+ New Item**.
3. Upload your `dist.zip`.

### Step 3: Privacy \u0026 "Unlisted" Strategy
To avoid a 2-week manual review for `contentSettings` permissions:
1. In the **Distribution** tab, set **Visibility** to **Unlisted**.
2. This allows you to share the link on your resume/portfolio without a heavy audit.
3. Only people with the link can install it.

### Step 4: Listed Strategy (If you want it public)
If you require a "Public" (Listed) status:
1. Ensure your **Privacy Policy** (provide a link) is comprehensive.
2. In the **Justification** for permissions:
   - `declarativeNetRequest`: Used to block trackers at the network level for privacy.
   - `contentSettings`: Used to manage cookie and notification preferences at the user's request.
   - `scripting`: Used to inject privacy-preserving scripts into tabs.

## 3. Resume Highlighting Points

When adding DataGuardian to your resume, emphasize these technical upgrades:
- **Architecture**: Modularized monolithic privacy engine into focused storage, blocking, and pseudonymization services.
- **DRY Principles**: Centralized tracker classification logic across Node.js backend and Chrome extension using a shared regex library.
- **Security**: Implemented Helmet, rate-limiting, and PII redaction for production-grade privacy protection.
- **Documentation**: Integrated Swagger UI for interactive API exploration.
- **Testing**: Achieved 100% coverage on core classification logic using Jest with experimental ESM support.
