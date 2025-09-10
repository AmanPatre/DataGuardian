import React, { useState } from "react";
import PopupView from "./pages/PopupView";
import FullReportView from "./pages/FullReportView";

//Placeholder Data
const siteData = {
  url: "GlobalNewsDaily.com",
  score: "C-",
  summary:
    "This site uses 25 trackers and shares your activity with 18 third-party companies, including data brokers.",
  trackers: {
    ad: 15,
    analytics: 10,
    social: 3,
  },
  permissions: {
    location: true,
    notifications: true,
    cookies: false,
  },
};

function App() {
  // State to manage which view is currently visible
  const [currentView, setCurrentView] = useState("popup"); // 'popup' or 'fullReport'

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  // Conditionally render the view based on the state
  return (
    <div className="w-[400px] bg-gray-50 text-gray-800">
      {currentView === "popup" ? (
        <PopupView siteData={siteData} onNavigate={navigateTo} />
      ) : (
        <FullReportView siteData={siteData} onNavigate={navigateTo} />
      )}
    </div>
  );
}

export default App;
