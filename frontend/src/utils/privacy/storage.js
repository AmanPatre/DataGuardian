/**
 * Privacy settings and storage management
 */

export class PrivacyStorage {
    constructor(isExtension) {
        this.isExtension = isExtension;
        this.settings = this.getDefaultSettings();
    }

    getDefaultSettings() {
        return {
            blockNotifications: false,
            blockCookies: false,
            blockAdvertisingTrackers: false,
            blockAnalyticsTrackers: false,
            blockSocialTrackers: false,
            blockCDNUtilityTrackers: false,
            blockTagManagerTrackers: false,
            blockUnknownTrackers: false,
        };
    }

    getDomainFromUrl(url) {
        if (!url || !url.startsWith('http')) {
            return 'unknown';
        }
        try {
            return new URL(url).hostname;
        } catch (error) {
            return 'unknown';
        }
    }

    async loadSettings(siteUrl = null) {
        const defaults = this.getDefaultSettings();
        if (!this.isExtension) {
            this.settings = { ...defaults };
            return;
        }

        try {
            if (!siteUrl) {
                this.settings = { ...defaults };
                return;
            }

            const domain = this.getDomainFromUrl(siteUrl);
            const storageKey = `privacySettings_${domain}`;
            const result = await chrome.storage.local.get([storageKey]);

            if (result[storageKey]) {
                this.settings = { ...defaults, ...result[storageKey] };
            } else {
                this.settings = { ...defaults };
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
            this.settings = { ...defaults };
        }
    }

    async saveSettings(siteUrl = null) {
        if (!this.isExtension || !siteUrl) {
            return;
        }
        try {
            const domain = this.getDomainFromUrl(siteUrl);
            const storageKey = `privacySettings_${domain}`;
            await chrome.storage.local.set({ [storageKey]: this.settings });
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    getSetting(key) {
        return this.settings[key];
    }

    setSetting(key, value) {
        this.settings[key] = value;
    }
}
