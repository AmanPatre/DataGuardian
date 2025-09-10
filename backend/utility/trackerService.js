import axios from "axios";
import * as cheerio from "cheerio";

// Known trackers/domains (you can expand this)
const TRACKER_DOMAINS = [
  // Analytics
  "google-analytics.com",
  "googletagmanager.com",
  "mixpanel.com",
  "segment.com",
  "amplitude.com",
  "hotjar.com",
  "matomo.org",
  "heap.io",

  // Ads / Marketing
  "doubleclick.net",
  "adservice.google.com",
  "ads-twitter.com",
  "facebook.net",
  "facebook.com",
  "fbcdn.net",
  "criteo.net",
  "taboola.com",
  "outbrain.com",
  "adroll.com",
  "pubmatic.com",
  "smartadserver.com",
  "revcontent.com",
  "mgid.com",

  // Social / Widgets
  "twitter.com",
  "linkedin.com",
  "pinterest.com",
  "instagram.com",
  "youtube.com",
  "tiktok.com",
  "snapchat.com",

  // Experiment / Optimization / Testing
  "cdn.optimizely.com",
  "optimizely.com",
  "vwo.com",
  "crazyegg.com",

  // Fonts / CDNs that may track
  "fonts.googleapis.com",
  "cdnjs.cloudflare.com",
  "jsdelivr.net",
  "maxcdn.bootstrapcdn.com",

  // Misc / Retargeting
  "yandex.ru",
  "bing.com",
  "adform.net",
  "adition.com",
  "smartadserver.com",
  "quantserve.com",
  "scorecardresearch.com",
  "analytics.yahoo.com"
];

export async function detectTrackers(url) {
  try {
    // Fetch website HTML
    const { data: html } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(html);

    let trackers = [];

    // 1. Scripts
    $("script[src]").each((_, el) => {
      const src = $(el).attr("src");
      trackers.push(src);
    });

    // 2. Images
    $("img[src]").each((_, el) => {
      const src = $(el).attr("src");
      trackers.push(src);
    });

    // 3. Iframes
    $("iframe[src]").each((_, el) => {
      const src = $(el).attr("src");
      trackers.push(src);
    });

    // 4. Stylesheets/fonts
    $("link[href]").each((_, el) => {
      const href = $(el).attr("href");
      trackers.push(href);
    });

    // Clean + filter
    trackers = trackers
      .filter(Boolean)
      .map((src) => src.trim())
      .map((src) => {
        try {
          return new URL(src, url).hostname; // normalize to hostname
        } catch {
          return src;
        }
      });

    // Check against known tracker list
    const detected = trackers.filter((host) =>
      TRACKER_DOMAINS.some((tracker) => host.includes(tracker))
    );

    return {
      allResources: [...new Set(trackers)],
      detectedTrackers: [...new Set(detected)],
    };
  } catch (err) {
    console.error("Tracker detection failed:", err.message);
    return { allResources: [], detectedTrackers: [] };
  }
}
