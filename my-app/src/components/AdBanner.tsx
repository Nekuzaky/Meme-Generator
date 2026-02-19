import { useEffect, useRef } from "react";
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
  slot = "5741036671",
  className = "",
}: AdBannerProps) {
  const { t } = useLanguage();
  const adRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = adRef.current;
    if (!node) return;
    if (node.dataset.loaded === "1") return;

    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      node.dataset.loaded = "1";
    } catch {
      // Adsense script may not be loaded in local dev
    }
  }, []);

  return (
    <div className={`rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-100">{t("ad.label")}</span>
        <span>{t("ad.placeholder")}</span>
      </div>
      <ins
        ref={(el) => {
          adRef.current = el;
        }}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2300689809815106"
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
