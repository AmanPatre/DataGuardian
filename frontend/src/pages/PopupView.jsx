import React, { useState, useEffect } from "react";
import ModernHeader from "../components/ModernHeader";
import LoadingSpinner from "../components/LoadingSpinner";
import { PrivacyManager } from "../utils/privacyManager";
import {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
  ServerIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  ArrowRightCircleIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

// Helper object to map category names to their UI properties
const categoryDetails = {
  Advertising: { icon: "BugAntIcon", color: "bg-red-100 text-red-700" },
  Analytics: { icon: "ChartPieIcon", color: "bg-blue-100 text-blue-700" },
  Social: { icon: "ShareIcon", color: "bg-sky-100 text-sky-700" },
  "CDN/Utility": { icon: "ServerIcon", color: "bg-indigo-100 text-indigo-700" },
  "Tag Manager": { icon: "TagIcon", color: "bg-yellow-100 text-yellow-700" },
  Unknown: {
    icon: "QuestionMarkCircleIcon",
    color: "bg-gray-100 text-gray-700",
  },
};

// Helper function to get the correct icon component from its name string
const icons = {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
  ServerIcon,
  TagIcon,
  QuestionMarkCircleIcon,
};
const getIcon = (iconName) => {
  const IconComponent = icons[iconName];
  return IconComponent ? (
    <IconComponent className="w-5 h-5" />
  ) : (
    <QuestionMarkCircleIcon className="w-5 h-5" />
  );
};

// removed: PrivacyMeter (unused)

// A compact version of the AI Analysis for the popup
const CompactAIPrivacyAnalysis = ({ summary }) => {
  if (!summary || !summary.whatTheyCollect) {
    return (
      <p className="text-xs text-center text-gray-500 py-2">
        AI summary is not available for this site.
      </p>
    );
  }

  const truncateAtSentence = (text, targetWords = 35) => {
    if (!text || typeof text !== "string") return text;
    const clean = text.trim();
    if (!clean) return clean;
    const sentences = clean.split(/(?<=[.!?])\s+/);
    let result = [];
    let count = 0;
    for (const s of sentences) {
      const w = s.trim().split(/\s+/).filter(Boolean);
      if (w.length === 0) continue;
      result.push(s.trim());
      count += w.length;
      if (count >= targetWords) break;
    }
    if (result.length > 0) return result.join(" ");
    const words = clean.split(/\s+/);
    if (words.length <= targetWords) return clean;
    return words.slice(0, targetWords).join(" ") + "…";
  };

  const renderSection = (title, data, icon) => {
    if (!data || data.length === 0) return null;
    const text = Array.isArray(data) ? data.join(", ") : String(data);
    return (
      <div className="flex items-start gap-2 text-xs">
        {icon}
        <p>
          <span className="font-semibold">{title}:</span>{" "}
          {truncateAtSentence(text, 35)}
        </p>
      </div>
    );
  };

  return (
    <div className="space-y-2 text-left">
      {renderSection(
        "Collects",
        summary.whatTheyCollect,
        <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
      )}
      {renderSection(
        "Shares With",
        summary.whoTheyShareWith,
        <BuildingOfficeIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
      )}
      {renderSection(
        "Key Risks",
        summary.keyRisks,
        <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
      )}
    </div>
  );
};

const PopupView = ({ siteData = {}, onNavigate }) => {
  const [privacyManager] = useState(new PrivacyManager());
  const [isLoading, setIsLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState("research");

  const {
    url = "Unknown site",
    trackers = {},
    grade = "F",
    aiSummary,
  } = siteData;

  const trackerCategories = Object.keys(trackers);
  const totalTrackers = Object.values(trackers).reduce(
    (sum, count) => sum + count,
    0
  );
  // removed: trackerCategoriesKey (no longer needed)

  useEffect(() => {
    const loadMode = async () => {
      setIsLoading(true);
      try {
        await privacyManager.loadSettings(url);
        const mode = await privacyManager.getPrivacyMode();
        setPrivacyMode(mode);
      } catch (error) {
        console.error("Failed to load privacy mode:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadMode();
  }, [privacyManager, url]);

  const setAllCategoryBlocking = async (enabled) => {
    try {
      // General catch-all toggle if used elsewhere
      await privacyManager.updateSetting("blockTrackers", enabled, url);
    } catch {
      console.warn("blockTrackers toggle failed");
    }
    try {
      for (const category of trackerCategories) {
        const key = `block${category.replace(/[^a-zA-Z0-9]/g, "")}Trackers`;
        try {
          await privacyManager.updateSetting(key, enabled, url);
        } catch {
          /* noop */
        }
      }
    } catch {
      /* noop */
    }
  };

  // Removed Privacy Protection Level computation per request

  // const privacyStats = getPrivacyImprovement();

  const getHostname = (urlString) => {
    try {
      if (!urlString || urlString === "Unknown site") return "this site";
      return new URL(urlString).hostname;
    } catch {
      return "this site";
    }
  };

  if (isLoading) {
    return (
      <div className="w-[400px] flex items-center justify-center p-4">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div
      className="w-[400px] flex flex-col bg-gray-50 no-scrollbar"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <ModernHeader score={grade} isAnalyzing={false} />

      <div
        className="flex-1 p-4 space-y-3 no-scrollbar"
        style={{ overflow: "auto" }}
      >
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">Mode</p>
              <p className="text-xs text-gray-500">
                {privacyMode === "stealth"
                  ? "Stealth: Block ALL trackers."
                  : "Research: Share data anonymously (no IDs/cookies)"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await privacyManager.setPrivacyMode("stealth");
                  setPrivacyMode("stealth");
                  await setAllCategoryBlocking(true);
                  // Notify other views to refresh their toggles
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("privacyModeChanged", {
                        detail: { mode: "stealth" },
                      })
                    );
                  }
                }}
                className={`w-28 text-center px-3 py-1.5 text-sm rounded-lg border ${
                  privacyMode === "stealth"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Stealth
              </button>
              <button
                onClick={async () => {
                  await privacyManager.setPrivacyMode("research");
                  setPrivacyMode("research");
                  await setAllCategoryBlocking(false);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(
                      new CustomEvent("privacyModeChanged", {
                        detail: { mode: "research" },
                      })
                    );
                  }
                }}
                className={`w-28 text-center px-3 py-1.5 text-sm rounded-lg border ${
                  privacyMode === "research"
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                Research
              </button>
            </div>
          </div>
        </div>

        {/* Privacy Protection Level removed per request */}

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                AI Privacy Snapshot
              </p>
              <p className="text-xs text-gray-500">
                Summary for {getHostname(url)}
              </p>
            </div>
          </div>
          <CompactAIPrivacyAnalysis summary={aiSummary?.summary} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-semibold text-gray-800">
              Trackers Detected
            </h2>
            <span className="text-sm font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {totalTrackers} Total
            </span>
          </div>
          <div className="space-y-2">
            {trackerCategories.length > 0 ? (
              trackerCategories.map((category) => {
                const details =
                  categoryDetails[category] || categoryDetails.Unknown;
                return (
                  <div
                    key={category}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`p-1 rounded-full ${details.color}`}>
                        {getIcon(details.icon)}
                      </span>
                      <span className="text-gray-700">{category}</span>
                    </div>
                    <span className="font-medium text-gray-800">
                      {trackers[category]}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-3">
                <p className="text-sm font-medium text-green-700">
                  No trackers were detected on this page!
                </p>
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.scrollTo) {
              window.scrollTo({ top: 0, behavior: "instant" });
            }
            if (onNavigate) onNavigate("fullReport");
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          View Full Report & Controls
          <ArrowRightCircleIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PopupView;
