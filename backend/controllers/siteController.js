import Site from "../models/Site.js";

const analyzeSite = async (req, res) => {
  try {
    const { url, simplifiedPolicy, score, trackers } = req.body;

    // Save or update site record
    let site = await Site.findOne({ url });
    if (site) {
      site.simplifiedPolicy = simplifiedPolicy;
      site.score = score;
      site.trackers = trackers;
      await site.save();
    } else {
      site = await Site.create({ url, simplifiedPolicy, score, trackers });
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
    const site = await Site.findOne({  url: req.query.url });
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
    console.log(error)
  }
};

export { analyzeSite, getSite, getAllSites };
