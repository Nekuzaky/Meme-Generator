import { useCallback, useEffect, useState } from "react";
import MemeGenerator from "../components/MemeGenerator";
import RecentMemes from "./RecentMemes";
import { useLanguage } from "../context/LanguageContext";
import { useRecentMemes } from "../hooks/useRecentMemes";
import type { Meme as MemeType } from "../types/types";

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
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { recentMemes, addRecentMeme, clearRecentMemes } = useRecentMemes(
        "recent-memes-tendance"
    );

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const res = await fetch("https://api.imgflip.com/get_memes");
                const data = await res.json();
                setMemes(data.data.memes || []);
            } catch (err) {
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

    const randomMeme = useCallback(() => {
        if (!memes.length) return;
        const randomNum = Math.floor(Math.random() * memes.length);
        setCurrentMeme(memes[randomNum]);
    }, [memes]);

    useEffect(() => {
        if (memes.length) {
            randomMeme();
        }
    }, [memes, randomMeme]);

    const selectedMeme = currentMeme ?? fallbackMeme;

    useEffect(() => {
        if (!selectedMeme?.url) return;
        addRecentMeme({
            id: selectedMeme.id,
            name: selectedMeme.name,
            url: selectedMeme.url,
            source: "tendance",
            box_count: selectedMeme.box_count ?? 2,
        });
    }, [selectedMeme, addRecentMeme]);

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
                <button
                    className="w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl md:w-auto"
                    onClick={randomMeme}
                    disabled={isLoading}
                >
                    {isLoading ? t("meme.loading") : t("meme.generate")}
                </button>
            </div>

            {error ? (
                <p className="mt-6 rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                    {error}
                </p>
            ) : (
                <div className="mt-8">
                    <MemeGenerator
                        imageUrl={selectedMeme.url}
                        box_count={selectedMeme.box_count ?? 2}
                        imageName={selectedMeme.name}
                    />
                    <RecentMemes
                        title={t("recent.title")}
                        items={recentMemes}
                        onClear={clearRecentMemes}
                        onSelect={(item) =>
                            setCurrentMeme({
                                id: item.id ?? "recent",
                                name: item.name,
                                url: item.url,
                                box_count: item.box_count ?? 2,
                            })
                        }
                    />
                </div>
            )}
        </section>
    );
}