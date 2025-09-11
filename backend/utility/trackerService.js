import puppeteer from "puppeteer";

// List of known tracker domain keywords to detect
const TRACKER_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "facebook.net",
  "doubleclick.net",
  "adservice.google.com",
  "ads-twitter.com",
  "optimizely.com",
  "segment.com",
  "mixpanel.com",
  "hotjar.com",
  // add more known tracker domains as needed
];

export async function detectTrackers(url) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const detectedTrackersSet = new Set();

  // Intercept and selectively block requests to speed up loading
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    const resourceType = req.resourceType();
    if (["image", "stylesheet", "font"].includes(resourceType)) {
      req.abort();
    } else {
      try {
        const hostname = new URL(req.url()).hostname;
        if (TRACKER_DOMAINS.some((tracker) => hostname.includes(tracker))) {
          detectedTrackersSet.add(hostname);
        }
      } catch (err) {
        // Ignore invalid URLs
      }
      req.continue();
    }
  });
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (err) {
    if (err.name === "TimeoutError") {
      console.warn("Timeout reached but proceeding anyway");
    } else {
      await browser.close();
      throw err;
    }
  }
  await browser.close();
  
  return { detectedTrackers: Array.from(detectedTrackersSet) };
}
