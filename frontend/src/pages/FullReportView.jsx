import ReportHeader from "../components/ReportHeader";
import AIPrivacyAnalysis from "../components/AIPrivacyAnalysis";
import DataFlowVisualization from "../components/DataFlowVisualization";
import PrivacyControls from "../components/PrivacyControls";
import AnalysisSummary from "../components/AnalysisSummary";

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

  // Prepare tracker details for visualization
  const trackerDetails = aiSummary?.trackerDetails || [];

  return (
    <div className="p-4 flex flex-col gap-4 max-h-96 overflow-y-auto">
      <ReportHeader grade={grade} url={url} onNavigate={onNavigate} />

      <AIPrivacyAnalysis
        aiSummary={aiSummary}
        simplifiedPolicy={simplifiedPolicy}
      />

      <DataFlowVisualization
        url={url}
        trackerDetails={trackerDetails}
        aiSummary={aiSummary}
        trackerCount={trackerCount}
      />

      <PrivacyControls permissions={permissions} />

      <AnalysisSummary
        score={score}
        grade={grade}
        trackerCount={trackerCount}
        aiSummary={aiSummary}
      />
    </div>
  );
};

export default FullReportView;
