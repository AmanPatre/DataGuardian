import ToggleAction from "../components/ToggleAction";
import {
  BellAlertIcon,
  WifiIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline";

const PrivacyControls = ({ permissions = {} }) => {
  return (
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
        <strong>Tip:</strong> Blocking trackers may affect website functionality
        but improves your privacy.
      </div>
    </div>
  );
};

export default PrivacyControls;
