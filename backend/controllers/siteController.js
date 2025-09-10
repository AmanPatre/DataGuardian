import Site from "../models/Site.js";
import { detectTrackers } from "../utility/trackerService.js";

function calculatePrivacyScore({ url, simplifiedPolicy, trackers }) {
  let score = 0;

  // Trackers factor
  if (trackers.length <= 2) score += 40;
  else if (trackers.length <= 5) score += 20;

  // URL security
  if (url.startsWith("https://")) score += 10;

  // Policy keywords
  const lowerPolicy = simplifiedPolicy ? simplifiedPolicy.toLowerCase() : "";
  const positiveKeywords = [
    "encrypted",
    "no data sharing",
    "gdpr",
    "privacy focused",
  ];
  const negativeKeywords = [
    "sell data",
    "third party",
    "advertisers",
    "share data",
  ];

  positiveKeywords.forEach((word) => {
    if (lowerPolicy.includes(word)) score += 10;
  });

  negativeKeywords.forEach((word) => {
    if (lowerPolicy.includes(word)) score -= 10;
  });

  // Final adjustments
  if (score < 0) score = 0;
  if (score > 100) score = 100;

  return score;
}

function getCategory(score) {
  if (score >= 80) return "Good";
  if (score >= 50) return "Moderate";
  return "Poor";
}

const analyzeSite = async (req, res) => {
  try {
    const { url, simplifiedPolicy } = req.body;
    const { detectedTrackers } = await detectTrackers(url);

    const score = calculatePrivacyScore({
      url,
      simplifiedPolicy,
      trackers: detectedTrackers,
    });
    const category = getCategory(score);

    // Save or update site record
    let site = await Site.findOne({ url });
    if (site) {
      site.simplifiedPolicy = simplifiedPolicy;
      site.trackers = detectedTrackers;
      site.score = score;
      site.category = category;

      await site.save();
    } else {
      site = await Site.create({
        url,
        simplifiedPolicy,
        score: score,
        category: category,
        trackers: detectedTrackers,
      });
    }

    res
      .status(201)
      .json({ success: true, message: "Site analyzed successfully", site });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    console.log(error);
  }
};

const getSite = async (req, res) => {
  try {
    const site = await Site.findOne({ url: req.query.url });
    if (!site) {
      return res.status(404).json({ message: "Site not found" });
    }
    res.json(site);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllSites = async (req, res) => {
  try {
    const sites = await Site.find().sort({ createdAt: -1 });
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
};

export { analyzeSite, getSite, getAllSites };
