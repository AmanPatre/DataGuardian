import React, { useState, useEffect } from "react";
import ModernHeader from "../components/ModernHeader";
import ModernToggle from "../components/ModernToggle";
import AIPrivacyAnalysis from "../components/AIPrivacyAnalysis";
import TrackerNetworkVisualization from "../components/TrackerNetworkVisualization";
import { PrivacyManager } from "../utils/privacyManager";
import {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
  ServerIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ChevronDownIcon,
  ListBulletIcon,
} from "@heroicons/react/24/outline";

// Helper object to map category names to their UI properties
const categoryDetails = {
  Advertising: {
    icon: "BugAntIcon",
    description: "Block advertising and marketing trackers",
  },
  Analytics: {
    icon: "ChartPieIcon",
    description: "Block website analytics and behavior tracking",
  },
  Social: {
    icon: "ShareIcon",
    description: "Block social media widgets and tracking",
  },
  "CDN/Utility": {
    icon: "ServerIcon",
    description: "Block content delivery and utility scripts",
  },
  "Tag Manager": {
    icon: "TagIcon",
    description: "Block third-party script loaders",
  },
  Unknown: {
    icon: "QuestionMarkCircleIcon",
    description: "Block trackers of unknown category",
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

// [UI-ENHANCEMENT] A new collapsible section component to organize the report
const CollapsibleSection = ({ title, icon, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-all duration-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <h2 className="flex items-center gap-3 font-bold text-lg text-gray-800">
          {icon}
          {title}
        </h2>
        <ChevronDownIcon
          className={`w-6 h-6 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 border-t border-gray-200">{children}</div>
      )}
    </div>
  );
};

const FullReportView = ({ siteData = {}, onNavigate }) => {
  const { url, grade, trackers = {}, aiSummary, simplifiedPolicy } = siteData;
  const trackerCategories = Object.keys(trackers);

  const [privacyManager] = useState(new PrivacyManager());
  const [trackerSettings, setTrackerSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Group tracker domains by category for the new detailed list
  const groupedTrackers = (aiSummary?.trackerDetails || []).reduce(
    (acc, tracker) => {
      const category = tracker.category || "Unknown";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(tracker);
      return acc;
    },
    {}
  );

  // Load settings for all detected tracker categories - Functionality is identical
  useEffect(() => {
    const loadTrackerSettings = async () => {
      setIsLoading(true);
      try {
        await privacyManager.loadSettings(url);
        const settings = {};
        trackerCategories.forEach((category) => {
          const settingKey = `block${category.replace(
            /[^a-zA-Z0-9]/g,
            ""
          )}Trackers`;
          settings[settingKey] = privacyManager.getSetting(settingKey);
        });
        setTrackerSettings(settings);
      } catch (error) {
        console.error("Failed to load tracker settings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (trackerCategories.length > 0) loadTrackerSettings();
    else setIsLoading(false);
  }, [privacyManager, url, Object.keys(trackers).join(",")]);

  // Handle toggling tracker categories - Functionality is identical
  const handleTrackerToggle = async (enabled, settingKey) => {
    try {
      await privacyManager.updateSetting(settingKey, enabled, url);
      setTrackerSettings((prev) => ({ ...prev, [settingKey]: enabled }));
    } catch (error) {
      console.error(`Failed to toggle ${settingKey}:`, error);
    }
  };

  // Refresh category toggles from storage (used after mode changes)
  const refreshCategoryToggles = async () => {
    try {
      await privacyManager.loadSettings(url);
      const settings = {};
      trackerCategories.forEach((category) => {
        const settingKey = `block${category.replace(
          /[^a-zA-Z0-9]/g,
          ""
        )}Trackers`;
        settings[settingKey] = privacyManager.getSetting(settingKey);
      });
      setTrackerSettings(settings);
    } catch {
      // ignore
    }
  };

  // Listen for mode change and refresh UI switches
  useEffect(() => {
    const handler = (evt) => {
      if (evt?.detail?.mode) {
        refreshCategoryToggles();
      }
    };
    window.addEventListener("privacyModeChanged", handler);
    return () => window.removeEventListener("privacyModeChanged", handler);
  }, [url, trackerCategories.join(",")]);

  return (
    <div
      className="min-h-screen bg-gray-100 no-scrollbar overflow-y-auto"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      <div className="relative">
        {/* Back button to return to popup view */}
        <button
          onClick={() => onNavigate && onNavigate("popup")}
          className="absolute top-3 left-3 z-10 p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Back to summary"
        >
          {/* Using a simple unicode arrow to avoid new imports */}
          <span className="text-gray-700 text-xl leading-none">←</span>
        </button>
        <ModernHeader score={grade} isAnalyzing={false} />
      </div>

      <div className="p-4 md:p-6 space-y-6">
        {/* AI Privacy Analysis */}
        <CollapsibleSection
          title="AI-Powered Privacy Summary"
          icon={<InformationCircleIcon className="w-6 h-6 text-blue-600" />}
          defaultOpen={true}
        >
          <div className="pt-4">
            {aiSummary && aiSummary.summary ? (
              <AIPrivacyAnalysis
                aiSummary={aiSummary}
                simplifiedPolicy={simplifiedPolicy}
              />
            ) : (
              <p className="text-gray-600">
                The AI privacy summary could not be generated for this website.
              </p>
            )}
          </div>
        </CollapsibleSection>

        {/* Tracker Blocking Controls */}
        <CollapsibleSection
          title="Privacy Controls"
          icon={<ShieldCheckIcon className="w-6 h-6 text-blue-600" />}
          defaultOpen={true}
        >
          <div className="space-y-3 pt-4">
            {isLoading ? (
              <p className="text-center text-gray-500 py-4">
                Loading controls...
              </p>
            ) : trackerCategories.length > 0 ? (
              trackerCategories.map((category) => {
                const settingKey = `block${category.replace(
                  /[^a-zA-Z0-9]/g,
                  ""
                )}Trackers`;
                const details =
                  categoryDetails[category] || categoryDetails.Unknown;
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
                <p className="text-sm font-medium text-green-800">
                  No trackers were detected on this page!
                </p>
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Data Flow Visualization */}
        <CollapsibleSection
          title="Tracker Network Visualization"
          icon={<ShareIcon className="w-6 h-6 text-blue-600" />}
          defaultOpen={false}
        >
          <TrackerNetworkVisualization
            trackerDetails={aiSummary?.trackerDetails || []}
            siteUrl={url}
          />
        </CollapsibleSection>

        {/* [UI-ENHANCEMENT] New section for a detailed list of all trackers */}
        <CollapsibleSection
          title="Detailed Tracker List"
          icon={<ListBulletIcon className="w-6 h-6 text-blue-600" />}
          defaultOpen={false}
        >
          <div className="pt-4 space-y-4">
            {Object.keys(groupedTrackers).length > 0 ? (
              Object.keys(groupedTrackers).map((category) => (
                <div key={category}>
                  <h3 className="font-semibold text-gray-700 mb-2 border-b pb-1">
                    {category}
                  </h3>
                  <ul className="space-y-1">
                    {groupedTrackers[category].map((tracker) => (
                      <li
                        key={tracker.domain}
                        className="text-sm text-gray-800 font-mono bg-gray-50 p-2 rounded flex justify-between items-center"
                      >
                        <span>{tracker.domain}</span>
                        <span className="text-gray-400 font-sans text-xs bg-white px-2 py-1 rounded-full">
                          {tracker.company}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            ) : (
              <p className="text-gray-600">
                No specific tracker domains were identified.
              </p>
            )}
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default FullReportView;
