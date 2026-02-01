import { useLanguage } from "../context/LanguageContext";

export default function AdBanner() {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-xs text-slate-300">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-semibold text-slate-100">{t("ad.label")}</span>
        <span>{t("ad.placeholder")}</span>
      </div>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2300689809815106"
        data-ad-slot="0000000000"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
      <script
        dangerouslySetInnerHTML={{
          __html: "(adsbygoogle = window.adsbygoogle || []).push({});",
        }}
      />
    </div>
  );
}
