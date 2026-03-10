import { MdAutoAwesome, MdOutlineRocketLaunch } from "react-icons/md";
import { Link, useNavigate } from "react-router-dom";
import Meme from "../components/Meme";
import { useLanguage } from "../context/LanguageContext";
import type { Meme as MemeType } from "../types/types";

export default function TemplatesGallery() {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const copy =
    language === "fr"
      ? {
          kicker: "Templates",
          title: "Choisis d'abord le template, puis ouvre le Creator.",
          subtitle:
            "Cette page sert uniquement a trouver un format viral. Une fois choisi, tu bascules dans le Creator pour ecrire et exporter.",
          creator: "Aller au Creator",
        }
      : {
          kicker: "Templates",
          title: "Pick the template first, then open the Creator.",
          subtitle:
            "This page is only for finding a viral format. Once selected, you move into the Creator to write and export.",
          creator: "Go to Creator",
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

          <Link
            to="/creator"
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-cyan-400/60"
          >
            <MdOutlineRocketLaunch className="text-base" />
            {copy.creator}
          </Link>
        </div>
      </section>

      <Meme
        galleryOnly
        onTemplatePick={(meme: MemeType) =>
          navigate("/creator", { state: { selectedTemplate: meme } })
        }
      />
    </div>
  );
}
