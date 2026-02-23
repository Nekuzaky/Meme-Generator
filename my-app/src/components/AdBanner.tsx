import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "../context/LanguageContext";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

interface AdBannerProps {
  slot?: string;
  className?: string;
}

export default function AdBanner({
  slot,
  className = "",
}: AdBannerProps) {
  const { t } = useLanguage();
  const adRef = useRef<HTMLElement | null>(null);
  const runtimeSlot = useMemo(
    () => (slot ?? import.meta.env.VITE_ADSENSE_SLOT_DEFAULT ?? "").trim(),
    [slot]
  );
  const adsenseEnabled = useMemo(() => {
    const flag = (import.meta.env.VITE_ADSENSE_ENABLED ?? "").toLowerCase();
    if (flag === "true") return true;
    if (flag === "false") return false;
    return import.meta.env.PROD && window.location.hostname === "meme.altcore.fr";
  }, []);
  const canLoadAd = adsenseEnabled && runtimeSlot !== "";

  useEffect(() => {
    if (!canLoadAd) return;
    const node = adRef.current;
    if (!node) return;
    if (node.dataset.loaded === "1") return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      node.dataset.loaded = "1";
    } catch {
      // Adsense script may not be loaded in local dev
    }
  }, [canLoadAd]);

  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-100">{t("ad.label")}</span>
        <span>{t("ad.placeholder")}</span>
      </div>
      {canLoadAd ? (
        <ins
          ref={(el) => {
            adRef.current = el;
          }}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-2300689809815106"
          data-ad-slot={runtimeSlot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/60 px-3 py-6 text-center text-[11px] text-slate-400">
          {import.meta.env.PROD
            ? "Ads disabled (missing slot config)."
            : "Ads disabled in local/dev environment."}
        </div>
      )}
    </div>
  );
}
