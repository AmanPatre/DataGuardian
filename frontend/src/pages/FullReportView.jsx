import React, { useState, useEffect } from "react";
import ReportHeader from "../components/ReportHeader";
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
  InformationCircleIcon
} from "@heroicons/react/24/outline";

// Helper object to map category names to their UI properties
const categoryDetails = {
  Advertising: { icon: "BugAntIcon", description: "Block advertising and marketing trackers" },
  Analytics: { icon: "ChartPieIcon", description: "Block website analytics and behavior tracking" },
  Social: { icon: "ShareIcon", description: "Block social media widgets and tracking" },
  "CDN/Utility": { icon: "ServerIcon", description: "Block content delivery and utility scripts" },
  "Tag Manager": { icon: "TagIcon", description: "Block third-party script loaders" },
  Unknown: { icon: "QuestionMarkCircleIcon", description: "Block trackers of unknown category" },
};

// Helper function to get the correct icon component from its name string
const icons = { BugAntIcon, ChartPieIcon, ShareIcon, ServerIcon, TagIcon, QuestionMarkCircleIcon };
const getIcon = (iconName) => {
  const IconComponent = icons[iconName];
  return IconComponent ? <IconComponent className="w-5 h-5" /> : <QuestionMarkCircleIcon className="w-5 h-5" />;
};

// A simple container for sections of the report
const ReportSection = ({ title, icon, children }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-4 border-b border-gray-200">
                <h2 className="flex items-center gap-2 font-bold text-lg text-gray-800">
                    {icon}
                    {title}
                </h2>
            </div>
            <div className="p-4">
                {children}
            </div>
        </div>
    );
};


const FullReportView = ({ siteData = {}, onNavigate }) => {
  const { url, grade, trackers = {}, aiSummary, simplifiedPolicy } = siteData;
  const trackerCategories = Object.keys(trackers);
  
  const [privacyManager] = useState(new PrivacyManager());
  const [trackerSettings, setTrackerSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load settings for all detected tracker categories
  useEffect(() => {
    const loadTrackerSettings = async () => {
      setIsLoading(true);
      try {
        await privacyManager.loadSettings(url);
        const settings = {};
        trackerCategories.forEach(category => {
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
    if (trackerCategories.length > 0) loadTrackerSettings();
    else setIsLoading(false);
  }, [privacyManager, url, Object.keys(trackers).join(',')]);

  // Handle toggling tracker categories
  const handleTrackerToggle = async (enabled, settingKey) => {
    try {
      await privacyManager.updateSetting(settingKey, enabled, url);
      setTrackerSettings((prev) => ({ ...prev, [settingKey]: enabled }));
    } catch (error) {
      console.error(`Failed to toggle ${settingKey}:`, error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ReportHeader score={grade} url={url} onNavigate={onNavigate} />

      <div className="p-4 space-y-6">
       

        {/* AI Privacy Analysis - YOUR ORIGINAL COMPONENT, FULLY PRESERVED */}
        <ReportSection title="AI-Powered Privacy Summary" icon={<InformationCircleIcon className="w-6 h-6 text-blue-600"/>}>
            {/* [FIXED] Changed prop name from "analysis" to "aiSummary" to match the child component */}
            {aiSummary ? (
                 <AIPrivacyAnalysis aiSummary={aiSummary} simplifiedPolicy={simplifiedPolicy}/>
            ) : (
                <p className="text-gray-600">The AI privacy summary could not be generated for this website.</p>
            )}
        </ReportSection>
        
        {/* Data Flow Visualization */}
        <ReportSection title="Tracker Network" icon={<ShareIcon className="w-6 h-6 text-blue-600"/>}>
             <TrackerNetworkVisualization trackerDetails={aiSummary?.trackerDetails || []} siteUrl={url} />
        </ReportSection>

         {/* Tracker Blocking Controls - NOW FULLY FUNCTIONAL */}
        <ReportSection title="Privacy Controls" icon={<ShieldCheckIcon className="w-6 h-6 text-blue-600"/>}>
            <div className="space-y-3">
                {isLoading ? <p className="text-center text-gray-500 py-4">Loading controls...</p> :
                    trackerCategories.length > 0 ? (
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
                        <p className="text-sm font-medium text-green-800">No trackers were detected on this page!</p>
                    </div>
                    )}
            </div>
        </ReportSection>
      </div>
    </div>
  );
};

export default FullReportView;

