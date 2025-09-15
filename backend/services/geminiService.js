// backend/services/geminiService.js
import { GoogleGenerativeAI } from '@google/generative-ai';


export async function generateAIPrivacySummary(trackers, url) {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    if (!process.env.GEMINI_API_KEY) {
      console.warn('Gemini API key not found');
      return {
        success: false,
        note: "AI analysis unavailable - API key missing",
        summary: {
          whatTheyCollect: [],
          whoTheyShareWith: [],
          howLongTheyKeep: "Information not available",
          keyRisks: [],
          trackerBreakdown: []
        }
      };
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Create a comprehensive prompt
    const prompt = `
You are a privacy analysis expert. Analyze the following website and its trackers to provide a comprehensive privacy summary.

Website: ${url}
Detected Trackers: ${trackers.join(', ')}

Please provide a JSON response with the following structure:
{
  "whatTheyCollect": ["specific data types they collect"],
  "whoTheyShareWith": ["companies/partners they share data with"],
  "howLongTheyKeep": "data retention period",
  "keyRisks": ["privacy risks to users"],
  "trackerBreakdown": ["explanation of major trackers found"]
}

Guidelines:
- Be specific and factual about data collection practices
- Identify actual companies based on the tracker domains
- Explain privacy risks in user-friendly language
- Keep each array item concise but informative
- Focus on the most significant privacy concerns
- If information is unknown, indicate that clearly

Analyze the tracker domains to identify:
- Google services (analytics, ads, tag manager)
- Social media trackers (Facebook, Twitter, etc.)
- Ad networks (DoubleClick, AdNxs, etc.)
- Analytics services (Mixpanel, Hotjar, etc.)
- Data brokers and audience platforms

Provide realistic assessments based on the actual trackers detected.
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Try to parse JSON from the response
    let summary;
    try {
      // Extract JSON from the response (sometimes the model adds extra text)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summary = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response as JSON:', parseError.message);

      // Fallback: create a basic summary based on trackers
      summary = createFallbackSummary(trackers, url);
    }

    // Validate and sanitize the summary
    const validatedSummary = validateSummary(summary);

    return {
      success: true,
      summary: validatedSummary,
      trackerCount: trackers.length,
      rawResponse: text // For debugging
    };

  } catch (error) {
    console.error('Gemini AI error:', error.message);

    // Return fallback summary instead of failing completely
    return {
      success: false,
      note: `AI analysis failed: ${error.message}`,
      summary: createFallbackSummary(trackers, url)
    };
  }
}

function createFallbackSummary(trackers, url) {
  const domain = new URL(url).hostname;

  // Analyze trackers to create basic summary
  const googleTrackers = trackers.filter(t => t.includes('google'));
  const facebookTrackers = trackers.filter(t => t.includes('facebook'));
  const adTrackers = trackers.filter(t =>
    t.includes('ads') || t.includes('doubleclick') || t.includes('adnxs')
  );
  const analyticsTrackers = trackers.filter(t =>
    t.includes('analytics') || t.includes('mixpanel') || t.includes('hotjar')
  );

  const companies = [];
  if (googleTrackers.length > 0) companies.push('Google');
  if (facebookTrackers.length > 0) companies.push('Meta/Facebook');
  if (adTrackers.length > 0) companies.push('Advertising Networks');
  if (analyticsTrackers.length > 0) companies.push('Analytics Providers');

  return {
    whatTheyCollect: [
      "Browsing behavior and page views",
      "Device and browser information",
      "IP address and location data",
      ...(trackers.length > 5 ? ["User interactions and clicks"] : []),
      ...(trackers.length > 10 ? ["Cross-site tracking data"] : [])
    ],
    whoTheyShareWith: companies.length > 0 ? companies : ["Third-party partners"],
    howLongTheyKeep: trackers.length > 8 ? "Up to 2 years or indefinitely" : "Varies by service",
    keyRisks: [
      `Your browsing on ${domain} may be tracked across other websites`,
      ...(trackers.length > 5 ? ["Detailed behavioral profiling for advertising"] : []),
      ...(trackers.length > 10 ? ["Extensive data sharing with multiple partners"] : [])
    ],
    trackerBreakdown: trackers.slice(0, 4).map(tracker => {
      if (tracker.includes('google')) {
        return `${tracker}: Google's tracking service for analytics and advertising`;
      } else if (tracker.includes('facebook')) {
        return `${tracker}: Meta's social media and advertising tracker`;
      } else if (tracker.includes('doubleclick')) {
        return `${tracker}: Google's advertising network for targeted ads`;
      } else {
        return `${tracker}: Third-party tracking and analytics service`;
      }
    })
  };
}

function validateSummary(summary) {
  const validated = {
    whatTheyCollect: Array.isArray(summary.whatTheyCollect) ?
      summary.whatTheyCollect.slice(0, 8) :
      ["Information not available"],

    whoTheyShareWith: Array.isArray(summary.whoTheyShareWith) ?
      summary.whoTheyShareWith.slice(0, 10) :
      ["Information not available"],

    howLongTheyKeep: typeof summary.howLongTheyKeep === 'string' ?
      summary.howLongTheyKeep :
      "Information not available",

    keyRisks: Array.isArray(summary.keyRisks) ?
      summary.keyRisks.slice(0, 6) :
      ["Privacy risks could not be determined"],

    trackerBreakdown: Array.isArray(summary.trackerBreakdown) ?
      summary.trackerBreakdown.slice(0, 5) :
      []
  };

  return validated;
}