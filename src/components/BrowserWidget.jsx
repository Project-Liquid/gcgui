import { useEffect, useRef, useState } from "react";
import { normalizeBrowserUrl } from "../utils/browserUrl";
import "./BrowserWidget.css";

export default function BrowserWidget({ shape }) {
    const displayName = shape?.name || "Browser";
    const configuredUrl = typeof shape?.url === "string" ? shape.url.trim() : "";
    const normalizedUrl = normalizeBrowserUrl(configuredUrl);
    const webviewRef = useRef(null);
    const [currentUrl, setCurrentUrl] = useState(normalizedUrl);
    const [isLoading, setIsLoading] = useState(Boolean(normalizedUrl));
    const [error, setError] = useState("");

    useEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return undefined;

        const readUrl = () => {
            try {
                return webview.getURL?.() || "";
            } catch {
                return "";
            }
        };

        const handleStart = () => {
            setIsLoading(true);
            setError("");
        };

        const handleStop = () => {
            setIsLoading(false);
            const loadedUrl = readUrl();
            if (loadedUrl) setCurrentUrl(loadedUrl);
        };

        const handleNavigate = event => {
            if (event?.url) setCurrentUrl(event.url);
        };

        const handleFail = event => {
            // -3 is ERR_ABORTED, which happens on normal rapid navigation.
            if (event?.isMainFrame === false || event?.errorCode === -3) return;
            setIsLoading(false);
            setError(event?.errorDescription || "Unable to load page");
        };

        webview.addEventListener("did-start-loading", handleStart);
        webview.addEventListener("did-stop-loading", handleStop);
        webview.addEventListener("did-navigate", handleNavigate);
        webview.addEventListener("did-navigate-in-page", handleNavigate);
        webview.addEventListener("did-fail-load", handleFail);

        return () => {
            webview.removeEventListener("did-start-loading", handleStart);
            webview.removeEventListener("did-stop-loading", handleStop);
            webview.removeEventListener("did-navigate", handleNavigate);
            webview.removeEventListener("did-navigate-in-page", handleNavigate);
            webview.removeEventListener("did-fail-load", handleFail);
        };
    }, [normalizedUrl, error]);

    const reload = () => {
        if (!normalizedUrl) return;
        if (error) {
            // The webview is unmounted while the error state is shown; clearing
            // the error mounts a fresh one which loads `src` again.
            setIsLoading(true);
            setError("");
            return;
        }
        try {
            webviewRef.current?.reload();
        } catch {
            // Webview may not be attached yet; src will load it.
        }
    };

    const displayUrl = currentUrl || normalizedUrl;

    const header = (
        <div className="browser-widget-header">
            <div className="browser-widget-title">
                <div className="widget-name">{displayName}</div>
                <div className="browser-widget-url" title={displayUrl}>
                    {displayUrl || "No URL configured"}
                </div>
            </div>
            {isLoading && normalizedUrl && !error && <div className="browser-widget-status">Loading…</div>}
            <button
                type="button"
                className="browser-widget-action"
                onMouseDown={event => event.stopPropagation()}
                onClick={reload}
                disabled={!normalizedUrl}
                title={error ? "Retry loading" : "Reload page"}
                aria-label={error ? "Retry loading" : "Reload page"}
            >
                ⟳
            </button>
        </div>
    );

    if (!normalizedUrl) {
        return (
            <div className="browser-widget fill">
                {header}
                <div className="browser-widget-empty">
                    <div className="browser-widget-empty-icon">🌐</div>
                    <div className="browser-widget-empty-title">
                        {configuredUrl ? "Invalid URL" : "No URL configured"}
                    </div>
                    <div className="browser-widget-empty-hint">
                        {configuredUrl
                            ? `“${configuredUrl}” is not a valid HTTP or HTTPS address.`
                            : "Right-click the widget and choose Edit, or select it and press E, to set the page URL."}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="browser-widget fill">
            {header}
            <div className="browser-widget-content">
                {error ? (
                    <div className="browser-widget-empty">
                        <div className="browser-widget-empty-icon">⚠</div>
                        <div className="browser-widget-empty-title">Could not load page</div>
                        <div className="browser-widget-empty-hint">{error}</div>
                        <div className="browser-widget-empty-url">{normalizedUrl}</div>
                        <button
                            type="button"
                            className="browser-widget-retry"
                            onMouseDown={event => event.stopPropagation()}
                            onClick={reload}
                        >
                            Retry
                        </button>
                    </div>
                ) : (
                    <webview
                        ref={webviewRef}
                        className="browser-widget-view"
                        src={normalizedUrl}
                        title={displayName}
                    />
                )}
            </div>
        </div>
    );
}
