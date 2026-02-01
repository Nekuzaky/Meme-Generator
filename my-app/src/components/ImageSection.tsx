import { useEffect } from "react";
import { Rnd } from "react-rnd";
import { useMeme } from "../context/MemeContext";
import { useLanguage } from "../context/LanguageContext";
import type { TextEffect } from "../types/types";

interface IProps {
  image: string;
  textLayers?: { id: string; index: number; locked: boolean; zIndex: number }[];
  selectedLayer?:
    | { type: "text"; id: string; index: number }
    | { type: "sticker"; id: string }
    | null;
  stickers?: {
    id: string;
    emoji?: string;
    src?: string;
    kind: "emoji" | "image";
    x: number;
    y: number;
    size: number;
    locked: boolean;
    zIndex: number;
  }[];
  onStickerChange?: (id: string, position: { x: number; y: number }, size: number) => void;
  onSelectText?: (index: number) => void;
  onSelectSticker?: (id: string) => void;
  grid?: [number, number];
}

export default function ImageSection({
  image,
  textLayers = [],
  stickers = [],
  selectedLayer,
  onStickerChange,
  onSelectText,
  onSelectSticker,
  grid,
}: IProps) {
  const { t } = useLanguage();
  const { boxes, clearBoxes } = useMeme();

  const getTop = (index: number) => 70 * index;

  const getBorder = (color: string, thickness = 2) => {
    const t = thickness;
    const s = Math.max(1, Math.round(thickness / 2));
    return `${t}px 0 0 ${color}, -${t}px 0 0 ${color}, 0 ${t}px 0 ${color}, 0 -${t}px 0 ${color}, ${s}px ${s}px ${color}, -${s}px -${s}px 0 ${color}, ${s}px -${s}px 0 ${color}, -${s}px ${s}px 0 ${color}`;
  };

  const getStyle = (
    outline_color: string,
    font_color: string,
    fontStyle: string,
    fontSize: number,
    effect: TextEffect
  ) => {
    const isGradient = effect === "gradient";
    const isOutline = effect === "outline";
    return {
      fontFamily: fontStyle,
      fontSize: `${fontSize}px`,
      textShadow: getBorder(outline_color, isOutline ? 4 : 2),
      color: isGradient ? "transparent" : font_color,
      backgroundImage: isGradient
        ? "linear-gradient(90deg, #f472b6, #a78bfa, #22d3ee, #facc15)"
        : undefined,
      WebkitBackgroundClip: isGradient ? "text" : undefined,
      backgroundClip: isGradient ? "text" : undefined,
      overflowWrap: "break-word",
      whiteSpace: "pre-wrap",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    } as React.CSSProperties;
  };

  const renderArcText = (text: string) => {
    const chars = text.split("");
    const mid = (chars.length - 1) / 2;
    return (
      <span className="flex items-end justify-center">
        {chars.map((char, index) => {
          const offset = index - mid;
          const rotate = offset * 6;
          const translateY = Math.abs(offset) * -2;
          return (
            <span
              key={`${char}-${index}`}
              style={{
                display: "inline-block",
                transform: `translateY(${translateY}px) rotate(${rotate}deg)`,
              }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          );
        })}
      </span>
    );
  };

  useEffect(() => {
    return () => {
      clearBoxes();
    };
    // eslint-disable-next-line
  }, [image]);

  return (
    <div
      className="relative mx-auto w-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 shadow-lg shadow-fuchsia-500/10"
      id="downloadMeme"
    >
      <img
        src={image}
        alt={t("image.alt")}
        className="relative h-full w-full object-contain"
      />

      {boxes !== undefined &&
        boxes.map(
          ({ outline_color, color, fontFamily, fontSize, text, effect }, index) => {
            const layer = textLayers.find((item) => item.index === index);
            const isLocked = layer?.locked ?? false;
            const isSelected = selectedLayer?.type === "text" && selectedLayer.index === index;
            return (
              <Rnd
                style={{
                  ...getStyle(outline_color, color, fontFamily, fontSize, effect),
                  zIndex: layer?.zIndex ?? 1,
                  outline: isSelected ? "2px solid rgba(244,114,182,0.6)" : undefined,
                }}
                default={
                  {
                    x: 20,
                    y: getTop(index),
                  } as any
                }
                key={index}
                bounds="#downloadMeme"
                disableDragging={isLocked}
                enableResizing={!isLocked}
                dragGrid={grid}
                resizeGrid={grid}
                onClick={() => onSelectText?.(index)}
              >
                <span className={effect === "shake" ? "text-shake" : undefined}>
                  {effect === "arc" ? renderArcText(text) : text}
                </span>
              </Rnd>
            );
          }
        )}

      {stickers.map((sticker) => (
        <Rnd
          key={sticker.id}
          bounds="#downloadMeme"
          size={{ width: sticker.size, height: sticker.size }}
          position={{ x: sticker.x, y: sticker.y }}
          onDragStop={(_, data) =>
            onStickerChange?.(sticker.id, { x: data.x, y: data.y }, sticker.size)
          }
          onResizeStop={(_, __, ref, ___, position) =>
            onStickerChange?.(
              sticker.id,
              { x: position.x, y: position.y },
              ref.offsetWidth
            )
          }
          lockAspectRatio
          enableResizing={!sticker.locked}
          disableDragging={sticker.locked}
          style={{
            zIndex: sticker.zIndex,
            outline:
              selectedLayer?.type === "sticker" && selectedLayer.id === sticker.id
                ? "2px solid rgba(244,114,182,0.6)"
                : undefined,
          }}
          dragGrid={grid}
          resizeGrid={grid}
          onClick={() => onSelectSticker?.(sticker.id)}
        >
          <div className="flex h-full w-full items-center justify-center">
            {sticker.kind === "image" && sticker.src ? (
              <img
                src={sticker.src}
                alt="sticker"
                className="h-full w-full object-contain"
              />
            ) : (
              <span className="text-3xl">{sticker.emoji}</span>
            )}
          </div>
        </Rnd>
      ))}
    </div>
  );
}
