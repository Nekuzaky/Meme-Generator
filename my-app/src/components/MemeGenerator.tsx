import {
  MdArrowDownward,
  MdArrowUpward,
  MdAutoFixHigh,
  MdCasino,
  MdCelebration,
  MdDownload,
  MdFlip,
  MdGifBox,
  MdLock,
  MdLockOpen,
  MdMovie,
  MdOfflineBolt,
  MdRedo,
  MdShare,
  MdTimer,
  MdTune,
  MdUndo,
  MdUpload,
} from "react-icons/md";
import { useEffect, useMemo, useRef, useState } from "react";
import { fontStyles, stickerOptions } from "../constants/constants";
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
import {
  decodeSharePayload,
  encodeSharePayload,
  isSharePayloadTooLarge,
  SHARE_QUERY_KEY,
} from "../lib/share";
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
type VariantSlotKey = "A" | "B";
type VariantSlot = {
  snapshot: HistorySnapshot;
  updatedAt: number;
};

const deepClone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const loadDomToImage = () => import("dom-to-image");
const loadFileSaver = () => import("file-saver");
const loadGifshot = () => import("gifshot");
const loadQrCode = () => import("qrcode");
const randomItem = <T,>(items: T[]) => items[Math.floor(Math.random() * items.length)];
const remixColors = [
  ["#ffffff", "#111827"],
  ["#fef08a", "#7c2d12"],
  ["#22d3ee", "#0f172a"],
  ["#f472b6", "#1f2937"],
  ["#86efac", "#14532d"],
];
const remixEffects: Box["effect"][] = ["none", "arc", "outline", "gradient", "shake"];
type FunFilterKey = "none" | "punch" | "mono" | "vhs" | "sunset";
const imageFilterPresets: Record<FunFilterKey, string> = {
  none: "none",
  punch: "contrast(1.14) saturate(1.22)",
  mono: "grayscale(1) contrast(1.08)",
  vhs: "contrast(1.16) saturate(0.95) hue-rotate(-10deg)",
  sunset: "sepia(0.38) saturate(1.28) hue-rotate(-18deg)",
};
const LOCAL_CREATOR_FALLBACK_KEY = "meme-creator-cloud-fallback";

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
  const [variantSlots, setVariantSlots] = useState<Partial<Record<VariantSlotKey, VariantSlot>>>({});
  const [isExportingVariants, setIsExportingVariants] = useState(false);
  const [imageFilterKey, setImageFilterKey] = useState<FunFilterKey>("none");
  const [isMirrored, setIsMirrored] = useState(false);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [isExportingVideo, setIsExportingVideo] = useState(false);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [speedrunDuration, setSpeedrunDuration] = useState<30 | 60>(30);
  const [speedrunRemaining, setSpeedrunRemaining] = useState(0);
  const [speedrunConstraint, setSpeedrunConstraint] = useState("");
  const [speedrunActive, setSpeedrunActive] = useState(false);

  const historyRef = useRef<HistorySnapshot[]>([]);
  const futureRef = useRef<HistorySnapshot[]>([]);
  const historyTimerRef = useRef<number | null>(null);
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

  const saveLocalFallback = () => {
    const entry = {
      id: cloudMemeId ?? Date.now(),
      title: getBaseFileName(),
      source_image_url: activeImageUrl,
      payload: sharePayload,
      tags: ["creator", "web", "fallback"],
      savedAt: new Date().toISOString(),
    };

    try {
      const raw = localStorage.getItem(LOCAL_CREATOR_FALLBACK_KEY);
      const items = raw ? (JSON.parse(raw) as typeof entry[]) : [];
      const next = [entry, ...items].slice(0, 20);
      localStorage.setItem(LOCAL_CREATOR_FALLBACK_KEY, JSON.stringify(next));
    } catch {
      // ignore local fallback storage errors
    }
  };

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
          const payload = decodeSharePayload<SharePayload>(share);
          const snapshot = snapshotFromPayload(payload);
          if (snapshot) {
            applySnapshot(
              snapshot,
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
    setImageFilterKey("none");
    setIsMirrored(false);
    setSpeedrunActive(false);
    setSpeedrunRemaining(0);
    setSpeedrunConstraint("");
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

    if (historyTimerRef.current) {
      window.clearTimeout(historyTimerRef.current);
    }

    historyTimerRef.current = window.setTimeout(() => {
      const snapshot = createSnapshot();
      const last = historyRef.current[historyRef.current.length - 1];
      const unchanged = last && JSON.stringify(last) === JSON.stringify(snapshot);
      if (unchanged) return;
      historyRef.current.push(snapshot);
      if (historyRef.current.length > 80) {
        historyRef.current.shift();
      }
      futureRef.current = [];
    }, 120);

    return () => {
      if (historyTimerRef.current) {
        window.clearTimeout(historyTimerRef.current);
        historyTimerRef.current = null;
      }
    };
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
    const detachedStylesheets: HTMLLinkElement[] = [];
    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      document
        .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href^="http"]')
        .forEach((link) => {
          if (!link.parentNode) return;
          detachedStylesheets.push(link);
          link.parentNode.removeChild(link);
        });
      const domtoimage = await loadDomToImage();
      return await domtoimage.default.toBlob(node);
    } finally {
      detachedStylesheets.forEach((link) => {
        document.head.appendChild(link);
      });
      setIsExporting(false);
    }
  };

  const waitForUiCommit = async () => {
    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  };

  const buildBlobFromSnapshot = async (snapshot: HistorySnapshot) => {
    applySnapshot(snapshot);
    await waitForUiCommit();
    return buildMemeBlob();
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

  const drawSmartWatermark = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    target: "image" | "video"
  ) => {
    const isVertical = height > width * 1.2;
    const text = `Made with ${t("brand.name")}`;
    const size = Math.max(12, Math.round(Math.min(width, height) * (target === "video" ? 0.022 : 0.02)));
    const paddingX = Math.max(8, Math.round(size * 0.65));
    const paddingY = Math.max(6, Math.round(size * 0.45));
    ctx.font = `600 ${size}px Manrope, sans-serif`;
    const textWidth = ctx.measureText(text).width;
    const boxWidth = textWidth + paddingX * 2;
    const boxHeight = size + paddingY * 2;
    const x = isVertical ? width - boxWidth - 18 : 14;
    const y = isVertical ? 14 : height - boxHeight - 14;
    ctx.fillStyle = "rgba(2, 6, 23, 0.56)";
    ctx.fillRect(x, y, boxWidth, boxHeight);
    ctx.strokeStyle = "rgba(244,114,182,0.45)";
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, y + 0.5, boxWidth - 1, boxHeight - 1);
    ctx.fillStyle = "rgba(248,250,252,0.92)";
    ctx.fillText(text, x + paddingX, y + boxHeight - paddingY - 2);
  };

  const blobToImage = (blob: Blob) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const objectUrl = URL.createObjectURL(blob);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(image);
      };
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Unable to decode export image"));
      };
      image.src = objectUrl;
    });

  const applyWatermarkToBlob = async (
    blob: Blob,
    target: "image" | "video" = "image"
  ) => {
    if (!watermarkEnabled) return blob;
    const image = await blobToImage(blob);
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return blob;
    ctx.drawImage(image, 0, 0);
    drawSmartWatermark(ctx, canvas.width, canvas.height, target);
    const output = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/png");
    });
    return output ?? blob;
  };

  const downloadMeme = async () => {
    let blob = await buildMemeBlob();
    if (!blob) return;
    blob = await applyWatermarkToBlob(blob, "image");
    const { saveAs } = await loadFileSaver();
    saveAs(blob, getPngFileName());
    trackEngagement("download");
  };

  const randomPunchlineBlast = () => {
    const pools =
      language === "fr"
        ? {
            top: [
              "MOI QUAND JE DIS JUSTE UNE EPISODE",
              "LE PLAN ETAIT SIMPLE",
              "QUAND LE CAFE FAIT EFFET",
              "MOOD DU LUNDI MATIN",
            ],
            bottom: [
              "2H PLUS TARD JE DEBOGUE ENCORE",
              "CA PART EN CHAOS TOTAL",
              "LE CLAVIER PREND DES DEGATS",
              "FINAL BOSS: LA PROD",
            ],
          }
        : {
            top: [
              "ME SAYING JUST ONE EPISODE",
              "THE PLAN WAS SIMPLE",
              "WHEN COFFEE KICKS IN",
              "MONDAY MORNING MOOD",
            ],
            bottom: [
              "2 HOURS LATER STILL DEBUGGING",
              "TOTAL CHAOS MODE",
              "KEYBOARD TAKING DAMAGE",
              "FINAL BOSS: PRODUCTION",
            ],
          };

    const nextBoxes = deepClone(boxes);
    if (nextBoxes.length === 0) {
      nextBoxes.push(createDefaultBox(0), createDefaultBox(1));
      setBoxesCount(2);
      setTextLayers([
        createDefaultTextLayer(0, 1),
        createDefaultTextLayer(1, 2),
      ]);
    }

    const updated = nextBoxes.map((box, index) => ({
      ...box,
      text: index === 0 ? randomItem(pools.top) : randomItem(pools.bottom),
      effect: index === 0 ? "outline" : box.effect,
    }));
    replaceBoxes(updated);
    setShareStatus(language === "fr" ? "Punchlines generees." : "Punchlines generated.");
    trackEngagement("edit");
  };

  const addStickerBurst = () => {
    const burstCount = 6;
    setStickers((prev) => {
      const next = [...prev];
      for (let i = 0; i < burstCount; i += 1) {
        next.push({
          id: createStickerId(),
          emoji: randomItem(stickerOptions),
          kind: "emoji",
          x: 16 + (i % 3) * 84 + Math.floor(Math.random() * 24),
          y: 18 + Math.floor(i / 3) * 84 + Math.floor(Math.random() * 24),
          size: 44 + Math.floor(Math.random() * 22),
          locked: false,
          zIndex: getNextZIndex(textLayers, next),
        });
      }
      return next.slice(0, 40);
    });
    setShareStatus(language === "fr" ? "Sticker burst ajoute." : "Sticker burst added.");
    trackEngagement("edit");
  };

  const cycleImageFilter = () => {
    const order: FunFilterKey[] = ["none", "punch", "mono", "vhs", "sunset"];
    const currentIndex = order.indexOf(imageFilterKey);
    const next = order[(currentIndex + 1) % order.length];
    setImageFilterKey(next);
    const filterLabel =
      next === "none"
        ? language === "fr"
          ? "Aucun"
          : "None"
        : next.toUpperCase();
    setShareStatus(
      language === "fr" ? `Filtre actif: ${filterLabel}.` : `Active filter: ${filterLabel}.`
    );
  };

  const toggleMirrorMode = () => {
    setIsMirrored((prev) => !prev);
    trackEngagement("edit");
  };

  const applyBundlePreset = (preset: "shitpost" | "corporate" | "gaming" | "anime") => {
    const nextBoxes = deepClone(boxes.length > 0 ? boxes : [createDefaultBox(0), createDefaultBox(1)]);
    const bundleLabel =
      preset === "shitpost"
        ? "SHITPOST"
        : preset === "corporate"
          ? "CORPORATE"
          : preset === "gaming"
            ? "GAMING"
            : "ANIME";

    const styleMap = {
      shitpost: { fill: "#ffffff", outline: "#0f172a", effect: "shake" as Box["effect"], filter: "vhs" as FunFilterKey },
      corporate: { fill: "#e2e8f0", outline: "#0f172a", effect: "none" as Box["effect"], filter: "mono" as FunFilterKey },
      gaming: { fill: "#22d3ee", outline: "#111827", effect: "gradient" as Box["effect"], filter: "punch" as FunFilterKey },
      anime: { fill: "#fef08a", outline: "#7c2d12", effect: "arc" as Box["effect"], filter: "sunset" as FunFilterKey },
    }[preset];

    const updated = nextBoxes.map((box, index) => ({
      ...box,
      text:
        box.text.trim() ||
        (index === 0
          ? `${bundleLabel} MODE`
          : language === "fr"
            ? "on garde le chaos controle"
            : "controlled chaos only"),
      color: styleMap.fill,
      outline_color: styleMap.outline,
      effect: styleMap.effect,
      fontFamily: preset === "corporate" ? "Arial" : randomItem(fontStyles),
      fontSize: preset === "corporate" ? 40 : 46,
    }));

    replaceBoxes(updated);
    setImageFilterKey(styleMap.filter);
    setShareStatus(
      language === "fr" ? `Preset ${preset} applique.` : `${preset} preset applied.`
    );
    trackEngagement("edit");
  };

  const exportGif = async () => {
    const node = document.getElementById("downloadMeme");
    if (!node) return;
    const detachedStylesheets: HTMLLinkElement[] = [];
    const previousFilter = node.style.filter;
    const previousTransform = node.style.transform;
    const previousTransition = node.style.transition;
    const textLayerNodes = Array.from(node.querySelectorAll<HTMLElement>(".meme-text-layer"));
    const stickerLayerNodes = Array.from(node.querySelectorAll<HTMLElement>(".meme-sticker-layer"));
    const previousTextOpacity = textLayerNodes.map((el) => el.style.opacity);
    const previousTextTransform = textLayerNodes.map((el) => el.style.transform);
    const previousStickerOpacity = stickerLayerNodes.map((el) => el.style.opacity);
    const previousStickerTransform = stickerLayerNodes.map((el) => el.style.transform);
    const frameStyles = [
      { filter: "none", transform: "translate(0px, 0px)" },
      { filter: "contrast(1.08) saturate(1.1) hue-rotate(10deg)", transform: "translate(1px, -1px)" },
      { filter: "contrast(1.14) saturate(1.22)", transform: "translate(-1px, 1px)" },
      { filter: "brightness(1.06) saturate(1.18) hue-rotate(-8deg)", transform: "translate(0px, 0px)" },
      { filter: "none", transform: "translate(0px, 0px)" },
    ];

    try {
      setIsExportingGif(true);
      setIsExporting(true);
      document
        .querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"][href^="http"]')
        .forEach((link) => {
          if (!link.parentNode) return;
          detachedStylesheets.push(link);
          link.parentNode.removeChild(link);
        });

      const domtoimage = await loadDomToImage();
      const frames: string[] = [];
      node.style.transition = "none";
      for (let frameIndex = 0; frameIndex < frameStyles.length; frameIndex += 1) {
        const frame = frameStyles[frameIndex];
        node.style.filter = frame.filter;
        node.style.transform = frame.transform;
        textLayerNodes.forEach((el, index) => {
          const visible = index <= frameIndex;
          el.style.opacity = visible ? "1" : "0";
          el.style.transform = visible ? "translateY(0px)" : "translateY(12px)";
        });
        stickerLayerNodes.forEach((el, index) => {
          const visible = index <= frameIndex - 1;
          el.style.opacity = visible ? "1" : "0";
          el.style.transform = visible ? "scale(1)" : "scale(0.7)";
        });
        await waitForUiCommit();
        const png = await domtoimage.default.toPng(node);
        if (watermarkEnabled) {
          const image = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("GIF frame load failed"));
            img.src = png;
          });
          const canvas = document.createElement("canvas");
          canvas.width = image.width;
          canvas.height = image.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(image, 0, 0);
            drawSmartWatermark(ctx, canvas.width, canvas.height, "image");
            frames.push(canvas.toDataURL("image/png"));
          } else {
            frames.push(png);
          }
        } else {
          frames.push(png);
        }
      }

      const gifshot = await loadGifshot();
      const gifDataUrl = await new Promise<string>((resolve, reject) => {
        gifshot.default.createGIF(
          {
            images: frames,
            gifWidth: Math.max(320, node.clientWidth),
            gifHeight: Math.max(320, node.clientHeight),
            interval: 0.18,
            numFrames: frames.length,
            sampleInterval: 8,
          },
          (result: { error?: boolean; image?: string; errorCode?: string }) => {
            if (!result.error && result.image) {
              resolve(result.image);
              return;
            }
            reject(new Error(result.errorCode || "GIF generation failed"));
          }
        );
      });

      const response = await fetch(gifDataUrl);
      const gifBlob = await response.blob();
      const { saveAs } = await loadFileSaver();
      saveAs(gifBlob, `${getBaseFileName()}.gif`);
      setShareStatus(language === "fr" ? "GIF timeline exporte." : "Timeline GIF exported.");
      trackEngagement("download");
    } catch {
      setShareStatus(language === "fr" ? "Echec export GIF." : "GIF export failed.");
    } finally {
      node.style.filter = previousFilter;
      node.style.transform = previousTransform;
      node.style.transition = previousTransition;
      textLayerNodes.forEach((el, index) => {
        el.style.opacity = previousTextOpacity[index] ?? "";
        el.style.transform = previousTextTransform[index] ?? "";
      });
      stickerLayerNodes.forEach((el, index) => {
        el.style.opacity = previousStickerOpacity[index] ?? "";
        el.style.transform = previousStickerTransform[index] ?? "";
      });
      detachedStylesheets.forEach((link) => {
        document.head.appendChild(link);
      });
      setIsExporting(false);
      setIsExportingGif(false);
    }
  };

  const exportVerticalVideo = async () => {
    const sourceBlob = await buildMemeBlob();
    if (!sourceBlob) return;
    if (typeof MediaRecorder === "undefined") {
      setShareStatus(language === "fr" ? "Export video non supporte par ce navigateur." : "Video export is not supported in this browser.");
      return;
    }

    try {
      setIsExportingVideo(true);
      const image = await blobToImage(sourceBlob);
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const mimeCandidates = [
        "video/mp4;codecs=h264",
        "video/mp4",
        "video/webm;codecs=vp9",
        "video/webm",
      ];
      const mimeType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) || "";
      if (!mimeType) {
        setShareStatus(language === "fr" ? "Aucun codec video compatible." : "No compatible video codec found.");
        return;
      }

      const stream = canvas.captureStream(30);
      const chunks: BlobPart[] = [];
      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 6_000_000,
      });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };

      const durationMs = 3200;
      const renderFrame = (progress: number) => {
        const zoom = 1.04 + progress * 0.06;
        const fitScale = Math.min(canvas.width / image.width, canvas.height / image.height);
        const drawWidth = image.width * fitScale * zoom;
        const drawHeight = image.height * fitScale * zoom;
        const swayX = Math.sin(progress * Math.PI * 2) * 10;
        const swayY = Math.cos(progress * Math.PI * 2) * 8;
        const drawX = (canvas.width - drawWidth) / 2 + swayX;
        const drawY = (canvas.height - drawHeight) / 2 + swayY;
        ctx.fillStyle = "#020617";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
        if (watermarkEnabled) {
          drawSmartWatermark(ctx, canvas.width, canvas.height, "video");
        }
      };

      recorder.start();
      const start = performance.now();
      await new Promise<void>((resolve) => {
        const tick = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(1, elapsed / durationMs);
          renderFrame(progress);
          if (elapsed < durationMs) {
            requestAnimationFrame(tick);
          } else {
            resolve();
          }
        };
        requestAnimationFrame(tick);
      });

      const videoBlob = await new Promise<Blob>((resolve) => {
        recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
        recorder.stop();
      });
      stream.getTracks().forEach((track) => track.stop());

      const extension = mimeType.includes("mp4") ? "mp4" : "webm";
      const { saveAs } = await loadFileSaver();
      saveAs(videoBlob, `${getBaseFileName()}-vertical.${extension}`);
      setShareStatus(
        extension === "mp4"
          ? language === "fr"
            ? "MP4 vertical exporte."
            : "Vertical MP4 exported."
          : language === "fr"
            ? "Export vertical en WEBM (MP4 non supporte par ce navigateur)."
            : "Exported vertical WEBM (MP4 not supported by this browser)."
      );
      trackEngagement("download");
    } catch {
      setShareStatus(language === "fr" ? "Echec export video vertical." : "Vertical video export failed.");
    } finally {
      setIsExportingVideo(false);
    }
  };


  const exportSocialTemplate = async (template: {
    id: string;
    width: number;
    height: number;
  }) => {
    let sourceBlob = await buildMemeBlob();
    if (!sourceBlob) return;
    sourceBlob = await applyWatermarkToBlob(sourceBlob, "image");

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

      const { saveAs } = await loadFileSaver();
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
      if (isSharePayloadTooLarge(sharePayload)) {
        return "";
      }
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
    loadQrCode()
      .then((QRCode) => QRCode.toDataURL(shareUrl, { margin: 1, width: 220 }))
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
      let blob = await buildMemeBlob();
      if (!blob) {
        setShareStatus(t("generator.shareUnavailable"));
        return;
      }
      blob = await applyWatermarkToBlob(blob, "image");

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

      const { saveAs } = await loadFileSaver();
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
      saveLocalFallback();
      setShareStatus(
        error instanceof Error
          ? `${error.message} · ${language === "fr" ? "Copie locale gardee." : "Local backup saved."}`
          : t("generator.shareUnavailable")
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

  const applyCaptionTone = (mode: "roast" | "deadpan" | "hype" | "plot") => {
    const toneWords =
      mode === "roast"
        ? {
            fr: ["quelle idee", "catastrophe premium", "niveau legendaire"],
            en: ["what a choice", "premium disaster", "legend-tier mistake"],
          }
        : mode === "deadpan"
          ? {
              fr: ["oui bien sur", "aucun probleme", "situation normale"],
              en: ["yes of course", "no problem", "totally normal"],
            }
          : mode === "hype"
            ? {
                fr: ["mode boss active", "energie maximale", "scene iconique"],
                en: ["boss mode on", "maximum energy", "iconic scene"],
              }
            : {
                fr: ["et puis retournement", "plot twist immediat", "fin inattendue"],
                en: ["then plot twist", "instant twist", "unexpected ending"],
              };

    const locale = language === "fr" ? "fr" : "en";
    const pool = toneWords[locale];
    const nextBoxes = deepClone(boxes);

    if (nextBoxes.length === 0) {
      nextBoxes.push(createDefaultBox(0));
      setTextLayers((prev) => [...prev, createDefaultTextLayer(0, getNextZIndex(prev, stickers))]);
      setBoxesCount(1);
    }

    const withText = nextBoxes.map((box, index) => {
      const baseText = box.text.trim() || (index === 0 ? getBaseFileName() : randomItem(pool));
      const nextText =
        mode === "roast"
          ? `${baseText.toUpperCase()}`
          : mode === "deadpan"
            ? `${baseText}...`
            : mode === "hype"
              ? `${baseText.toUpperCase()}!!!`
              : `${baseText} -> ${randomItem(pool)}`;

      return {
        ...box,
        text: nextText,
      };
    });

    replaceBoxes(withText);
    trackEngagement("edit");
  };

  const autoLayoutForMobile = () => {
    setTextLayers((prev) =>
      prev.map((layer, index) => ({
        ...layer,
        x: 18,
        y: index === 0 ? 18 : index === 1 ? 300 : 18 + index * 90,
        width: 280,
        height: 96,
      }))
    );
    setGridEnabled(true);
    setGridSize(8);
    setShareStatus(language === "fr" ? "Mise en page mobile appliquee." : "Mobile-safe layout applied.");
    trackEngagement("edit");
  };

  const chaosRemix = () => {
    const nextBoxes = deepClone(boxes).map((box, index) => {
      const [fill, outline] = randomItem(remixColors);
      return {
        ...box,
        color: fill,
        outline_color: outline,
        fontFamily: randomItem(fontStyles),
        fontSize: 42 + Math.floor(Math.random() * 22),
        effect: randomItem(remixEffects),
        text:
          box.text.trim() ||
          (index === 0
            ? (language === "fr" ? "MOI EN 2 SECONDES" : "ME IN 2 SECONDS")
            : language === "fr"
              ? "tout part en vrille"
              : "everything collapses"),
      };
    });

    const nextTextLayers = textLayers.map((layer, index) => ({
      ...layer,
      x: 14 + (index % 2) * 26,
      y: 18 + index * 86,
      width: 240 + (index % 2) * 40,
      height: 90 + (index % 2) * 16,
    }));

    replaceBoxes(nextBoxes);
    setTextLayers(nextTextLayers);
    setStickers((prev) => {
      if (prev.length > 0) return prev;
      return [
        {
          id: createStickerId(),
          emoji: randomItem(stickerOptions),
          kind: "emoji",
          x: 24,
          y: 24,
          size: 58,
          locked: false,
          zIndex: getNextZIndex(nextTextLayers, prev),
        },
      ];
    });
    setShareStatus(language === "fr" ? "Chaos remix active." : "Chaos remix applied.");
    trackEngagement("edit");
  };

  const saveVariant = (slot: VariantSlotKey) => {
    setVariantSlots((prev) => ({
      ...prev,
      [slot]: {
        snapshot: createSnapshot(),
        updatedAt: Date.now(),
      },
    }));
    setShareStatus(
      language === "fr" ? `Version ${slot} capturee.` : `Variant ${slot} captured.`
    );
  };

  const loadVariant = (slot: VariantSlotKey) => {
    const variant = variantSlots[slot];
    if (!variant) return;
    applySnapshot(variant.snapshot, { resetHistory: true });
    setShareStatus(
      language === "fr" ? `Version ${slot} chargee.` : `Variant ${slot} loaded.`
    );
  };

  const exportVariantComparison = async () => {
    const variantA = variantSlots.A?.snapshot;
    const variantB = variantSlots.B?.snapshot;
    if (!variantA || !variantB) return;

    const restoreSnapshot = createSnapshot();

    try {
      setIsExportingVariants(true);
      const [blobA, blobB] = [await buildBlobFromSnapshot(variantA), await buildBlobFromSnapshot(variantB)];
      if (!blobA || !blobB) {
        setShareStatus(t("generator.shareUnavailable"));
        return;
      }

      const [imageA, imageB] = await Promise.all(
        [blobA, blobB].map(
          (blob) =>
            new Promise<HTMLImageElement>((resolve, reject) => {
              const url = URL.createObjectURL(blob);
              const img = new Image();
              img.onload = () => {
                URL.revokeObjectURL(url);
                resolve(img);
              };
              img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("Unable to load variant"));
              };
              img.src = url;
            })
        )
      );

      const gutter = 32;
      const labelHeight = 64;
      const canvas = document.createElement("canvas");
      canvas.width = imageA.width + imageB.width + gutter * 3;
      canvas.height = Math.max(imageA.height, imageB.height) + gutter * 2 + labelHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#020617";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e2e8f0";
      ctx.font = "600 28px Manrope";
      ctx.fillText("Variant A", gutter, 42);
      ctx.fillText("Variant B", imageA.width + gutter * 2, 42);
      ctx.drawImage(imageA, gutter, labelHeight);
      ctx.drawImage(imageB, imageA.width + gutter * 2, labelHeight);

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((nextBlob) => resolve(nextBlob), "image/png");
      });
      if (!blob) return;
      const { saveAs } = await loadFileSaver();
      saveAs(blob, `${getBaseFileName()}-ab-compare.png`);
      trackEngagement("download");
      setShareStatus(language === "fr" ? "Comparatif A/B exporte." : "A/B comparison exported.");
    } catch (error) {
      setShareStatus(
        error instanceof Error ? error.message : t("generator.shareUnavailable")
      );
    } finally {
      applySnapshot(restoreSnapshot, { resetHistory: true });
      await waitForUiCommit();
      setIsExportingVariants(false);
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
        saveLocalFallback();
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

  const speedrunConstraints = useMemo(
    () =>
      language === "fr"
        ? [
            "Maximum 6 mots par texte",
            "Ajoute exactement 1 sticker",
            "Interdit d'utiliser le mot \"meme\"",
            "Utilise un seul effet visuel",
            "Ajoute une punchline en CAPS",
            "Format mobile lisible obligatoire",
          ]
        : [
            "Maximum 6 words per text",
            "Add exactly 1 sticker",
            "Do not use the word \"meme\"",
            "Use only one visual effect",
            "Add one ALL-CAPS punchline",
            "Must stay mobile-readable",
          ],
    [language]
  );

  const startSpeedrun = (seconds: 30 | 60) => {
    setSpeedrunDuration(seconds);
    setSpeedrunRemaining(seconds);
    setSpeedrunConstraint(randomItem(speedrunConstraints));
    setSpeedrunActive(true);
    setShareStatus(
      language === "fr"
        ? `Speedrun ${seconds}s lance.`
        : `${seconds}s speedrun started.`
    );
  };

  const stopSpeedrun = () => {
    setSpeedrunActive(false);
    setSpeedrunRemaining(0);
    setShareStatus(language === "fr" ? "Speedrun arrete." : "Speedrun stopped.");
  };

  useEffect(() => {
    if (!speedrunActive) return;
    const timer = window.setInterval(() => {
      setSpeedrunRemaining((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setSpeedrunActive(false);
          setShareStatus(
            language === "fr"
              ? "Temps ecoule. Exporte ton meme."
              : "Time up. Export your meme."
          );
          trackEngagement("session");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [speedrunActive, language]);

  const canUndo = historyRef.current.length > 1;
  const canRedo = futureRef.current.length > 0;
  const captionIndexes = Array.from({ length: boxesCount }, (_, index) => index);
  const viralScore = useMemo(() => {
    const totalText = boxes.reduce((sum, box) => sum + box.text.trim().length, 0);
    const conciseBonus = totalText > 0 && totalText <= 90 ? 24 : totalText <= 150 ? 16 : 8;
    const layerBonus = Math.min(24, boxes.length * 8);
    const stickerBonus = stickers.length === 0 ? 6 : stickers.length <= 3 ? 14 : 8;
    const contrastBonus = boxes.some((box) => box.color !== box.outline_color) ? 18 : 6;
    const polishBonus = shareUrl ? 20 : 10;
    return Math.min(100, conciseBonus + layerBonus + stickerBonus + contrastBonus + polishBonus);
  }, [boxes, stickers, shareUrl]);
  const viralSuggestions = useMemo(() => {
    const suggestions: string[] = [];
    const totalText = boxes.reduce((sum, box) => sum + box.text.trim().length, 0);
    if (totalText === 0) {
      suggestions.push(language === "fr" ? "Ajoute une accroche courte et lisible." : "Add a short, readable hook.");
    } else if (totalText > 150) {
      suggestions.push(language === "fr" ? "Raccourcis le texte pour un impact mobile." : "Trim text for stronger mobile impact.");
    }
    if (stickers.length === 0) {
      suggestions.push(language === "fr" ? "Un sticker bien place peut booster le rythme visuel." : "One well-placed sticker can boost visual rhythm.");
    }
    if (!shareUrl) {
      suggestions.push(language === "fr" ? "Sauvegarde cloud pour partager proprement un projet lourd." : "Use cloud save to share a heavy project reliably.");
    }
    if (suggestions.length === 0) {
      suggestions.push(language === "fr" ? "Bon ratio lisibilite / chaos. Pret a sortir." : "Strong readability/chaos balance. Ready to ship.");
    }
    return suggestions.slice(0, 3);
  }, [boxes, stickers.length, shareUrl, language]);
  const autosaveText =
    autosaveState === "saving"
      ? language === "fr"
        ? "Autosave cloud..."
        : "Cloud autosaving..."
      : autosaveState === "saved"
        ? language === "fr"
          ? "Autosave synchronise."
          : "Autosave synced."
        : autosaveState === "error"
          ? language === "fr"
            ? "Autosave en erreur."
            : "Autosave failed."
          : language === "fr"
            ? "Autosave inactif."
            : "Autosave idle.";
  const cloudTitle = language === "fr" ? "Cloud & versions" : "Cloud & versions";
  const aiTitle = language === "fr" ? "Assistant IA meme" : "AI meme assistant";
  const aiPlaceholder =
    language === "fr"
      ? "Theme (ex: lundi matin, ecole, travail...)"
      : "Topic (e.g. monday morning, school, work...)";
  const aiButton = isGeneratingAi
    ? language === "fr"
      ? "Generation..."
      : "Generating..."
    : language === "fr"
      ? "Generer des captions"
      : "Generate captions";
  const speedrunClock = `${Math.floor(speedrunRemaining / 60)
    .toString()
    .padStart(2, "0")}:${(speedrunRemaining % 60).toString().padStart(2, "0")}`;

  return (
    <div className="glass-card w-full p-4 sm:p-5 md:p-8">
      <div className="flex flex-col gap-5 md:gap-6 xl:flex-row xl:items-start">
        <div className="w-full xl:w-[52%]">
          <ImageSection
            image={activeImageUrl}
            imageFilter={imageFilterPresets[imageFilterKey]}
            isMirrored={isMirrored}
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

        <div className="w-full xl:w-[48%]">
          <div className="space-y-4 xl:max-h-[calc(100vh-8rem)] xl:overflow-y-auto xl:pr-2">
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

            <div className="space-y-3">
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

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
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
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-cyan-300/40 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-sm transition hover:border-cyan-300/70 hover:text-white disabled:opacity-50 sm:w-auto"
                onClick={exportGif}
                disabled={isExportingGif}
              >
                <MdGifBox className="text-lg" />
                {isExportingGif
                  ? language === "fr"
                    ? "Export GIF..."
                    : "GIF export..."
                  : language === "fr"
                    ? "Exporter GIF"
                    : "Export GIF"}
              </button>

              <button
                type="button"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-emerald-300/40 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-100 shadow-sm transition hover:border-emerald-300/70 hover:text-white disabled:opacity-50 sm:w-auto"
                onClick={exportVerticalVideo}
                disabled={isExportingVideo}
              >
                <MdMovie className="text-lg" />
                {isExportingVideo
                  ? language === "fr"
                    ? "Export video..."
                    : "Video export..."
                  : language === "fr"
                    ? "Exporter vertical MP4"
                    : "Export vertical MP4"}
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

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {language === "fr" ? "Creator intelligence" : "Creator intelligence"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {language === "fr"
                      ? "Des outils rapides pour sortir une version plus agressive, plus lisible, ou plus mobile."
                      : "Fast tools to produce a sharper, cleaner, or more mobile-ready version."}
                  </p>
                </div>
                <div className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Viral score {viralScore}/100
                </div>
              </div>

              <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-orange-400 transition-all"
                  style={{ width: `${Math.max(10, viralScore)}%` }}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={chaosRemix}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-fuchsia-400/60"
                >
                  <MdOfflineBolt className="text-base" />
                  {language === "fr" ? "Chaos remix" : "Chaos remix"}
                </button>
                <button
                  type="button"
                  onClick={autoLayoutForMobile}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-cyan-400/60"
                >
                  <MdAutoFixHigh className="text-base" />
                  {language === "fr" ? "Auto layout mobile" : "Mobile auto layout"}
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { id: "roast", label: language === "fr" ? "Roast" : "Roast" },
                  { id: "deadpan", label: language === "fr" ? "Deadpan" : "Deadpan" },
                  { id: "hype", label: language === "fr" ? "Hype" : "Hype" },
                  { id: "plot", label: language === "fr" ? "Plot twist" : "Plot twist" },
                ].map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => applyCaptionTone(tone.id as "roast" | "deadpan" | "hype" | "plot")}
                    className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-2">
                {viralSuggestions.map((item) => (
                  <p
                    key={item}
                    className="rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-xs text-slate-300"
                  >
                    {item}
                  </p>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/25 bg-cyan-500/5 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {language === "fr" ? "Fun Lab" : "Fun Lab"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {language === "fr"
                      ? "Mode fun: punchlines auto, sticker burst, filtres visuels, miroir et export GIF."
                      : "Fun mode: auto punchlines, sticker burst, visual filters, mirror mode, and GIF export."}
                  </p>
                </div>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-100">
                  Dynamic
                </span>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-slate-100">
                    <MdTimer className="text-sm text-amber-300" />
                    {language === "fr" ? "Speedrun mode" : "Speedrun mode"}
                  </p>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${speedrunActive ? "bg-amber-500/20 text-amber-200" : "bg-slate-800 text-slate-300"}`}>
                    {speedrunClock}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  {speedrunConstraint ||
                    (language === "fr"
                      ? "Demarre un timer avec contrainte random."
                      : "Start a timed challenge with random constraint.")}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => startSpeedrun(30)}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-amber-400/60"
                  >
                    30s
                  </button>
                  <button
                    type="button"
                    onClick={() => startSpeedrun(60)}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-amber-400/60"
                  >
                    60s
                  </button>
                  <button
                    type="button"
                    onClick={stopSpeedrun}
                    disabled={!speedrunActive}
                    className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-rose-400/60 disabled:opacity-40"
                  >
                    {language === "fr" ? "Stop" : "Stop"}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/10 bg-slate-950/60 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-100">
                    {language === "fr" ? "Preset bundles" : "Preset bundles"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setWatermarkEnabled((prev) => !prev)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold transition ${
                      watermarkEnabled
                        ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100"
                        : "border-white/10 bg-slate-900/70 text-slate-200 hover:border-emerald-300/50"
                    }`}
                  >
                    {watermarkEnabled
                      ? language === "fr"
                        ? "Watermark ON"
                        : "Watermark ON"
                      : language === "fr"
                        ? "Watermark OFF"
                        : "Watermark OFF"}
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(["shitpost", "corporate", "gaming", "anime"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => applyBundlePreset(preset)}
                      className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-200 transition hover:border-cyan-400/60"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={randomPunchlineBlast}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-fuchsia-400/60"
                >
                  <MdCasino className="text-base" />
                  {language === "fr" ? "Punchline blast" : "Punchline blast"}
                </button>
                <button
                  type="button"
                  onClick={addStickerBurst}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-amber-400/60"
                >
                  <MdCelebration className="text-base" />
                  {language === "fr" ? "Sticker burst" : "Sticker burst"}
                </button>
                <button
                  type="button"
                  onClick={cycleImageFilter}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-cyan-400/60"
                >
                  <MdTune className="text-base" />
                  {language === "fr" ? "Cycle filtres" : "Cycle filters"}
                </button>
                <button
                  type="button"
                  onClick={toggleMirrorMode}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition ${
                    isMirrored
                      ? "border-rose-400/60 bg-rose-500/15 text-rose-100"
                      : "border-white/10 bg-slate-950/70 text-slate-100 hover:border-rose-400/60"
                  }`}
                >
                  <MdFlip className="text-base" />
                  {language === "fr" ? "Mode miroir" : "Mirror mode"}
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-100">
                    {language === "fr" ? "A/B variants lab" : "A/B variants lab"}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {language === "fr"
                      ? "Capture deux versions, recharge-les et exporte une planche comparative."
                      : "Capture two versions, reload them, and export a comparison board."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={exportVariantComparison}
                  disabled={!variantSlots.A || !variantSlots.B || isExportingVariants}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:border-fuchsia-400/60 disabled:opacity-40"
                >
                  {isExportingVariants
                    ? language === "fr"
                      ? "Export..."
                      : "Exporting..."
                    : language === "fr"
                      ? "Exporter A/B"
                      : "Export A/B"}
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {(["A", "B"] as VariantSlotKey[]).map((slot) => {
                  const variant = variantSlots[slot];
                  return (
                    <div
                      key={slot}
                      className="rounded-2xl border border-white/10 bg-slate-950/60 p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-slate-100">
                          Variant {slot}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {variant
                            ? new Date(variant.updatedAt).toLocaleTimeString()
                            : language === "fr"
                              ? "Vide"
                              : "Empty"}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400">
                        {variant
                          ? `${variant.snapshot.boxes.filter((box) => box.text.trim() !== "").length} text / ${variant.snapshot.stickers.length} stickers`
                          : language === "fr"
                            ? "Capture l'etat actuel pour le comparer."
                            : "Capture the current state to compare it."}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => saveVariant(slot)}
                          className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
                        >
                          {language === "fr" ? `Sauver ${slot}` : `Save ${slot}`}
                        </button>
                        <button
                          type="button"
                          onClick={() => loadVariant(slot)}
                          disabled={!variant}
                          className="rounded-full border border-white/10 bg-slate-900/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-cyan-400/60 disabled:opacity-40"
                        >
                          {language === "fr" ? `Charger ${slot}` : `Load ${slot}`}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {shareStatus && <p className="text-xs text-slate-300">{shareStatus}</p>}
              {!shareUrl ? (
                <p className="text-xs text-amber-200">{t("generator.shareTooLarge")}</p>
              ) : null}

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-100">{cloudTitle}</p>
                <button
                  type="button"
                  onClick={async () => {
                    setShowVersions((prev) => !prev);
                    if (!showVersions) {
                      await loadVersions();
                    }
                  }}
                  className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
                >
                  {showVersions ? t("generator.less") : t("generator.more")}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">{autosaveText}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={saveManualVersion}
                  disabled={!cloudMemeId}
                  className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60 disabled:opacity-40"
                >
                  {language === "fr" ? "Sauver version" : "Save version"}
                </button>
                <button
                  type="button"
                  onClick={loadVersions}
                  disabled={!cloudMemeId || isLoadingVersions}
                  className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-[11px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60 disabled:opacity-40"
                >
                  {isLoadingVersions
                    ? language === "fr"
                      ? "Chargement..."
                      : "Loading..."
                    : language === "fr"
                      ? "Rafraichir versions"
                      : "Refresh versions"}
                </button>
              </div>

              {showVersions && (
                <div className="mt-3 flex max-h-52 flex-col gap-2 overflow-y-auto pr-1">
                  {versions.length === 0 ? (
                    <p className="text-xs text-slate-400">
                      {language === "fr" ? "Aucune version cloud." : "No cloud versions yet."}
                    </p>
                  ) : (
                    versions.map((version) => (
                      <div
                        key={version.id}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-200"
                      >
                        <span className="truncate">
                          {version.version_label || version.change_source} -{" "}
                          {new Date(version.created_at).toLocaleString()}
                        </span>
                        <button
                          type="button"
                          onClick={() => restoreVersion(version.id)}
                          className="rounded-full border border-white/10 bg-slate-900/70 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:border-fuchsia-400/60"
                        >
                          {language === "fr" ? "Restaurer" : "Restore"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
              <p className="text-sm font-semibold text-slate-100">{aiTitle}</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input
                  value={aiTopic}
                  onChange={(event) => setAiTopic(event.target.value)}
                  placeholder={aiPlaceholder}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-100 outline-none"
                />
                <button
                  type="button"
                  onClick={generateAiCaptions}
                  disabled={isGeneratingAi}
                  className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:border-fuchsia-400/60 disabled:opacity-50"
                >
                  {aiButton}
                </button>
              </div>
              {aiStatus ? <p className="mt-2 text-xs text-slate-400">{aiStatus}</p> : null}
            </div>

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
