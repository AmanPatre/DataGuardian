import Header from "../components/Header";
import ToggleAction from "../components/ToggleAction";
import {
  ArrowLeftIcon,
  MapIcon,
  ClipboardDocumentCheckIcon,
  BellAlertIcon,
  WifiIcon,
  ShieldExclamationIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

const FullReportView = ({ siteData = {}, onNavigate }) => {
  const {
    score = "N/A",
    grade = "F",
    url = "Unknown site",
    simplifiedPolicy = "",
    trackerCount = 0,
    aiSummary = null,
    permissions = { notifications: false, cookies: false },
  } = siteData;

  const hasAISummary = aiSummary && aiSummary.success && aiSummary.summary;

  return (
    <div className="p-4 flex flex-col gap-4 max-h-96 overflow-y-auto">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate && onNavigate("popup")}
          className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Back to summary"
        >
          <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
        </button>
        <Header score={grade} />
      </div>

      <h1 className="text-lg font-bold text-center text-gray-900 -mt-4">
        Privacy Report for {new URL(url).hostname}
      </h1>

      {/* AI Privacy Policy Summary Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-3 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
          AI Privacy Analysis
        </h2>

        {hasAISummary ? (
          <div className="space-y-4">
            {/* What They Collect */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <InformationCircleIcon className="w-4 h-4 text-blue-500" />
                What They Collect:
              </h3>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                {aiSummary.summary.whatTheyCollect
                  ?.slice(0, 5)
                  .map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
              </ul>
            </div>

            {/* Who They Share With */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <BuildingOfficeIcon className="w-4 h-4 text-purple-500" />
                Who They Share With:
              </h3>
              <div className="flex flex-wrap gap-2">
                {aiSummary.summary.whoTheyShareWith
                  ?.slice(0, 6)
                  .map((company, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full"
                    >
                      {company}
                    </span>
                  ))}
                {aiSummary.summary.whoTheyShareWith?.length > 6 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{aiSummary.summary.whoTheyShareWith.length - 6} more
                  </span>
                )}
              </div>
            </div>

            {/* How Long They Keep It */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <ClockIcon className="w-4 h-4 text-orange-500" />
                Data Retention:
              </h3>
              <p className="text-sm text-gray-600 bg-orange-50 p-2 rounded">
                {aiSummary.summary.howLongTheyKeep ||
                  "Information not available"}
              </p>
            </div>

            {/* Key Privacy Risks */}
            <div>
              <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-red-500" />
                Privacy Risks:
              </h3>
              <ul className="list-disc list-inside text-sm text-red-600 space-y-1 bg-red-50 p-2 rounded">
                {aiSummary.summary.keyRisks?.slice(0, 4).map((risk, index) => (
                  <li key={index}>{risk}</li>
                ))}
              </ul>
            </div>

            {/* Tracker Breakdown */}
            {aiSummary.summary.trackerBreakdown?.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-800 mb-2 flex items-center gap-2">
                  <ShieldExclamationIcon className="w-4 h-4 text-yellow-500" />
                  Top Trackers Explained:
                </h3>
                <div className="space-y-2">
                  {aiSummary.summary.trackerBreakdown
                    .slice(0, 4)
                    .map((tracker, index) => (
                      <div
                        key={index}
                        className="text-xs bg-yellow-50 p-2 rounded border-l-2 border-yellow-400"
                      >
                        {tracker}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-gray-400 mb-2">
              <ClipboardDocumentCheckIcon className="w-8 h-8 mx-auto" />
            </div>
            <p className="text-sm text-gray-600">
              {aiSummary?.note || "AI analysis not available for this site"}
            </p>
            {simplifiedPolicy && (
              <p className="mt-2 text-xs text-gray-500 italic">
                {simplifiedPolicy}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Visual Data Flow Map */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-2 flex items-center gap-2">
          <MapIcon className="w-5 h-5 text-green-600" />
          Data Flow Visualization
        </h2>
        <div className="text-center py-4">
          <div className="flex items-center justify-center space-x-4 text-sm">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-blue-600 font-bold text-xs">YOU</span>
              </div>
              <span className="text-xs text-gray-600">Your Device</span>
            </div>

            <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs text-gray-500">
                {trackerCount} trackers
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-red-600 font-bold text-xs">
                  {new URL(url).hostname.slice(0, 3).toUpperCase()}
                </span>
              </div>
              <span className="text-xs text-gray-600">Website</span>
            </div>

            <div className="flex-1 border-t-2 border-dashed border-gray-300 relative">
              <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-white px-2 text-xs text-gray-500">
                shares with
              </span>
            </div>

            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-2">
                <span className="text-purple-600 font-bold text-xs">3RD</span>
              </div>
              <span className="text-xs text-gray-600">Partners</span>
            </div>
          </div>

          {hasAISummary && aiSummary.summary.whoTheyShareWith?.length > 0 && (
            <div className="mt-3 text-xs text-gray-500">
              <p>
                Your data flows to:{" "}
                {aiSummary.summary.whoTheyShareWith.slice(0, 3).join(", ")}
                {aiSummary.summary.whoTheyShareWith.length > 3 &&
                  ` and ${
                    aiSummary.summary.whoTheyShareWith.length - 3
                  } others`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Centralized Consent Section */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-3">Privacy Controls</h2>
        <div className="flex flex-col gap-3">
          <ToggleAction
            icon={<BellAlertIcon className="w-6 h-6 text-yellow-500" />}
            label="Block Notification Requests"
            initialState={permissions.notifications ?? false}
          />
          <ToggleAction
            icon={<WifiIcon className="w-6 h-6 text-blue-500" />}
            label="Block Marketing Cookies"
            initialState={permissions.cookies ?? false}
          />
          <ToggleAction
            icon={<ShieldExclamationIcon className="w-6 h-6 text-red-500" />}
            label="Block All Trackers"
            initialState={false}
          />
        </div>

        <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
          💡 <strong>Tip:</strong> Blocking trackers may affect website
          functionality but improves your privacy.
        </div>
      </div>

      {/* Analysis Info */}
      <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
        <div className="flex justify-between items-center">
          <span>
            Privacy Score: {score}/100 ({grade})
          </span>
          <span>{trackerCount} trackers detected</span>
        </div>
        {hasAISummary && (
          <div className="mt-1 text-center">
            <span className="inline-flex items-center">
              🤖 AI-powered analysis
              {!aiSummary.success && (
                <span className="ml-1 text-orange-600">(Limited)</span>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullReportView;
