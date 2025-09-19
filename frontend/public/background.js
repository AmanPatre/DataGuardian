// Background service worker for DataGuardian extension
// This handles privacy blocking, storage, and communication between components

class DataGuardianBackground {
  constructor() {
    this.settings = {};
    this.blockedRequests = new Map();
    this.init();
  }

  async init() {
    console.log('DataGuardian Background Script Starting...');

    // Load settings from storage
    await this.loadSettings();

    // Set up event listeners
    this.setupEventListeners();

    // Initialize request blocking
    this.setupRequestBlocking();

    console.log('DataGuardian Background Script Ready');
  }

  // Load privacy settings from storage
  async loadSettings() {
    try {
      const result = await chrome.storage.local.get(['privacySettings']);
      this.settings = result.privacySettings || {
        blockNotifications: false,
        blockCookies: false,
        blockTrackers: false,
        blockAdTrackers: true,
        blockAnalyticsTrackers: true,
        blockSocialTrackers: false
      };
      console.log('Loaded settings:', this.settings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  // Save settings to storage
  async saveSettings() {
    try {
      await chrome.storage.local.set({ privacySettings: this.settings });
      console.log('Settings saved:', this.settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  // Set up event listeners
  setupEventListeners() {
    // Listen for messages from popup/content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for storage changes
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'local' && changes.privacySettings) {
        this.settings = changes.privacySettings.newValue || {};
        console.log('Settings updated from storage:', this.settings);
      }
    });

    // Listen for tab updates to apply settings
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url) {
        this.applySettingsToTab(tab);
      }
    });

    // Listen for web navigation to track site changes
    chrome.webNavigation.onCompleted.addListener((details) => {
      if (details.frameId === 0) { // Main frame only
        this.onSiteChanged(details.tabId, details.url);
      }
    });
  }

  // Handle messages from other parts of the extension
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.type) {
        case 'GET_SETTINGS':
          sendResponse({ success: true, settings: this.settings });
          break;

        case 'UPDATE_SETTING':
          await this.updateSetting(request.setting, request.value);
          sendResponse({ success: true });
          break;

        case 'GET_BLOCKED_COUNT':
          const count = this.getBlockedCountForTab(sender.tab?.id);
          sendResponse({ success: true, count });
          break;

        case 'PRIVACY_SETTING_CHANGED':
          // Broadcast to all tabs
          this.broadcastSettingChange(request.setting, request.value);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  // Update a specific setting
  async updateSetting(settingKey, value) {
    this.settings[settingKey] = value;
    await this.saveSettings();

    // Apply the setting to all tabs
    const tabs = await chrome.tabs.query({});
    tabs.forEach(tab => {
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        this.applySettingToTab(tab, settingKey, value);
      }
    });

    console.log(`Updated setting ${settingKey} to ${value}`);
  }

  // Set up request blocking using declarativeNetRequest API
  setupRequestBlocking() {
    // Define tracker domains for different categories
    const trackerDomains = {
      ad: [
        '*://*.doubleclick.net/*',
        '*://*.googlesyndication.com/*',
        '*://*.googleadservices.com/*',
        '*://*.amazon-adsystem.com/*',
        '*://*.criteo.com/*',
        '*://*.outbrain.com/*',
        '*://*.taboola.com/*',
        '*://*.adnxs.com/*',
        '*://*.adsystem.com/*'
      ],
      analytics: [
        '*://*.google-analytics.com/*',
        '*://*.googletagmanager.com/*',
        '*://*.mixpanel.com/*',
        '*://*.segment.com/*',
        '*://*.amplitude.com/*',
        '*://*.hotjar.com/*',
        '*://*.fullstory.com/*',
        '*://*.mouseflow.com/*'
      ],
      social: [
        '*://*.facebook.net/*',
        '*://*.connect.facebook.net/*',
        '*://*.ads-twitter.com/*',
        '*://*.linkedin.com/analytics/*',
        '*://*.snapchat.com/track/*',
        '*://*.pinterest.com/track/*',
        '*://*.tiktok.com/track/*'
      ]
    };

    // Update blocking rules based on current settings
    this.updateBlockingRules(trackerDomains);
  }

  // Update blocking rules
  async updateBlockingRules(trackerDomains) {
    try {
      // Remove existing rules
      const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
      const existingRuleIds = existingRules.map(rule => rule.id);

      if (existingRuleIds.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          removeRuleIds: existingRuleIds
        });
      }

      // Create new rules based on settings
      const newRules = [];
      let ruleId = 1;

      // Add rules for each category if enabled
      if (this.settings.blockAdTrackers) {
        trackerDomains.ad.forEach(domain => {
          newRules.push({
            id: ruleId++,
            priority: 1,
            action: { type: 'block' },
            condition: {
              urlFilter: domain,
              resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame']
            }
          });
        });
      }

      if (this.settings.blockAnalyticsTrackers) {
        trackerDomains.analytics.forEach(domain => {
          newRules.push({
            id: ruleId++,
            priority: 1,
            action: { type: 'block' },
            condition: {
              urlFilter: domain,
              resourceTypes: ['script', 'xmlhttprequest', 'image']
            }
          });
        });
      }

      if (this.settings.blockSocialTrackers) {
        trackerDomains.social.forEach(domain => {
          newRules.push({
            id: ruleId++,
            priority: 1,
            action: { type: 'block' },
            condition: {
              urlFilter: domain,
              resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame']
            }
          });
        });
      }

      // Add comprehensive tracker blocking if enabled
      if (this.settings.blockTrackers) {
        const allTrackers = [
          ...trackerDomains.ad,
          ...trackerDomains.analytics,
          ...trackerDomains.social
        ];

        allTrackers.forEach(domain => {
          if (!newRules.find(rule => rule.condition.urlFilter === domain)) {
            newRules.push({
              id: ruleId++,
              priority: 2,
              action: { type: 'block' },
              condition: {
                urlFilter: domain,
                resourceTypes: ['script', 'xmlhttprequest', 'image', 'sub_frame']
              }
            });
          }
        });
      }

      // Apply new rules
      if (newRules.length > 0) {
        await chrome.declarativeNetRequest.updateDynamicRules({
          addRules: newRules
        });
        console.log(`Updated blocking rules: ${newRules.length} rules active`);
      }

    } catch (error) {
      console.error('Failed to update blocking rules:', error);
    }
  }

  // Apply settings to a specific tab
  async applySettingsToTab(tab) {
    if (!tab.url || (!tab.url.startsWith('http://') && !tab.url.startsWith('https://'))) {
      return;
    }

    try {
      // Apply notification blocking
      if (this.settings.blockNotifications) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            if (typeof window.Notification !== 'undefined') {
              window.Notification.requestPermission = () => Promise.resolve('denied');
              Object.defineProperty(window.Notification, 'permission', {
                value: 'denied',
                writable: false
              });
            }
          }
        }).catch(() => { });
      }

      // Apply cookie blocking
      if (this.settings.blockCookies) {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const originalSetCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie')?.set;
            if (originalSetCookie) {
              Object.defineProperty(document, 'cookie', {
                set: function (value) {
                  const trackingPatterns = [
                    /_ga/, /_gid/, /_fbp/, /_fbc/, /utm_/, /track/, /analytics/
                  ];

                  const isTrackingCookie = trackingPatterns.some(pattern =>
                    pattern.test(value.toLowerCase())
                  );

                  if (!isTrackingCookie) {
                    originalSetCookie.call(this, value);
                  }
                },
                get: function () {
                  return document.cookie;
                },
                configurable: true
              });
            }
          }
        }).catch(() => { });
      }

    } catch (error) {
      console.error(`Failed to apply settings to tab ${tab.id}:`, error);
    }
  }

  // Apply specific setting to tab
  async applySettingToTab(tab, settingKey, value) {
    // Update blocking rules when tracker settings change
    if (settingKey.includes('Trackers') || settingKey === 'blockTrackers') {
      await this.setupRequestBlocking();
    }

    // Apply other settings
    await this.applySettingsToTab(tab);
  }

  // Handle site changes
  onSiteChanged(tabId, url) {
    // Reset blocked request count for this tab
    this.blockedRequests.set(tabId, 0);

    // Show privacy notification if tracking protection is active
    const activeProtections = Object.values(this.settings).filter(Boolean).length;
    if (activeProtections > 0) {
      chrome.action.setBadgeText({
        tabId: tabId,
        text: activeProtections.toString()
      });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    } else {
      chrome.action.setBadgeText({ tabId: tabId, text: '' });
    }
  }

  // Get blocked request count for tab
  getBlockedCountForTab(tabId) {
    return this.blockedRequests.get(tabId) || 0;
  }

  // Broadcast setting changes to all tabs
  async broadcastSettingChange(setting, value) {
    try {
      const tabs = await chrome.tabs.query({});
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          type: 'SETTING_CHANGED',
          setting,
          value
        }).catch(() => {
          // Ignore errors for tabs that don't have content scripts
        });
      });
    } catch (error) {
      console.error('Failed to broadcast setting change:', error);
    }
  }
}

// Initialize the background script
const dataGuardian = new DataGuardianBackground();