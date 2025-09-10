import { useState } from "react";

const ToggleAction = ({ icon, label, initialState = false }) => {
  const [isOn, setIsOn] = useState(initialState);

  const toggleSwitch = () => setIsOn(!isOn);

  return (
    <div className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3">
        {icon}
        <span className="font-medium text-gray-700 text-sm">{label}</span>
      </div>
      <button
        onClick={toggleSwitch}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
          isOn ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ${
            isOn ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

export default ToggleAction;
