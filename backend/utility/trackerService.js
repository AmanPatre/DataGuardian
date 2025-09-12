import puppeteer from "puppeteer";

// List of known tracker domain keywords to detect
const TRACKER_DOMAINS = [
  "google-analytics.com",
  "googletagmanager.com",
  "doubleclick.net",
  "facebook.net",
  "facebook.com",
  "adservice.google.com",
  "ads-twitter.com",
  "optimizely.com",
  "segment.com",
  "mixpanel.com",
  "hotjar.com",
  "scorecardresearch.com",
  "quantserve.com",
  "adroll.com",
  "outbrain.com",
  "taboola.com",
  "criteo.com",
  "ads.google.com",
  "adnxs.com",
  "amazon-adsystem.com",
  "atdmt.com",
  "brightcove.com",
  "chartbeat.com",
  "clicktale.net",
  "comscore.com",
  "demdex.net",
  "doubleverify.com",
  "eyeota.net",
  "mathtag.com",
  "mediadetect.com",
  "mookie1.com",
  "perf.overture.com",
  "pubmatic.com",
  "radiate.com",
  "reinvigorate.net",
  "rubiconproject.com",
  "scorecardresearch.com",
  "sharethis.com",
  "spotxchange.com",
  "turn.com",
  "twitter.com",
  "trustarc.com",
  "verizon.com",
  "videoplayerhub.com",
  "xaxis.com",
  "yahoo.com",
  "zedo.com",
  "zedoads.com",
  "zedoengineering.com",
  "adform.net"
];

// Custom delay helper function that pauses execution for a specified time (milliseconds)
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Function to detect trackers on a given URL with simulated user interactions
export async function detectTrackers(url) {
  // Launch a new headless browser instance
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Set to hold unique detected tracker hostnames
  const detectedTrackersSet = new Set();

  // Enable request interception to monitor all network requests
  await page.setRequestInterception(true);

  // Event handler triggered on each network request
  page.on("request", (req) => {
    try {
      // Extract hostname from request URL
      const hostname = new URL(req.url()).hostname;

      // Check if any part of the hostname matches known tracker domains
      if (TRACKER_DOMAINS.some(tracker => hostname.includes(tracker))) {
        detectedTrackersSet.add(hostname); // Add tracker hostname to set
      }
    } catch (err) {
      // Ignore invalid URLs or parsing errors
    }

    // Continue processing the request without blocking any resource types
    req.continue();
  });

  try {
    // Navigate to the URL and wait until DOM content is loaded
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    // Simulate scrolling down by one viewport height to trigger lazy-loaded trackers
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await delay(1500); // Wait for 1.5 seconds after scroll to allow requests to fire

    // Simulate hovering over the page body to trigger hover-based trackers or UI effects
    await page.hover("body");
    await delay(1000); // Wait for 1 second after hover

    // Simulate clicking on one interactive element from common selectors 
    // This can trigger consent dialogs or additional scripts loading trackers
    const clickSelectors = ["button", "a", ".btn", ".close", ".cookie-consent-accept"];

    for (const selector of clickSelectors) {
      const elements = await page.$$(selector); // Find all matching elements
      if (elements.length > 0) {
        try {
          await elements[0].click(); // Click the first detected element
          await delay(2000); // Wait 2 seconds for any network activity triggered by click
          break; // Exit after one successful click
        } catch (e) {
          // Ignore errors like hidden or disabled buttons
        }
      }
    }
  } catch (err) {
    if (err.name === "TimeoutError") {
      console.warn("Timeout reached but proceeding anyway");
    } else {
      await browser.close();
      throw err; // Rethrow unexpected errors
    }
  }

  // Close the browser session after detection is complete
  await browser.close();

  // Return the array of unique detected tracker hostnames
  return { detectedTrackers: Array.from(detectedTrackersSet) };
}
