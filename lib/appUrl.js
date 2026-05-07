/**
 * Base URL for links in Slack notifications (production: set PUBLIC_APP_URL).
 * Normalizes common misconfigurations (missing scheme, stray quotes/spaces).
 */
export function getPublicAppBaseUrl() {
    const explicit = process.env.PUBLIC_APP_URL;
    if (explicit) {
        let s = String(explicit).trim().replace(/^['"]+|['"]+$/g, '');
        s = s.replace(/\/$/, '');
        if (s && !/^https?:\/\//i.test(s)) {
            s = `https://${s}`;
        }
        return s;
    }
    const vercel = process.env.VERCEL_URL;
    if (vercel) {
        const host = String(vercel).replace(/^https?:\/\//i, '');
        return `https://${host}`;
    }
    return '';
}
