// Content script for DataGuardian extension
// This script runs on web pages to provide real-time tracker detection and blocking

class DataGuardianContentScript {
  constructor() {
    this.blockedRequests = new Set();
    this.trackerDomains = new Set();
    this.init();
  }

  async init() {
    console.log('🛡️ DataGuardian Content Script: Initializing...');
    console.log('📊 Page URL:', window.location.href);
    console.log('⏰ Initialization time:', new Date().toLocaleTimeString());

    // Load tracker domains from background script
    await this.loadTrackerDomains();

    // Set up request monitoring
    this.setupRequestMonitoring();

    // Set up DOM monitoring for new scripts
    this.setupDOMMonitoring();

    console.log('🛡️ DataGuardian Content Script: Ready');
    console.log('📋 Current settings:', this.settings);
    console.log('🎯 Ready to block trackers based on user preferences');

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
        console.log('📋 DataGuardian: Loaded site-specific settings from background:', this.settings);
        console.log('🌐 Current site:', window.location.hostname);
      } else {
        console.log('📋 DataGuardian: No response from background, using defaults:', this.settings);
      }
    } catch (error) {
      console.log('📋 DataGuardian: Background script not available, using defaults:', this.settings);
      console.log('💡 This is normal if the extension is still loading');
    }
  }

  setupRequestMonitoring() {
    // Monitor fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (resource, options) => {
      const url = typeof resource === 'string' ? resource : resource.url;

      if (this.shouldBlockRequest(url)) {
        this.blockedRequests.add(url);
        console.log('🚫 DataGuardian: Blocked fetch request to:', url);
        console.log('📊 Total blocked requests:', this.blockedRequests.size);
        console.log('⏰ Block time:', new Date().toLocaleTimeString());
        return Promise.reject(new Error('Blocked by DataGuardian privacy protection'));
      }

      return originalFetch.call(this, resource, options);
    };

    // Monitor XMLHttpRequest
    const originalXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
      if (this.shouldBlockRequest(url)) {
        this.blockedRequests.add(url);
        console.log('🚫 DataGuardian: Blocked XHR request to:', url);
        console.log('📊 Total blocked requests:', this.blockedRequests.size);
        console.log('⏰ Block time:', new Date().toLocaleTimeString());
        return; // Block the request
      }
      return originalXHROpen.call(this, method, url, ...args);
    };

    // Monitor script loading
    const originalCreateElement = document.createElement;
    document.createElement = function (tagName) {
      const element = originalCreateElement.call(this, tagName);

      if (tagName.toLowerCase() === 'script') {
        const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, 'src')?.set;
        if (originalSrcSetter) {
          Object.defineProperty(element, 'src', {
            set: function (value) {
              if (this.shouldBlockRequest(value)) {
                console.log('🚫 DataGuardian: Blocked script loading:', value);
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
              console.log('🚫 DataGuardian: Blocked dynamically added script:', node.src);
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
    if (!this.settings) return false;

    const trackerDomains = [
      // Ad trackers
      'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
      'amazon-adsystem.com', 'criteo.com', 'outbrain.com', 'taboola.com',
      'adnxs.com', 'rubiconproject.com', 'pubmatic.com',

      // Analytics trackers
      'google-analytics.com', 'googletagmanager.com', 'mixpanel.com',
      'segment.com', 'amplitude.com', 'hotjar.com', 'fullstory.com',
      'mouseflow.com', 'chartbeat.com',

      // Social trackers
      'facebook.net', 'connect.facebook.net', 'twitter.com', 'ads-twitter.com',
      'linkedin.com', 'snapchat.com', 'pinterest.com', 'tiktok.com'
    ];

    const isTrackerDomain = trackerDomains.some(domain => url.includes(domain));

    if (!isTrackerDomain) return false;

    // Check specific blocking settings
    if (this.settings.blockAdTrackers && this.isAdTracker(url)) return true;
    if (this.settings.blockAnalyticsTrackers && this.isAnalyticsTracker(url)) return true;
    if (this.settings.blockSocialTrackers && this.isSocialTracker(url)) return true;
    if (this.settings.blockTrackers) return true;

    return false;
  }

  isAdTracker(url) {
    const adDomains = [
      'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
      'amazon-adsystem.com', 'criteo.com', 'outbrain.com', 'taboola.com',
      'adnxs.com', 'rubiconproject.com', 'pubmatic.com'
    ];
    return adDomains.some(domain => url.includes(domain));
  }

  isAnalyticsTracker(url) {
    const analyticsDomains = [
      'google-analytics.com', 'googletagmanager.com', 'mixpanel.com',
      'segment.com', 'amplitude.com', 'hotjar.com', 'fullstory.com',
      'mouseflow.com', 'chartbeat.com'
    ];
    return analyticsDomains.some(domain => url.includes(domain));
  }

  isSocialTracker(url) {
    const socialDomains = [
      'facebook.net', 'connect.facebook.net', 'twitter.com', 'ads-twitter.com',
      'linkedin.com', 'snapchat.com', 'pinterest.com', 'tiktok.com'
    ];
    return socialDomains.some(domain => url.includes(domain));
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
          console.log('🔄 DataGuardian: Reconnected to background script!');
          console.log('📋 Updated settings:', this.settings);
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
