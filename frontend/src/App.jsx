import React, { useState, useEffect } from "react";
import PopupView from "./pages/PopupView";
import FullReportView from "./pages/FullReportView";
import axios from "axios";

function categorizeTrackers(trackerDomains = []) {
  const categories = { ad: 0, analytics: 0, social: 0 };

  trackerDomains.forEach((domain) => {
    const d = domain.toLowerCase();
    if (
      d.includes("ads") ||
      d.includes("doubleclick") ||
      d.includes("adservice") ||
      d.includes("adnxs")
    ) {
      categories.ad++;
    } else if (
      d.includes("analytics") ||
      d.includes("googletagmanager") ||
      d.includes("mixpanel") ||
      d.includes("hotjar")
    ) {
      categories.analytics++;
    } else if (
      d.includes("facebook") ||
      d.includes("sharethis") ||
      d.includes("taboola") ||
      d.includes("twitter")
    ) {
      categories.social++;
    } else {
      categories.analytics++;
    }
  });

  return categories;
}

function App() {
  const [currentView, setCurrentView] = useState("popup");
  const [siteData, setSiteData] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading to try auto-detection
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState([]);
  const [manualUrl, setManualUrl] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  const addDebugInfo = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Try to auto-detect current tab URL on component mount
  useEffect(() => {
    const tryAutoDetection = async () => {
      addDebugInfo("🚀 Starting DataGuardian - trying auto-detection...");
      
      // Check if chrome extension APIs are available
      if (typeof chrome === 'undefined' || !chrome.tabs) {
        addDebugInfo("⚠️ Chrome APIs not available - falling back to manual input");
        setShowManualInput(true);
        setLoading(false);
        return;
      }

      try {
        // FIRST: Try to get current tab with DETAILED logging
        const tabs = await new Promise((resolve, reject) => {
          chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(tabs);
            }
          });
        });

        addDebugInfo(`📋 Found ${tabs?.length || 0} active tabs`);
        
        if (tabs && tabs.length > 0) {
          const tab = tabs[0];
          addDebugInfo(`🔍 Tab details:`);
          addDebugInfo(`   - ID: ${tab.id}`);
          addDebugInfo(`   - URL: ${tab.url || 'UNDEFINED'}`);
          addDebugInfo(`   - Title: ${tab.title || 'UNDEFINED'}`);
          addDebugInfo(`   - Status: ${tab.status}`);
          addDebugInfo(`   - WindowId: ${tab.windowId}`);

          // If URL is undefined, try to FORCE activeTab permission
          if (!tab.url) {
            addDebugInfo("🔧 URL is undefined - trying to trigger activeTab permission...");
            
            try {
              // Method 1: Execute a simple script to trigger activeTab
              if (chrome.scripting) {
                addDebugInfo("🎯 Attempting script injection to trigger activeTab...");
                
                await new Promise((resolve, reject) => {
                  chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => {
                      return {
                        url: window.location.href,
                        host: window.location.host,
                        pathname: window.location.pathname
                      };
                    }
                  }, (results) => {
                    if (chrome.runtime.lastError) {
                      addDebugInfo(`❌ Script injection failed: ${chrome.runtime.lastError.message}`);
                      reject(new Error(chrome.runtime.lastError.message));
                    } else {
                      addDebugInfo(`✅ Script injection successful!`);
                      if (results && results[0] && results[0].result) {
                        const pageInfo = results[0].result;
                        addDebugInfo(`🎯 Got page info from script: ${pageInfo.url}`);
                        resolve(pageInfo.url);
                      } else {
                        addDebugInfo(`⚠️ Script executed but no results returned`);
                        reject(new Error("No results from script"));
                      }
                    }
                  });
                });

                // If script injection worked, the URL should now be available
                const updatedTabs = await new Promise((resolve, reject) => {
                  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                    if (chrome.runtime.lastError) {
                      reject(new Error(chrome.runtime.lastError.message));
                    } else {
                      resolve(tabs);
                    }
                  });
                });

                if (updatedTabs[0]?.url) {
                  addDebugInfo(`🎯 SUCCESS! URL now available after script: ${updatedTabs[0].url}`);
                  analyzeUrl(updatedTabs[0].url, true);
                  return;
                } else {
                  addDebugInfo(`❌ URL still undefined after script injection`);
                }

              } else {
                addDebugInfo("❌ chrome.scripting API not available");
              }

            } catch (scriptError) {
              addDebugInfo(`❌ Script injection failed: ${scriptError.message}`);
            }

            // Method 2: Try using chrome.tabs.get() for more details
            addDebugInfo("🔧 Trying chrome.tabs.get() for more tab details...");
            try {
              const detailedTab = await new Promise((resolve, reject) => {
                chrome.tabs.get(tab.id, (tabInfo) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message));
                  } else {
                    resolve(tabInfo);
                  }
                });
              });

              addDebugInfo(`📋 Detailed tab info:`);
              addDebugInfo(`   - URL: ${detailedTab.url || 'STILL UNDEFINED'}`);
              addDebugInfo(`   - pendingUrl: ${detailedTab.pendingUrl || 'NONE'}`);
              
              if (detailedTab.url) {
                addDebugInfo(`🎯 Found URL via tabs.get(): ${detailedTab.url}`);
                analyzeUrl(detailedTab.url, true);
                return;
              } else if (detailedTab.pendingUrl) {
                addDebugInfo(`🎯 Using pendingUrl: ${detailedTab.pendingUrl}`);
                analyzeUrl(detailedTab.pendingUrl, true);
                return;
              }

            } catch (getError) {
              addDebugInfo(`❌ chrome.tabs.get() failed: ${getError.message}`);
            }

          } else if (tab.url) {
            addDebugInfo(`🎯 Auto-detected URL: ${tab.url}`);
            
            // Check if it's a valid URL we can analyze
            if (tab.url.startsWith('http://') || tab.url.startsWith('https://')) {
              addDebugInfo("✅ Valid HTTP/HTTPS URL detected - auto-analyzing...");
              analyzeUrl(tab.url, true);
              return;
            } else {
              addDebugInfo(`⚠️ Cannot analyze URL with protocol: ${tab.url.split(':')[0]}:`);
            }
          }
        } else {
          addDebugInfo("⚠️ No tabs found in query result");
        }

        // Method 3: Try broader tab query as last resort
        addDebugInfo("🔧 Trying broader tab query (all windows)...");
        const allTabs = await new Promise((resolve, reject) => {
          chrome.tabs.query({ active: true }, (tabs) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else {
              resolve(tabs);
            }
          });
        });

        addDebugInfo(`📊 Found ${allTabs?.length || 0} active tabs across all windows`);
        
        if (allTabs && allTabs.length > 0) {
          for (let i = 0; i < allTabs.length; i++) {
            const tab = allTabs[i];
            addDebugInfo(`   Tab ${i}: ${tab.url || 'NO_URL'} (Window: ${tab.windowId})`);
            
            if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
              addDebugInfo(`🎯 Using tab ${i} URL: ${tab.url}`);
              analyzeUrl(tab.url, true);
              return;
            }
          }
        }

      } catch (error) {
        addDebugInfo(`❌ Auto-detection failed: ${error.message}`);
      }

      // Fall back to manual input
      addDebugInfo("🔄 All auto-detection methods failed - falling back to manual input");
      addDebugInfo("💡 This usually means you're on a restricted page or permissions aren't fully granted");
      setShowManualInput(true);
      setLoading(false);
    };

    tryAutoDetection();
  }, []);

  const analyzeUrl = (inputUrl, isAutoDetected = false) => {
    addDebugInfo(`🎯 Starting analysis (${isAutoDetected ? 'auto-detected' : 'manual'})...`);
    setLoading(true);
    setError(null);
    
    addDebugInfo(`📝 Input URL: "${inputUrl}"`);
    
    if (!inputUrl || !inputUrl.trim()) {
      addDebugInfo("❌ Empty or invalid input");
      setError("Please enter a URL");
      setLoading(false);
      setShowManualInput(true);
      return;
    }
    
    let url = inputUrl.trim();
    addDebugInfo(`🔧 Trimmed URL: "${url}"`);
    
    // Add protocol if missing
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
      addDebugInfo(`🔗 Added protocol: "${url}"`);
    } else {
      addDebugInfo(`✅ URL already has protocol: "${url}"`);
    }
    
    // Validate URL
    let urlObj;
    try {
      urlObj = new URL(url);
      addDebugInfo(`✅ URL validation successful`);
      addDebugInfo(`   - Host: ${urlObj.host}`);
    } catch (urlError) {
      addDebugInfo(`❌ URL validation failed: ${urlError.message}`);
      setError(`Invalid URL: ${urlError.message}`);
      setLoading(false);
      setShowManualInput(true);
      return;
    }
    
    // Check for restricted protocols
    const restrictedProtocols = ['chrome:', 'chrome-extension:', 'edge:', 'about:', 'moz-extension:', 'file:'];
    if (restrictedProtocols.some(protocol => url.startsWith(protocol))) {
      addDebugInfo(`⛔ Restricted protocol detected: ${url}`);
      setError("Cannot analyze browser internal pages. Please navigate to a regular website or enter a URL manually.");
      setLoading(false);
      setShowManualInput(true);
      return;
    }
    
    // Normalize URL
    if (!urlObj.pathname || urlObj.pathname === "") {
      urlObj.pathname = "/";
    }
    const finalUrl = urlObj.toString();
    addDebugInfo(`🎯 Final URL for API: "${finalUrl}"`);
    
    // Prepare API request
    const requestData = {
      url: finalUrl,
      simplifiedPolicy: "This site uses cookies and collects emails encrypted no data sharing gdpr privacy focused",
    };
    
    addDebugInfo(`📤 Sending to backend: ${JSON.stringify(requestData)}`);
    
    // Send to backend
    axios.post("http://localhost:5000/api/sites/analyze", requestData)
      .then((response) => {
        addDebugInfo(`✅ Analysis complete!`);
        const site = response.data.site;
        site.trackers = categorizeTrackers(site.trackers || []);
        setSiteData(site);
        setLoading(false);
        setShowManualInput(false); // Hide manual input on success
      })
      .catch((err) => {
        addDebugInfo(`❌ Backend error: ${err.message}`);
        console.error("Full error:", err);
        setError(`Analysis failed: ${err.response?.data?.message || err.message}`);
        setLoading(false);
        setShowManualInput(true); // Show manual input on error
      });
  };

  const handleManualSubmit = () => {
    analyzeUrl(manualUrl, false);
  };

  const navigateTo = (view) => {
    setCurrentView(view);
  };

  const resetToManualInput = () => {
    setError(null);
    setSiteData(null);
    setShowManualInput(true);
    setLoading(false);
  };

  // Loading view (auto-detection in progress)
  if (loading && !showManualInput) {
    return (
      <div className="w-[400px] p-4 bg-gray-50">
        <div className="flex items-center mb-4">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
          <span>Detecting current website...</span>
        </div>
        
        <div className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto font-mono">
          {debugInfo.map((info, index) => (
            <div key={index} className="mb-1">{info}</div>
          ))}
        </div>

        <button 
          onClick={() => {
            setShowManualInput(true);
            setLoading(false);
          }}
          className="w-full mt-3 bg-gray-500 text-white px-4 py-2 rounded text-sm hover:bg-gray-600"
        >
          Skip to Manual Input
        </button>
      </div>
    );
  }

  // Manual input view or error view
  if (showManualInput || error) {
    return (
      <div className="w-[400px] p-4 bg-gray-50">
        {error && (
          <div className="text-red-600 font-bold mb-4">❌ {error}</div>
        )}
        
        <div className={error ? "mb-4" : "text-blue-600 font-bold mb-4"}>
          {error ? "🔄 Try Manual Input:" : "🛡️ DataGuardian Privacy Analysis"}
        </div>
        
        <div className="mb-4">
          <p className="text-sm mb-3">
            Enter a website URL to analyze its privacy practices:
          </p>
          <input
            type="text"
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            placeholder="Enter URL (e.g. leetcode.com)"
            className="w-full p-2 border rounded text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleManualSubmit()}
          />
          <button
            onClick={handleManualSubmit}
            disabled={!manualUrl.trim() || loading}
            className={`w-full mt-2 px-4 py-2 rounded text-sm transition-colors ${
              manualUrl.trim() && !loading
                ? 'bg-blue-500 text-white hover:bg-blue-600' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="inline-block animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
                Analyzing...
              </>
            ) : (
              '🔍 Analyze Website Privacy'
            )}
          </button>
        </div>

        <div className="mb-4">
          <h3 className="font-bold text-sm mb-2">Debug Log:</h3>
          <div className="text-xs bg-gray-100 p-2 rounded max-h-32 overflow-y-auto font-mono">
            {debugInfo.map((info, index) => (
              <div key={index} className="mb-1">{info}</div>
            ))}
          </div>
        </div>

        <div className="text-sm bg-blue-50 p-3 rounded">
          <h4 className="font-bold mb-2">💡 Examples:</h4>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li><code>leetcode.com</code></li>
            <li><code>https://github.com</code></li>
            <li><code>stackoverflow.com</code></li>
          </ul>
        </div>
      </div>
    );
  }

  // Success view - show results
  if (siteData) {
    return (
      <div className="w-[400px] bg-gray-50 text-gray-800">
        {currentView === "popup" ? (
          <PopupView siteData={siteData} onNavigate={navigateTo} />
        ) : (
          <FullReportView siteData={siteData} onNavigate={navigateTo} />
        )}
        
        {/* Add a small button to analyze a different site */}
        <div className="p-2 border-t">
          <button 
            onClick={resetToManualInput}
            className="w-full text-xs bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
          >
            🔄 Analyze Different Website
          </button>
        </div>
      </div>
    );
  }

  return <div className="p-4">Something went wrong</div>;
}

export default App;