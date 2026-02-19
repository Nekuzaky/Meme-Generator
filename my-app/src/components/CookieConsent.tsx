import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

const CONSENT_COOKIE = "meme_cookie_consent";
const VISITOR_COOKIE = "meme_visitor_id";
const CONSENT_VERSION = "v1";

const getCookie = (name: string) => {
  const needle = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(needle));
  return match ? decodeURIComponent(match.slice(needle.length)) : null;
};

const setCookie = (name: string, value: string, maxAgeDays = 365) => {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Max-Age=${maxAgeDays * 86400}; Path=/; SameSite=Lax${secure}`;
};

const ensureVisitorId = () => {
  const existing = getCookie(VISITOR_COOKIE);
  if (existing) return existing;
  const next =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  setCookie(VISITOR_COOKIE, next, 365);
  return next;
};

const getTrackingCacheKey = (path: string) => {
  const day = new Date().toISOString().slice(0, 10);
  return `meme-telemetry-${day}-${path}`;
};

export default function CookieConsent() {
  const { language } = useLanguage();
  const location = useLocation();
  const [choice, setChoice] = useState<"pending" | "accept" | "reject">("pending");

  const labels = useMemo(
    () =>
      language === "fr"
        ? {
            title: "Cookies et donnees",
            description:
              "Nous utilisons des cookies de fonctionnement et, avec ton accord, des cookies de mesure pour ameliorer le produit.",
            accept: "Accepter",
            reject: "Refuser",
          }
        : {
            title: "Cookies and data",
            description:
              "We use functional cookies and, with your consent, analytics cookies to improve the product.",
            accept: "Accept",
            reject: "Reject",
          },
    [language]
  );

  useEffect(() => {
    const consent = getCookie(CONSENT_COOKIE);
    if (consent === "accept" || consent === "reject") {
      setChoice(consent);
      if (consent === "accept") {
        ensureVisitorId();
      }
      return;
    }
    setChoice("pending");
  }, []);

  useEffect(() => {
    if (choice !== "accept") return;
    const visitorId = ensureVisitorId();
    const pagePath = `${location.pathname}${location.search}`;
    const cacheKey = getTrackingCacheKey(pagePath);
    if (localStorage.getItem(cacheKey)) return;

    const params = new URLSearchParams(window.location.search);
    const payload = {
      consent: true,
      consent_version: CONSENT_VERSION,
      visitor_id: visitorId,
      page_path: pagePath,
      referrer: document.referrer || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || "",
      platform: navigator.userAgentData?.platform || navigator.platform || "",
      dnt: navigator.doNotTrack === "1",
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    };

    fetch("/api/telemetry/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(() => {
        localStorage.setItem(cacheKey, "1");
      })
      .catch(() => {
        // silent fail
      });
  }, [choice, location.pathname, location.search]);

  const accept = () => {
    setCookie(CONSENT_COOKIE, "accept", 365);
    ensureVisitorId();
    setChoice("accept");
  };

  const reject = () => {
    setCookie(CONSENT_COOKIE, "reject", 365);
    setChoice("reject");
  };

  if (choice !== "pending") return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl shadow-fuchsia-500/20 md:left-auto md:w-[420px]">
      <p className="text-sm font-semibold text-slate-100">{labels.title}</p>
      <p className="mt-1 text-xs text-slate-300">{labels.description}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white"
        >
          {labels.accept}
        </button>
        <button
          type="button"
          onClick={reject}
          className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          {labels.reject}
        </button>
      </div>
    </div>
  );
}
