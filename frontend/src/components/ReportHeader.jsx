import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import Header from "../components/Header";

const ReportHeader = ({ grade, url, onNavigate }) => {
  return (
    <>
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
    </>
  );
};

export default ReportHeader;
