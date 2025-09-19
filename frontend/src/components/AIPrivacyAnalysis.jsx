import {
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  BuildingOfficeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

const AIPrivacyAnalysis = ({ aiSummary, simplifiedPolicy }) => {
  const hasAISummary = aiSummary && aiSummary.success && aiSummary.summary;

  if (!hasAISummary) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="font-bold text-md mb-3 flex items-center gap-2">
          <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
          AI Privacy Analysis
        </h2>
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
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
      <h2 className="font-bold text-md mb-3 flex items-center gap-2">
        <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-600" />
        AI Privacy Analysis
      </h2>

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
            {aiSummary.summary.howLongTheyKeep || "Information not available"}
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
    </div>
  );
};

export default AIPrivacyAnalysis;
