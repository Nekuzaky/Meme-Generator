import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdCloudUpload,
  MdFlip,
  MdLink,
  MdRefresh,
  MdSaveAlt,
} from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export default function ImageEditor() {
  const { t } = useLanguage();
  const templates = useMemo(
    () => [
      { id: "story", label: t("template.story"), width: 1080, height: 1920 },
      { id: "square", label: t("template.square"), width: 1080, height: 1080 },
      { id: "landscape", label: t("template.landscape"), width: 1920, height: 1080 },
      { id: "banner", label: t("template.banner"), width: 1500, height: 500 },
    ],
    [t]
  );
  const [templateId, setTemplateId] = useState("story");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("image-editee.png");
  const [imageLink, setImageLink] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const objectUrlRef = useRef<string | null>(null);

  const activeTemplate = useMemo(
    () => templates.find((item) => item.id === templateId) ?? templates[0],
    [templateId, templates]
  );

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  const filterStyle = useMemo(
    () =>
      `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
    [brightness, contrast, saturation]
  );

  const transformStyle = useMemo(() => {
    const flipScaleX = flipX ? -1 : 1;
    const flipScaleY = flipY ? -1 : 1;
    return `translate(${offsetX}px, ${offsetY}px) scale(${zoom}) rotate(${rotation}deg) scale(${flipScaleX}, ${flipScaleY})`;
  }, [offsetX, offsetY, rotation, zoom, flipX, flipY]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.[0]) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(files[0]);
    objectUrlRef.current = nextUrl;
    setImageUrl(nextUrl);
    setImageName(files[0].name);
  };

  const applyImageLink = () => {
    const trimmed = imageLink.trim();
    if (!trimmed) return;
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageUrl(trimmed);
    setImageName("image-editee.png");
  };

  const resetEditor = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setRotation(0);
    setZoom(1);
    setOffsetX(0);
    setOffsetY(0);
    setFlipX(false);
    setFlipY(false);
  };

  const clearImage = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setImageUrl(null);
    setImageLink("");
    setImageName("image-editee.png");
    resetEditor();
  };

  const downloadImage = async () => {
    if (!imageUrl) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
    });

    const canvas = document.createElement("canvas");
    const baseWidth = img.naturalWidth || img.width;
    const baseHeight = img.naturalHeight || img.height;
    const outputWidth = activeTemplate?.width || baseWidth;
    const outputHeight = activeTemplate?.height || baseHeight;
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.filter = filterStyle;
    const fitScale = Math.min(outputWidth / baseWidth, outputHeight / baseHeight);
    const drawWidth = baseWidth * fitScale;
    const drawHeight = baseHeight * fitScale;
    ctx.translate(outputWidth / 2 + offsetX, outputHeight / 2 + offsetY);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = imageName || "image-editee.png";
    link.click();
  };

  return (
    <section className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-fuchsia-400">
            {t("imageEditor.kicker")}
          </p>
          <h2 className="rgb-text text-2xl md:text-3xl">
            {t("imageEditor.title")}
          </h2>
          <p className="text-sm text-slate-300 md:text-base">
            {t("imageEditor.description")}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-fuchsia-400/60"
            type="button"
            onClick={resetEditor}
          >
            <MdRefresh className="text-lg" />
            {t("imageEditor.reset")}
          </button>
          <button
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            type="button"
            onClick={downloadImage}
            disabled={!imageUrl}
          >
            <MdSaveAlt className="text-lg" />
            {t("imageEditor.export")}
          </button>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/10 bg-slate-900/60 px-6 py-10 text-center transition hover:border-fuchsia-400/60">
            <MdCloudUpload className="text-3xl text-fuchsia-500" />
            <p className="text-sm font-semibold text-slate-100">
              {t("imageEditor.upload")}
            </p>
            <p className="text-xs text-slate-400">
              {t("imageEditor.formats")}
            </p>
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
              {t("imageEditor.useLink")}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-400 focus:border-fuchsia-400/80"
                placeholder="https://..."
                value={imageLink}
                onChange={(e) => setImageLink(e.target.value)}
              />
              <button
                className="rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                onClick={applyImageLink}
                type="button"
              >
                {t("imageEditor.use")}
              </button>
            </div>
          </div>

          <button
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-rose-400/60"
            type="button"
            onClick={clearImage}
          >
            <MdRefresh className="text-lg" />
            {t("imageEditor.changeImage")}
          </button>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">
                {t("imageEditor.templates")}
              </p>
              <span className="text-xs text-slate-400">
                {t("imageEditor.templateSize")}
              </span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setTemplateId(template.id)}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                    template.id === templateId
                      ? "border-fuchsia-400/70 bg-fuchsia-500/10 text-fuchsia-100"
                      : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-fuchsia-400/40"
                  }`}
                >
                  <span>{template.label}</span>
                  <span className="text-[11px] text-slate-400">
                    {template.width}x{template.height}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
          <p className="text-sm font-semibold text-slate-100">
            {t("imageEditor.quickSettings")}
          </p>
          <div className="grid gap-4">
            <label className="flex flex-col gap-2 text-xs text-slate-300">
              {t("imageEditor.brightness")} ({brightness}%)
              <input
                type="range"
                min={50}
                max={150}
                value={brightness}
                onChange={(e) => setBrightness(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-300">
              {t("imageEditor.contrast")} ({contrast}%)
              <input
                type="range"
                min={50}
                max={150}
                value={contrast}
                onChange={(e) => setContrast(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-300">
              {t("imageEditor.saturation")} ({saturation}%)
              <input
                type="range"
                min={0}
                max={200}
                value={saturation}
                onChange={(e) => setSaturation(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-300">
              {t("imageEditor.rotation")} ({rotation}°)
              <input
                type="range"
                min={-180}
                max={180}
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-300">
              {t("imageEditor.zoom")} ({zoom.toFixed(2)}x)
              <input
                type="range"
                min={0.5}
                max={2}
                step={0.01}
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-300">
              {t("imageEditor.offsetX")} ({offsetX}px)
              <input
                type="range"
                min={-200}
                max={200}
                value={offsetX}
                onChange={(e) => setOffsetX(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-2 text-xs text-slate-300">
              {t("imageEditor.offsetY")} ({offsetY}px)
              <input
                type="range"
                min={-200}
                max={200}
                value={offsetY}
                onChange={(e) => setOffsetY(Number(e.target.value))}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setFlipX((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  flipX
                    ? "bg-fuchsia-500/20 text-fuchsia-200"
                    : "bg-slate-950/70 text-slate-300"
                }`}
              >
                <MdFlip className="text-base" />
                {t("imageEditor.flipX")}
              </button>
              <button
                type="button"
                onClick={() => setFlipY((prev) => !prev)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  flipY
                    ? "bg-fuchsia-500/20 text-fuchsia-200"
                    : "bg-slate-950/70 text-slate-300"
                }`}
              >
                <MdFlip className="text-base" />
                {t("imageEditor.flipY")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/60 p-5">
        <p className="mb-4 text-sm font-semibold text-slate-100">
          {t("imageEditor.preview")}
        </p>
        {imageUrl ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{activeTemplate.label}</span>
              <span>
                {activeTemplate.width}x{activeTemplate.height}
              </span>
            </div>
            <div
              className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-6"
              style={{ aspectRatio: `${activeTemplate.width} / ${activeTemplate.height}` }}
            >
            <img
              src={imageUrl}
              alt={t("image.alt")}
              className="max-h-[420px] w-auto select-none"
              style={{ filter: filterStyle, transform: transformStyle }}
            />
          </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/60 px-6 py-10 text-center text-sm text-slate-400">
            {t("imageEditor.empty")}
          </div>
        )}
        <p className="mt-3 text-xs text-slate-400">
          {t("imageEditor.exportNote")}
        </p>
      </div>
    </section>
  );
}
