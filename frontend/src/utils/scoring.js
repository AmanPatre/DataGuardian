/**
 * This logic is adapted from the backend controller.
 * It recalculates the privacy score based on the number of *unblocked* trackers.
 * @param {object} initialSiteData - The original analysis data from the backend.
 * @param {number} unblockedTrackersCount - The number of trackers not blocked by user settings.
 * @returns {number} The new privacy score.
 */
function calculateDynamicPrivacyScore({ initialSiteData, unblockedTrackersCount }) {
  let score = 0;
  const { url, simplifiedPolicy, aiSummary } = initialSiteData;

  // 1. Trackers factor (40 points max) - This is the dynamic part
  if (unblockedTrackersCount === 0) score += 40;
  else if (unblockedTrackersCount <= 2) score += 35;
  else if (unblockedTrackersCount <= 5) score += 25;
  else if (unblockedTrackersCount <= 10) score += 15;
  else if (unblockedTrackersCount <= 15) score += 5;

  // 2. URL security (10 points max)
  if (url.startsWith("https://")) score += 10;

  // 3. Policy keywords (30 points max) - This part is static based on initial analysis
  const lowerPolicy = simplifiedPolicy ? simplifiedPolicy.toLowerCase() : "";
  const positiveKeywords = [
    "encrypted", "no data sharing", "gdpr", "privacy focused",
    "user control", "opt-out", "delete data", "minimal collection",
  ];
  const negativeKeywords = [
    "sell data", "third party", "advertisers", "share data",
    "indefinitely", "partners", "affiliates", "marketing",
  ];

  positiveKeywords.forEach((word) => {
    if (lowerPolicy.includes(word)) score += 4;
  });

  negativeKeywords.forEach((word) => {
    if (lowerPolicy.includes(word)) score -= 3;
  });

  // 4. AI Analysis bonus/penalty (20 points max) - This is also static
  if (aiSummary && aiSummary.success) {
    const risks = aiSummary.summary.keyRisks || [];
    if (risks.length <= 2) score += 15;
    else if (risks.length <= 4) score += 10;
    else score += 5;

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

  return Math.round(score);
}

/**
 * Converts a numerical score to a letter grade.
 * @param {number} score - The privacy score.
 * @returns {string} The letter grade.
 */
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

/**
 * Main function to recalculate the score and grade based on current tracker settings.
 * @param {object} initialSiteData - The original site data from the backend.
 * @param {object} trackerSettings - The current user-defined tracker settings.
 * @returns {{score: number, grade: string}} The new score and grade.
 */
export function recalculateScoreAndGrade(initialSiteData, trackerSettings) {
  const { aiSummary } = initialSiteData;
  const trackerDetails = aiSummary?.trackerDetails || [];

  // If there are no trackers, the score doesn't change.
  if (trackerDetails.length === 0) {
      return { score: initialSiteData.score, grade: initialSiteData.grade };
  }

  // Calculate the number of unblocked trackers
  let unblockedTrackersCount = 0;
  for (const tracker of trackerDetails) {
      const category = tracker.category || 'Unknown';
      const settingKey = `block${category.replace(/[^a-zA-Z0-9]/g, '')}Trackers`;
      if (!trackerSettings[settingKey]) {
          unblockedTrackersCount++;
      }
  }

  const newScore = calculateDynamicPrivacyScore({ initialSiteData, unblockedTrackersCount });
  const newGrade = getGradeFromScore(newScore);

  return { score: newScore, grade: newGrade };
}