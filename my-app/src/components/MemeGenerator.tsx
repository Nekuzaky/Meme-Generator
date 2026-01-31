import { MdDownload } from "react-icons/md";
import domtoimage from "dom-to-image";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import { stickerOptions } from "../constants/constants";
import CaptionProvider from "../context/CaptionContext";
import Caption from "./Caption";
import ImageSection from "./ImageSection";

interface IProps {
  imageUrl: string;
  box_count: number;
  imageName: string;
}

export default function MemeGenerator({
  imageUrl,
  box_count,
  imageName,
}: IProps) {
  const [boxesCount, setBoxesCount] = useState(box_count);
  const [stickers, setStickers] = useState<
    { id: string; emoji: string; x: number; y: number; size: number }[]
  >([]);

  let boxes = [];
  for (let i = 1; i <= boxesCount; i++) {
    boxes.push(i);
  }

  const downloadMeme = async () => {
    let node = document.getElementById("downloadMeme");
    if (node) {
      const blob = await domtoimage.toBlob(node);
      saveAs(blob, imageName);
    }
  };

  const addBox = () => {
    setBoxesCount((prevCount) => prevCount + 1);
  };

  useEffect(() => {
    setBoxesCount(box_count);
    setStickers([]);
  }, [box_count, imageUrl]);

  const createStickerId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const addSticker = (emoji: string) => {
    setStickers((prev) => [
      ...prev,
      {
        id: createStickerId(),
        emoji,
        x: 24 + prev.length * 10,
        y: 24 + prev.length * 10,
        size: 56,
      },
    ]);
  };

  const updateSticker = (id: string, position: { x: number; y: number }, size: number) => {
    setStickers((prev) =>
      prev.map((sticker) =>
        sticker.id === id ? { ...sticker, ...position, size } : sticker
      )
    );
  };

  const removeSticker = (id: string) => {
    setStickers((prev) => prev.filter((sticker) => sticker.id !== id));
  };

  const clearStickers = () => {
    setStickers([]);
  };


  return (
    <div className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="w-full md:w-1/2">
          <ImageSection
            image={imageUrl}
            stickers={stickers}
            onStickerChange={updateSticker}
          />
        </div>

        <div className="w-full md:w-1/2">
          <div className="space-y-6">
            <div className="space-y-4">
              {boxes.map((_, index) => (
                <CaptionProvider key={index}>
                  <Caption index={index} />
                </CaptionProvider>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60 hover:text-white sm:w-auto"
                onClick={addBox}
              >
                Ajouter un texte
              </button>

              <button
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:w-auto"
                onClick={downloadMeme}
              >
                <MdDownload className="text-lg" />
                Télécharger
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">
                  Stickers & emojis
                </p>
                <button
                  className="text-xs font-semibold text-slate-300 transition hover:text-white"
                  onClick={clearStickers}
                >
                  Tout retirer
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {stickerOptions.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => addSticker(emoji)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-slate-950/70 text-xl transition hover:border-fuchsia-400/60"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {stickers.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {stickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      type="button"
                      onClick={() => removeSticker(sticker.id)}
                      className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-rose-400/70 hover:text-white"
                    >
                      Retirer {sticker.emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
