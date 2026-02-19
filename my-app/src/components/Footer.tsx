import {
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import AdBanner from "./AdBanner";

function Footer() {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const footerClasses = isDark
    ? "border-white/10 bg-slate-950/70"
    : "border-slate-200/80 bg-white/80";
  const textClasses = isDark ? "text-slate-300" : "text-slate-600";
  const iconClasses = isDark
    ? "border-white/10 bg-slate-900/70 text-slate-200"
    : "border-slate-200 bg-white/90 text-slate-700 shadow-sm shadow-slate-200/60";

  return (
    <footer className={`border-t backdrop-blur ${footerClasses}`}>
      <div className={`mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-6 text-sm md:px-6 ${textClasses}`}>
        <AdBanner />
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p>{t("footer.copyright")}</p>
            <p>{t("footer.credit")}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs uppercase tracking-wide ${isDark ? "text-slate-400" : "text-slate-500"}`}>
              {t("footer.follow")}
            </span>
            <div className="flex items-center gap-3">
              <a
                href="#"
                aria-label={t("social.instagram")}
                className={`rounded-full border p-2 transition hover:border-fuchsia-400/60 hover:text-white ${iconClasses}`}
              >
                <FaInstagram className="text-lg" />
              </a>
              <a
                href="#"
                aria-label={t("social.tiktok")}
                className={`rounded-full border p-2 transition hover:border-fuchsia-400/60 hover:text-white ${iconClasses}`}
              >
                <FaTiktok className="text-lg" />
              </a>
              <a
                href="#"
                aria-label={t("social.x")}
                className={`rounded-full border p-2 transition hover:border-fuchsia-400/60 hover:text-white ${iconClasses}`}
              >
                <FaXTwitter className="text-lg" />
              </a>
              <a
                href="#"
                aria-label={t("social.youtube")}
                className={`rounded-full border p-2 transition hover:border-fuchsia-400/60 hover:text-white ${iconClasses}`}
              >
                <FaYoutube className="text-lg" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
