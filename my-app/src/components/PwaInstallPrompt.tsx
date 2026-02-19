import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaInstallPrompt() {
  const { language } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null
  );
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const labels = useMemo(
    () =>
      language === "fr"
        ? {
            title: "Installer l'app",
            text: "Ajoute Meme Creator sur ton ecran d'accueil pour une experience plus fluide.",
            install: "Installer",
            close: "Fermer",
          }
        : {
            title: "Install app",
            text: "Add Meme Creator to your home screen for a smoother mobile experience.",
            install: "Install",
            close: "Close",
          },
    [language]
  );

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setHidden(true);
  };

  if (!deferredPrompt || hidden) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-40 w-[min(92vw,480px)] -translate-x-1/2 rounded-2xl border border-white/10 bg-slate-950/90 p-4 shadow-xl">
      <p className="text-sm font-semibold text-slate-100">{labels.title}</p>
      <p className="mt-1 text-xs text-slate-300">{labels.text}</p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={install}
          className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-2 text-xs font-semibold text-white"
        >
          {labels.install}
        </button>
        <button
          type="button"
          onClick={() => setHidden(true)}
          className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 text-xs font-semibold text-slate-200"
        >
          {labels.close}
        </button>
      </div>
    </div>
  );
}
