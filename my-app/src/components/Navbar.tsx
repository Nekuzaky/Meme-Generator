import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  MdAutoAwesome,
  MdDarkMode,
  MdLightMode,
  MdLocalFireDepartment,
  MdMilitaryTech,
} from "react-icons/md";
import logo from "../assets/images/logo.png";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
import { readEngagementSnapshot } from "../lib/engagement";

export default function Navbar() {
  const { language, setLanguage, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [engagement, setEngagement] = useState(() => readEngagementSnapshot());
  const languageLabel = language.toUpperCase();
  const isDark = theme === "dark";
  const challengePercent = Math.round(
    (engagement.challengeProgress / engagement.challengeGoal) * 100
  );

  useEffect(() => {
    const refresh = () => setEngagement(readEngagementSnapshot());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const copy =
    language === "fr"
      ? {
          level: "Niveau",
          streak: "Serie",
          days: "jours",
          challenge: "Challenge",
          turbo: "Mode turbo",
        }
      : {
          level: "Level",
          streak: "Streak",
          days: "days",
          challenge: "Challenge",
          turbo: "Turbo mode",
        };

  const headerClasses = isDark
    ? "border-white/10 bg-slate-950/80 supports-[backdrop-filter]:bg-slate-950/65"
    : "border-slate-200/90 bg-white/90 supports-[backdrop-filter]:bg-white/75";
  const controlClasses = isDark
    ? "border-white/10 bg-slate-900/70 text-slate-200"
    : "border-slate-200 bg-white/95 text-slate-700 shadow-sm shadow-slate-200/80";
  const activeNavClasses = isDark
    ? "bg-fuchsia-500/20 text-fuchsia-200"
    : "bg-fuchsia-100 text-fuchsia-700";
  const idleNavClasses = isDark
    ? "text-slate-300 hover:text-white"
    : "text-slate-600 hover:text-slate-900";
  const mutedTextClasses = isDark ? "text-slate-300" : "text-slate-600";
  const selectTextClasses = isDark ? "text-slate-100" : "text-slate-800";

  return (
    <header className={`sticky top-0 z-30 w-full border-b backdrop-blur ${headerClasses}`}>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label={t("brand.name")}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 shadow-lg shadow-fuchsia-500/30 transition group-hover:scale-105">
              <img
                src={logo}
                alt={t("brand.name")}
                className="h-8 w-8"
              />
            </div>
            <div>
              <p className="rgb-text text-lg">{t("brand.name")}</p>
              <p className={`hidden text-xs sm:block ${mutedTextClasses}`}>
                {t("brand.tagline")}
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div
              className={`hidden items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold md:flex ${controlClasses}`}
            >
              <span className="text-fuchsia-300">
                <MdMilitaryTech className="text-sm" />
              </span>
              <span className={mutedTextClasses}>
                {copy.level} {engagement.level}
              </span>
            </div>

            <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${controlClasses}`}>
              <span className={mutedTextClasses}>
                {t("navbar.language")} {languageLabel}
              </span>
              <select
                className={`bg-transparent text-xs outline-none ${selectTextClasses}`}
                value={language}
                onChange={(e) =>
                  setLanguage(e.target.value as "fr" | "en" | "de" | "it" | "ja")
                }
                aria-label={t("navbar.language")}
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
                <option value="de">DE</option>
                <option value="it">IT</option>
                <option value="ja">JA</option>
              </select>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition hover:border-fuchsia-400/60 ${controlClasses}`}
              aria-label={t("navbar.theme")}
            >
              {theme === "dark" ? (
                <MdDarkMode className="text-sm" />
              ) : (
                <MdLightMode className="text-sm" />
              )}
              <span className="hidden sm:inline">
                {theme === "dark" ? t("theme.dark") : t("theme.light")}
              </span>
            </button>

            <Link
              to="/creator"
              className="hidden items-center gap-2 rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:brightness-110 md:flex"
            >
              <MdAutoAwesome className="text-sm" />
              {copy.turbo}
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <nav className="flex items-center gap-2 overflow-x-auto pb-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? activeNavClasses : idleNavClasses}`
              }
            >
              {t("navbar.home")}
            </NavLink>
            <NavLink
              to="/creator"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? activeNavClasses : idleNavClasses}`
              }
            >
              {t("navbar.creator")}
            </NavLink>
            <NavLink
              to="/editor"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? activeNavClasses : idleNavClasses}`
              }
            >
              {t("navbar.editor")}
            </NavLink>
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? activeNavClasses : idleNavClasses}`
              }
            >
              {t("navbar.profile")}
            </NavLink>
          </nav>

          <div className={`hidden items-center gap-3 text-xs md:flex ${mutedTextClasses}`}>
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/30 bg-amber-400/10 px-2 py-1 text-amber-200">
              <MdLocalFireDepartment className="text-sm" />
              {copy.streak} {engagement.currentStreak} {copy.days}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2 py-1">
              {copy.challenge} {engagement.challengeProgress}/{engagement.challengeGoal}
              <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-800">
                <span
                  className="block h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 transition-all duration-300"
                  style={{ width: `${Math.max(8, challengePercent)}%` }}
                />
              </span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
