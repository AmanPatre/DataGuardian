import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import ToggleAction from "../components/ToggleAction";
import { PrivacyManager } from "../utils/privacyManager";
import {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

const PopupView = ({ siteData = {}, onNavigate }) => {
  const [privacyManager] = useState(new PrivacyManager());
  const [trackerSettings, setTrackerSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const {
    score = "N/A",
    summary = "No summary available.",
    url = "Unknown site",
    simplifiedPolicy = "",
    category = "Unknown",
    trackers = { ad: 0, analytics: 0, social: 0 },
    grade = "F",
  } = siteData;

  // Load current tracker blocking settings
  useEffect(() => {
    const loadTrackerSettings = async () => {
      setIsLoading(true);
      try {
        await privacyManager.loadSettings();

        const settings = {
          blockAdTrackers: privacyManager.getSetting("blockAdTrackers"),
          blockAnalyticsTrackers: privacyManager.getSetting(
            "blockAnalyticsTrackers"
          ),
          blockSocialTrackers: privacyManager.getSetting("blockSocialTrackers"),
        };

        setTrackerSettings(settings);
      } catch (error) {
        console.error("Failed to load tracker settings:", error);
        // Fallback to default settings
        setTrackerSettings({
          blockAdTrackers: true,
          blockAnalyticsTrackers: true,
          blockSocialTrackers: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadTrackerSettings();
  }, [privacyManager]);

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

  // Handle tracker toggle
  const handleTrackerToggle = async (enabled, settingKey) => {
    try {
      await privacyManager.updateSetting(settingKey, enabled);

      // Show notification with specific details
      const trackerTypes = {
        blockAdTrackers: "advertising",
        blockAnalyticsTrackers: "analytics",
        blockSocialTrackers: "social media",
      };

      const trackerType = trackerTypes[settingKey];
      const action = enabled ? "blocking" : "allowing";

      privacyManager.showPrivacyNotification(
        `Now ${action} ${trackerType} trackers on this site`
      );

      // Update local state
      setTrackerSettings((prev) => ({
        ...prev,
        [settingKey]: enabled,
      }));
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
      return { improvement: 0, message: "No trackers detected" };
    }

    const blockedEstimate =
      (trackerSettings.blockAdTrackers ? trackers.ad || 0 : 0) +
      (trackerSettings.blockAnalyticsTrackers ? trackers.analytics || 0 : 0) +
      (trackerSettings.blockSocialTrackers ? trackers.social || 0 : 0);

    const improvement = Math.round((blockedEstimate / totalTrackers) * 100);

    return {
      improvement,
      message:
        improvement > 0
          ? `Blocking ${blockedEstimate}/${totalTrackers} trackers (${improvement}% protection)`
          : "Enable blocking to improve privacy",
    };
  };

  const privacyStats = getPrivacyImprovement();

  // Helper function to safely get hostname
  const getHostname = (urlString) => {
    try {
      if (!urlString || urlString === "Unknown site") return "this site";
      return new URL(urlString).hostname;
    } catch (error) {
      return "this site";
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        <Header score={grade} />
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-700">Loading privacy controls...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <Header score={grade} />

      {/* Summary Section */}
      <div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {summary} on{" "}
          <strong className="font-semibold text-gray-900">
            {getHostname(url)}
          </strong>
        </p>
        {simplifiedPolicy && (
          <p className="mt-2 text-xs italic text-gray-500">
            {simplifiedPolicy}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-700 font-semibold">
          Category: {category}
        </p>
      </div>

      {/* Privacy Status */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">
              Privacy Protection
            </p>
            <p className="text-xs text-gray-600">{privacyStats.message}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {privacyStats.improvement}%
            </div>
            <div className="text-xs text-gray-500">Protected</div>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-md font-bold text-gray-900 mb-2">
          Tracker Blocking
        </h2>
        <div className="flex flex-col gap-3">
          <ToggleAction
            icon={<BugAntIcon className="w-6 h-6 text-red-500" />}
            label={`Block Ad Trackers (${trackers.ad ?? 0})`}
            description="Block advertising and marketing trackers"
            initialState={trackerSettings.blockAdTrackers ?? false}
            settingKey="blockAdTrackers"
            onToggle={handleTrackerToggle}
            disabled={trackers.ad === 0}
          />
          <ToggleAction
            icon={<ChartPieIcon className="w-6 h-6 text-blue-500" />}
            label={`Block Analytics Trackers (${trackers.analytics ?? 0})`}
            description="Block website analytics and user behavior tracking"
            initialState={trackerSettings.blockAnalyticsTrackers ?? false}
            settingKey="blockAnalyticsTrackers"
            onToggle={handleTrackerToggle}
            disabled={trackers.analytics === 0}
          />
          <ToggleAction
            icon={<ShareIcon className="w-6 h-6 text-indigo-500" />}
            label={`Block Social Trackers (${trackers.social ?? 0})`}
            description="Block social media widgets and tracking"
            initialState={trackerSettings.blockSocialTrackers ?? false}
            settingKey="blockSocialTrackers"
            onToggle={handleTrackerToggle}
            disabled={trackers.social === 0}
          />
        </div>

        {/* Tracker Summary */}
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
          <div className="flex justify-between items-center">
            <span>Total Trackers Found:</span>
            <span className="font-semibold">
              {(trackers.ad || 0) +
                (trackers.analytics || 0) +
                (trackers.social || 0)}
            </span>
          </div>
          {privacyStats.improvement > 0 && (
            <div className="mt-1 text-green-600">
              ✓ {privacyStats.improvement}% of trackers will be blocked
            </div>
          )}
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Footer Button */}
      <button
        onClick={() => onNavigate && onNavigate("fullReport")}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        View Full Privacy Report
      </button>

      {/* Extension Status */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          DataGuardian Extension •
          <span
            className={`ml-1 ${
              typeof chrome !== "undefined" ? "text-green-600" : "text-red-600"
            }`}
          >
            {typeof chrome !== "undefined" ? "Active" : "Standalone Mode"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default PopupView;
