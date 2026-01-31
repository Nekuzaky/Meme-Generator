import { useState } from "react";
import { MdImage, MdInfo, MdLink, MdRefresh } from "react-icons/md";
import MemeGenerator from "../components/MemeGenerator";

export default function OwnMeme() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [imageLink, setImageLink] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setImageName(files[0].name);
      setImageUrl(URL.createObjectURL(files[0]));
    }
  };

  const handleImageLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageLink(e.target.value);
  };

  const applyImageLink = () => {
    const trimmed = imageLink.trim();
    if (!trimmed) return;
    setImageUrl(trimmed);
    setImageName("meme-personnalise.png");
  };

  const resetState = () => {
    setImageUrl(null);
    setImageLink("");
    setImageName("");
  };

  return (
    <section className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-400">
            Ton image
          </p>
          <h2 className="text-2xl font-semibold text-slate-100 md:text-3xl">
            Crée un meme à partir de tes propres images
          </h2>
          <p className="text-sm text-slate-300 md:text-base">
            Importe un fichier ou colle un lien direct, puis ajoute ton texte.
          </p>
        </div>
        <button
          className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60"
          onClick={resetState}
        >
          <MdRefresh className="text-lg" />
          Réinitialiser
        </button>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/60 px-6 py-10 text-center transition hover:border-fuchsia-400/60">
            <MdImage className="text-3xl text-fuchsia-500" />
            <p className="text-sm font-semibold text-slate-100">
              Dépose une image ou clique pour choisir un fichier
            </p>
            <p className="text-xs text-slate-400">PNG, JPG, GIF</p>
            <input
              className="hidden"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
            />
          </label>

          <div className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
              <MdLink className="text-lg text-fuchsia-500" />
              Utiliser un lien d’image
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-fuchsia-400/80"
                placeholder="https://..."
                value={imageLink}
                onChange={handleImageLink}
              />
              <button
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                onClick={applyImageLink}
              >
                Utiliser
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-sm text-slate-300">
          <div className="flex items-start gap-3">
            <MdInfo className="mt-0.5 text-xl text-fuchsia-500" />
            <div className="space-y-2">
              <p className="font-semibold text-slate-100">Conseils rapides</p>
              <ul className="list-disc space-y-1 pl-4">
                <li>Privilégie des images en haute résolution.</li>
                <li>Glisse les textes directement sur l’image.</li>
                <li>Ajoute plusieurs zones pour plus d’impact.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {imageUrl ? (
          <MemeGenerator imageUrl={imageUrl} box_count={2} imageName={imageName} />
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-10 text-center text-sm text-slate-400">
            Ajoute une image pour commencer à personnaliser ton meme.
          </div>
        )}
      </div>
    </section>
  );
}
