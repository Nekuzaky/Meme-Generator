import { Link } from "react-router-dom";
import { MdAutoFixHigh, MdImage } from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";

export default function Landing() {
  const { t } = useLanguage();

  return (
    <section className="glass-card w-full overflow-hidden p-6 md:p-10">
      <div className="relative">
        <div className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl md:h-64 md:w-64" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-40 w-40 rounded-full bg-cyan-400/20 blur-3xl md:h-60 md:w-60" />

        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-fuchsia-300">
              {t("landing.kicker")}
            </p>
            <h1 className="rgb-text text-3xl leading-tight md:text-5xl">
              {t("landing.title")}
            </h1>
            <p className="max-w-xl text-sm text-slate-300 md:text-base">
              {t("landing.subtitle")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/creator"
                className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {t("landing.creator.cta")}
              </Link>
              <Link
                to="/editor"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 hover:text-white"
              >
                {t("landing.editor.cta")}
              </Link>
            </div>
          </div>

          <div className="grid w-full max-w-sm gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>⚡ Templates sociaux</span>
              <span>Stories, posts</span>
            </div>
            <div className="flex items-center justify-between">
              <span>✨ Stickers & calques</span>
              <span>Ordre + lock</span>
            </div>
            <div className="flex items-center justify-between">
              <span>📦 Export & partage</span>
              <span>PNG + QR</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-fuchsia-400/40">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-fuchsia-500/15 text-fuchsia-300">
              <MdAutoFixHigh className="text-2xl" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">
              {t("landing.creator.title")}
            </h2>
            <p className="text-sm text-slate-300">
              {t("landing.creator.description")}
            </p>
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
            <h2 className="text-xl font-semibold text-slate-100">
              {t("landing.editor.title")}
            </h2>
            <p className="text-sm text-slate-300">
              {t("landing.editor.description")}
            </p>
          </div>
          <Link
            to="/editor"
            className="mt-6 inline-flex items-center justify-center rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 hover:text-white"
          >
            {t("landing.editor.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
