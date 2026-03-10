import { useCallback, useEffect, useMemo, useState } from "react";
import MemeGenerator from "../components/MemeGenerator";
import RecentMemes from "./RecentMemes";
import { useLanguage } from "../context/LanguageContext";
import { useRecentMemes } from "../hooks/useRecentMemes";
import type { Meme as MemeType } from "../types/types";

const FAVORITES_KEY = "meme-creator-favorite-templates";

const tagRules: { tag: string; keywords: string[] }[] = [
  { tag: "reaction", keywords: ["face", "when", "guy", "girl", "kid", "man", "woman"] },
  { tag: "animals", keywords: ["cat", "dog", "bear", "monkey", "animal"] },
  { tag: "movies", keywords: ["movie", "film", "star wars", "batman", "spiderman"] },
  { tag: "gaming", keywords: ["game", "gamer", "pc", "console", "minecraft"] },
  { tag: "social", keywords: ["instagram", "facebook", "twitter", "x ", "tiktok"] },
  { tag: "classic", keywords: ["drake", "success", "fry", "distracted", "two buttons"] },
];

const getTagsForName = (name: string) => {
  const lower = name.toLowerCase();
  const tags = tagRules
    .filter((rule) => rule.keywords.some((keyword) => lower.includes(keyword)))
    .map((rule) => rule.tag);
  return tags.length ? Array.from(new Set(tags)) : ["classic"];
};

interface MemeProps {
  galleryOnly?: boolean;
  onTemplatePick?: (meme: MemeType) => void;
}

export default function Meme({ galleryOnly = false, onTemplatePick }: MemeProps) {
  const { t } = useLanguage();
  const PAGE_SIZE = 18;
  const fallbackMeme: MemeType = {
    id: "fallback",
    name: t("meme.fallback"),
    url: "https://i.imgflip.com/64sz4u.png",
    box_count: 2,
  };
  const [memes, setMemes] = useState<MemeType[]>([]);
  const [currentMeme, setCurrentMeme] = useState<MemeType | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [sortMode, setSortMode] = useState<"popular" | "name">("popular");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { recentMemes, addRecentMeme, clearRecentMemes } = useRecentMemes(
    "recent-memes-tendance"
  );

  useEffect(() => {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as string[];
      setFavoriteIds(parsed);
    } catch {
      setFavoriteIds([]);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const res = await fetch("https://api.imgflip.com/get_memes");
        const data = await res.json();
        setMemes(data.data.memes || []);
      } catch {
        setError(t("meme.error"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [t]);

  useEffect(() => {
    if (error) {
      setError(t("meme.error"));
    }
  }, [t, error]);

  const memesWithMeta = useMemo(
    () =>
      memes.map((meme, rank) => ({
        meme,
        rank,
        tags: getTagsForName(meme.name),
      })),
    [memes]
  );

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    memesWithMeta.forEach((item) => item.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort((a, b) => a.localeCompare(b));
  }, [memesWithMeta]);

  const filteredMemes = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    let next = memesWithMeta.filter((item) => {
      if (query && !item.meme.name.toLowerCase().includes(query)) return false;
      if (selectedTag !== "all" && !item.tags.includes(selectedTag)) return false;
      if (favoritesOnly && !favoriteIds.includes(item.meme.id)) return false;
      return true;
    });

    if (sortMode === "name") {
      next = [...next].sort((a, b) => a.meme.name.localeCompare(b.meme.name));
    } else {
      next = [...next].sort((a, b) => a.rank - b.rank);
    }

    return next.map((item) => item.meme);
  }, [memesWithMeta, searchQuery, selectedTag, sortMode, favoritesOnly, favoriteIds]);
  const totalPages = Math.max(1, Math.ceil(filteredMemes.length / PAGE_SIZE));
  const visibleTemplates = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMemes.slice(start, start + PAGE_SIZE);
  }, [filteredMemes, currentPage]);

  const randomMeme = useCallback(() => {
    if (!filteredMemes.length) return;
    const randomNum = Math.floor(Math.random() * filteredMemes.length);
    const picked = filteredMemes[randomNum];
    if (galleryOnly && onTemplatePick) {
      onTemplatePick(picked);
      return;
    }
    setCurrentMeme(picked);
  }, [filteredMemes, galleryOnly, onTemplatePick]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedTag, sortMode, favoritesOnly]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!filteredMemes.length) {
      setCurrentMeme(null);
      return;
    }

    if (!currentMeme || !filteredMemes.some((meme) => meme.id === currentMeme.id)) {
      setCurrentMeme(filteredMemes[0]);
    }
  }, [filteredMemes, currentMeme]);

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [id, ...prev]
    );
  };

  const hasSearchResults = filteredMemes.length > 0;
  const selectedMeme = currentMeme ?? (filteredMemes[0] ?? fallbackMeme);
  const isFavorite = selectedMeme?.id ? favoriteIds.includes(selectedMeme.id) : false;

  useEffect(() => {
    if (!hasSearchResults || !selectedMeme?.url) return;
    addRecentMeme({
      id: selectedMeme.id,
      name: selectedMeme.name,
      url: selectedMeme.url,
      source: "tendance",
      box_count: selectedMeme.box_count ?? 2,
    });
  }, [hasSearchResults, selectedMeme, addRecentMeme]);

  return (
    <section id="trending-lab" className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-400">
            {t("meme.kicker")}
          </p>
          <h2 className="rgb-text text-2xl md:text-3xl">
            {t("meme.title")}
          </h2>
          <p className="text-sm text-slate-300 md:text-base">
            {t("meme.description")}
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60 sm:w-auto"
            onClick={() => toggleFavorite(selectedMeme.id)}
            disabled={!selectedMeme?.id}
            type="button"
          >
            {isFavorite ? t("meme.unfavorite") : t("meme.favorite")}
          </button>
          <button
            className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            onClick={randomMeme}
            disabled={isLoading || !hasSearchResults}
            type="button"
          >
            {isLoading ? t("meme.loading") : t("meme.generate")}
          </button>
        </div>
      </div>

      {error ? (
        <p className="mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : (
        <div className="mt-8">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="w-full">
                <label
                  htmlFor="meme-search"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-300"
                >
                  {t("meme.searchLabel")}
                </label>
                <input
                  id="meme-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("meme.searchPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-fuchsia-400/80"
                />
              </div>

              <div className="grid w-full gap-2 sm:grid-cols-3 md:w-auto">
                <select
                  value={selectedTag}
                  onChange={(e) => setSelectedTag(e.target.value)}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 outline-none"
                >
                  <option value="all">{t("meme.tagAll")}</option>
                  {availableTags.map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
                <select
                  value={sortMode}
                  onChange={(e) => setSortMode(e.target.value as "popular" | "name")}
                  className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-slate-100 outline-none"
                >
                  <option value="popular">{t("meme.sortPopular")}</option>
                  <option value="name">{t("meme.sortName")}</option>
                </select>
                <button
                  type="button"
                  onClick={() => setFavoritesOnly((prev) => !prev)}
                  className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    favoritesOnly
                      ? "border-fuchsia-400/70 bg-fuchsia-500/10 text-fuchsia-100"
                      : "border-white/10 bg-slate-950 text-slate-200 hover:border-fuchsia-400/40"
                  }`}
                >
                  {t("meme.favoritesOnly")}
                </button>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400">
              {isLoading
                ? t("meme.loading")
                : t("meme.searchCount", {
                    count: filteredMemes.length,
                    total: memes.length,
                  })}
            </p>
          </div>

          {!galleryOnly ? (
            <div className="mt-6">
              {isLoading ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-10 text-center text-sm text-slate-400">
                  {t("meme.loading")}
                </div>
              ) : hasSearchResults ? (
                <MemeGenerator
                  imageUrl={selectedMeme.url}
                  box_count={selectedMeme.box_count ?? 2}
                  imageName={selectedMeme.name}
                />
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/60 px-6 py-10 text-center text-sm text-slate-400">
                  {t("meme.noResults")}
                </div>
              )}
            </div>
          ) : null}

          {hasSearchResults ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {t("meme.galleryTitle")}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {t("meme.pickTemplate")}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 font-semibold text-slate-200 transition hover:border-fuchsia-400/60 disabled:opacity-40"
                  >
                    {t("meme.prevPage")}
                  </button>
                  <span>
                    {t("meme.page", { current: currentPage, total: totalPages })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 font-semibold text-slate-200 transition hover:border-fuchsia-400/60 disabled:opacity-40"
                  >
                    {t("meme.nextPage")}
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {visibleTemplates.map((meme) => {
                  const favorite = favoriteIds.includes(meme.id);
                  const isSelected = selectedMeme.id === meme.id;
                  return (
                    <article
                      key={meme.id}
                      className={`overflow-hidden rounded-2xl border text-left transition ${
                        isSelected
                          ? "border-fuchsia-400/70 bg-fuchsia-500/10"
                          : "border-white/10 bg-slate-950/60 hover:border-fuchsia-400/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (galleryOnly && onTemplatePick) {
                            onTemplatePick(meme);
                            return;
                          }
                          setCurrentMeme(meme);
                        }}
                        className="block w-full text-left"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-slate-900">
                          <img
                            src={meme.url}
                            alt={meme.name}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="space-y-2 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-2 text-sm font-semibold text-slate-100">
                              {meme.name}
                            </p>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] font-semibold text-slate-300">
                              {meme.box_count ?? 2} txt
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>#{filteredMemes.findIndex((item) => item.id === meme.id) + 1}</span>
                          </div>
                        </div>
                      </button>
                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(meme.id)}
                          className={`rounded-full border px-2 py-1 text-[11px] font-semibold transition ${
                            favorite
                              ? "border-fuchsia-400/70 bg-fuchsia-500/10 text-fuchsia-100"
                              : "border-white/10 bg-slate-900/70 text-slate-200 hover:border-fuchsia-400/40"
                          }`}
                        >
                          {favorite ? "Saved" : "Fav"}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          ) : null}
          {!galleryOnly ? (
            <RecentMemes
              title={t("recent.title")}
              items={recentMemes}
              onClear={clearRecentMemes}
              onSelect={(item) => {
                setSearchQuery("");
                setCurrentMeme({
                  id: item.id ?? "recent",
                  name: item.name,
                  url: item.url,
                  box_count: item.box_count ?? 2,
                });
              }}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}
