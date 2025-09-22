import React, { useState, useEffect } from "react";
import ModernHeader from "../components/ModernHeader";
import ModernToggle from "../components/ModernToggle";
import LoadingSpinner from "../components/LoadingSpinner";
import { PrivacyManager } from "../utils/privacyManager";
import {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
  BoltIcon,
  SparklesIcon,
  // [ADD] Import new icons for the dynamic categories
  ServerIcon,
  TagIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";

// [ADD] Helper object to map category names to their UI properties
const categoryDetails = {
  Advertising: { icon: "BugAntIcon", description: "Block advertising and marketing trackers" },
  Analytics: { icon: "ChartPieIcon", description: "Block website analytics and behavior tracking" },
  Social: { icon: "ShareIcon", description: "Block social media widgets and tracking" },
  "CDN/Utility": { icon: "ServerIcon", description: "Block content delivery and utility scripts" },
  "Tag Manager": { icon: "TagIcon", description: "Block third-party script loaders" },
  Unknown: { icon: "QuestionMarkCircleIcon", description: "Block trackers of unknown category" },
};

// [ADD] Helper function to get the correct icon component from its name
const icons = { BugAntIcon, ChartPieIcon, ShareIcon, ServerIcon, TagIcon, QuestionMarkCircleIcon };
const getIcon = (iconName) => {
  const IconComponent = icons[iconName];
  return IconComponent ? <IconComponent className="w-5 h-5" /> : <QuestionMarkCircleIcon className="w-5 h-5" />;
};


const PopupView = ({ siteData = {}, onNavigate }) => {
  const [privacyManager] = useState(new PrivacyManager());
  const [trackerSettings, setTrackerSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // [UPDATE] Destructure the dynamic `trackers` object
  const {
    summary = "No summary available.",
    url = "Unknown site",
    simplifiedPolicy = "",
    category = "Unknown",
    trackers = {}, // Now a dynamic object like { Advertising: 5, Analytics: 2 }
    grade = "F",
  } = siteData;

  // Get a list of all categories found on the current site
  const trackerCategories = Object.keys(trackers);

  // [UPDATE] Dynamically load settings for all detected tracker categories
  useEffect(() => {
    const loadTrackerSettings = async () => {
      setIsLoading(true);
      try {
        await privacyManager.loadSettings(siteData.url || url);
        const settings = {};
        trackerCategories.forEach(category => {
          // Create a consistent key, e.g., "blockAdvertisingTrackers" or "blockCDNUtilityTrackers"
          const settingKey = `block${category.replace(/[^a-zA-Z0-9]/g, "")}Trackers`;
          settings[settingKey] = privacyManager.getSetting(settingKey);
        });
        setTrackerSettings(settings);
      } catch (error) {
        console.error("Failed to load tracker settings:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (trackerCategories.length > 0) {
        loadTrackerSettings();
    } else {
        setIsLoading(false); // No trackers, so no settings to load
    }
  }, [privacyManager, siteData.url, url, Object.keys(trackers).join(',')]); // Rerun if the categories change

  // [UPDATE] Simplified toggle handler
  const handleTrackerToggle = async (enabled, settingKey) => {
    try {
      await privacyManager.updateSetting(settingKey, enabled, siteData.url || url);
      setTrackerSettings((prev) => ({ ...prev, [settingKey]: enabled, }));
      
      const categoryName = settingKey.replace('block', '').replace('Trackers', '');
      const action = enabled ? "blocking" : "allowing";
      console.log(`Updated setting: Now ${action} ${categoryName} trackers.`);

    } catch (error) {
      console.error(`Failed to toggle ${settingKey}:`, error);
      throw error;
    }
  };

  // [UPDATE] Dynamically calculate privacy improvement across all categories
  const getPrivacyImprovement = () => {
    const totalTrackers = Object.values(trackers).reduce((sum, count) => sum + count, 0);

    if (totalTrackers === 0) {
      return { improvement: 100, message: "No trackers detected", level: "excellent", color: "green", blockedCount: 0, totalCount: 0 };
    }

    let blockedEstimate = 0;
    trackerCategories.forEach(category => {
      const settingKey = `block${category.replace(/[^a-zA-Z0-9]/g, "")}Trackers`;
      if (trackerSettings[settingKey]) {
        blockedEstimate += trackers[category] || 0;
      }
    });

    const improvement = totalTrackers > 0 ? Math.round((blockedEstimate / totalTrackers) * 100) : 0;
    let level = "minimal", color = "red";
    if (improvement >= 75) { level = "excellent"; color = "green"; }
    else if (improvement >= 50) { level = "good"; color = "blue"; }
    else if (improvement >= 25) { level = "moderate"; color = "yellow"; }

    return {
      improvement,
      message: improvement > 0 ? `Blocking ${blockedEstimate}/${totalTrackers} trackers (${improvement}% protection)` : "Enable blocking to improve privacy",
      level,
      color,
      blockedCount: blockedEstimate,
      totalCount: totalTrackers,
    };
  };

  const privacyStats = getPrivacyImprovement();

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
      <div className="min-h-[500px] flex flex-col items-center justify-center">
        <LoadingSpinner message="Loading privacy controls..." />
      </div>
    );
  }

  return (
    <div className="min-h-[500px] flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <ModernHeader score={grade} isAnalyzing={false} />

      <div className="flex-1 p-4 space-y-4">
        {/* Summary Section remains the same */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {summary} on{" "}
                        <span className="font-semibold text-gray-900 bg-blue-50 px-2 py-1 rounded-lg">
                            {getHostname(url)}
                        </span>
                    </p>
                    {simplifiedPolicy && (
                        <p className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                            {simplifiedPolicy}
                        </p>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Category:</span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                            {category}
                        </span>
                    </div>
                </div>
            </div>
        </div>

        {/* Privacy Status section remains the same */}
        <div
          className={`bg-white rounded-2xl border-2 p-4 shadow-sm transition-all duration-500 ${
            privacyStats.color === "green"
              ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
              : privacyStats.color === "blue"
              ? "border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50"
              : privacyStats.color === "yellow"
              ? "border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
              : "border-red-200 bg-gradient-to-br from-red-50 to-pink-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Privacy Protection Level
              </p>
              <p className="text-xs text-gray-600">{privacyStats.message}</p>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold transition-colors duration-500 ${
                  privacyStats.color === "green" ? "text-green-600" : "text-red-600"
                }`}
              >
                {privacyStats.improvement}%
              </div>
              <div className="text-xs text-gray-500">Protected</div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* [UPDATE] Tracker Blocking Section is now DYNAMIC */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Tracker Blocking
            </h2>
          </div>

          <div className="space-y-3">
            {trackerCategories.length > 0 ? (
              trackerCategories.map((category) => {
                const settingKey = `block${category.replace(/[^a-zA-Z0-9]/g, '')}Trackers`;
                const details = categoryDetails[category] || categoryDetails.Unknown;
                return (
                  <ModernToggle
                    key={settingKey}
                    icon={getIcon(details.icon)}
                    label={`Block ${category} Trackers`}
                    description={details.description}
                    count={trackers[category] || 0}
                    initialState={trackerSettings[settingKey] || false}
                    settingKey={settingKey}
                    onToggle={handleTrackerToggle}
                    disabled={(trackers[category] || 0) === 0}
                  />
                );
              })
            ) : (
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">No trackers were detected on this page. Excellent privacy!</p>
              </div>
            )}
          </div>
        </div>

        {/* Tracker Summary remains mostly the same but uses dynamic total */}
        <div
          className={`bg-white rounded-2xl border-2 p-4 shadow-sm transition-all duration-300 ${
            privacyStats.improvement > 0
              ? "border-green-200 bg-gradient-to-br from-green-50 to-emerald-50"
              : "border-gray-200 bg-gray-50"
          }`}
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium text-gray-700">
              Total Trackers Found:
            </span>
            <span className="font-bold text-gray-900">
              {privacyStats.totalCount}
            </span>
          </div>

          {privacyStats.improvement > 0 && privacyStats.totalCount > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-sm">🛡️</span>
                <span className="text-xs font-medium">
                  {privacyStats.improvement}% protection active
                </span>
              </div>
            </div>
          ) : (
             <div className="flex items-center gap-2 text-gray-600">
               <span className="text-sm">⚠️</span>
               <span className="text-xs">
                 Enable tracker blocking to improve privacy
               </span>
             </div>
          )}
        </div>

        {/* Footer Button remains the same */}
        <button
          onClick={() => onNavigate && onNavigate("fullReport")}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl"
        >
          View Full Privacy Report
        </button>

        {/* Extension Status remains the same */}
        <div className="text-center bg-white rounded-xl border border-gray-200 p-3">
          <p className="text-xs text-gray-600 font-medium">
            DataGuardian Extension •
            <span
              className={`ml-1 font-semibold ${
                typeof chrome !== "undefined"
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {typeof chrome !== "undefined" ? "Active" : "Standalone Mode"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PopupView;
