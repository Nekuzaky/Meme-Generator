import { Link, useLocation } from "react-router-dom";
import { MdAutoAwesome, MdImage, MdOutlineRocketLaunch } from "react-icons/md";
import MemeGenerator from "../components/MemeGenerator";
import { useLanguage } from "../context/LanguageContext";
import type { Meme as MemeType } from "../types/types";
import OwnMeme from "./OwnMeme";

export default function Home() {
  const { language } = useLanguage();
  const location = useLocation();
  const selectedTemplate = (location.state as { selectedTemplate?: MemeType } | null)
    ?.selectedTemplate;

  const copy =
    language === "fr"
      ? {
          kicker: "Creator",
          title: "Template, texte, export.",
          subtitle:
            "Le Creator sert a finaliser un meme. Commence par un template, ecris ton texte, puis exporte sans friction.",
          trending: "1. Choisir un template",
          upload: "2. Importer mon image",
          editor: "3. Ouvrir l'editor",
          flowTitle: "Flow ultra-court",
          flow: [
            "Choisir un template dans la galerie",
            "Ecrire le texte sur le visuel",
            "Exporter en PNG ou format social",
          ],
        }
      : {
          kicker: "Creator",
          title: "Template, text, export.",
          subtitle:
            "The Creator is for finishing a meme fast. Start from a template, write the caption, then export cleanly.",
          trending: "1. Pick a template",
          upload: "2. Upload my image",
          editor: "3. Open editor",
          flowTitle: "Quick flow",
          flow: [
            "Pick a template from the gallery",
            "Write the text on the visual",
            "Export to PNG or social format",
          ],
        };

  return (
    <div className="space-y-6">
      <section className="glass-card p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="inline-flex items-center gap-2 rounded-full border border-fuchsia-400/30 bg-fuchsia-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-200">
              <MdAutoAwesome className="text-sm" />
              {copy.kicker}
            </p>
            <h1 className="display-font text-3xl text-white md:text-4xl">{copy.title}</h1>
            <p className="max-w-2xl text-sm text-slate-300">{copy.subtitle}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              to="/templates"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <MdAutoAwesome className="text-base" />
              {copy.trending}
            </Link>
            <a
              href="#upload-lab"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60"
            >
              <MdImage className="text-base" />
              {copy.upload}
            </a>
            <Link
              to="/editor"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60"
            >
              <MdOutlineRocketLaunch className="text-base" />
              {copy.editor}
            </Link>
          </div>
        </div>
        <div className="mt-5 grid gap-2 md:grid-cols-3">
          {copy.flow.map((step, index) => (
            <div
              key={step}
              className="rounded-2xl border border-white/10 bg-slate-950/60 p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
                {copy.flowTitle} {index + 1}
              </p>
              <p className="mt-1 text-sm text-slate-200">{step}</p>
            </div>
          ))}
        </div>
      </section>
      {selectedTemplate ? (
        <section className="glass-card p-5 md:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-300">
                {language === "fr" ? "Template choisi" : "Selected template"}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-white">
                {selectedTemplate.name}
              </h2>
            </div>
            <Link
              to="/templates"
              className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60"
            >
              {language === "fr" ? "Changer de template" : "Change template"}
            </Link>
          </div>
          <MemeGenerator
            imageUrl={selectedTemplate.url}
            box_count={selectedTemplate.box_count ?? 2}
            imageName={selectedTemplate.name}
          />
        </section>
      ) : null}
      <OwnMeme />
    </div>
  );
}
