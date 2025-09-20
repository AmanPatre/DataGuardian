import React, { useState, useEffect } from "react";
import ModernHeader from "../components/ModernHeader";
import ModernToggle from "../components/ModernToggle";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressIndicator from "../components/ProgressIndicator";
import { PrivacyManager } from "../utils/privacyManager";
import {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
  BoltIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

const PopupView = ({ siteData = {}, onNavigate }) => {
  const [privacyManager] = useState(new PrivacyManager());
  const [trackerSettings, setTrackerSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing] = useState(false);
  const [analysisProgress] = useState(1);

  const {
    summary = "No summary available.",
    url = "Unknown site",
    simplifiedPolicy = "",
    category = "Unknown",
    trackers = { ad: 0, analytics: 0, social: 0 },
    grade = "F",
  } = siteData;

  // Load current tracker blocking settings for this specific site
  useEffect(() => {
    const loadTrackerSettings = async () => {
      setIsLoading(true);
      try {
        // Load settings for the current site (using siteData.url)
        await privacyManager.loadSettings(siteData.url || url);

        const settings = {
          blockAdTrackers: privacyManager.getSetting("blockAdTrackers"),
          blockAnalyticsTrackers: privacyManager.getSetting(
            "blockAnalyticsTrackers"
          ),
          blockSocialTrackers: privacyManager.getSetting("blockSocialTrackers"),
        };

        setTrackerSettings(settings);
        console.log(
          `📋 Loaded site-specific settings for ${getHostname(url)}:`,
          settings
        );
      } catch (error) {
        console.error("Failed to load tracker settings:", error);
        // Fallback to default settings - ALLOW ALL by default
        setTrackerSettings({
          blockAdTrackers: false,
          blockAnalyticsTrackers: false,
          blockSocialTrackers: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTrackerSettings();
  }, [privacyManager, siteData.url, url]);

  // Listen for setting changes
  useEffect(() => {
    const handleSettingChange = (event) => {
      const { setting, value } = event.detail;
      if (setting.includes("Trackers")) {
        setTrackerSettings((prev) => ({
          ...prev,
          [setting]: value,
        }));
      }
    };

    window.addEventListener("privacySettingChanged", handleSettingChange);
    return () => {
      window.removeEventListener("privacySettingChanged", handleSettingChange);
    };
  }, []);

  // Handle tracker toggle for this specific site
  const handleTrackerToggle = async (enabled, settingKey) => {
    try {
      // Update setting for current site
      await privacyManager.updateSetting(
        settingKey,
        enabled,
        siteData.url || url
      );

      // Show notification with specific details
      const trackerTypes = {
        blockAdTrackers: "advertising",
        blockAnalyticsTrackers: "analytics",
        blockSocialTrackers: "social media",
      };

      const trackerType = trackerTypes[settingKey];
      const action = enabled ? "blocking" : "allowing";
      const siteName = getHostname(url);

      privacyManager.showPrivacyNotification(
        `Now ${action} ${trackerType} trackers on ${siteName}`
      );

      // Update local state
      setTrackerSettings((prev) => ({
        ...prev,
        [settingKey]: enabled,
      }));

      console.log(`🔄 Updated ${settingKey} to ${enabled} for ${siteName}`);
    } catch (error) {
      console.error(`Failed to toggle ${settingKey}:`, error);
      throw error;
    }
  };

  // Calculate privacy improvement
  const getPrivacyImprovement = () => {
    const totalTrackers =
      (trackers.ad || 0) + (trackers.analytics || 0) + (trackers.social || 0);

    if (totalTrackers === 0) {
      return {
        improvement: 0,
        message: "No trackers detected",
        level: "none",
        color: "gray",
      };
    }

    const blockedEstimate =
      (trackerSettings.blockAdTrackers ? trackers.ad || 0 : 0) +
      (trackerSettings.blockAnalyticsTrackers ? trackers.analytics || 0 : 0) +
      (trackerSettings.blockSocialTrackers ? trackers.social || 0 : 0);

    const improvement = Math.round((blockedEstimate / totalTrackers) * 100);

    let level = "minimal";
    let color = "red";

    if (improvement >= 75) {
      level = "excellent";
      color = "green";
    } else if (improvement >= 50) {
      level = "good";
      color = "blue";
    } else if (improvement >= 25) {
      level = "moderate";
      color = "yellow";
    }

    return {
      improvement,
      message:
        improvement > 0
          ? `Blocking ${blockedEstimate}/${totalTrackers} trackers (${improvement}% protection)`
          : "Enable blocking to improve privacy",
      level,
      color,
      blockedCount: blockedEstimate,
      totalCount: totalTrackers,
    };
  };

  const privacyStats = getPrivacyImprovement();

  // Helper function to safely get hostname
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
      <div className="min-h-[400px] flex flex-col">
        <ModernHeader score={grade} isAnalyzing={isAnalyzing} />
        <div className="flex-1 p-4">
          <LoadingSpinner message="Loading privacy controls..." size="medium" />
          {isAnalyzing && (
            <div className="mt-4">
              <ProgressIndicator
                currentStep={analysisProgress}
                totalSteps={3}
                steps={[
                  "Detecting Trackers",
                  "Analyzing Privacy",
                  "Loading Settings",
                ]}
                isVisible={true}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[500px] flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <ModernHeader score={grade} isAnalyzing={isAnalyzing} />

      <div className="flex-1 p-4 space-y-4">
        {/* Summary Section */}
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

        {/* Privacy Status */}
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
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    privacyStats.color === "green"
                      ? "bg-green-100 text-green-700"
                      : privacyStats.color === "blue"
                      ? "bg-blue-100 text-blue-700"
                      : privacyStats.color === "yellow"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {privacyStats.level.charAt(0).toUpperCase() +
                    privacyStats.level.slice(1)}
                </span>
                {privacyStats.improvement > 0 && (
                  <span className="text-xs text-gray-500">
                    🛡️ {privacyStats.blockedCount} of {privacyStats.totalCount}{" "}
                    blocked
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-2xl font-bold transition-colors duration-500 ${
                  privacyStats.color === "green"
                    ? "text-green-600"
                    : privacyStats.color === "blue"
                    ? "text-blue-600"
                    : privacyStats.color === "yellow"
                    ? "text-yellow-600"
                    : "text-red-600"
                }`}
              >
                {privacyStats.improvement}%
              </div>
              <div className="text-xs text-gray-500">Protected</div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Tracker Blocking Section */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BoltIcon className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              Tracker Blocking
            </h2>
          </div>

          <div className="space-y-3">
            <ModernToggle
              icon={<BugAntIcon className="w-5 h-5" />}
              label="Block Ad Trackers"
              description="Block advertising and marketing trackers"
              count={trackers.ad ?? 0}
              initialState={trackerSettings.blockAdTrackers ?? false}
              settingKey="blockAdTrackers"
              onToggle={handleTrackerToggle}
              disabled={trackers.ad === 0}
            />
            <ModernToggle
              icon={<ChartPieIcon className="w-5 h-5" />}
              label="Block Analytics Trackers"
              description="Block website analytics and user behavior tracking"
              count={trackers.analytics ?? 0}
              initialState={trackerSettings.blockAnalyticsTrackers ?? false}
              settingKey="blockAnalyticsTrackers"
              onToggle={handleTrackerToggle}
              disabled={trackers.analytics === 0}
            />
            <ModernToggle
              icon={<ShareIcon className="w-5 h-5" />}
              label="Block Social Trackers"
              description="Block social media widgets and tracking"
              count={trackers.social ?? 0}
              initialState={trackerSettings.blockSocialTrackers ?? false}
              settingKey="blockSocialTrackers"
              onToggle={handleTrackerToggle}
              disabled={trackers.social === 0}
            />
          </div>
        </div>

        {/* Tracker Summary */}
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
              {(trackers.ad || 0) +
                (trackers.analytics || 0) +
                (trackers.social || 0)}
            </span>
          </div>

          {privacyStats.improvement > 0 ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-green-700">
                <span className="text-sm">🛡️</span>
                <span className="text-xs font-medium">
                  {privacyStats.improvement}% protection active
                </span>
              </div>
              <div className="text-xs text-green-600">
                Blocking {privacyStats.blockedCount} of{" "}
                {privacyStats.totalCount} trackers
              </div>
              <div className="w-full bg-green-200 rounded-full h-1.5 mt-2">
                <div
                  className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${privacyStats.improvement}%` }}
                ></div>
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

        {/* Footer Button */}
        <button
          onClick={() => onNavigate && onNavigate("fullReport")}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-2xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl"
        >
          View Full Privacy Report
        </button>

        {/* Extension Status */}
        <div className="text-center bg-white rounded-xl border border-gray-200 p-3">
          <div className="flex items-center justify-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                typeof chrome !== "undefined" ? "bg-green-400" : "bg-red-400"
              }`}
            ></div>
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
    </div>
  );
};

export default PopupView;
