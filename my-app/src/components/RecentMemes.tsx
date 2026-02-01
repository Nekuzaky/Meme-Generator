import type { RecentMeme } from "../types/types";
import { useLanguage } from "../context/LanguageContext";

interface Props {
  title: string;
  items: RecentMeme[];
  onSelect: (item: RecentMeme) => void;
  onClear: () => void;
}

export default function RecentMemes({ title, items, onSelect, onClear }: Props) {
  const { t } = useLanguage();
  const getSourceLabel = (source?: string) => {
    if (source === "tendance") return t("recent.source.trending");
    if (source === "perso") return t("recent.source.custom");
    return source ?? "";
  };

  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-semibold text-slate-300 transition hover:text-white"
        >
          {t("recent.clear")}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 text-xs text-slate-400">
          {t("recent.empty")}
        </p>
      ) : (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
          {items.map((item) => (
            <button
              key={`${item.url}-${item.name}`}
              type="button"
              onClick={() => onSelect(item)}
              className="flex w-24 flex-shrink-0 flex-col gap-2 text-left"
            >
              <div className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-slate-950/70">
                <img
                  src={item.url}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <p className="truncate text-xs font-semibold text-slate-200">
                {item.name}
              </p>
              {item.source && (
                <span className="text-[10px] uppercase tracking-wide text-slate-400">
                  {getSourceLabel(item.source)}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
