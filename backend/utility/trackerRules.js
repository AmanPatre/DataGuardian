/**
 * Shared tracker classification rules for DataGuardian2
 */

export const TRACKER_CATEGORIES = {
    ADVERTISING: "Advertising",
    ANALYTICS: "Analytics",
    SOCIAL: "Social",
    TAG_MANAGER: "Tag Manager",
    CDN_UTILITY: "CDN/Utility",
    UNKNOWN: "Unknown"
};

export const TRACKER_RULES = [
    {
        re: /doubleclick|googlesyndication|googleadservices|ads\.google|adservice\.google/,
        name: "Google Ads",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Google",
    },
    {
        re: /googletagmanager|gtm/,
        name: "Google Tag Manager",
        category: TRACKER_CATEGORIES.TAG_MANAGER,
        company: "Google",
    },
    {
        re: /google-analytics|analytics\.google/,
        name: "Google Analytics",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Google",
    },
    {
        re: /gstatic|googleapis/,
        name: "Google Static/Services",
        category: TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Google",
    },
    {
        re: /\.google\./,
        name: "Google Services",
        category: TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Google",
    },
    {
        re: /facebook|fbcdn|fbevents|connect\.facebook\.net/,
        name: "Meta Pixel",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Meta",
    },
    {
        re: /instagram\.com/,
        name: "Instagram",
        category: TRACKER_CATEGORIES.SOCIAL,
        company: "Meta",
    },
    {
        re: /linkedin|licdn|bat\.bing\.com|bingads/,
        name: "Microsoft Ads/LinkedIn",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Microsoft",
    },
    {
        re: /twitter|tiktok|snapchat|pinterest/,
        name: "Social Network",
        category: TRACKER_CATEGORIES.SOCIAL,
        company: "Various",
    },
    {
        re: /adnxs|appnexus/,
        name: "AppNexus (Adnxs)",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Microsoft (Xandr)",
    },
    {
        re: /rubiconproject/,
        name: "Rubicon Project (Magnite)",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Magnite",
    },
    {
        re: /pubmatic/,
        name: "PubMatic",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "PubMatic",
    },
    {
        re: /criteo/,
        name: "Criteo",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Criteo",
    },
    {
        re: /taboola/,
        name: "Taboola",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Taboola",
    },
    {
        re: /outbrain/,
        name: "Outbrain",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Outbrain",
    },
    { re: /openx/, name: "OpenX", category: TRACKER_CATEGORIES.ADVERTISING, company: "OpenX" },
    {
        re: /adroll/,
        name: "AdRoll",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "NextRoll",
    },
    {
        re: /cxense\.com/,
        name: "Cxense",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Cxense",
    },
    {
        re: /mixpanel/,
        name: "Mixpanel",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Mixpanel",
    },
    {
        re: /segment\.com/,
        name: "Segment",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Twilio Segment",
    },
    {
        re: /amplitude/,
        name: "Amplitude",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Amplitude",
    },
    { re: /hotjar/, name: "Hotjar", category: TRACKER_CATEGORIES.ANALYTICS, company: "Hotjar" },
    {
        re: /fullstory/,
        name: "FullStory",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "FullStory",
    },
    {
        re: /logrocket/,
        name: "LogRocket",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "LogRocket",
    },
    {
        re: /optimizely/,
        name: "Optimizely",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Optimizely",
    },
    {
        re: /mouseflow/,
        name: "Mouseflow",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Mouseflow",
    },
    {
        re: /chartbeat/,
        name: "Chartbeat",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Chartbeat",
    },
    {
        re: /clicktale/,
        name: "Clicktale",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Clicktale",
    },
    {
        re: /mathtag/,
        name: "MediaMath (mathtag)",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "MediaMath",
    },
    {
        re: /doubleverify/,
        name: "DoubleVerify",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "DoubleVerify",
    },
    {
        re: /scorecardresearch\.com/,
        name: "ScorecardResearch",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Comscore",
    },
    {
        re: /comscore\.com/,
        name: "Comscore",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Comscore",
    },
    {
        re: /quantserve\.com/,
        name: "Quantserve",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Quantcast",
    },
    {
        re: /demdex\.net/,
        name: "Adobe Experience Cloud (Demdex)",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Adobe",
    },
    {
        re: /adsrvr\.org/,
        name: "The Trade Desk",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "The Trade Desk",
    },
    {
        re: /eyeota\.net/,
        name: "Eyeota",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Eyeota",
    },
    {
        re: /bluekai\.com/,
        name: "Oracle BlueKai",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Oracle",
    },
    {
        re: /amazon-adsystem\.com/,
        name: "Amazon Advertising",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Amazon",
    },
    {
        re: /bouncex\.net|wunderkind\.co/,
        name: "Wunderkind (BounceX)",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Wunderkind",
    },
    {
        re: /onetag\.com|s-onetag\.com/,
        name: "OneTag",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "OneTag",
    },
    {
        re: /permutive/,
        name: "Permutive",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Permutive",
    },
    {
        re: /turner\.com|warnermediacdn\.com/,
        name: "Turner/Warner CDN",
        category: TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Warner Bros. Discovery",
    },
    {
        re: /collector\.github\.com/,
        name: "GitHub Telemetry",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "GitHub",
    },
    {
        re: /cloudflareinsights\.com/,
        name: "Cloudflare Web Analytics",
        category: TRACKER_CATEGORIES.ANALYTICS,
        company: "Cloudflare",
    },
    {
        re: /dubcdn\.com/,
        name: "Dub CDN",
        category: TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Dub",
    },
    {
        re: /temu\.com/,
        name: "Temu",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Temu",
    },
    {
        re: /yahoo\.com/,
        name: "Yahoo",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Yahoo",
    },
    {
        re: /adform\.net/,
        name: "Adform",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Adform",
    },
    {
        re: /lijit\.com/,
        name: "Lijit",
        category: TRACKER_CATEGORIES.ADVERTISING,
        company: "Sovrn/Lijit",
    }
];

// Patterns for broad tracker matching (from trackerService.js)
export const TRACKER_PATTERNS = [
    /\.ads\./,
    /\.analytics\./,
    /\.tracking\./,
    /\.metrics\./,
    /\.telemetry\./,
    /ads\d+\./,
    /track\d*\./,
    /collect\./,
    /pixel\./,
    /beacon\./,
    /\/analytics/i,
    /\/tracking/i,
    /\/collect/i,
    /\/beacon/i,
    /\/pixel/i,
    /\/track/i,
    /\/metric/i,
    /\/telemetry/i,
    /gtag|gtm/i,
    /fbevents/i,
    /doubleclick/i
];

/**
 * Classifies a domain based on the tracker rules
 * @param {string} domain 
 * @returns {object} { name, category, company }
 */
export function classifyDomain(domain) {
    if (!domain) return { name: "Unknown", category: TRACKER_CATEGORIES.UNKNOWN, company: "Unknown" };

    const lower = domain.toLowerCase();

    for (const rule of TRACKER_RULES) {
        if (rule.re.test(lower)) {
            return {
                name: rule.name,
                category: rule.category,
                company: rule.company
            };
        }
    }

    if (/analytics|track|collect|pixel|beacon|telemetry|metrics/.test(lower)) {
        return { name: "Tracker", category: TRACKER_CATEGORIES.ANALYTICS, company: "Unknown" };
    }

    return { name: lower, category: TRACKER_CATEGORIES.UNKNOWN, company: "Unknown" };
}

/**
 * Checks if a URL or domain is a tracker
 * @param {string} url 
 * @param {string} domain 
 * @returns {boolean}
 */
export function isTracker(url, domain) {
    const lowerDomain = (domain || "").toLowerCase();
    const lowerUrl = (url || "").toLowerCase();

    // Check against rules
    for (const rule of TRACKER_RULES) {
        if (rule.re.test(lowerDomain)) return true;
    }

    // Check against general patterns
    for (const pattern of TRACKER_PATTERNS) {
        if (pattern.test(lowerDomain) || pattern.test(lowerUrl)) return true;
    }

    return false;
}
