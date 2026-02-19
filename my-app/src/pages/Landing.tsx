import { Link } from "react-router-dom";
import { MdAutoFixHigh, MdImage, MdRocketLaunch } from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";

export default function Landing() {
  const { t, language } = useLanguage();

  const copy =
    language === "fr"
      ? {
          chips: ["No signup requis", "Export PNG rapide", "Mobile friendly"],
          howTitle: "Comment ca marche",
          how: [
            {
              title: "1. Choisis un template",
              text: "Selectionne un meme tendance ou importe ton image perso.",
            },
            {
              title: "2. Edite en direct",
              text: "Ajoute texte, stickers, calques, alignement et effets.",
            },
            {
              title: "3. Exporte et partage",
              text: "Genere des formats reseaux et partage avec lien + QR.",
            },
          ],
          seoTitle: "Createur de memes en ligne gratuit",
          seoText:
            "Meme Creator est un createur de memes en ligne gratuit pour Instagram, TikTok, X et YouTube. Cree un meme en quelques secondes avec texte draggable, stickers, historique, exports social media et partage instantane.",
          faqTitle: "Questions frequentes",
          faq: [
            {
              q: "Puis-je utiliser mes propres images ?",
              a: "Oui, upload local ou URL directe. Le createur gere aussi les templates populaires.",
            },
            {
              q: "Le site fonctionne sur mobile ?",
              a: "Oui. Les poignées de redimensionnement sont optimisees pour le tactile.",
            },
            {
              q: "Puis-je sauvegarder mes memes ?",
              a: "Oui, cree un profil pour sauvegarder, republier et gerer tes creations.",
            },
          ],
        }
      : {
          chips: ["No signup required", "Fast PNG export", "Mobile friendly"],
          howTitle: "How it works",
          how: [
            {
              title: "1. Pick a template",
              text: "Choose a trending meme or import your own image.",
            },
            {
              title: "2. Edit live",
              text: "Add text, stickers, layers, alignment and effects.",
            },
            {
              title: "3. Export and share",
              text: "Generate social formats and share with link + QR.",
            },
          ],
          seoTitle: "Free online meme generator",
          seoText:
            "Meme Creator is a free online meme generator for Instagram, TikTok, X and YouTube. Build memes in seconds with draggable text, stickers, layers, social exports and instant sharing.",
          faqTitle: "FAQ",
          faq: [
            {
              q: "Can I use my own images?",
              a: "Yes, both local upload and direct URL are supported.",
            },
            {
              q: "Does it work on mobile?",
              a: "Yes. Resize handles are optimized for touch interactions.",
            },
            {
              q: "Can I save my memes?",
              a: "Yes, create a profile to save and manage your creations.",
            },
          ],
        };

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
            <p className="max-w-2xl text-sm text-slate-300 md:text-base">
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

          <div className="grid w-full max-w-sm gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <span>Templates sociaux</span>
              <span>Stories, posts</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Stickers & calques</span>
              <span>Ordre + lock</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Export & partage</span>
              <span>PNG + QR</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Profil cloud</span>
              <span>Sauvegarde</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
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

        <div className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-slate-900/60 p-6 transition hover:-translate-y-1 hover:border-amber-300/50">
          <div className="space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-300">
              <MdRocketLaunch className="text-2xl" />
            </div>
            <h2 className="text-xl font-semibold text-slate-100">{copy.howTitle}</h2>
            <p className="text-sm text-slate-300">{copy.how[2].text}</p>
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
          <h2 className="text-xl font-semibold text-slate-100">{copy.seoTitle}</h2>
          <p className="mt-3 text-sm text-slate-300">{copy.seoText}</p>

          <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-slate-300">
            {copy.howTitle}
          </h3>
          <div className="mt-3 grid gap-2">
            {copy.how.map((step) => (
              <div
                key={step.title}
                className="rounded-xl border border-white/10 bg-slate-950/70 p-3"
              >
                <p className="text-sm font-semibold text-slate-100">{step.title}</p>
                <p className="mt-1 text-xs text-slate-300">{step.text}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-slate-900/60 p-6">
          <h2 className="text-xl font-semibold text-slate-100">{copy.faqTitle}</h2>
          <div className="mt-4 space-y-3">
            {copy.faq.map((item) => (
              <div
                key={item.q}
                className="rounded-xl border border-white/10 bg-slate-950/70 p-3"
              >
                <h3 className="text-sm font-semibold text-slate-100">{item.q}</h3>
                <p className="mt-1 text-xs text-slate-300">{item.a}</p>
              </div>
            ))}
          </div>
        </article>
      </div>
    </section>
  );
}
