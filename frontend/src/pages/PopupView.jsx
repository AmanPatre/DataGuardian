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
  Unknown: { icon: "QuestionMarkCircleIcon", color: "bg-gray-100 text-gray-700" },
};

// Helper function to get the correct icon component from its name string
const icons = { BugAntIcon, ChartPieIcon, ShareIcon, ServerIcon, TagIcon, QuestionMarkCircleIcon };
const getIcon = (iconName) => {
  const IconComponent = icons[iconName];
  return IconComponent ? <IconComponent className="w-5 h-5" /> : <QuestionMarkCircleIcon className="w-5 h-5" />;
};

// A more compact and refined Privacy Meter
const PrivacyMeter = ({ protectionLevel }) => {
    const percentage = Math.max(0, Math.min(100, protectionLevel));
    const radius = 28;
    const circumference = 2 * Math.PI * radius; 
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const getColor = (level) => {
        if (level < 33) return "stroke-red-500";
        if (level < 66) return "stroke-amber-500";
        return "stroke-green-500";
    };
    const getTextColor = (level) => {
        if (level < 33) return "text-red-500";
        if (level < 66) return "text-amber-500";
        return "text-green-500";
    }

    return (
        <div className="relative flex items-center justify-center w-28 h-28 mx-auto">
            <svg className="w-full h-full" viewBox="0 0 72 72">
                <circle className="text-gray-200" strokeWidth="8" stroke="currentColor" fill="transparent" r={radius} cx="36" cy="36"/>
                <circle
                    className={`transition-all duration-700 ease-in-out ${getColor(percentage)}`}
                    strokeWidth="8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="36"
                    cy="36"
                    style={{
                        strokeDasharray: circumference,
                        strokeDashoffset,
                        transform: 'rotate(-90deg)',
                        transformOrigin: '50% 50%',
                    }}
                />
            </svg>
            <div className="absolute text-center">
                <span className={`text-2xl font-bold ${getTextColor(percentage)}`}>{percentage}%</span>
                <p className="text-xs text-gray-500 uppercase font-semibold">Protected</p>
            </div>
        </div>
    );
};

// A compact version of the AI Analysis for the popup
const CompactAIPrivacyAnalysis = ({ summary }) => {
    if (!summary || !summary.whatTheyCollect) {
        return <p className="text-xs text-center text-gray-500 py-2">AI summary is not available for this site.</p>;
    }

    const renderSection = (title, data, icon) => {
        if (!data || data.length === 0) return null;
        return (
             <div className="flex items-start gap-2 text-xs">
                {icon}
                <p><span className="font-semibold">{title}:</span> {data.join(', ')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-2 text-left">
            {renderSection("Collects", summary.whatTheyCollect, <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0"/>)}
            {renderSection("Shares With", summary.whoTheyShareWith, <BuildingOfficeIcon className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0"/>)}
            {renderSection("Key Risks", summary.keyRisks, <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0"/>)}
        </div>
    )
}


const PopupView = ({ siteData = {}, onNavigate }) => {
  const [privacyManager] = useState(new PrivacyManager());
  const [trackerSettings, setTrackerSettings] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const {
    url = "Unknown site",
    trackers = {},
    grade = "F",
    aiSummary
  } = siteData;

  const trackerCategories = Object.keys(trackers);
  const totalTrackers = Object.values(trackers).reduce((sum, count) => sum + count, 0);

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
  
  const getPrivacyImprovement = () => {
    if (totalTrackers === 0) {
      return { protectionLevel: 100, message: "No trackers detected!" };
    }

    let blockedEstimate = 0;
    trackerCategories.forEach(category => {
      const settingKey = `block${category.replace(/[^a-zA-Z0-9]/g, "")}Trackers`;
      if (trackerSettings[settingKey]) {
        blockedEstimate += trackers[category] || 0;
      }
    });

    const protectionLevel = totalTrackers > 0 ? Math.round((blockedEstimate / totalTrackers) * 100) : 0;
    const message = protectionLevel > 0 ? `${blockedEstimate} of ${totalTrackers} trackers blocked` : "Protection is available";

    return { protectionLevel, message };
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
      return <div className="w-[400px] flex items-center justify-center p-4"><LoadingSpinner /></div>
  }

  return (
    <div className="w-[400px] flex flex-col bg-gray-50">
      <ModernHeader score={grade} isAnalyzing={false} />

      <div className="flex-1 p-4 space-y-3">
        
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm text-center">
            <h2 className="text-sm font-semibold text-gray-800">Privacy Protection Level</h2>
            <PrivacyMeter protectionLevel={privacyStats.protectionLevel} />
            <p className="text-xs text-gray-500 -mt-2">{privacyStats.message}</p>
        </div>


        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                    <SparklesIcon className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                    <p className="text-sm font-semibold text-gray-800">AI Privacy Snapshot</p>
                    <p className="text-xs text-gray-500">Summary for {getHostname(url)}</p>
                </div>
            </div>
            <CompactAIPrivacyAnalysis summary={aiSummary?.summary} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
             <div className="flex justify-between items-center mb-3">
                <h2 className="text-sm font-semibold text-gray-800">Trackers Detected</h2>
                <span className="text-sm font-bold bg-gray-100 text-gray-700 px-2 py-1 rounded-full">{totalTrackers} Total</span>
            </div>
            <div className="space-y-2">
                {trackerCategories.length > 0 ? (
                    trackerCategories.map((category) => {
                        const details = categoryDetails[category] || categoryDetails.Unknown;
                        return (
                            <div key={category} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className={`p-1 rounded-full ${details.color}`}>
                                        {getIcon(details.icon)}
                                    </span>
                                    <span className="text-gray-700">{category}</span>
                                </div>
                                <span className="font-medium text-gray-800">{trackers[category]}</span>
                            </div>
                        );
                    })
                ) : (
                     <div className="text-center py-3">
                        <p className="text-sm font-medium text-green-700">No trackers were detected on this page!</p>
                    </div>
                )}
            </div>
        </div>

        <button
          onClick={() => onNavigate && onNavigate("fullReport")}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          View Full Report & Controls
          <ArrowRightCircleIcon className="w-5 h-5"/>
        </button>
      </div>
    </div>
  );
};

export default PopupView;

