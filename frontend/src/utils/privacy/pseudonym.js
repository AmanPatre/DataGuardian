/**
 * Pseudonymization and PII redaction logic
 */

export class PrivacyPseudonym {
    constructor() {
        this.sitePseudonymCache = {};
    }

    redactPIIInUrl(url) {
        const keys = ['email', 'e-mail', 'uid', 'user_id', 'device_id', 'fbclid', 'gclid', '_ga', 'ip', 'lat', 'lon'];
        try {
            const u = new URL(url);
            keys.forEach(k => u.searchParams.delete(k));
            return u.toString();
        } catch (_) {
            return url;
        }
    }

    stripSensitiveHeaders(headers = []) {
        const sensitive = ['cookie', 'authorization', 'x-auth-token', 'user-agent'];
        return headers.filter(h => !sensitive.includes(h.name.toLowerCase()));
    }

    async getStablePseudonymForSite(origin) {
        if (this.sitePseudonymCache[origin]) return this.sitePseudonymCache[origin];

        // In a real app, this might come from a salted hash or backend
        const pseudonym = 'User-' + Math.random().toString(36).substring(2, 7);
        this.sitePseudonymCache[origin] = pseudonym;
        return pseudonym;
    }
}
