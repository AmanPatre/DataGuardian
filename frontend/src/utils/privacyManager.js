/**
 * PrivacyManager (Orchestrator)
 * Refactored to use modular components for improved maintainability.
 */
import { PrivacyStorage } from './privacy/storage';
import { PrivacyBlocking } from './privacy/blocking';
import { PrivacyPseudonym } from './privacy/pseudonym';
import { isTracker, classifyDomain, TRACKER_CATEGORIES } from './trackerRules';

export class PrivacyManager {
  constructor() {
    this.isExtension = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;
    this.storage = new PrivacyStorage(this.isExtension);
    this.blocking = new PrivacyBlocking(this.isExtension);
    this.pseudonym = new PrivacyPseudonym();

    // Legacy support for direct settings access
    this.init();
  }

  async init() {
    await this.storage.loadSettings();
  }

  get settings() {
    return this.storage.settings;
  }

  // --- Storage Delegation ---
  async loadSettings(url) {
    return this.storage.loadSettings(url);
  }

  async saveSettings(url) {
    return this.storage.saveSettings(url);
  }

  getSetting(key) {
    return this.storage.getSetting(key);
  }

  async updateSetting(key, value, siteUrl = null) {
    this.storage.setSetting(key, value);
    await this.saveSettings(siteUrl);

    if (this.isExtension) {
      this.applySetting(key, value, siteUrl);
      this.notifySettingChanged(key, value);
    }
  }

  // --- Blocking Delegation ---
  async applySetting(key, enabled, siteUrl = null) {
    if (!this.isExtension) return;

    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const activeTab = tabs && tabs[0];
      if (!activeTab) return;

      switch (key) {
        case 'blockNotifications':
          await this.blocking.handleNotificationBlocking(activeTab, enabled);
          break;
        case 'blockCookies':
          await this.blocking.handleCookieBlocking(activeTab, enabled);
          break;
        case 'blockTrackers':
          await this.blocking.handleTrackerBlocking(activeTab, enabled);
          break;
        case 'blockAdvertisingTrackers':
        case 'blockAnalyticsTrackers':
        case 'blockSocialTrackers':
        case 'blockTagManagerTrackers':
        case 'blockCDNUtilityTrackers':
          await this.blocking.handleSpecificTrackerBlocking(activeTab, key, enabled);
          break;
      }
    } catch (error) {
      console.warn(`Failed to apply setting ${key}:`, error);
    }
  }

  // --- Mode Management ---
  async getPrivacyMode() {
    if (!this.isExtension) return 'none';
    const result = await chrome.storage.local.get(['privacyMode']);
    return result.privacyMode || 'none';
  }

  async setPrivacyMode(mode) {
    if (!this.isExtension) return;
    await chrome.storage.local.set({ privacyMode: mode });
    this.notifySettingChanged('privacyMode', mode);

    if (mode === 'stealth') {
      await this.setAllTrackerBlocksForSite(null, true);
    }
  }

  async getSitePrivacyMode(siteUrl = null) {
    if (!this.isExtension || !siteUrl) return 'none';
    const domain = this.storage.getDomainFromUrl(siteUrl);
    const result = await chrome.storage.local.get([`sitePrivacyMode_${domain}`]);
    return result[`sitePrivacyMode_${domain}`] || await this.getPrivacyMode();
  }

  async setSitePrivacyMode(siteUrl, mode) {
    if (!this.isExtension || !siteUrl) return;
    const domain = this.storage.getDomainFromUrl(siteUrl);
    await chrome.storage.local.set({ [`sitePrivacyMode_${domain}`]: mode });
    this.notifySettingChanged('sitePrivacyMode', mode);
  }

  async setAllTrackerBlocksForSite(siteUrl, enabled) {
    const categories = [
      'blockAdvertisingTrackers',
      'blockAnalyticsTrackers',
      'blockSocialTrackers',
      'blockTagManagerTrackers',
      'blockCDNUtilityTrackers'
    ];

    for (const cat of categories) {
      await this.updateSetting(cat, enabled, siteUrl);
    }
  }

  // --- Classification & PII ---
  classifyTracker(url) {
    return isTracker(url) ? 'tracker' : 'unknown';
  }

  redactPIIInUrl(url) {
    return this.pseudonym.redactPIIInUrl(url);
  }

  // --- Notifications & Helpers ---
  notifySettingChanged(key, value) {
    if (this.isExtension) {
      chrome.runtime.sendMessage({
        type: 'PRIVACY_SETTING_CHANGED',
        setting: key,
        value: value
      }).catch(() => { });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('privacySettingChanged', {
        detail: { setting: key, value: value }
      }));
    }
  }

  showPrivacyNotification(message, type = 'info') {
    if (!this.isExtension || !chrome.notifications) return;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'extensionHome.png',
      title: 'DataGuardian Privacy',
      message: message
    }).catch(() => { });
  }

  async getSitePermissions(url) {
    if (!this.isExtension || !chrome.contentSettings) return {};
    try {
      const origin = new URL(url).origin;
      const permissions = {};

      const getSet = (api) => new Promise(resolve => {
        api.get({ primaryUrl: origin }, d => resolve(d.setting === 'block'));
      });

      permissions.notifications = await getSet(chrome.contentSettings.notifications);
      permissions.cookies = await getSet(chrome.contentSettings.cookies);

      return permissions;
    } catch (_) {
      return {};
    }
  }
}