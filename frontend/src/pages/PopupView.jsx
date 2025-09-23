import React from "react";
import ModernHeader from "../components/ModernHeader";
import {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
  ServerIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  ArrowRightCircleIcon
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


const PopupView = ({ siteData = {}, onNavigate }) => {
  const {
    summary = "No summary available.",
    url = "Unknown site",
    trackers = {},
    grade = "F",
  } = siteData;

  const trackerCategories = Object.keys(trackers);
  const totalTrackers = Object.values(trackers).reduce((sum, count) => sum + count, 0);

  const getHostname = (urlString) => {
    try {
      if (!urlString || urlString === "Unknown site") return "this site";
      return new URL(urlString).hostname;
    } catch {
      return "this site";
    }
  };

  return (
    <div className="w-[400px] h-[550px] flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <ModernHeader score={grade} isAnalyzing={false} />

      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* AI Summary Section */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SparklesIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">AI Privacy Snapshot</p>
              <p className="text-sm text-gray-700 leading-relaxed mt-1">
                {summary} on{" "}
                <span className="font-semibold text-gray-900">
                  {getHostname(url)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Tracker Category Summary - REPLACES TOGGLES */}
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

        {/* Footer Button to navigate to the new "Control Center" */}
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

