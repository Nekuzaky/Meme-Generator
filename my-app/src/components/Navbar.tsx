export default function Navbar() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/10 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 via-rose-500 to-amber-400 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30">
            MG
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-100">
              Générateur de memes
            </p>
            <p className="text-xs text-slate-300">
              Crée, personnalise et télécharge en un clic
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-3 text-sm text-slate-300 md:flex">
          <span>100+ memes tendance</span>
          <span>•</span>
          <span>Texte glisser-déposer</span>
        </div>
      </div>
    </header>
  );
}
