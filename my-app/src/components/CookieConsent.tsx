import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import { buildApiUrl } from "../lib/api";

const CONSENT_COOKIE = "meme_cookie_consent";
const VISITOR_COOKIE = "meme_visitor_id";
const CONSENT_VERSION = "v2";

type ConsentChoice = {
  version: string;
  essential: true;
  analytics: boolean;
  personalization: boolean;
  updatedAt: string;
};

const DEFAULT_CONSENT: ConsentChoice = {
  version: CONSENT_VERSION,
  essential: true,
  analytics: false,
  personalization: false,
  updatedAt: "",
};

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

const readConsent = (): ConsentChoice | null => {
  const raw = getCookie(CONSENT_COOKIE);
  if (!raw) return null;

  if (raw === "accept") {
    return {
      version: CONSENT_VERSION,
      essential: true,
      analytics: true,
      personalization: true,
      updatedAt: new Date().toISOString(),
    };
  }

  if (raw === "reject") {
    return {
      version: CONSENT_VERSION,
      essential: true,
      analytics: false,
      personalization: false,
      updatedAt: new Date().toISOString(),
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<ConsentChoice>;
    return {
      version: parsed.version ?? CONSENT_VERSION,
      essential: true,
      analytics: Boolean(parsed.analytics),
      personalization: Boolean(parsed.personalization),
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
    };
  } catch {
    return null;
  }
};

const writeConsent = (choice: ConsentChoice) => {
  setCookie(CONSENT_COOKIE, JSON.stringify(choice), 365);
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
  const [savedConsent, setSavedConsent] = useState<ConsentChoice | null>(null);
  const [draftConsent, setDraftConsent] = useState<ConsentChoice>(DEFAULT_CONSENT);
  const [isCustomizing, setIsCustomizing] = useState(false);

  const labels = useMemo(
    () =>
      language === "fr"
        ? {
            title: "Confidentialite et cookies",
            description:
              "Nous utilisons les cookies essentiels pour faire tourner le site. Avec ton accord, nous activons aussi la mesure d'audience et la personnalisation.",
            essential: "Essentiels",
            essentialText: "Toujours actifs pour le fonctionnement du site.",
            analytics: "Mesure d'audience",
            analyticsText: "Visites, pages vues, performance, funnels et campagnes.",
            personalization: "Personnalisation",
            personalizationText: "Langue, experience et recommandations plus adaptees.",
            acceptAll: "Tout accepter",
            essentialOnly: "Essentiels seulement",
            customize: "Personnaliser",
            save: "Enregistrer mes choix",
          }
        : {
            title: "Privacy and cookies",
            description:
              "We use essential cookies to run the site. With your consent, we also enable audience measurement and personalization.",
            essential: "Essential",
            essentialText: "Always active for core site functionality.",
            analytics: "Analytics",
            analyticsText: "Visits, page views, performance, funnels, and campaigns.",
            personalization: "Personalization",
            personalizationText: "Language, experience, and smarter recommendations.",
            acceptAll: "Accept all",
            essentialOnly: "Essential only",
            customize: "Customize",
            save: "Save my choices",
          },
    [language]
  );

  useEffect(() => {
    const consent = readConsent();
    if (consent) {
      setSavedConsent(consent);
      setDraftConsent(consent);
      if (consent.analytics || consent.personalization) {
        ensureVisitorId();
      }
    }
  }, []);

  useEffect(() => {
    if (!savedConsent?.analytics) return;
    const visitorId = ensureVisitorId();
    const pagePath = `${location.pathname}${location.search}`;
    const cacheKey = getTrackingCacheKey(pagePath);
    if (localStorage.getItem(cacheKey)) return;

    const params = new URLSearchParams(window.location.search);
    const payload = {
      consent: true,
      consent_version: savedConsent.version,
      visitor_id: visitorId,
      page_path: pagePath,
      referrer: document.referrer || "",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language || "",
      platform: navigator.userAgentData?.platform || navigator.platform || "",
      dnt: navigator.doNotTrack === "1",
      personalization: savedConsent.personalization,
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
    };

    fetch(buildApiUrl("/telemetry/visit"), {
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
  }, [savedConsent, location.pathname, location.search]);

  const saveConsent = (next: ConsentChoice) => {
    const payload = {
      ...next,
      version: CONSENT_VERSION,
      essential: true as const,
      updatedAt: new Date().toISOString(),
    };
    writeConsent(payload);
    setSavedConsent(payload);
    setDraftConsent(payload);
    setIsCustomizing(false);
    if (payload.analytics || payload.personalization) {
      ensureVisitorId();
    }
  };

  if (savedConsent) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-white/15 bg-slate-950/95 p-4 shadow-2xl shadow-fuchsia-500/20 md:left-auto md:w-[460px]">
      <p className="text-sm font-semibold text-slate-100">{labels.title}</p>
      <p className="mt-1 text-xs text-slate-300">{labels.description}</p>

      <div className="mt-4 space-y-2 rounded-2xl border border-white/10 bg-slate-900/70 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-slate-100">{labels.essential}</p>
            <p className="mt-1 text-[11px] text-slate-400">{labels.essentialText}</p>
          </div>
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-200">
            On
          </span>
        </div>

        {isCustomizing ? (
          <>
            <label className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-slate-100">{labels.analytics}</p>
                <p className="mt-1 text-[11px] text-slate-400">{labels.analyticsText}</p>
              </div>
              <input
                type="checkbox"
                checked={draftConsent.analytics}
                onChange={(event) =>
                  setDraftConsent((prev) => ({ ...prev, analytics: event.target.checked }))
                }
              />
            </label>

            <label className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
              <div>
                <p className="text-xs font-semibold text-slate-100">{labels.personalization}</p>
                <p className="mt-1 text-[11px] text-slate-400">{labels.personalizationText}</p>
              </div>
              <input
                type="checkbox"
                checked={draftConsent.personalization}
                onChange={(event) =>
                  setDraftConsent((prev) => ({ ...prev, personalization: event.target.checked }))
                }
              />
            </label>
          </>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            saveConsent({
              version: CONSENT_VERSION,
              essential: true,
              analytics: true,
              personalization: true,
              updatedAt: "",
            })
          }
          className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white"
        >
          {labels.acceptAll}
        </button>

        <button
          type="button"
          onClick={() =>
            saveConsent({
              version: CONSENT_VERSION,
              essential: true,
              analytics: false,
              personalization: false,
              updatedAt: "",
            })
          }
          className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          {labels.essentialOnly}
        </button>

        <button
          type="button"
          onClick={() => {
            if (isCustomizing) {
              saveConsent(draftConsent);
              return;
            }
            setIsCustomizing(true);
          }}
          className="rounded-xl border border-white/15 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          {isCustomizing ? labels.save : labels.customize}
        </button>
      </div>
    </div>
  );
}
