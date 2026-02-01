import { Link, NavLink } from "react-router-dom";
import logo from "../assets/images/logo.png";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const flag = language === "fr" ? "🇫🇷" : "🇬🇧";

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-3"
            aria-label={t("brand.name")}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 shadow-lg shadow-fuchsia-500/30">
              <img
                src={logo}
                alt={t("brand.name")}
                className="h-8 w-8"
              />
            </div>
            <div>
              <p className="rgb-text text-lg">{t("brand.name")}</p>
              <p className="text-xs text-slate-300">
                {t("brand.tagline")}
              </p>
            </div>
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-300">
          <div className="hidden items-center gap-3 md:flex">
            <span>{t("navbar.trending")}</span>
            <span>•</span>
            <span>{t("navbar.drag")}</span>
          </div>
          <nav className="flex items-center gap-3">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? "bg-fuchsia-500/20 text-fuchsia-200"
                    : "text-slate-300 hover:text-white"
                }`
              }
            >
              {t("navbar.home")}
            </NavLink>
            <NavLink
              to="/editor"
              className={({ isActive }) =>
                `rounded-full px-3 py-1 text-xs font-semibold transition ${
                  isActive
                    ? "bg-fuchsia-500/20 text-fuchsia-200"
                    : "text-slate-300 hover:text-white"
                }`
              }
            >
              {t("navbar.editor")}
            </NavLink>
          </nav>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-xs font-semibold">
            <span className="text-slate-300">
              {t("navbar.language")} {flag}
            </span>
            <select
              className="bg-transparent text-xs text-slate-100 outline-none"
              value={language}
              onChange={(e) => setLanguage(e.target.value as "fr" | "en")}
              aria-label={t("navbar.language")}
            >
              <option value="fr">🇫🇷 FR</option>
              <option value="en">🇬🇧 EN</option>
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
