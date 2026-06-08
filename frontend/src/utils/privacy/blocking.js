/**
 * Privacy blocking and script injection logic
 */
import { getDomainsForCategory, TRACKER_CATEGORIES } from '../trackerRules';

export class PrivacyBlocking {
    constructor(isExtension) {
        this.isExtension = isExtension;
    }

    async handleNotificationBlocking(tab, enabled) {
        if (!this.isExtension || !chrome.scripting || !chrome.scripting.executeScript) return;

        try {
            if (enabled) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (shouldBlock) => {
                        if (shouldBlock && typeof window.Notification !== 'undefined') {
                            const originalRequestPermission = window.Notification.requestPermission;
                            window.Notification.requestPermission = () => {
                                console.log('DataGuardian: Blocked notification request');
                                return Promise.resolve('denied');
                            };
                            Object.defineProperty(window.Notification, 'permission', {
                                get: () => 'denied',
                                configurable: true
                            });
                        }
                    },
                    args: [enabled]
                });
            }
        } catch (error) {
            console.warn('Notification blocking failed:', error);
        }
    }

    async handleCookieBlocking(tab, enabled) {
        if (!this.isExtension || !chrome.scripting || !chrome.scripting.executeScript) return;

        try {
            if (enabled) {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (shouldBlock) => {
                        if (shouldBlock && typeof document !== 'undefined') {
                            const originalCookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
                            Object.defineProperty(document, 'cookie', {
                                set: (value) => {
                                    const trackingPatterns = [/analytics/, /pixel/, /tracker/, /uid/, /fbclid/, /gclid/];
                                    if (trackingPatterns.some(p => p.test(value.toLowerCase()))) {
                                        console.log('DataGuardian: Blocked tracking cookie:', value.split('=')[0]);
                                        return;
                                    }
                                    originalCookieDescriptor.set.call(document, value);
                                },
                                get: () => originalCookieDescriptor.get.call(document),
                                configurable: true
                            });
                        }
                    },
                    args: [enabled]
                });
            }
        } catch (error) {
            console.warn('Cookie blocking failed:', error);
        }
    }

    async handleTrackerBlocking(tab, enabled) {
        if (!this.isExtension || !chrome.scripting || !chrome.scripting.executeScript) return;

        try {
            if (enabled) {
                const domainsToBlock = [
                    ...getDomainsForCategory(TRACKER_CATEGORIES.ADVERTISING),
                    ...getDomainsForCategory(TRACKER_CATEGORIES.ANALYTICS),
                    ...getDomainsForCategory(TRACKER_CATEGORIES.SOCIAL),
                    ...getDomainsForCategory(TRACKER_CATEGORIES.TAG_MANAGER),
                ];

                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (trackerDomains) => {
                        const originalFetch = window.fetch;
                        const originalXHROpen = XMLHttpRequest.prototype.open;

                        window.fetch = function (resource, options) {
                            const url = typeof resource === 'string' ? resource : resource.url;
                            if (trackerDomains.some(d => url.includes(d))) {
                                console.log('DataGuardian: Blocked fetch tracker:', url);
                                return Promise.reject(new Error('Blocked by DataGuardian'));
                            }
                            return originalFetch.apply(this, arguments);
                        };

                        XMLHttpRequest.prototype.open = function (method, url, ...args) {
                            if (trackerDomains.some(d => url.includes(d))) {
                                console.log('DataGuardian: Blocked XHR tracker:', url);
                                return;
                            }
                            return originalXHROpen.apply(this, [method, url, ...args]);
                        };
                    },
                    args: [domainsToBlock]
                });
            }
        } catch (error) {
            console.warn('Tracker blocking failed:', error);
        }
    }

    async handleSpecificTrackerBlocking(tab, category, enabled) {
        if (!this.isExtension || !chrome.scripting || !chrome.scripting.executeScript) return;

        const categoryMap = {
            blockAdvertisingTrackers: TRACKER_CATEGORIES.ADVERTISING,
            blockAnalyticsTrackers: TRACKER_CATEGORIES.ANALYTICS,
            blockSocialTrackers: TRACKER_CATEGORIES.SOCIAL,
            blockCDNUtilityTrackers: TRACKER_CATEGORIES.CDN_UTILITY,
            blockTagManagerTrackers: TRACKER_CATEGORIES.TAG_MANAGER,
        };

        const targetCategory = categoryMap[category];
        const domains = targetCategory ? getDomainsForCategory(targetCategory) : [];

        if (enabled && domains.length > 0) {
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: (blockedDomains, categoryName) => {
                        const originalFetch = window.fetch;
                        window.fetch = function (resource, options) {
                            const url = typeof resource === 'string' ? resource : resource.url;
                            if (blockedDomains.some(d => url.includes(d))) {
                                console.log(`DataGuardian: Blocked ${categoryName} tracker:`, url);
                                return Promise.reject(new Error(`Blocked by DataGuardian ${categoryName} filter`));
                            }
                            return originalFetch.apply(this, arguments);
                        };
                    },
                    args: [domains, targetCategory]
                });
            } catch (error) {
                console.error(`Failed to handle ${category} blocking:`, error);
            }
        }
    }
}
