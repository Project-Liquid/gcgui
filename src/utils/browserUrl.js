/**
 * Browser widget URL handling.
 *
 * Accepts bare hostnames ("example.com"), local addresses ("localhost:3000")
 * and full HTTP(S) URLs. Other schemes are rejected so the widget only ever
 * embeds web pages.
 */

const LOCAL_HOST = /^(localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[01])(?:\.\d{1,3}){2}|\[::1\])(?::\d+)?(?:[/?#]|$)/i;

/**
 * Normalize a URL entered in the browser widget settings.
 *
 * @param {string} raw
 * @returns {string} Absolute HTTP(S) URL, or "" when empty/invalid.
 */
export function normalizeBrowserUrl(raw) {
    if (typeof raw !== "string") return "";
    const trimmed = raw.trim();
    if (!trimmed) return "";

    let candidate = trimmed;
    if (!/^[a-z][a-z\d+.-]*:\/\//i.test(candidate)) {
        const protocol = LOCAL_HOST.test(candidate) ? "http" : "https";
        candidate = `${protocol}://${candidate}`;
    }

    try {
        const url = new URL(candidate);
        if (url.protocol !== "http:" && url.protocol !== "https:") return "";
        if (!url.hostname) return "";
        return url.href;
    } catch {
        return "";
    }
}

export default { normalizeBrowserUrl };
