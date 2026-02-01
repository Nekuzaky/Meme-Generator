import {
  MdArrowDownward,
  MdArrowUpward,
  MdDownload,
  MdLock,
  MdLockOpen,
  MdUpload,
} from "react-icons/md";
import domtoimage from "dom-to-image";
import { saveAs } from "file-saver";
import { useEffect, useMemo, useRef, useState } from "react";
import { stickerOptions } from "../constants/constants";
import CaptionProvider from "../context/CaptionContext";
import { useLanguage } from "../context/LanguageContext";
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
  const { t } = useLanguage();
  const [boxesCount, setBoxesCount] = useState(box_count);
  const [textLayers, setTextLayers] = useState<
    { id: string; index: number; locked: boolean; zIndex: number }[]
  >([]);
  const [stickers, setStickers] = useState<
    {
      id: string;
      emoji?: string;
      src?: string;
      kind: "emoji" | "image";
      x: number;
      y: number;
      size: number;
      locked: boolean;
      zIndex: number;
    }[]
  >([]);
  const [selectedLayer, setSelectedLayer] = useState<
    { type: "text"; id: string; index: number } | { type: "sticker"; id: string } | null
  >(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [showStickers, setShowStickers] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const historyRef = useRef<{ textLayers: typeof textLayers; stickers: typeof stickers }[]>([]);
  const futureRef = useRef<typeof historyRef.current>([]);
  const skipHistoryRef = useRef(false);

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
    setTextLayers(
      Array.from({ length: box_count }, (_, index) => ({
        id: `text-${index}`,
        index,
        locked: false,
        zIndex: index + 1,
      }))
    );
    setSelectedLayer(null);
  }, [box_count, imageUrl]);

  useEffect(() => {
    setTextLayers((prev) => {
      const next = Array.from({ length: boxesCount }, (_, index) => {
        const id = `text-${index}`;
        const existing = prev.find((layer) => layer.id === id);
        return (
          existing ?? {
            id,
            index,
            locked: false,
            zIndex: index + 1,
          }
        );
      });
      return next.map((layer, index) => ({ ...layer, index }));
    });
  }, [boxesCount]);

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    historyRef.current.push({
      textLayers: JSON.parse(JSON.stringify(textLayers)),
      stickers: JSON.parse(JSON.stringify(stickers)),
    });
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }
    futureRef.current = [];
  }, [textLayers, stickers]);

  const createStickerId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  };

  const getNextZIndex = (currentText = textLayers, currentStickers = stickers) => {
    const all = [
      ...currentText.map((layer) => layer.zIndex),
      ...currentStickers.map((layer) => layer.zIndex),
    ];
    return (all.length ? Math.max(...all) : 0) + 1;
  };

  const addSticker = (emoji: string) => {
    setStickers((prev) => {
      const nextZIndex = getNextZIndex(textLayers, prev);
      return [
        ...prev,
        {
          id: createStickerId(),
          emoji,
          kind: "emoji",
          x: 24 + prev.length * 10,
          y: 24 + prev.length * 10,
          size: 56,
          locked: false,
          zIndex: nextZIndex,
        },
      ];
    });
  };

  const addCustomSticker = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : "";
      if (!src) return;
      setStickers((prev) => {
        const nextZIndex = getNextZIndex(textLayers, prev);
        return [
          ...prev,
          {
            id: createStickerId(),
            src,
            kind: "image",
            x: 24 + prev.length * 10,
            y: 24 + prev.length * 10,
            size: 72,
            locked: false,
            zIndex: nextZIndex,
          },
        ];
      });
    };
    reader.readAsDataURL(file);
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

  const toggleTextLock = (id: string) => {
    setTextLayers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      )
    );
  };

  const toggleStickerLock = (id: string) => {
    setStickers((prev) =>
      prev.map((layer) =>
        layer.id === id ? { ...layer, locked: !layer.locked } : layer
      )
    );
  };

  const undo = () => {
    if (historyRef.current.length < 2) return;
    const current = historyRef.current.pop();
    if (current) {
      futureRef.current.unshift(current);
    }
    const previous = historyRef.current[historyRef.current.length - 1];
    if (!previous) return;
    skipHistoryRef.current = true;
    setTextLayers(previous.textLayers);
    setStickers(previous.stickers);
  };

  const redo = () => {
    const next = futureRef.current.shift();
    if (!next) return;
    skipHistoryRef.current = true;
    setTextLayers(next.textLayers);
    setStickers(next.stickers);
    historyRef.current.push(next);
  };

  const duplicateSelected = () => {
    if (!selectedLayer || selectedLayer.type !== "sticker") return;
    const sticker = stickers.find((item) => item.id === selectedLayer.id);
    if (!sticker) return;
    setStickers((prev) => [
      ...prev,
      {
        ...sticker,
        id: createStickerId(),
        x: sticker.x + 16,
        y: sticker.y + 16,
        locked: false,
        zIndex: getNextZIndex(textLayers, prev),
      },
    ]);
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey)) return;
      if (event.key.toLowerCase() === "z") {
        event.preventDefault();
        undo();
      }
      if (event.key.toLowerCase() === "y") {
        event.preventDefault();
        redo();
      }
      if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        duplicateSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLayer, stickers, textLayers]);

  const layers = [
    ...textLayers.map((layer) => ({
      id: layer.id,
      type: "text" as const,
      label: t("layers.text", { index: layer.index + 1 }),
      locked: layer.locked,
      zIndex: layer.zIndex,
    })),
    ...stickers.map((layer) => ({
      id: layer.id,
      type: "sticker" as const,
      label: `${t("layers.sticker")} ${layer.emoji ?? ""}`,
      locked: layer.locked,
      zIndex: layer.zIndex,
    })),
  ].sort((a, b) => b.zIndex - a.zIndex);

  const moveLayer = (id: string, direction: "up" | "down") => {
    const index = layers.findIndex((layer) => layer.id === id);
    if (index === -1) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= layers.length) return;
    const current = layers[index];
    const target = layers[targetIndex];
    if (!current || !target) return;

    const swap = (zA: number, zB: number) => {
      if (current.type === "text") {
        setTextLayers((prev) =>
          prev.map((layer) =>
            layer.id === current.id ? { ...layer, zIndex: zB } : layer
          )
        );
      } else {
        setStickers((prev) =>
          prev.map((layer) =>
            layer.id === current.id ? { ...layer, zIndex: zB } : layer
          )
        );
      }

      if (target.type === "text") {
        setTextLayers((prev) =>
          prev.map((layer) =>
            layer.id === target.id ? { ...layer, zIndex: zA } : layer
          )
        );
      } else {
        setStickers((prev) =>
          prev.map((layer) =>
            layer.id === target.id ? { ...layer, zIndex: zA } : layer
          )
        );
      }
    };

    swap(current.zIndex, target.zIndex);
  };


  return (
    <div className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="w-full md:w-1/2">
          <ImageSection
            image={imageUrl}
            stickers={stickers}
            onStickerChange={updateSticker}
            textLayers={textLayers}
            selectedLayer={selectedLayer}
            onSelectText={(index) =>
              setSelectedLayer({ type: "text", id: `text-${index}`, index })
            }
            onSelectSticker={(id) => setSelectedLayer({ type: "sticker", id })}
            grid={gridEnabled ? [gridSize, gridSize] : undefined}
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
                {t("generator.addText")}
              </button>

              <button
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:w-auto"
                onClick={downloadMeme}
              >
                <MdDownload className="text-lg" />
                {t("generator.download")}
              </button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">
                  {t("generator.section.stickers")}
                </p>
                <div className="flex items-center gap-3">
                  <button
                    className="text-xs font-semibold text-slate-300 transition hover:text-white"
                    onClick={clearStickers}
                  >
                    {t("generator.clearStickers")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStickers((prev) => !prev)}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
                  >
                    {showStickers ? t("generator.less") : t("generator.more")}
                  </button>
                </div>
              </div>

              {showStickers && (
                <>
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

                  <div className="mt-4 flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-300">
                      {t("generator.customSticker")}
                    </span>
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-fuchsia-400/60">
                      <MdUpload className="text-base" />
                      {t("generator.uploadSticker")}
                      <input
                        type="file"
                        accept="image/png,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) addCustomSticker(file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
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
                          {t("generator.removeSticker", { emoji: sticker.emoji ?? "" })}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">
                  {t("generator.section.grid")}
                </p>
                <button
                  type="button"
                  onClick={() => setShowGrid((prev) => !prev)}
                  className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
                >
                  {showGrid ? t("generator.less") : t("generator.more")}
                </button>
              </div>
              {showGrid && (
                <>
                  <label className="mt-3 flex items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={gridEnabled}
                      onChange={(event) => setGridEnabled(event.target.checked)}
                    />
                    {t("grid.snap")}
                  </label>
                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
                    <span>{t("grid.size")}</span>
                    <input
                      type="range"
                      min={4}
                      max={40}
                      value={gridSize}
                      onChange={(event) => setGridSize(Number(event.target.value))}
                      className="w-full accent-fuchsia-400"
                      disabled={!gridEnabled}
                    />
                    <span className="w-10 text-right text-slate-200">{gridSize}px</span>
                  </div>
                </>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">
                  {t("generator.section.layers")}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {t("layers.subtitle")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowLayers((prev) => !prev)}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
                  >
                    {showLayers ? t("generator.less") : t("generator.more")}
                  </button>
                </div>
              </div>

              {showLayers && (
                <>
                  {layers.length === 0 ? (
                    <p className="mt-3 text-xs text-slate-400">
                      {t("layers.empty")}
                    </p>
                  ) : (
                    <div className="mt-3 flex max-h-56 flex-col gap-2 overflow-y-auto pr-1">
                      {layers.map((layer, idx) => (
                        <div
                          key={layer.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
                        >
                          <span>{layer.label}</span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                layer.type === "text"
                                  ? toggleTextLock(layer.id)
                                  : toggleStickerLock(layer.id)
                              }
                              className={`rounded-lg px-2 py-1 text-xs transition ${
                                layer.locked
                                  ? "bg-fuchsia-500/20 text-fuchsia-200"
                                  : "bg-slate-900/80 text-slate-300"
                              }`}
                              aria-label={layer.locked ? t("layers.unlock") : t("layers.lock")}
                            >
                              {layer.locked ? (
                                <MdLock className="text-base" />
                              ) : (
                                <MdLockOpen className="text-base" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => moveLayer(layer.id, "up")}
                              disabled={idx === 0}
                              className="rounded-lg bg-slate-900/80 px-2 py-1 text-xs text-slate-300 transition hover:text-white disabled:opacity-40"
                              aria-label={t("layers.moveUp")}
                            >
                              <MdArrowUpward className="text-base" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveLayer(layer.id, "down")}
                              disabled={idx === layers.length - 1}
                              className="rounded-lg bg-slate-900/80 px-2 py-1 text-xs text-slate-300 transition hover:text-white disabled:opacity-40"
                              aria-label={t("layers.moveDown")}
                            >
                              <MdArrowDownward className="text-base" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
