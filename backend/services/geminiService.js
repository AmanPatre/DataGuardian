// backend/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Tracker database with detailed information
const TRACKER_DATABASE = {
  'google-analytics.com': {
    name: 'Google Analytics',
    category: 'Analytics',
    company: 'Google',
    dataTypes: ['browsing behavior', 'page views', 'user interactions', 'device info'],
    purpose: 'Website traffic analysis and user behavior tracking'
  },
  'facebook.net': {
    name: 'Meta Pixel',
    category: 'Social Media Tracking',
    company: 'Meta (Facebook)',
    dataTypes: ['browsing behavior', 'purchase activity', 'demographic data'],
    purpose: 'Ad targeting and conversion tracking'
  },
  'doubleclick.net': {
    name: 'DoubleClick',
    category: 'Advertising',
    company: 'Google',
    dataTypes: ['browsing history', 'ad interactions', 'demographic profiles'],
    purpose: 'Personalized advertising and remarketing'
  },
  'googletagmanager.com': {
    name: 'Google Tag Manager',
    category: 'Tag Management',
    company: 'Google',
    dataTypes: ['page interactions', 'events', 'conversion data'],
    purpose: 'Managing multiple tracking tags and analytics'
  },
  'criteo.com': {
    name: 'Criteo',
    category: 'Advertising',
    company: 'Criteo',
    dataTypes: ['shopping behavior', 'product views', 'purchase history'],
    purpose: 'Retargeting ads and personalized product recommendations'
  },
  'hotjar.com': {
    name: 'Hotjar',
    category: 'Analytics',
    company: 'Hotjar',
    dataTypes: ['mouse movements', 'clicks', 'form interactions', 'session recordings'],
    purpose: 'User experience analysis and heatmap generation'
  },
  'mixpanel.com': {
    name: 'Mixpanel',
    category: 'Analytics',
    company: 'Mixpanel',
    dataTypes: ['user actions', 'event tracking', 'funnel analysis'],
    purpose: 'Product analytics and user engagement tracking'
  },
  'taboola.com': {
    name: 'Taboola',
    category: 'Content Recommendation',
    company: 'Taboola',
    dataTypes: ['reading preferences', 'content engagement', 'browsing patterns'],
    purpose: 'Content recommendations and native advertising'
  },
  'outbrain.com': {
    name: 'Outbrain',
    category: 'Content Recommendation',
    company: 'Outbrain',
    dataTypes: ['article preferences', 'engagement data', 'interest profiles'],
    purpose: 'Content discovery and sponsored content delivery'
  },
  'amazon-adsystem.com': {
    name: 'Amazon DSP',
    category: 'Advertising',
    company: 'Amazon',
    dataTypes: ['shopping behavior', 'product interests', 'purchase patterns'],
    purpose: 'Display advertising and product promotion'
  }
};

// Get tracker information from database or infer from domain
function getTrackerInfo(domain) {
  // Direct match
  if (TRACKER_DATABASE[domain]) {
    return TRACKER_DATABASE[domain];
  }

  // Partial match for subdomains
  for (const [key, value] of Object.entries(TRACKER_DATABASE)) {
    if (domain.includes(key.split('.')[0])) {
      return value;
    }
  }

  // Infer information from domain patterns
  const lowerDomain = domain.toLowerCase();

  if (lowerDomain.includes('google') || lowerDomain.includes('goog')) {
    return {
      name: domain,
      category: 'Google Services',
      company: 'Google',
      dataTypes: ['browsing data', 'user interactions'],
      purpose: 'Analytics and advertising services'
    };
  }

  if (lowerDomain.includes('facebook') || lowerDomain.includes('meta')) {
    return {
      name: domain,
      category: 'Social Media',
      company: 'Meta',
      dataTypes: ['social interactions', 'browsing behavior'],
      purpose: 'Social media integration and advertising'
    };
  }

  if (lowerDomain.includes('ads') || lowerDomain.includes('ad')) {
    return {
      name: domain,
      category: 'Advertising',
      company: 'Unknown Ad Network',
      dataTypes: ['browsing history', 'ad interactions'],
      purpose: 'Advertising and marketing'
    };
  }

  // Default fallback
  return {
    name: domain,
    category: 'Unknown',
    company: 'Unknown',
    dataTypes: ['browsing data'],
    purpose: 'Data collection and tracking'
  };
}

// Generate AI summary for trackers
export async function generateAIPrivacySummary(trackers, siteUrl) {
  try {
    // Get tracker information
    const trackerInfos = trackers.map(tracker => ({
      domain: tracker,
      ...getTrackerInfo(tracker)
    }));

    // Prepare prompt for Gemini
    const prompt = `
You are a privacy expert helping users understand website tracking. Analyze the following trackers found on ${siteUrl} and provide a clear, user-friendly summary.

Trackers detected:
${trackerInfos.map(t => `
- ${t.name} (${t.domain})
  Category: ${t.category}
  Company: ${t.company}
  Data Types: ${t.dataTypes.join(', ')}
  Purpose: ${t.purpose}
`).join('')}

Please provide a structured response with these sections:

**WHAT THEY COLLECT:**
List the main types of data being collected (be specific but user-friendly)

**WHO THEY SHARE WITH:**
List the main companies/partners receiving data

**HOW LONG THEY KEEP IT:**
Provide typical data retention information for these types of trackers

**KEY PRIVACY RISKS:**
Explain the main privacy concerns in simple terms

**TRACKER BREAKDOWN:**
For each major tracker, provide a 1-2 sentence explanation of what it does

Keep the language simple, engaging, and focus on what matters most to users' privacy. Use bullet points and be concise.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    // Parse the response into structured format
    const sections = parseGeminiResponse(summary);

    return {
      success: true,
      summary: sections,
      trackerCount: trackers.length,
      trackerDetails: trackerInfos
    };

  } catch (error) {
    console.error('Error generating AI summary:', error);

    // Fallback to manual summary if AI fails
    return generateFallbackSummary(trackers, siteUrl);
  }
}

// Parse Gemini response into structured sections
function parseGeminiResponse(response) {
  const sections = {
    whatTheyCollect: [],
    whoTheyShareWith: [],
    howLongTheyKeep: '',
    keyRisks: [],
    trackerBreakdown: []
  };

  try {
    const lines = response.split('\n');
    let currentSection = null;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed.includes('WHAT THEY COLLECT')) {
        currentSection = 'whatTheyCollect';
      } else if (trimmed.includes('WHO THEY SHARE WITH')) {
        currentSection = 'whoTheyShareWith';
      } else if (trimmed.includes('HOW LONG THEY KEEP')) {
        currentSection = 'howLongTheyKeep';
      } else if (trimmed.includes('KEY PRIVACY RISKS') || trimmed.includes('KEY RISKS')) {
        currentSection = 'keyRisks';
      } else if (trimmed.includes('TRACKER BREAKDOWN')) {
        currentSection = 'trackerBreakdown';
      } else if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const item = trimmed.substring(2).trim();
        if (currentSection && sections[currentSection] && Array.isArray(sections[currentSection])) {
          sections[currentSection].push(item);
        }
      } else if (currentSection === 'howLongTheyKeep' && trimmed && !trimmed.includes('**')) {
        sections.howLongTheyKeep += (sections.howLongTheyKeep ? ' ' : '') + trimmed;
      }
    }

    return sections;
  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    return generateFallbackStructure();
  }
}

// Fallback summary generation if AI fails
function generateFallbackSummary(trackers, siteUrl) {
  const trackerInfos = trackers.map(tracker => ({
    domain: tracker,
    ...getTrackerInfo(tracker)
  }));

  const companies = [...new Set(trackerInfos.map(t => t.company))];
  const dataTypes = [...new Set(trackerInfos.flatMap(t => t.dataTypes))];

  return {
    success: false,
    summary: {
      whatTheyCollect: dataTypes.slice(0, 5),
      whoTheyShareWith: companies.slice(0, 8),
      howLongTheyKeep: "Typically 1-2 years for active data, indefinitely for anonymized data",
      keyRisks: [
        "Detailed browsing profiles can be created",
        "Data may be sold to third parties",
        "Cross-site tracking enables extensive surveillance"
      ],
      trackerBreakdown: trackerInfos.slice(0, 5).map(t =>
        `${t.name}: ${t.purpose}`
      )
    },
    trackerCount: trackers.length,
    trackerDetails: trackerInfos,
    note: "AI analysis unavailable - showing basic tracker information"
  };
}

function generateFallbackStructure() {
  return {
    whatTheyCollect: ["Browsing behavior", "Device information", "Location data"],
    whoTheyShareWith: ["Advertising networks", "Analytics companies", "Data brokers"],
    howLongTheyKeep: "Varies by company, typically 1-2 years",
    keyRisks: ["Detailed user profiling", "Cross-site tracking"],
    trackerBreakdown: ["Basic tracker information available"]
  };
}