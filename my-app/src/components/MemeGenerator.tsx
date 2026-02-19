import {
  MdArrowDownward,
  MdArrowUpward,
  MdDownload,
  MdLock,
  MdLockOpen,
  MdRedo,
  MdShare,
  MdUndo,
  MdUpload,
} from "react-icons/md";
import domtoimage from "dom-to-image";
import { saveAs } from "file-saver";
import QRCode from "qrcode";
import { useEffect, useMemo, useRef, useState } from "react";
import { stickerOptions } from "../constants/constants";
import CaptionProvider from "../context/CaptionContext";
import { useLanguage } from "../context/LanguageContext";
import { useMeme } from "../context/MemeContext";
import {
  API_TOKEN_KEY,
  autosaveMemeApi,
  createMemeVersionApi,
  generateMemeSuggestionsApi,
  getMemeVersionsApi,
  restoreMemeVersionApi,
  saveMemeApi,
  updateMemeApi,
  type ApiMemeVersion,
} from "../lib/api";
import { trackEngagement } from "../lib/engagement";
import type { Box } from "../types/types";
import Caption from "./Caption";
import ImageSection from "./ImageSection";

interface IProps {
  imageUrl: string;
  box_count: number;
  imageName: string;
}

type TextLayer = {
  id: string;
  index: number;
  locked: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

type StickerLayer = {
  id: string;
  emoji?: string;
  src?: string;
  kind: "emoji" | "image";
  x: number;
  y: number;
  size: number;
  locked: boolean;
  zIndex: number;
};

type HistorySnapshot = {
  activeImageUrl: string;
  activeImageName: string;
  boxesCount: number;
  boxes: Box[];
  textLayers: TextLayer[];
  stickers: StickerLayer[];
};

type SharePayload = HistorySnapshot & { version: 1 };

const SHARE_QUERY_KEY = "memeShare";

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const encodeSharePayload = (payload: SharePayload) =>
  encodeURIComponent(
    btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
  );

const decodeSharePayload = (raw: string) =>
  JSON.parse(decodeURIComponent(escape(atob(decodeURIComponent(raw))))) as SharePayload;

export default function MemeGenerator({
  imageUrl,
  box_count,
  imageName,
}: IProps) {
  const { t, language } = useLanguage();
  const { boxes, replaceBoxes } = useMeme();

  const [activeImageUrl, setActiveImageUrl] = useState(imageUrl);
  const [activeImageName, setActiveImageName] = useState(imageName);
  const [boxesCount, setBoxesCount] = useState(box_count);
  const [textLayers, setTextLayers] = useState<TextLayer[]>([]);
  const [stickers, setStickers] = useState<StickerLayer[]>([]);
  const [selectedLayer, setSelectedLayer] = useState<
    { type: "text"; id: string; index: number } | { type: "sticker"; id: string } | null
  >(null);
  const [gridEnabled, setGridEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);
  const [showStickers, setShowStickers] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showLayers, setShowLayers] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [onboardingStep, setOnboardingStep] = useState<number | null>(null);
  const [cloudMemeId, setCloudMemeId] = useState<number | null>(null);
  const [autosaveState, setAutosaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [versions, setVersions] = useState<ApiMemeVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiStatus, setAiStatus] = useState<string | null>(null);

  const historyRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  const skipHistoryRef = useRef(false);
  const shareLoadedRef = useRef(false);
  const autosaveTimerRef = useRef<number | null>(null);

  const socialTemplates = useMemo(
    () => [
      { id: "story", label: t("template.story"), width: 1080, height: 1920 },
      { id: "square", label: t("template.square"), width: 1080, height: 1080 },
      { id: "landscape", label: t("template.landscape"), width: 1920, height: 1080 },
      { id: "banner", label: t("template.banner"), width: 1500, height: 500 },
    ],
    [t]
  );

  const onboardingSteps = useMemo(
    () => [
      {
        title: t("onboarding.creator.step1.title"),
        description: t("onboarding.creator.step1.description"),
      },
      {
        title: t("onboarding.creator.step2.title"),
        description: t("onboarding.creator.step2.description"),
      },
      {
        title: t("onboarding.creator.step3.title"),
        description: t("onboarding.creator.step3.description"),
      },
    ],
    [t]
  );

  const createDefaultBox = (index: number): Box => ({
    index,
    text: "",
    color: "#ffffff",
    outline_color: "#222222",
    fontSize: 50,
    fontFamily: "Impact",
    effect: "none",
  });

  const createDefaultTextLayer = (index: number, zIndex?: number): TextLayer => ({
    id: `text-${index}`,
    index,
    locked: false,
    zIndex: zIndex ?? index + 1,
    x: 20,
    y: 70 * index,
    width: 220,
    height: 110,
  });

  const getNextZIndex = (
    currentTextLayers = textLayers,
    currentStickers = stickers
  ) => {
    const all = [
      ...currentTextLayers.map((layer) => layer.zIndex),
      ...currentStickers.map((layer) => layer.zIndex),
    ];
    return (all.length ? Math.max(...all) : 0) + 1;
  };

  const createSnapshot = (): HistorySnapshot => ({
    activeImageUrl,
    activeImageName,
    boxesCount,
    boxes: deepClone(boxes),
    textLayers: deepClone(textLayers),
    stickers: deepClone(stickers),
  });

  const applySnapshot = (
    snapshot: HistorySnapshot,
    options?: { resetHistory?: boolean }
  ) => {
    skipHistoryRef.current = true;
    setActiveImageUrl(snapshot.activeImageUrl);
    setActiveImageName(snapshot.activeImageName);
    setBoxesCount(snapshot.boxesCount);
    replaceBoxes(deepClone(snapshot.boxes));
    setTextLayers(deepClone(snapshot.textLayers));
    setStickers(deepClone(snapshot.stickers));
    setSelectedLayer(null);
    if (options?.resetHistory) {
      historyRef.current = [deepClone(snapshot)];
      futureRef.current = [];
    }
  };

  const snapshotFromPayload = (payload: unknown): HistorySnapshot | null => {
    if (!payload || typeof payload !== "object") return null;
    const asPayload = payload as Partial<SharePayload>;
    if (
      asPayload.version !== 1 ||
      typeof asPayload.activeImageUrl !== "string" ||
      typeof asPayload.activeImageName !== "string" ||
      typeof asPayload.boxesCount !== "number" ||
      !Array.isArray(asPayload.boxes) ||
      !Array.isArray(asPayload.textLayers) ||
      !Array.isArray(asPayload.stickers)
    ) {
      return null;
    }

    return {
      activeImageUrl: asPayload.activeImageUrl,
      activeImageName: asPayload.activeImageName,
      boxesCount: asPayload.boxesCount,
      boxes: asPayload.boxes as Box[],
      textLayers: asPayload.textLayers as TextLayer[],
      stickers: asPayload.stickers as StickerLayer[],
    };
  };

  useEffect(() => {
    if (!shareLoadedRef.current) {
      shareLoadedRef.current = true;
      const share = new URLSearchParams(window.location.search).get(SHARE_QUERY_KEY);
      if (share) {
        try {
          const payload = decodeSharePayload(share);
          if (payload.version === 1) {
            applySnapshot(
              {
                activeImageUrl: payload.activeImageUrl,
                activeImageName: payload.activeImageName,
                boxesCount: payload.boxesCount,
                boxes: payload.boxes,
                textLayers: payload.textLayers,
                stickers: payload.stickers,
              },
              { resetHistory: true }
            );
            setShowShareOptions(true);
            return;
          }
        } catch {
          // ignore invalid share links
        }
      }
    }

    const initialBoxes = Array.from({ length: box_count }, (_, index) =>
      createDefaultBox(index)
    );
    const initialTextLayers = Array.from({ length: box_count }, (_, index) =>
      createDefaultTextLayer(index)
    );
    applySnapshot(
      {
        activeImageUrl: imageUrl,
        activeImageName: imageName,
        boxesCount: box_count,
        boxes: initialBoxes,
        textLayers: initialTextLayers,
        stickers: [],
      },
      { resetHistory: true }
    );
    setShareStatus(null);
    setCloudMemeId(null);
    setVersions([]);
    setShowVersions(false);
    setAutosaveState("idle");
  }, [imageUrl, imageName, box_count]);

  useEffect(() => {
    const raw = localStorage.getItem("meme-creator-onboarding-v1");
    if (!raw) {
      setOnboardingStep(0);
    }
  }, []);

  useEffect(() => {
    if (skipHistoryRef.current) {
      skipHistoryRef.current = false;
      return;
    }
    const snapshot = createSnapshot();
    const last = historyRef.current[historyRef.current.length - 1];
    const unchanged = last && JSON.stringify(last) === JSON.stringify(snapshot);
    if (unchanged) return;
    historyRef.current.push(snapshot);
    if (historyRef.current.length > 80) {
      historyRef.current.shift();
    }
    futureRef.current = [];
  }, [activeImageUrl, activeImageName, boxesCount, boxes, textLayers, stickers]);

  useEffect(() => {
    if (!showLayers) {
      setSelectedLayer(null);
    }
  }, [showLayers]);

  const undo = () => {
    if (historyRef.current.length < 2) return;
    const current = historyRef.current.pop();
    if (current) {
      futureRef.current.unshift(current);
    }
    const previous = historyRef.current[historyRef.current.length - 1];
    if (!previous) return;
    applySnapshot(previous);
  };

  const redo = () => {
    const next = futureRef.current.shift();
    if (!next) return;
    historyRef.current.push(deepClone(next));
    applySnapshot(next);
  };

  const addBox = () => {
    const nextIndex = boxesCount;
    const nextBox = createDefaultBox(nextIndex);
    const nextTextLayer = createDefaultTextLayer(nextIndex, getNextZIndex());
    setBoxesCount((prev) => prev + 1);
    replaceBoxes([...boxes, nextBox]);
    setTextLayers((prev) => [...prev, nextTextLayer]);
  };

  const removeTextBox = (index: number) => {
    if (boxesCount <= 1) return;
    const nextBoxes = boxes
      .filter((box) => box.index !== index)
      .sort((a, b) => a.index - b.index)
      .map((box, nextIndex) => ({ ...box, index: nextIndex }));
    const nextTextLayers = textLayers
      .filter((layer) => layer.index !== index)
      .sort((a, b) => a.index - b.index)
      .map((layer, nextIndex) => ({
        ...layer,
        id: `text-${nextIndex}`,
        index: nextIndex,
      }));

    setBoxesCount(nextBoxes.length);
    replaceBoxes(nextBoxes);
    setTextLayers(nextTextLayers);
    setSelectedLayer((prev) => {
      if (!prev || prev.type !== "text") return prev;
      if (prev.index === index) return null;
      if (prev.index > index) {
        return {
          type: "text",
          id: `text-${prev.index - 1}`,
          index: prev.index - 1,
        };
      }
      return prev;
    });
  };

  const updateTextLayer = (
    id: string,
    values: { x: number; y: number; width: number; height: number }
  ) => {
    setTextLayers((prev) =>
      prev.map((layer) => (layer.id === id ? { ...layer, ...values } : layer))
    );
  };

  const createStickerId = () => {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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
      const key = event.key.toLowerCase();
      if (key === "z" && event.shiftKey) {
        event.preventDefault();
        redo();
        return;
      }
      if (key === "z") {
        event.preventDefault();
        undo();
      }
      if (key === "y") {
        event.preventDefault();
        redo();
      }
      if (key === "d") {
        event.preventDefault();
        duplicateSelected();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedLayer, stickers, textLayers, boxes, boxesCount]);

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

  const buildMemeBlob = async () => {
    const node = document.getElementById("downloadMeme");
    if (!node) return null;
    setIsExporting(true);
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      return await domtoimage.toBlob(node);
    } finally {
      setIsExporting(false);
    }
  };

  const getBaseFileName = () => {
    const raw = activeImageName?.trim() || "meme";
    const dotIndex = raw.lastIndexOf(".");
    return dotIndex > 0 ? raw.slice(0, dotIndex) : raw;
  };

  const getPngFileName = (suffix?: string) => {
    const base = getBaseFileName();
    return suffix ? `${base}-${suffix}.png` : `${base}.png`;
  };

  const downloadMeme = async () => {
    const blob = await buildMemeBlob();
    if (!blob) return;
    saveAs(blob, getPngFileName());
    trackEngagement("download");
  };

  const exportSocialTemplate = async (template: {
    id: string;
    width: number;
    height: number;
  }) => {
    const sourceBlob = await buildMemeBlob();
    if (!sourceBlob) return;

    const sourceUrl = URL.createObjectURL(sourceBlob);
    try {
      const sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Unable to load source image"));
        img.src = sourceUrl;
      });

      const canvas = document.createElement("canvas");
      canvas.width = template.width;
      canvas.height = template.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const fitScale = Math.min(
        template.width / sourceImage.width,
        template.height / sourceImage.height
      );
      const drawWidth = sourceImage.width * fitScale;
      const drawHeight = sourceImage.height * fitScale;
      const drawX = (template.width - drawWidth) / 2;
      const drawY = (template.height - drawHeight) / 2;

      ctx.clearRect(0, 0, template.width, template.height);
      ctx.drawImage(sourceImage, drawX, drawY, drawWidth, drawHeight);

      const outputBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png");
      });
      if (!outputBlob) return;

      saveAs(outputBlob, getPngFileName(template.id));
      trackEngagement("download");
    } finally {
      URL.revokeObjectURL(sourceUrl);
    }
  };

  const sharePayload = useMemo<SharePayload>(
    () => ({
      version: 1,
      activeImageUrl,
      activeImageName,
      boxesCount,
      boxes: deepClone(boxes),
      textLayers: deepClone(textLayers),
      stickers: deepClone(stickers),
    }),
    [activeImageUrl, activeImageName, boxesCount, boxes, textLayers, stickers]
  );

  const shareUrl = useMemo(() => {
    if (!activeImageUrl) return "";
    try {
      return `${window.location.origin}/creator?${SHARE_QUERY_KEY}=${encodeSharePayload(sharePayload)}`;
    } catch {
      return "";
    }
  }, [sharePayload, activeImageUrl]);

  useEffect(() => {
    if (!shareUrl) {
      setQrDataUrl("");
      return;
    }
    QRCode.toDataURL(shareUrl, { margin: 1, width: 220 })
      .then((url) => setQrDataUrl(url))
      .catch(() => setQrDataUrl(""));
  }, [shareUrl]);

  const copyShareLink = async () => {
    if (!shareUrl) {
      setShareStatus(t("generator.shareUnavailable"));
      return;
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareStatus(t("generator.linkCopied"));
    } catch {
      setShareStatus(t("generator.shareUnavailable"));
    }
  };

  const shareMeme = async () => {
    try {
      setIsSharing(true);
      setShareStatus(null);
      const blob = await buildMemeBlob();
      if (!blob) {
        setShareStatus(t("generator.shareUnavailable"));
        return;
      }

      const fileName = getPngFileName();
      const file = new File([blob], fileName, { type: "image/png" });
      const canShareFiles =
        typeof navigator.share === "function" &&
        (typeof navigator.canShare !== "function" ||
          navigator.canShare({ files: [file] }));

      if (typeof navigator.share === "function") {
        const data: ShareData = {
          title: fileName,
          text: shareUrl || undefined,
        };
        if (canShareFiles) {
          data.files = [file];
        }
        await navigator.share(data);
        trackEngagement("share");
        setShareStatus(t("generator.shareDone"));
        return;
      }

      const clipboardItemCtor = (window as Window & { ClipboardItem?: any }).ClipboardItem;
      if (navigator.clipboard?.write && clipboardItemCtor) {
        const clipboardItem = new clipboardItemCtor({ "image/png": blob });
        await navigator.clipboard.write([clipboardItem]);
        trackEngagement("share");
        setShareStatus(t("generator.shareCopied"));
        return;
      }

      saveAs(blob, fileName);
      trackEngagement("download");
      setShareStatus(t("generator.shareFallbackDownload"));
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
      setShareStatus(t("generator.shareUnavailable"));
    } finally {
      setIsSharing(false);
    }
  };

  const saveToProfile = async () => {
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (!token) {
      setShareStatus(t("generator.saveNeedLogin"));
      return;
    }

    try {
      setIsSavingProfile(true);
      if (cloudMemeId) {
        await updateMemeApi(token, cloudMemeId, {
          title: getBaseFileName(),
          source_image_url: activeImageUrl,
          payload: sharePayload,
          tags: ["creator", "web"],
          is_public: false,
        });
      } else {
        const saved = await saveMemeApi(token, {
          title: getBaseFileName(),
          source_image_url: activeImageUrl,
          payload: sharePayload,
          tags: ["creator", "web"],
          is_public: false,
        });
        setCloudMemeId(saved.id);
      }
      trackEngagement("save");
      setAutosaveState("saved");
      setShareStatus(t("generator.savedProfile"));
    } catch (error) {
      setShareStatus(
        error instanceof Error ? error.message : t("generator.shareUnavailable")
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const loadVersions = async () => {
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (!token || !cloudMemeId) return;

    try {
      setIsLoadingVersions(true);
      const response = await getMemeVersionsApi(token, cloudMemeId);
      setVersions(response.items);
    } catch (error) {
      setShareStatus(
        error instanceof Error ? error.message : t("generator.shareUnavailable")
      );
    } finally {
      setIsLoadingVersions(false);
    }
  };

  const saveManualVersion = async () => {
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (!token || !cloudMemeId) {
      setShareStatus(t("generator.saveNeedLogin"));
      return;
    }

    try {
      await createMemeVersionApi(token, cloudMemeId, "Manual checkpoint");
      await loadVersions();
      setShareStatus(language === "fr" ? "Version enregistree." : "Version saved.");
    } catch (error) {
      setShareStatus(
        error instanceof Error ? error.message : t("generator.shareUnavailable")
      );
    }
  };

  const restoreVersion = async (versionId: number) => {
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (!token || !cloudMemeId) return;

    try {
      const response = await restoreMemeVersionApi(token, cloudMemeId, versionId);
      const snapshot = snapshotFromPayload(response.item.payload);
      if (snapshot) {
        applySnapshot(snapshot, { resetHistory: true });
      }
      setShareStatus(language === "fr" ? "Version restauree." : "Version restored.");
      await loadVersions();
    } catch (error) {
      setShareStatus(
        error instanceof Error ? error.message : t("generator.shareUnavailable")
      );
    }
  };

  const generateAiCaptions = async () => {
    try {
      setIsGeneratingAi(true);
      setAiStatus(null);
      const response = await generateMemeSuggestionsApi({
        language,
        topic: aiTopic,
        style: "funny",
      });

      const suggestion = response.items[0];
      if (!suggestion) {
        setAiStatus(language === "fr" ? "Aucune suggestion." : "No suggestion.");
        return;
      }

      const nextBoxes = deepClone(boxes);
      if (nextBoxes.length === 0) {
        nextBoxes.push(createDefaultBox(0));
      }
      nextBoxes[0] = {
        ...nextBoxes[0],
        text: suggestion.top || nextBoxes[0].text,
      };

      if (nextBoxes.length > 1) {
        nextBoxes[1] = {
          ...nextBoxes[1],
          text: suggestion.bottom || nextBoxes[1].text,
        };
      } else if (suggestion.bottom) {
        const nextIndex = nextBoxes.length;
        nextBoxes.push({
          ...createDefaultBox(nextIndex),
          text: suggestion.bottom,
          index: nextIndex,
        });
        setTextLayers((prev) => [...prev, createDefaultTextLayer(nextIndex, getNextZIndex())]);
        setBoxesCount(nextBoxes.length);
      }

      replaceBoxes(nextBoxes);
      trackEngagement("edit");
      setAiStatus(
        response.provider === "openai"
          ? language === "fr"
            ? "Texte IA applique."
            : "AI text applied."
          : language === "fr"
            ? "Texte local applique."
            : "Local suggestion applied."
      );
    } catch (error) {
      setAiStatus(
        error instanceof Error ? error.message : t("generator.shareUnavailable")
      );
    } finally {
      setIsGeneratingAi(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (!token || !activeImageUrl) return;

    if (autosaveTimerRef.current) {
      window.clearTimeout(autosaveTimerRef.current);
    }

    autosaveTimerRef.current = window.setTimeout(async () => {
      try {
        setAutosaveState("saving");
        const response = await autosaveMemeApi(token, {
          id: cloudMemeId ?? undefined,
          title: getBaseFileName(),
          source_image_url: activeImageUrl,
          payload: sharePayload,
          tags: ["creator", "web", "autosave"],
          is_public: false,
        });
        setCloudMemeId(response.id);
        setAutosaveState("saved");
      } catch {
        setAutosaveState("error");
      }
    }, 1800);

    return () => {
      if (autosaveTimerRef.current) {
        window.clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }
    };
  }, [sharePayload, activeImageUrl, cloudMemeId]);

  const closeOnboarding = () => {
    localStorage.setItem("meme-creator-onboarding-v1", "done");
    setOnboardingStep(null);
  };

  const nextOnboardingStep = () => {
    setOnboardingStep((prev) => {
      if (prev === null) return null;
      if (prev >= onboardingSteps.length - 1) {
        localStorage.setItem("meme-creator-onboarding-v1", "done");
        return null;
      }
      return prev + 1;
    });
  };

  const canUndo = historyRef.current.length > 1;
  const canRedo = futureRef.current.length > 0;
  const captionIndexes = Array.from({ length: boxesCount }, (_, index) => index);

  return (
    <div className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="w-full md:w-1/2">
          <ImageSection
            image={activeImageUrl}
            stickers={stickers}
            onStickerChange={updateSticker}
            onTextLayerChange={updateTextLayer}
            textLayers={textLayers}
            selectedLayer={selectedLayer}
            showSelectionOutline={showLayers}
            isExporting={isExporting}
            onSelectText={(index) =>
              setSelectedLayer({ type: "text", id: `text-${index}`, index })
            }
            onSelectSticker={(id) => setSelectedLayer({ type: "sticker", id })}
            onClearSelection={() => setSelectedLayer(null)}
            grid={gridEnabled ? [gridSize, gridSize] : undefined}
          />
        </div>

        <div className="w-full md:w-1/2">
          <div className="space-y-6">
            {onboardingStep !== null && (
              <div className="rounded-2xl border border-fuchsia-400/40 bg-fuchsia-500/10 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-fuchsia-200">
                      {t("onboarding.creator.title")} {onboardingStep + 1}/
                      {onboardingSteps.length}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-100">
                      {onboardingSteps[onboardingStep].title}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">
                      {onboardingSteps[onboardingStep].description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={closeOnboarding}
                    className="rounded-full border border-white/20 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:border-fuchsia-400/70"
                  >
                    {t("onboarding.skip")}
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={nextOnboardingStep}
                    className="rounded-full bg-gradient-to-r from-fuchsia-500 to-rose-500 px-3 py-1 text-[11px] font-semibold text-white"
                  >
                    {onboardingStep >= onboardingSteps.length - 1
                      ? t("onboarding.done")
                      : t("onboarding.next")}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {captionIndexes.map((index) => (
                <CaptionProvider key={index} index={index}>
                  <Caption
                    index={index}
                    canRemove={boxesCount > 1}
                    onRemove={() => removeTextBox(index)}
                  />
                </CaptionProvider>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60 hover:text-white disabled:opacity-40 sm:w-auto"
                onClick={undo}
                disabled={!canUndo}
              >
                <MdUndo className="text-lg" />
                {t("generator.undo")}
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60 hover:text-white disabled:opacity-40 sm:w-auto"
                onClick={redo}
                disabled={!canRedo}
              >
                <MdRedo className="text-lg" />
                {t("generator.redo")}
              </button>

              <button
                type="button"
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60 hover:text-white sm:w-auto"
                onClick={addBox}
              >
                {t("generator.addText")}
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:w-auto"
                onClick={downloadMeme}
              >
                <MdDownload className="text-lg" />
                {t("generator.download")}
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                onClick={shareMeme}
                disabled={isSharing}
              >
                <MdShare className="text-lg" />
                {isSharing ? t("generator.sharing") : t("generator.share")}
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                onClick={saveToProfile}
                disabled={isSavingProfile}
              >
                {isSavingProfile ? t("generator.savingProfile") : t("generator.saveProfile")}
              </button>
            </div>

            {shareStatus && <p className="text-xs text-slate-300">{shareStatus}</p>}

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">
                  {t("generator.socialExports")}
                </p>
                <span className="text-xs text-slate-400">
                  {t("generator.socialExportsHint")}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {socialTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => exportSocialTemplate(template)}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
                  >
                    {template.label} {template.width}x{template.height}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">
                  {t("generator.sharePanel")}
                </p>
                <button
                  type="button"
                  onClick={() => setShowShareOptions((prev) => !prev)}
                  className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
                >
                  {showShareOptions ? t("generator.less") : t("generator.more")}
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
                      onClick={copyShareLink}
                      className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
                    >
                      {t("generator.copyLink")}
                    </button>
                  </div>

                  {showShareOptions && (
                    <div className="space-y-2">
                      <p className="text-xs text-slate-400">{t("generator.qrNote")}</p>
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
                          {t("generator.downloadQr")}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="mt-3 text-xs text-slate-400">
                  {t("generator.shareUnavailable")}
                </p>
              )}
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
                    type="button"
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
