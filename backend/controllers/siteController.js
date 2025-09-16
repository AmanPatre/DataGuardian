// backend/controllers/siteController.js
import Site from "../models/Site.js";
import { detectTrackers } from "../utility/trackerService.js";
import { generateAIPrivacySummary } from "../services/geminiService.js";
import mongoose from "mongoose";

function calculatePrivacyScore({ url, simplifiedPolicy, trackers, aiSummary }) {
  let score = 0;

  // Trackers factor (40 points max)
  if (trackers.length === 0) score += 40;
  else if (trackers.length <= 2) score += 35;
  else if (trackers.length <= 5) score += 25;
  else if (trackers.length <= 10) score += 15;
  else if (trackers.length <= 15) score += 5;
  // 15+ trackers = 0 points

  // URL security (10 points max)
  if (url.startsWith("https://")) score += 10;

  // Policy keywords (30 points max)
  const lowerPolicy = simplifiedPolicy ? simplifiedPolicy.toLowerCase() : "";
  const positiveKeywords = [
    "encrypted",
    "no data sharing",
    "gdpr",
    "privacy focused",
    "user control",
    "opt-out",
    "delete data",
    "minimal collection",
  ];
  const negativeKeywords = [
    "sell data",
    "third party",
    "advertisers",
    "share data",
    "indefinitely",
    "partners",
    "affiliates",
    "marketing",
  ];

  positiveKeywords.forEach((word) => {
    if (lowerPolicy.includes(word)) score += 4;
  });

  negativeKeywords.forEach((word) => {
    if (lowerPolicy.includes(word)) score -= 3;
  });

  // AI Analysis bonus/penalty (20 points max)
  if (aiSummary && aiSummary.success) {
    const risks = aiSummary.summary.keyRisks || [];
    if (risks.length <= 2) score += 15;
    else if (risks.length <= 4) score += 10;
    else score += 5;

    // Penalty for high-risk trackers
    const highRiskCompanies = ["Meta", "Google", "Amazon"];
    const shareWith = aiSummary.summary.whoTheyShareWith || [];
    const highRiskCount = shareWith.filter((company) =>
      highRiskCompanies.some((risk) => company.includes(risk))
    ).length;

    score -= Math.min(highRiskCount * 3, 15);
  }

  // Final adjustments
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
}

function getGradeFromScore(score) {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "A-";
  if (score >= 80) return "B+";
  if (score >= 75) return "B";
  if (score >= 70) return "B-";
  if (score >= 65) return "C+";
  if (score >= 60) return "C";
  if (score >= 55) return "C-";
  if (score >= 50) return "D+";
  if (score >= 45) return "D";
  if (score >= 40) return "D-";
  return "F";
}

function getCategory(score) {
  if (score >= 80) return "Excellent";
  if (score >= 65) return "Good";
  if (score >= 50) return "Moderate";
  if (score >= 35) return "Poor";
  return "Very Poor";
}

// Check if database is connected
function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}

const analyzeSite = async (req, res) => {
  try {
    const { url, simplifiedPolicy } = req.body;

    console.log(`🔍 Starting analysis for: ${url}`);

    // Step 1: Detect trackers
    console.log("📊 Detecting trackers...");
    const trackerResult = await detectTrackers(url);

    if (!trackerResult.success) {
      console.log("❌ Tracker detection failed:", trackerResult.error);
      return res.status(500).json({
        success: false,
        error: "Failed to analyze website trackers",
        details: trackerResult.error,
      });
    }

    const { detectedTrackers } = trackerResult;
    console.log(`Found ${detectedTrackers.length} trackers:`, detectedTrackers);

    // Step 2: Generate AI Privacy Summary
    console.log("🤖 Generating AI privacy summary...");
    const aiSummary = await generateAIPrivacySummary(detectedTrackers, url);
    console.log("AI Summary generated:", aiSummary.success ? "✅" : "❌");

    // Step 3: Calculate privacy score
    const score = calculatePrivacyScore({
      url,
      simplifiedPolicy,
      trackers: detectedTrackers,
      aiSummary,
    });

    const grade = getGradeFromScore(score);
    const category = getCategory(score);

    console.log(`📈 Privacy Score: ${score} (${grade}) - ${category}`);

    // Step 4: Try to save to database (but continue even if it fails)
    let site = null;
    let dbError = null;

    if (isDatabaseConnected()) {
      try {
        site = await Site.findOne({ url });
        if (site) {
          site.simplifiedPolicy = simplifiedPolicy;
          site.trackers = detectedTrackers;
          site.score = score;
          site.grade = grade;
          site.category = category;
          site.aiSummary = aiSummary;
          site.lastAnalyzed = new Date();

          await site.save();
          console.log("📝 Updated existing site record");
        } else {
          site = await Site.create({
            url,
            simplifiedPolicy,
            score,
            grade,
            category,
            trackers: detectedTrackers,
            aiSummary,
            lastAnalyzed: new Date(),
          });
          console.log("📝 Created new site record");
        }
      } catch (dbErr) {
        console.warn("⚠️ Database operation failed:", dbErr.message);
        dbError = dbErr.message;

        // Create a temporary site object for response
        site = {
          url,
          simplifiedPolicy,
          score,
          grade,
          category,
          trackers: detectedTrackers,
          aiSummary,
          lastAnalyzed: new Date(),
        };
      }
    } else {
      console.warn("⚠️ Database not connected - creating temporary response");
      dbError = "Database not connected";

      // Create a temporary site object for response
      site = {
        url,
        simplifiedPolicy,
        score,
        grade,
        category,
        trackers: detectedTrackers,
        aiSummary,
        lastAnalyzed: new Date(),
      };
    }

    // Step 5: Prepare response with formatted data
    const response = {
      success: true,
      message: "Site analyzed successfully",
      ...(dbError && { warning: `Database issue: ${dbError}` }),
      site: {
        url: site.url,
        score: site.score,
        grade: site.grade,
        category: site.category,
        trackers: site.trackers,
        trackerCount: site.trackers.length,
        simplifiedPolicy: site.simplifiedPolicy,
        aiSummary: site.aiSummary,
        lastAnalyzed: site.lastAnalyzed,
        summary: generateUserFriendlySummary(site),
      },
    };

    console.log("✅ Analysis complete, sending response");
    res.status(201).json(response);
  } catch (error) {
    console.error("❌ Analysis failed:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      details: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};

// Generate user-friendly summary based on analysis
function generateUserFriendlySummary(site) {
  const { trackers, score, grade, category, aiSummary } = site;
  const trackerCount = Array.isArray(trackers) ? trackers.length : 0;

  let summary = "";

  if (score >= 80) {
    summary = `This site has excellent privacy practices with minimal tracking (${trackerCount} trackers).`;
  } else if (score >= 65) {
    summary = `This site has good privacy practices but uses some tracking (${trackerCount} trackers).`;
  } else if (score >= 50) {
    summary = `This site has moderate privacy practices with noticeable tracking (${trackerCount} trackers).`;
  } else if (score >= 35) {
    summary = `This site has poor privacy practices with significant tracking (${trackerCount} trackers).`;
  } else {
    summary = `This site has very poor privacy practices with extensive tracking (${trackerCount} trackers).`;
  }

  // Add AI insights if available
  if (aiSummary && aiSummary.success) {
    const companies = aiSummary.summary.whoTheyShareWith || [];
    if (companies.length > 0) {
      summary += ` Your data may be shared with ${companies
        .slice(0, 3)
        .join(", ")}${
        companies.length > 3 ? ` and ${companies.length - 3} others` : ""
      }.`;
    }
  }

  return summary;
}

const getSite = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
      });
    }

    const site = await Site.findOne({ url: req.query.url });
    if (!site) {
      return res.status(404).json({
        success: false,
        message: "Site not found",
      });
    }

    res.json({
      success: true,
      site: {
        ...site.toObject(),
        summary: generateUserFriendlySummary(site),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

const getAllSites = async (req, res) => {
  try {
    if (!isDatabaseConnected()) {
      return res.status(503).json({
        success: false,
        error: "Database not available",
        sites: [],
      });
    }

    const sites = await Site.find().sort({ lastAnalyzed: -1 });
    const sitesWithSummary = sites.map((site) => ({
      ...site.toObject(),
      summary: generateUserFriendlySummary(site),
    }));

    res.json({
      success: true,
      count: sitesWithSummary.length,
      sites: sitesWithSummary,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      sites: [],
    });
    console.log(error);
  }
};

// Controller function to build network graph data for a site
const getNetworkGraph = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Missing url query parameter" });
    }

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        error: "Database not available",
      });
    }

    const site = await Site.findOne({ url });
    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }

    // Start with the site node
    const nodes = [
      {
        id: site.url,
        type: "site",
        label: new URL(site.url).hostname,
        score: site.score,
        category: site.category,
      },
    ];
    // Helper: get root domain (simple eTLD+1 heuristic)
    function getRootDomain(hostname) {
      const parts = String(hostname || "")
        .toLowerCase()
        .split(".")
        .filter(Boolean);
      if (parts.length <= 2) return parts.join(".");
      return parts.slice(-2).join(".");
    }

    const siteRoot = getRootDomain(new URL(site.url).hostname);

    // Helper: classify tracker domain when AI details are not available
    function classifyTrackerDomain(domain) {
      const lower = String(domain || "").toLowerCase();

      // First-party subdomains → mark as first-party analytics/utility
      if (lower.endsWith(siteRoot)) {
        return {
          name: domain,
          category: "First-Party/Analytics",
          company: "First-Party",
        };
      }

      const checks = [
        {
          test: /doubleclick|googlesyndication|googleadservices|ads\.google|adservice\.google/,
          name: "Google Ads",
          category: "Advertising",
          company: "Google",
        },
        {
          test: /googletagmanager|gtm/,
          name: "Google Tag Manager",
          category: "Tag Manager",
          company: "Google",
        },
        {
          test: /google-analytics|analytics\.google/,
          name: "Google Analytics",
          category: "Analytics",
          company: "Google",
        },
        {
          test: /gstatic|googleapis/,
          name: "Google Static/Services",
          category: "CDN/Utility",
          company: "Google",
        },
        {
          test: /\.google\./,
          name: "Google Services",
          category: "CDN/Utility",
          company: "Google",
        },

        {
          test: /facebook|fbcdn|fbevents|connect\.facebook\.net/,
          name: "Meta Pixel",
          category: "Advertising",
          company: "Meta",
        },
        {
          test: /instagram\.com/,
          name: "Instagram",
          category: "Social",
          company: "Meta",
        },

        {
          test: /linkedin|licdn|bat\.bing\.com|bingads/,
          name: "Microsoft Ads/LinkedIn",
          category: "Advertising",
          company: "Microsoft",
        },

        {
          test: /twitter|tiktok|snapchat|pinterest/,
          name: "Social Network",
          category: "Social",
          company: "Various",
        },

        {
          test: /adnxs|appnexus|rubiconproject|pubmatic|criteo|taboola|outbrain|openx|adroll/,
          name: "Ad Network",
          category: "Advertising",
          company: "Various",
        },

        {
          test: /mixpanel|segment|amplitude|hotjar|fullstory|logrocket|optimizely|mouseflow|chartbeat|clicktale|mathtag|doubleverify/,
          name: "Analytics/Optimization",
          category: "Analytics",
          company: "Various",
        },

        {
          test: /scorecardresearch|quantserve|comscore|demdex|adsrvr|eyeota|bluekai/,
          name: "Data Broker",
          category: "Advertising",
          company: "Various",
        },

        // Additional common trackers
        {
          test: /amazon-adsystem\.com/,
          name: "Amazon Advertising",
          category: "Advertising",
          company: "Amazon",
        },
        {
          test: /bouncex\.net|wunderkind\.co/,
          name: "Wunderkind (BounceX)",
          category: "Advertising",
          company: "Wunderkind",
        },
        {
          test: /onetag\.com|s-onetag\.com/,
          name: "OneTag",
          category: "Advertising",
          company: "OneTag",
        },
        {
          test: /turner\.com/,
          name: "Turner CDN",
          category: "CDN/Utility",
          company: "Warner Bros. Discovery (Turner)",
        },
        {
          test: /collector\.github\.com/,
          name: "GitHub Telemetry",
          category: "Analytics",
          company: "GitHub",
        },
        {
          test: /cloudflareinsights\.com/,
          name: "Cloudflare Web Analytics",
          category: "Analytics",
          company: "Cloudflare",
        },
        {
          test: /dubcdn\.com/,
          name: "Dub CDN",
          category: "CDN/Utility",
          company: "Dub",
        },
      ];

      for (const rule of checks) {
        if (rule.test.test(lower)) {
          return {
            name: rule.name,
            category: rule.category,
            company: rule.company,
          };
        }
      }

      if (
        /analytics|track|collect|pixel|beacon|telemetry|metrics/i.test(lower)
      ) {
        return { name: "Tracker", category: "Analytics", company: "Unknown" };
      }

      return { name: domain, category: "Unknown", company: "Unknown" };
    }

    // Create tracker nodes and links from site to each tracker
    const links = [];
    for (const tracker of site.trackers) {
      // Get tracker info if available in AI summary
      let trackerInfo = { name: tracker, category: "Unknown" };
      if (site.aiSummary && site.aiSummary.trackerDetails) {
        const detail = site.aiSummary.trackerDetails.find(
          (t) => t.domain === tracker
        );
        if (detail) {
          trackerInfo = {
            name: detail.name,
            category: detail.category,
            company: detail.company,
          };
        }
      }

      // Fallback classification when unknown
      if (
        !trackerInfo ||
        trackerInfo.category === "Unknown" ||
        !trackerInfo.company
      ) {
        const fallback = classifyTrackerDomain(tracker);
        trackerInfo = {
          name:
            trackerInfo.name && trackerInfo.name !== tracker
              ? trackerInfo.name
              : fallback.name,
          category:
            trackerInfo.category === "Unknown"
              ? fallback.category
              : trackerInfo.category,
          company: trackerInfo.company || fallback.company,
        };
      }

      nodes.push({
        id: tracker,
        type: "tracker",
        label: trackerInfo.name,
        category: trackerInfo.category,
        company: trackerInfo.company || "Unknown",
      });

      links.push({
        source: site.url,
        target: tracker,
        type: trackerInfo.category,
      });
    }

    // Respond with the nodes and links
    return res.json({
      success: true,
      nodes,
      links,
      aiSummary: site.aiSummary,
      userSummary: generateUserFriendlySummary(site),
      summary: site.aiSummary, // legacy
    });
  } catch (error) {
    console.error("Error in getNetworkGraph:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// New endpoint to get detailed AI summary
const getAIPrivacySummary = async (req, res) => {
  try {
    const url = req.query.url;
    if (!url) {
      return res.status(400).json({ error: "Missing url query parameter" });
    }

    if (!isDatabaseConnected()) {
      return res.status(503).json({
        error: "Database not available",
      });
    }

    const site = await Site.findOne({ url });
    if (!site) {
      return res.status(404).json({ error: "Site not found" });
    }

    if (!site.aiSummary) {
      return res
        .status(404)
        .json({ error: "AI summary not available for this site" });
    }

    res.json({
      success: true,
      url: site.url,
      aiSummary: site.aiSummary,
      lastAnalyzed: site.lastAnalyzed,
      trackerCount: site.trackers.length,
    });
  } catch (error) {
    console.error("Error in getAIPrivacySummary:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export {
  analyzeSite,
  getSite,
  getAllSites,
  getNetworkGraph,
  getAIPrivacySummary,
};
