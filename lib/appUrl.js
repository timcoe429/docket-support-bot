/**
 * Base URL for links in Slack notifications (production: set PUBLIC_APP_URL).
 * Normalizes common misconfigurations (missing scheme, stray quotes/spaces).
 * Ignores bogus values like literal "public_app_url" — a common mistaken paste — and falls back to VERCEL_URL.
 */
function normalizedExplicitUrl(raw) {
    let s = String(raw).trim().replace(/^['"]+|['"]+$/g, '');
    s = s.replace(/\/$/, '');
    if (!s) return '';
    if (!/^https?:\/\//i.test(s)) {
        s = `https://${s}`;
    }
    return s;
}

function hostnameFromBaseUrl(fullUrlStr) {
    try {
        return new URL(fullUrlStr).hostname.toLowerCase();
    } catch {
        return null;
    }
}

/** Hostnames we must never use — usually someone pasted docs placeholder into Vercel. */
function isPlaceholderPublicHostname(hostname) {
    if (!hostname) return true;
    if (hostname === 'public_app_url') return true;
    if (hostname === 'public-app-url') return true;
    if (hostname === 'publicappurl') return true;
    if (hostname.toUpperCase() === 'PUBLIC_APP_URL') return true;
    return false;
}

export function getPublicAppBaseUrl() {
    const explicitRaw = process.env.PUBLIC_APP_URL;
    if (explicitRaw != null && String(explicitRaw).trim() !== '') {
        const s = normalizedExplicitUrl(explicitRaw);
        const host = hostnameFromBaseUrl(s);
        if (isPlaceholderPublicHostname(host)) {
            console.warn(
                `[appUrl] PUBLIC_APP_URL resolves to placeholder host "${host}" — ignoring. Set PUBLIC_APP_URL to your real HTTPS origin (e.g. https://support.yourdocketonline.com).`
            );
        } else if (host) {
            return s.replace(/\/$/, '');
        }
    }

    const vercel = process.env.VERCEL_URL;
    if (vercel) {
        const h = String(vercel).replace(/^https?:\/\//i, '');
        return `https://${h.replace(/\/$/, '')}`;
    }
    return '';
}
