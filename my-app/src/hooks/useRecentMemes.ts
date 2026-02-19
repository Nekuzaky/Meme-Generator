import { useCallback, useEffect, useMemo, useState } from "react";
import type { RecentMeme } from "../types/types";

const isPersistableUrl = (url: string) => !url.startsWith("blob:");

export const useRecentMemes = (storageKey: string, limit = 8) => {
  const [recentMemes, setRecentMemes] = useState<RecentMeme[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as RecentMeme[];
      setRecentMemes(parsed);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const addRecentMeme = useCallback((item: RecentMeme) => {
    setRecentMemes((prev) => {
      const next = [item, ...prev.filter((meme) => meme.url !== item.url)].slice(
        0,
        limit
      );

      const persistable = next.filter((meme) => isPersistableUrl(meme.url));
      localStorage.setItem(storageKey, JSON.stringify(persistable));
      return next;
    });
  }, [limit, storageKey]);

  const clearRecentMemes = useCallback(() => {
    setRecentMemes([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const value = useMemo(
    () => ({ recentMemes, addRecentMeme, clearRecentMemes }),
    [recentMemes, addRecentMeme, clearRecentMemes]
  );

  return value;
};
