import { useEffect, useMemo, useRef, useState } from "react";
import {
  MdCloudUpload,
  MdFlip,
  MdLink,
  MdRefresh,
  MdSaveAlt,
} from "react-icons/md";
import QRCode from "qrcode";
import { useLanguage } from "../context/LanguageContext";

type ImageEditorProject = {
  templateId: string;
  imageLink: string;
  brightness: number;
  contrast: number;
  saturation: number;
  rotation: number;
  zoom: number;
  offsetX: number;
  offsetY: number;
  flipX: boolean;
  flipY: boolean;
};

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
  const [drafts, setDrafts] = useState<
    { id: string; name: string; createdAt: number; project: ImageEditorProject }[]
  >([]);
  const autosaveRef = useRef<number | null>(null);
  const historyRef = useRef<ImageEditorProject[]>([]);
  const futureRef = useRef<ImageEditorProject[]>([]);
  const skipHistoryRef = useRef(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [showShareOptions, setShowShareOptions] = useState(false);

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

  useEffect(() => {
    const rawDrafts = localStorage.getItem("image-editor-drafts");
    if (rawDrafts) {
      try {
        const parsed = JSON.parse(rawDrafts) as typeof drafts;
        setDrafts(parsed);
      } catch {
        setDrafts([]);
      }
    }

    const rawAutosave = localStorage.getItem("image-editor-autosave");
    if (rawAutosave) {
      try {
        const project = JSON.parse(rawAutosave) as ImageEditorProject;
        if (project?.imageLink) {
          setTemplateId(project.templateId ?? "story");
          setImageLink(project.imageLink ?? "");
          setImageUrl(project.imageLink ?? null);
          setBrightness(project.brightness ?? 100);
          setContrast(project.contrast ?? 100);
          setSaturation(project.saturation ?? 100);
          setRotation(project.rotation ?? 0);
          setZoom(project.zoom ?? 1);
          setOffsetX(project.offsetX ?? 0);
          setOffsetY(project.offsetY ?? 0);
          setFlipX(project.flipX ?? false);
          setFlipY(project.flipY ?? false);
        }
      } catch {
        // ignore autosave errors
      }
    }
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

  const buildProject = (): ImageEditorProject => ({
    templateId,
    imageLink,
    brightness,
    contrast,
    saturation,
    rotation,
    zoom,
    offsetX,
    offsetY,
    flipX,
    flipY,
  });

  const applyProject = (project: ImageEditorProject) => {
    skipHistoryRef.current = true;
    setTemplateId(project.templateId ?? "story");
    setImageLink(project.imageLink ?? "");
    setImageUrl(project.imageLink ? project.imageLink : null);
    setBrightness(project.brightness ?? 100);
    setContrast(project.contrast ?? 100);
    setSaturation(project.saturation ?? 100);
    setRotation(project.rotation ?? 0);
    setZoom(project.zoom ?? 1);
    setOffsetX(project.offsetX ?? 0);
    setOffsetY(project.offsetY ?? 0);
    setFlipX(project.flipX ?? false);
    setFlipY(project.flipY ?? false);
  };

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    historyRef.current.push(buildProject());
    if (historyRef.current.length > 50) {
      historyRef.current.shift();
    }
    futureRef.current = [];
  }, [
    templateId,
    imageLink,
    brightness,
    contrast,
    saturation,
    rotation,
    zoom,
    offsetX,
    offsetY,
    flipX,
    flipY,
  ]);

  const undo = () => {
    if (historyRef.current.length < 2) return;
    const current = historyRef.current.pop();
    if (current) futureRef.current.unshift(current);
    const previous = historyRef.current[historyRef.current.length - 1];
    if (previous) applyProject(previous);
  };

  const redo = () => {
    const next = futureRef.current.shift();
    if (next) applyProject(next);
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
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    templateId,
    imageLink,
    brightness,
    contrast,
    saturation,
    rotation,
    zoom,
    offsetX,
    offsetY,
    flipX,
    flipY,
  ]);

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

  useEffect(() => {
    if (autosaveRef.current) {
      window.clearTimeout(autosaveRef.current);
    }
    autosaveRef.current = window.setTimeout(() => {
      localStorage.setItem("image-editor-autosave", JSON.stringify(buildProject()));
    }, 300);
  }, [
    templateId,
    imageLink,
    brightness,
    contrast,
    saturation,
    rotation,
    zoom,
    offsetX,
    offsetY,
    flipX,
    flipY,
  ]);

  const downloadImage = async (template = activeTemplate) => {
    if (!imageUrl || !template) return;
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
    const outputWidth = template.width || baseWidth;
    const outputHeight = template.height || baseHeight;
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

  const exportTemplate = (id: string) => {
    const template = templates.find((item) => item.id === id);
    if (!template) return;
    setTemplateId(id);
    void downloadImage(template);
  };

  const exportProject = () => {
    const data = JSON.stringify(buildProject(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "meme-creator-project.json";
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const importProject = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as ImageEditorProject;
        applyProject(parsed);
      } catch {
        // ignore invalid json
      }
    };
    reader.readAsText(file);
  };

  const saveDraft = () => {
    const project = buildProject();
    const newDraft = {
      id: `${Date.now()}`,
      name: project.imageLink ? project.imageLink.split("/").pop() || "Draft" : "Draft",
      createdAt: Date.now(),
      project,
    };
    setDrafts((prev) => {
      const next = [newDraft, ...prev].slice(0, 5);
      localStorage.setItem("image-editor-drafts", JSON.stringify(next));
      return next;
    });
  };

  const removeDraft = (id: string) => {
    setDrafts((prev) => {
      const next = prev.filter((draft) => draft.id !== id);
      localStorage.setItem("image-editor-drafts", JSON.stringify(next));
      return next;
    });
  };

  const shareUrl = useMemo(() => {
    if (!imageLink) return "";
    const payload = buildProject();
    const encoded = encodeURIComponent(
      btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    );
    return `${window.location.origin}/editor?share=${encoded}`;
  }, [
    imageLink,
    templateId,
    brightness,
    contrast,
    saturation,
    rotation,
    zoom,
    offsetX,
    offsetY,
    flipX,
    flipY,
  ]);

  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(shareUrl, { margin: 1, width: 220 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""));
  }, [shareUrl]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const share = params.get("share");
    if (!share) return;
    try {
      const decoded = JSON.parse(decodeURIComponent(atob(share))) as ImageEditorProject;
      applyProject(decoded);
    } catch {
      // ignore share errors
    }
  }, []);

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
            onClick={() => downloadImage()}
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
            <div className="mt-3 flex flex-wrap gap-2">
              {templates.map((template) => (
                <button
                  key={`${template.id}-export`}
                  type="button"
                  onClick={() => exportTemplate(template.id)}
                  disabled={!imageUrl}
                  className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60 disabled:opacity-40"
                >
                  {t("imageEditor.export")} {template.label}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">
                {t("imageEditor.project")}
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={exportProject}
                className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
              >
                {t("imageEditor.exportProject")}
              </button>
              <label className="cursor-pointer rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60">
                {t("imageEditor.importProject")}
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) importProject(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">
                {t("imageEditor.drafts")}
              </p>
              <button
                type="button"
                onClick={saveDraft}
                className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
              >
                {t("imageEditor.saveDraft")}
              </button>
            </div>
            {drafts.length === 0 ? (
              <p className="mt-3 text-xs text-slate-400">
                {t("imageEditor.emptyDrafts")}
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-2">
                {drafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
                  >
                    <span className="truncate">
                      {draft.name} • {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => applyProject(draft.project)}
                        className="rounded-full border border-white/10 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
                      >
                        {t("imageEditor.load")}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeDraft(draft.id)}
                        className="rounded-full border border-white/10 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
                      >
                        {t("imageEditor.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-100">
                {t("imageEditor.share")}
              </p>
              <button
                type="button"
                onClick={() => setShowShareOptions((prev) => !prev)}
                className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
              >
                {showShareOptions
                  ? t("imageEditor.lessOptions")
                  : t("imageEditor.moreOptions")}
              </button>
            </div>
            {shareUrl ? (
              <div className="mt-3 space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none"
                    value={shareUrl}
                    readOnly
                  />
                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(shareUrl)}
                    className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
                  >
                    {t("imageEditor.copyLink")}
                  </button>
                </div>

                {showShareOptions && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">
                      {t("imageEditor.qrNote")}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                      {qrDataUrl ? (
                        <img
                          src={qrDataUrl}
                          alt="QR code"
                          className="h-28 w-28 rounded-lg border border-white/10 sm:h-32 sm:w-32"
                        />
                      ) : (
                        <div className="h-28 w-28 rounded-lg border border-dashed border-white/10 bg-slate-950/60 text-xs text-slate-400 sm:h-32 sm:w-32" />
                      )}
                      <button
                        type="button"
                        disabled={!qrDataUrl}
                        onClick={() => {
                          const link = document.createElement("a");
                          link.href = qrDataUrl;
                          link.download = "meme-creator-qr.png";
                          link.click();
                        }}
                        className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-fuchsia-400/60 disabled:opacity-40"
                      >
                        {t("imageEditor.downloadQr")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-xs text-slate-400">
                {t("imageEditor.shareUnavailable")}
              </p>
            )}
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
              className="flex items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 p-4 sm:p-6"
              style={{ aspectRatio: `${activeTemplate.width} / ${activeTemplate.height}` }}
            >
            <img
              src={imageUrl}
              alt={t("image.alt")}
              className="max-h-[420px] w-auto max-w-full select-none"
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
