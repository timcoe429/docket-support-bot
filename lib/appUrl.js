/**
 * Base URL for links in Slack notifications (production: set PUBLIC_APP_URL).
 */
export function getPublicAppBaseUrl() {
    const explicit = process.env.PUBLIC_APP_URL;
    if (explicit) {
        return String(explicit).replace(/\/$/, '');
    }
    const vercel = process.env.VERCEL_URL;
    if (vercel) {
        const host = String(vercel).replace(/^https?:\/\//i, '');
        return `https://${host}`;
    }
    return '';
}
