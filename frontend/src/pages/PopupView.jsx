import React from "react";
import Header from "../components/Header";
import ToggleAction from "../components/ToggleAction";
import {
  BugAntIcon,
  ChartPieIcon,
  ShareIcon,
} from "@heroicons/react/24/outline";

const PopupView = ({ siteData = {}, onNavigate }) => {
  const {
    score = "N/A",
    summary = "No summary available.",
    url = "Unknown site",
    simplifiedPolicy = "",
    category = "Unknown",
    trackers = { ad: 0, analytics: 0, social: 0 },
  } = siteData;

  return (
    <div className="p-4 flex flex-col gap-4">
      <Header score={score} />

      {/* Summary Section */}
      <div>
        <p className="text-sm text-gray-600 leading-relaxed">
          {summary} on <strong className="font-semibold text-gray-900">{url}</strong>
        </p>
        {simplifiedPolicy && (
          <p className="mt-2 text-xs italic text-gray-500">{simplifiedPolicy}</p>
        )}
        <p className="mt-1 text-xs text-gray-700 font-semibold">Category: {category}</p>
      </div>

      <hr className="border-gray-200" />

      {/* Quick Actions Section */}
      <div>
        <h2 className="text-md font-bold text-gray-900 mb-2">Quick Actions</h2>
        <div className="flex flex-col gap-3">
          <ToggleAction
            icon={<BugAntIcon className="w-6 h-6 text-red-500" />}
            label={`Block Ad Trackers (${trackers.ad ?? 0})`}
            initialState={true}
          />
          <ToggleAction
            icon={<ChartPieIcon className="w-6 h-6 text-blue-500" />}
            label={`Block Analytics Trackers (${trackers.analytics ?? 0})`}
            initialState={true}
          />
          <ToggleAction
            icon={<ShareIcon className="w-6 h-6 text-indigo-500" />}
            label={`Block Social Trackers (${trackers.social ?? 0})`}
            initialState={false}
          />
        </div>
      </div>

      <hr className="border-gray-200" />

      {/* Footer Button */}
      <button
        onClick={() => onNavigate && onNavigate("fullReport")}
        className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        View Full Report
      </button>
    </div>
  );
};

export default PopupView;
