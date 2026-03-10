import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  MdAutoAwesome,
  MdCollections,
  MdDarkMode,
  MdEdit,
  MdLightMode,
  MdLocalFireDepartment,
  MdMilitaryTech,
  MdPerson,
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
          home: "Accueil",
          nav: [
            {
              to: "/templates",
              label: "Templates",
              hint: "Choisir un format viral",
              icon: MdCollections,
            },
            {
              to: "/creator",
              label: "Creator",
              hint: "Ecrire et composer le meme",
              icon: MdAutoAwesome,
            },
            {
              to: "/editor",
              label: "Editor",
              hint: "Retoucher une image",
              icon: MdEdit,
            },
            {
              to: "/profile",
              label: "Profile",
              hint: "Sauvegardes et compte",
              icon: MdPerson,
            },
          ],
        }
      : {
          level: "Level",
          streak: "Streak",
          days: "days",
          challenge: "Challenge",
          turbo: "Turbo mode",
          home: "Home",
          nav: [
            {
              to: "/templates",
              label: "Templates",
              hint: "Pick a viral format",
              icon: MdCollections,
            },
            {
              to: "/creator",
              label: "Creator",
              hint: "Write and build the meme",
              icon: MdAutoAwesome,
            },
            {
              to: "/editor",
              label: "Editor",
              hint: "Polish an image",
              icon: MdEdit,
            },
            {
              to: "/profile",
              label: "Profile",
              hint: "Account and saves",
              icon: MdPerson,
            },
          ],
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
            <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1.15rem] border border-white/15 bg-slate-950 shadow-lg shadow-fuchsia-500/20 transition duration-300 group-hover:scale-[1.04] group-hover:rotate-[-4deg]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,70,239,0.28),_transparent_46%),linear-gradient(135deg,rgba(34,211,238,0.2),rgba(244,114,182,0.14),rgba(245,158,11,0.2))]" />
              <div className="absolute inset-[2px] rounded-[1rem] border border-white/10 bg-slate-950/90" />
              <img
                src={logo}
                alt={t("brand.name")}
                className="relative h-8 w-8 drop-shadow-[0_4px_12px_rgba(244,114,182,0.35)]"
              />
            </div>
            <div>
              <p className="font-smash-slice text-lg tracking-wide text-white">
                {t("brand.name")}
              </p>
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

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <nav className="flex items-center gap-2 overflow-x-auto pb-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold transition ${isActive ? activeNavClasses : idleNavClasses}`
                }
              >
                {copy.home}
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

          <nav className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {copy.nav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-fuchsia-400/50 bg-fuchsia-500/15 text-white shadow-lg shadow-fuchsia-500/10"
                        : `${controlClasses} hover:border-fuchsia-400/50 hover:text-white`
                    }`
                  }
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 rounded-xl bg-white/10 p-2 text-base">
                      <Icon />
                    </span>
                    <div>
                      <p className="text-sm font-semibold">{item.label}</p>
                      <p className={`mt-0.5 text-[11px] ${mutedTextClasses}`}>
                        {item.hint}
                      </p>
                    </div>
                  </div>
                </NavLink>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
