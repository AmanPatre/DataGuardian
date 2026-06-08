// Content script for DataGuardian extension
// This script runs on web pages to provide real-time tracker detection and blocking

class DataGuardianContentScript {
  constructor() {
    this.blockedRequests = new Set();
    this.trackerDomains = new Set();
    this.init();
  }

  async init() {


    // Load tracker domains from background script
    await this.loadTrackerDomains();

    // Set up request monitoring
    this.setupRequestMonitoring();

    // Set up DOM monitoring for new scripts
    this.setupDOMMonitoring();



    // Try to reconnect to background script periodically
    this.setupBackgroundReconnection();
  }

  async loadTrackerDomains() {
    // Set default settings first
    this.settings = {
      blockNotifications: false,
      blockCookies: false,
      blockTrackers: false,
      blockAdTrackers: false,
      blockAnalyticsTrackers: false,
      blockSocialTrackers: false
    };

    try {
      // Try to get settings from background script with timeout
      // The background script will automatically load settings for this site's domain
      const response = await Promise.race([
        chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 1000))
      ]);

      if (response && response.success) {
        this.settings = response.settings;

      } else {

      }
    } catch (error) {

    }
  }

  setupRequestMonitoring() {
    // BUG 4 & 8 FIX: capture the class instance before overriding prototypes.
    // Inside prototype overrides, 'this' refers to the XHR/element — not the class.
    const self = this;

    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (resource, options) => {
      const url = typeof resource === 'string' ? resource : resource.url;

      if (self.shouldBlockRequest(url)) {
        self.blockedRequests.add(url);
        return Promise.reject(new Error('Blocked by DataGuardian privacy protection'));
      }

      return originalFetch.call(window, resource, options);
    };

    // Monitor XMLHttpRequest (BUG 4 FIX: use 'self' not 'this')
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      if (self.shouldBlockRequest(url)) {      // ← 'self' is the class instance
        self.blockedRequests.add(url);
        return; // Block the request
      }
      return originalXHROpen.call(this, method, url, ...args);
    };

    // Monitor script loading (BUG 8 FIX: use 'self' not 'this')
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = function (tagName) {
      const element = originalCreateElement(tagName);

      if (tagName.toLowerCase() === 'script') {
        const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
        if (originalSrcSetter) {
          Object.defineProperty(element, 'src', {
            set: function (value) {
              if (self.shouldBlockRequest(value)) { // ← 'self' is the class instance
                return; // Don't set the src
              }
              originalSrcSetter.call(this, value);
            },
            get: function () {
              return this.getAttribute('src');
            },
            configurable: true
          });
        }
      }

      return element;
    };
  }


  setupDOMMonitoring() {
    // Monitor for dynamically added scripts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'SCRIPT' && node.src) {
            if (this.shouldBlockRequest(node.src)) {
              node.remove();
            }
          }
        });
      });
    });

    observer.observe(document, {
      childList: true,
      subtree: true
    });
  }

  shouldBlockRequest(url) {
    if (!url) return false;

    // Use shared classifier (window.DG_TRACKER_CATEGORIES/dgIsTracker is from trackerRules.js)
    if (!window.dgIsTracker || !window.dgIsTracker(url)) return false;

    const info = window.dgClassifyDomain(url);
    const category = info.category;

    // Check specific blocking settings (Fixed in Bug 5 to use correct blockAdvertisingTrackers etc)
    if (this.settings.blockAdvertisingTrackers && category === window.DG_TRACKER_CATEGORIES.ADVERTISING) return true;
    if (this.settings.blockAnalyticsTrackers && category === window.DG_TRACKER_CATEGORIES.ANALYTICS) return true;
    if (this.settings.blockSocialTrackers && category === window.DG_TRACKER_CATEGORIES.SOCIAL) return true;
    if (this.settings.blockTagManagerTrackers && category === window.DG_TRACKER_CATEGORIES.TAG_MANAGER) return true;
    if (this.settings.blockCDNUtilityTrackers && category === window.DG_TRACKER_CATEGORIES.CDN_UTILITY) return true;

    if (this.settings.blockTrackers) return true;

    return false;
  }

  // Get blocked request count for this page
  getBlockedCount() {
    return this.blockedRequests.size;
  }

  // Setup periodic reconnection to background script
  setupBackgroundReconnection() {
    // Try to reconnect every 5 seconds for the first minute
    let attempts = 0;
    const maxAttempts = 12; // 12 attempts = 1 minute

    const tryReconnect = async () => {
      if (attempts >= maxAttempts) return;

      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
        if (response && response.success) {
          this.settings = response.settings;

          return; // Stop trying once connected
        }
      } catch (error) {
        // Silently continue trying
      }

      attempts++;
      setTimeout(tryReconnect, 5000); // Try again in 5 seconds
    };

    // Start trying after 2 seconds
    setTimeout(tryReconnect, 2000);
  }
}

// Initialize the content script
const dataGuardianContent = new DataGuardianContentScript();

// Expose globally for detection
window.dataGuardianContent = dataGuardianContent;
window.DataGuardianContent = dataGuardianContent;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_BLOCKED_COUNT') {
    sendResponse({
      success: true,
      count: dataGuardianContent.getBlockedCount()
    });
  }

  if (request.type === 'GET_SETTINGS') {
    sendResponse({
      success: true,
      settings: dataGuardianContent.settings
    });
  }
});
