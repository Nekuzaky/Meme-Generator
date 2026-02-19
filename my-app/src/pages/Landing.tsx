import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdAutoFixHigh,
  MdBolt,
  MdImage,
  MdLocalFireDepartment,
  MdMilitaryTech,
  MdRocketLaunch,
  MdStars,
  MdTimer,
} from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";
import { readEngagementSnapshot } from "../lib/engagement";
import { getPublicMemesApi, type ApiMeme } from "../lib/api";

export default function Landing() {
  const { t, language } = useLanguage();
  const [engagement, setEngagement] = useState(() => readEngagementSnapshot());
  const [publicMemes, setPublicMemes] = useState<ApiMeme[]>([]);
  const [publicLoading, setPublicLoading] = useState(false);
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

  useEffect(() => {
    setPublicLoading(true);
    getPublicMemesApi({ limit: 8 })
      .then((response) => {
        setPublicMemes(response.items);
      })
      .catch(() => {
        setPublicMemes([]);
      })
      .finally(() => setPublicLoading(false));
  }, []);

  const copy =
    language === "fr"
      ? {
          chips: ["Sans inscription", "Export social 1 clic", "Mobile optimise"],
          spotlightTitle: "Ta progression est en direct",
          spotlightText:
            "Chaque creation augmente ton niveau. Garde ta serie active et complete le challenge du jour.",
          challengeDone: "Challenge termine. Continue pour booster ton score.",
          challengeOpen: "Encore quelques actions pour finir le challenge du jour.",
          stats: {
            level: "Niveau",
            streak: "Serie",
            days: "jours",
            score: "Score",
            challenge: "Challenge du jour",
            activeDays: "jours actifs",
          },
          modeTitle: "Choisis ton mode de creation",
          modeText:
            "Passe du template viral au rendu social en quelques secondes, sans casser ton flow.",
          loopTitle: "Pourquoi tu reviens demain",
          loop: [
            {
              title: "Loop 1: idees rapides",
              text: "Templates tendance + texte drag and drop = concept en moins d'une minute.",
            },
            {
              title: "Loop 2: gratification instantanee",
              text: "Export natif Story/Post/Banner et partage direct sans retraitement.",
            },
            {
              title: "Loop 3: progression perso",
              text: "Serie, niveau et challenge quotidien pour garder le rythme.",
            },
          ],
          quickWinsTitle: "Ce qui rend l'outil pro + fun",
          quickWins: [
            "Undo/Redo complet pour tester sans stress",
            "Calques et stickers pour des memes plus construits",
            "Lien + QR pour partager en 2 secondes",
            "Profil cloud pour sauvegarder tes meilleurs formats",
          ],
          publicTitle: "Memes publics recents",
          publicSubtitle: "Ouvre, partage ou remixe les creations de la communaute.",
          remix: "Remix",
          view: "Voir",
        }
      : {
          chips: ["No signup", "One-click social export", "Mobile optimized"],
          spotlightTitle: "Your momentum is live",
          spotlightText:
            "Every creation increases your level. Keep your streak alive and complete the daily challenge.",
          challengeDone: "Challenge completed. Keep going to boost your score.",
          challengeOpen: "A few more actions to complete today's challenge.",
          stats: {
            level: "Level",
            streak: "Streak",
            days: "days",
            score: "Score",
            challenge: "Daily challenge",
            activeDays: "active days",
          },
          modeTitle: "Choose your creation mode",
          modeText:
            "Move from viral template to social-ready output in seconds without breaking your flow.",
          loopTitle: "Why you come back tomorrow",
          loop: [
            {
              title: "Loop 1: fast ideas",
              text: "Trending templates + drag and drop text = concept in under one minute.",
            },
            {
              title: "Loop 2: instant reward",
              text: "Native Story/Post/Banner exports and direct sharing with no extra editing.",
            },
            {
              title: "Loop 3: personal progression",
              text: "Streak, level, and daily challenge keep your creative rhythm active.",
            },
          ],
          quickWinsTitle: "What makes it pro + fun",
          quickWins: [
            "Full Undo/Redo to experiment without fear",
            "Layers and stickers for more crafted memes",
            "Link + QR sharing in under 2 seconds",
            "Cloud profile to save your best formats",
          ],
          publicTitle: "Recent public memes",
          publicSubtitle: "Open, share, or remix creations from the community.",
          remix: "Remix",
          view: "View",
        };

  const buildRemixLink = (meme: ApiMeme) => {
    const payload = meme.payload as
      | {
          version?: number;
          activeImageUrl?: string;
          activeImageName?: string;
          boxesCount?: number;
          boxes?: unknown[];
          textLayers?: unknown[];
          stickers?: unknown[];
        }
      | null
      | undefined;
    if (
      payload &&
      payload.version === 1 &&
      typeof payload.activeImageUrl === "string" &&
      Array.isArray(payload.boxes) &&
      Array.isArray(payload.textLayers) &&
      Array.isArray(payload.stickers)
    ) {
      const encoded = encodeURIComponent(
        btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
      );
      return `/creator?memeShare=${encoded}`;
    }
    return `/m/${meme.id}`;
  };

  return (
    <section className="glass-card relative w-full overflow-hidden p-6 md:p-10">
      <div className="pointer-events-none absolute -left-24 top-0 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-12 h-56 w-56 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-300/15 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/40 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
            <MdStars className="text-sm" />
            {t("landing.kicker")}
          </p>

          <h1 className="rgb-text text-4xl leading-tight md:text-6xl">
            {t("landing.title")}
          </h1>
          <p className="max-w-2xl text-sm text-slate-300 md:text-base">
            {t("landing.subtitle")}
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/creator"
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
            >
              {t("landing.creator.cta")}
            </Link>
            <Link
              to="/editor"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 hover:text-white"
            >
              {t("landing.editor.cta")}
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 hover:text-white"
            >
              {t("navbar.profile")}
            </Link>
          </div>

          <div className="flex flex-wrap gap-2">
            {copy.chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-[11px] font-semibold text-slate-200"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>

        <aside className="rounded-2xl border border-white/10 bg-slate-900/70 p-5 shadow-xl shadow-fuchsia-500/10">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-100">{copy.spotlightTitle}</h2>
            <span className="rounded-full border border-amber-300/40 bg-amber-400/10 px-2 py-1 text-[11px] font-semibold text-amber-200">
              {copy.stats.activeDays}: {engagement.totalDays}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-300">{copy.spotlightText}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">{copy.stats.level}</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-100">
                <MdMilitaryTech className="text-amber-300" />
                {engagement.level}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">{copy.stats.streak}</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-100">
                <MdLocalFireDepartment className="text-rose-300" />
                {engagement.currentStreak} {copy.stats.days}
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
              <p className="text-[11px] text-slate-400">{copy.stats.score}</p>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-slate-100">
                <MdBolt className="text-fuchsia-300" />
                {engagement.totalScore}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/70 p-3">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>{copy.stats.challenge}</span>
              <span>
                {engagement.challengeProgress}/{engagement.challengeGoal}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
              <span
                className="block h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-rose-500 to-amber-400 transition-all duration-300"
                style={{ width: `${Math.max(6, challengePercent)}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-400">
              {engagement.challengeProgress >= engagement.challengeGoal
                ? copy.challengeDone
                : copy.challengeOpen}
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold text-slate-100">{copy.modeTitle}</h2>
        <p className="text-sm text-slate-300">{copy.modeText}</p>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-fuchsia-400/40">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300">
              <MdAutoFixHigh className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100">{t("landing.creator.title")}</h3>
            <p className="text-sm text-slate-300">{t("landing.creator.description")}</p>
          </div>
          <Link
            to="/creator"
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {t("landing.creator.cta")}
          </Link>
        </div>

        <div className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-cyan-400/40">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300">
              <MdImage className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100">{t("landing.editor.title")}</h3>
            <p className="text-sm text-slate-300">{t("landing.editor.description")}</p>
          </div>
          <Link
            to="/editor"
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 hover:text-white"
          >
            {t("landing.editor.cta")}
          </Link>
        </div>

        <div className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-amber-300/50">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
              <MdRocketLaunch className="text-2xl" />
            </div>
            <h3 className="text-xl font-semibold text-slate-100">{t("navbar.profile")}</h3>
            <p className="text-sm text-slate-300">{copy.quickWins[3]}</p>
          </div>
          <Link
            to="/profile"
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 hover:text-white"
          >
            {t("navbar.profile")}
          </Link>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-xl font-semibold text-slate-100">{copy.loopTitle}</h3>
          <div className="mt-4 grid gap-3">
            {copy.loop.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-white/10 bg-slate-950/70 p-3"
              >
                <p className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <MdTimer className="text-fuchsia-300" />
                  {item.title}
                </p>
                <p className="mt-1 text-xs text-slate-300">{item.text}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h3 className="text-xl font-semibold text-slate-100">{copy.quickWinsTitle}</h3>
          <div className="mt-4 grid gap-2">
            {copy.quickWins.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-slate-200"
              >
                {item}
              </div>
            ))}
          </div>
        </article>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-slate-900/60 p-6">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold text-slate-100">{copy.publicTitle}</h3>
          <p className="text-sm text-slate-300">{copy.publicSubtitle}</p>
        </div>
        {publicLoading ? (
          <p className="mt-4 text-xs text-slate-400">{language === "fr" ? "Chargement..." : "Loading..."}</p>
        ) : publicMemes.length === 0 ? (
          <p className="mt-4 text-xs text-slate-400">
            {language === "fr" ? "Aucun meme public pour le moment." : "No public memes yet."}
          </p>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {publicMemes.map((meme) => {
              const preview = meme.generated_image_url || meme.source_image_url || "";
              return (
                <div
                  key={meme.id}
                  className="overflow-hidden rounded-xl border border-white/10 bg-slate-950/70"
                >
                  {preview ? (
                    <img
                      src={preview}
                      alt={meme.title}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-36 items-center justify-center text-xs text-slate-500">
                      No preview
                    </div>
                  )}
                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-semibold text-slate-100">{meme.title}</p>
                    <p className="text-[11px] text-slate-400">{meme.username ?? "Creator"}</p>
                    <div className="flex gap-2">
                      <Link
                        to={`/m/${meme.id}`}
                        className="rounded-full border border-white/10 bg-slate-900/70 px-2 py-1 text-[11px] font-semibold text-slate-200"
                      >
                        {copy.view}
                      </Link>
                      <Link
                        to={buildRemixLink(meme)}
                        className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-2 py-1 text-[11px] font-semibold text-fuchsia-100"
                      >
                        {copy.remix}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
