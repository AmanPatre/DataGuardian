import { isTracker, classifyDomain, TRACKER_CATEGORIES } from '../utility/trackerRules.js';

describe('Tracker Rules Utility', () => {
    test('should correctly identify tracker domains', () => {
        expect(isTracker('https://www.google-analytics.com/collect', 'google-analytics.com')).toBe(true);
        expect(isTracker('https://facebook.net/en_US/all.js', 'facebook.net')).toBe(true);
        expect(isTracker('https://example.com/logo.png', 'example.com')).toBe(false);
    });

    test('should correctly classify tracker categories', () => {
        const ga = classifyDomain('google-analytics.com');
        expect(ga.category).toBe(TRACKER_CATEGORIES.ANALYTICS);
        expect(ga.company).toBe('Google');

        const doubleclick = classifyDomain('doubleclick.net');
        expect(doubleclick.category).toBe(TRACKER_CATEGORIES.ADVERTISING);
    });

    test('should handle unknown domains gracefully', () => {
        const unknown = classifyDomain('my-tiny-store.com');
        expect(unknown.category).toBe(TRACKER_CATEGORIES.UNKNOWN);
    });
});
