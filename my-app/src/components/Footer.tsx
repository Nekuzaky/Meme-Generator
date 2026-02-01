import {
  FaInstagram,
  FaTiktok,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { useLanguage } from "../context/LanguageContext";

function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="border-t border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-sm text-slate-300 md:flex-row md:px-6">
        <div className="flex flex-col items-center gap-2 md:items-start">
          <p>{t("footer.copyright")}</p>
          <p>{t("footer.credit")}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-wide text-slate-400">
            {t("footer.follow")}
          </span>
          <div className="flex items-center gap-3">
            <a
              href="#"
              aria-label={t("social.instagram")}
              className="rounded-full border border-white/10 bg-slate-900/70 p-2 text-slate-200 transition hover:border-fuchsia-400/60 hover:text-white"
            >
              <FaInstagram className="text-lg" />
            </a>
            <a
              href="#"
              aria-label={t("social.tiktok")}
              className="rounded-full border border-white/10 bg-slate-900/70 p-2 text-slate-200 transition hover:border-fuchsia-400/60 hover:text-white"
            >
              <FaTiktok className="text-lg" />
            </a>
            <a
              href="#"
              aria-label={t("social.x")}
              className="rounded-full border border-white/10 bg-slate-900/70 p-2 text-slate-200 transition hover:border-fuchsia-400/60 hover:text-white"
            >
              <FaXTwitter className="text-lg" />
            </a>
            <a
              href="#"
              aria-label={t("social.youtube")}
              className="rounded-full border border-white/10 bg-slate-900/70 p-2 text-slate-200 transition hover:border-fuchsia-400/60 hover:text-white"
            >
              <FaYoutube className="text-lg" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;