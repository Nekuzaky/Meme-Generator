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

export default function Meme() {
  const { t } = useLanguage();
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

  const randomMeme = useCallback(() => {
    if (!filteredMemes.length) return;
    const randomNum = Math.floor(Math.random() * filteredMemes.length);
    setCurrentMeme(filteredMemes[randomNum]);
  }, [filteredMemes]);

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
    <section className="glass-card w-full p-6 md:p-8">
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
        </div>
      )}
    </section>
  );
}
