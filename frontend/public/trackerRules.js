/**
 * Shared tracker classification rules for DataGuardian extension
 * This file is loaded as a global script in the extension.
 */

const DG_TRACKER_CATEGORIES = {
    ADVERTISING: "Advertising",
    ANALYTICS: "Analytics",
    SOCIAL: "Social",
    TAG_MANAGER: "Tag Manager",
    CDN_UTILITY: "CDN/Utility",
    UNKNOWN: "Unknown"
};

const DG_TRACKER_RULES = [
    {
        re: /doubleclick|googlesyndication|googleadservices|ads\.google|adservice\.google/,
        name: "Google Ads",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Google",
        patterns: ['doubleclick.net', 'googlesyndication.com', 'googleadservices.com', 'ads.google', 'adservice.google']
    },
    {
        re: /googletagmanager|gtm/,
        name: "Google Tag Manager",
        category: DG_TRACKER_CATEGORIES.TAG_MANAGER,
        company: "Google",
        patterns: ['googletagmanager.com', 'gtm']
    },
    {
        re: /google-analytics|analytics\.google/,
        name: "Google Analytics",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Google",
        patterns: ['google-analytics.com', 'analytics.google']
    },
    {
        re: /gstatic|googleapis/,
        name: "Google Static/Services",
        category: DG_TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Google",
        patterns: ['gstatic.com', 'googleapis.com']
    },
    {
        re: /\.google\./,
        name: "Google Services",
        category: DG_TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Google",
        patterns: ['google.com']
    },
    {
        re: /facebook|fbcdn|fbevents|connect\.facebook\.net/,
        name: "Meta Pixel",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Meta",
        patterns: ['facebook.net', 'fbcdn.net', 'fbevents.js', 'facebook.com']
    },
    {
        re: /instagram\.com/,
        name: "Instagram",
        category: DG_TRACKER_CATEGORIES.SOCIAL,
        company: "Meta",
        patterns: ['instagram.com']
    },
    {
        re: /linkedin|licdn|bat\.bing\.com|bingads/,
        name: "Microsoft Ads/LinkedIn",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Microsoft",
        patterns: ['linkedin.com', 'licdn.com', 'bing.com']
    },
    {
        re: /twitter|tiktok|snapchat|pinterest/,
        name: "Social Network",
        category: DG_TRACKER_CATEGORIES.SOCIAL,
        company: "Various",
        patterns: ['twitter.com', 'tiktok.com', 'snapchat.com', 'pinterest.com']
    },
    {
        re: /adnxs|appnexus/,
        name: "AppNexus (Adnxs)",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Microsoft (Xandr)",
        patterns: ['adnxs.com', 'appnexus.com']
    },
    {
        re: /rubiconproject/,
        name: "Rubicon Project (Magnite)",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Magnite",
        patterns: ['rubiconproject.com']
    },
    {
        re: /pubmatic/,
        name: "PubMatic",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "PubMatic",
        patterns: ['pubmatic.com']
    },
    {
        re: /criteo/,
        name: "Criteo",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Criteo",
        patterns: ['criteo.com']
    },
    {
        re: /taboola/,
        name: "Taboola",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Taboola",
        patterns: ['taboola.com']
    },
    {
        re: /outbrain/,
        name: "Outbrain",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Outbrain",
        patterns: ['outbrain.com']
    },
    {
        re: /openx/,
        name: "OpenX",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "OpenX",
        patterns: ['openx.net']
    },
    {
        re: /adroll/,
        name: "AdRoll",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "NextRoll",
        patterns: ['adroll.com']
    },
    {
        re: /cxense\.com/,
        name: "Cxense",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Cxense",
        patterns: ['cxense.com']
    },
    {
        re: /mixpanel/,
        name: "Mixpanel",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Mixpanel",
        patterns: ['mixpanel.com']
    },
    {
        re: /segment\.com/,
        name: "Segment",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Twilio Segment",
        patterns: ['segment.com']
    },
    {
        re: /amplitude/,
        name: "Amplitude",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Amplitude",
        patterns: ['amplitude.com']
    },
    {
        re: /hotjar/,
        name: "Hotjar",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Hotjar",
        patterns: ['hotjar.com']
    },
    {
        re: /fullstory/,
        name: "FullStory",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "FullStory",
        patterns: ['fullstory.com']
    },
    {
        re: /logrocket/,
        name: "LogRocket",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "LogRocket",
        patterns: ['logrocket.com']
    },
    {
        re: /optimizely/,
        name: "Optimizely",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Optimizely",
        patterns: ['optimizely.com']
    },
    {
        re: /mouseflow/,
        name: "Mouseflow",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Mouseflow",
        patterns: ['mouseflow.com']
    },
    {
        re: /chartbeat/,
        name: "Chartbeat",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Chartbeat",
        patterns: ['chartbeat.com']
    },
    {
        re: /clicktale/,
        name: "Clicktale",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Clicktale",
        patterns: ['clicktale.com', 'clicktale.net']
    },
    {
        re: /mathtag/,
        name: "MediaMath (mathtag)",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "MediaMath",
        patterns: ['mathtag.com']
    },
    {
        re: /doubleverify/,
        name: "DoubleVerify",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "DoubleVerify",
        patterns: ['doubleverify.com']
    },
    {
        re: /scorecardresearch\.com/,
        name: "ScorecardResearch",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Comscore",
        patterns: ['scorecardresearch.com']
    },
    {
        re: /comscore\.com/,
        name: "Comscore",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Comscore",
        patterns: ['comscore.com']
    },
    {
        re: /quantserve\.com/,
        name: "Quantserve",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Quantcast",
        patterns: ['quantserve.com']
    },
    {
        re: /demdex\.net/,
        name: "Adobe Experience Cloud (Demdex)",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Adobe",
        patterns: ['demdex.net']
    },
    {
        re: /adsrvr\.org/,
        name: "The Trade Desk",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "The Trade Desk",
        patterns: ['adsrvr.org']
    },
    {
        re: /eyeota\.net/,
        name: "Eyeota",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Eyeota",
        patterns: ['eyeota.net']
    },
    {
        re: /bluekai\.com/,
        name: "Oracle BlueKai",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Oracle",
        patterns: ['bluekai.com']
    },
    {
        re: /amazon-adsystem\.com/,
        name: "Amazon Advertising",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Amazon",
        patterns: ['amazon-adsystem.com']
    },
    {
        re: /bouncex\.net|wunderkind\.co/,
        name: "Wunderkind (BounceX)",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Wunderkind",
        patterns: ['bouncex.net', 'wunderkind.co']
    },
    {
        re: /onetag\.com|s-onetag\.com/,
        name: "OneTag",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "OneTag",
        patterns: ['onetag.com']
    },
    {
        re: /permutive/,
        name: "Permutive",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Permutive",
        patterns: ['permutive.com']
    },
    {
        re: /turner\.com|warnermediacdn\.com/,
        name: "Turner/Warner CDN",
        category: DG_TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Warner Bros. Discovery",
        patterns: ['turner.com']
    },
    {
        re: /collector\.github\.com/,
        name: "GitHub Telemetry",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "GitHub",
        patterns: ['collector.github.com']
    },
    {
        re: /cloudflareinsights\.com/,
        name: "Cloudflare Web Analytics",
        category: DG_TRACKER_CATEGORIES.ANALYTICS,
        company: "Cloudflare",
        patterns: ['cloudflareinsights.com']
    },
    {
        re: /dubcdn\.com/,
        name: "Dub CDN",
        category: DG_TRACKER_CATEGORIES.CDN_UTILITY,
        company: "Dub",
        patterns: ['dubcdn.com']
    },
    {
        re: /temu\.com/,
        name: "Temu",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Temu",
        patterns: ['temu.com']
    },
    {
        re: /yahoo\.com/,
        name: "Yahoo",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Yahoo",
        patterns: ['yahoo.com']
    },
    {
        re: /adform\.net/,
        name: "Adform",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Adform",
        patterns: ['adform.net']
    },
    {
        re: /lijit\.com/,
        name: "Lijit",
        category: DG_TRACKER_CATEGORIES.ADVERTISING,
        company: "Sovrn/Lijit",
        patterns: ['lijit.com']
    }
];

const DG_TRACKER_PATTERNS = [
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

const dgClassifyDomain = function (domain) {
    if (!domain) return { name: "Unknown", category: DG_TRACKER_CATEGORIES.UNKNOWN, company: "Unknown" };

    const lower = domain.toLowerCase();

    for (const rule of DG_TRACKER_RULES) {
        if (rule.re.test(lower)) {
            return {
                name: rule.name,
                category: rule.category,
                company: rule.company
            };
        }
    }

    if (/analytics|track|collect|pixel|beacon|telemetry|metrics/.test(lower)) {
        return { name: "Tracker", category: DG_TRACKER_CATEGORIES.ANALYTICS, company: "Unknown" };
    }

    return { name: lower, category: DG_TRACKER_CATEGORIES.UNKNOWN, company: "Unknown" };
};

const dgIsTracker = function (url, domain) {
    const lowerDomain = (domain || "").toLowerCase();
    const lowerUrl = (url || "").toLowerCase();

    for (const rule of DG_TRACKER_RULES) {
        if (rule.re.test(lowerDomain)) return true;
    }

    for (const pattern of DG_TRACKER_PATTERNS) {
        if (pattern.test(lowerDomain) || pattern.test(lowerUrl)) return true;
    }

    return false;
};

const dgGetDomainsForCategory = function (category) {
    const domains = [];
    for (const rule of DG_TRACKER_RULES) {
        if (rule.category === category && rule.patterns) {
            domains.push(...rule.patterns);
        }
    }
    return [...new Set(domains)];
};

// Detect global scope (window in pages, self in workers)
const root = (typeof self === 'object' && self.self === self && self) ||
    (typeof window === 'object' && window.window === window && window);

root.DG_TRACKER_CATEGORIES = DG_TRACKER_CATEGORIES;
root.DG_TRACKER_RULES = DG_TRACKER_RULES;
root.DG_TRACKER_PATTERNS = DG_TRACKER_PATTERNS;
root.dgClassifyDomain = dgClassifyDomain;
root.dgIsTracker = dgIsTracker;
root.dgGetDomainsForCategory = dgGetDomainsForCategory;

