import React from "react";
import Header from "../components/Header";
import ToggleAction from "../components/ToggleAction";
import {
  ArrowLeftIcon,
  MapIcon,
  ClipboardDocumentCheckIcon,
  BellAlertIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";

const FullReportView = ({ siteData, onNavigate }) => {
  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate("popup")}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Back to summary"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <Header score={siteData.score} />
      </div>

      <h1 className="text-xl font-bold text-center text-gray-900 -mt-4">
        Full Report for {siteData.url}
      </h1>

      {/* AI Summary Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-2 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="w-5 h-5" /> AI Privacy Policy
          Summary
        </h2>
        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
          <li>
            <strong>What They Collect:</strong> Browsing history, location data,
            device information.
          </li>
          <li>
            <strong>Who They Share With:</strong> Google, Meta, and 15 other ad
            partners.
          </li>
          <li>
            <strong>Key Risks:</strong> Your browsing habits can be used to
            build a political profile of you.
          </li>
        </ul>
      </div>

      {/* Data Flow Map Placeholder */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-2 flex items-center gap-2">
          <MapIcon className="w-5 h-5" /> Visual Data Flow Map
        </h2>
        <div className="text-center text-sm text-gray-500 py-6 bg-gray-50 rounded-md">
          [Interactive Map Coming Soon]
        </div>
      </div>

      {/* Centralized Consent Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-3">Centralized Consent Layer</h2>
        <div className="flex flex-col gap-3">
          <ToggleAction
            icon={<BellAlertIcon className="w-6 h-6 text-yellow-500" />}
            label="Allow Notifications"
            initialState={siteData.permissions.notifications}
          />
          <ToggleAction
            icon={<WifiIcon className="w-6 h-6 text-green-500" />}
            label="Allow Marketing Cookies"
            initialState={siteData.permissions.cookies}
          />
        </div>
      </div>
    </div>
  );
};

export default FullReportView;
