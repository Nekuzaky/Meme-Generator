import { useEffect, useState } from "react";
import { useCaption } from "../context/CaptionContext";
import { useMeme } from "../context/MemeContext";
import { useLanguage } from "../context/LanguageContext";
import { stylePresets } from "../constants/constants";
import Color from "./Color";
import FontStyle from "./FontStyle";
import Text from "./Text";

interface IProps {
  index: number;
  onRemove?: () => void;
  canRemove?: boolean;
}

export default function Caption({ index, onRemove, canRemove = false }: IProps) {
  const { t } = useLanguage();
  const { changeBoxes } = useMeme();
  const {
    state,
    setColor,
    setOutlineColor,
    setFontFamily,
    setFontSize,
    setEffect,
  } = useCaption();
  const [palette, setPalette] = useState<{ fill: string[]; outline: string[] }>({
    fill: [],
    outline: [],
  });

  useEffect(() => {
    changeBoxes({ ...state, index });
    // eslint-disable-next-line
  }, [state]);

  useEffect(() => {
    const raw = localStorage.getItem("meme-creator-palette");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { fill: string[]; outline: string[] };
      setPalette({
        fill: parsed.fill ?? [],
        outline: parsed.outline ?? [],
      });
    } catch {
      setPalette({ fill: [], outline: [] });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("meme-creator-palette", JSON.stringify(palette));
  }, [palette]);

  const applyPreset = (preset: (typeof stylePresets)[number]) => {
    setFontFamily(preset.fontFamily);
    setFontSize(preset.fontSize);
    setColor(preset.color);
    setOutlineColor(preset.outline_color);
  };

  const saveFill = () => {
    setPalette((prev) => ({
      ...prev,
      fill: Array.from(new Set([state.color, ...prev.fill])).slice(0, 8),
    }));
  };

  const saveOutline = () => {
    setPalette((prev) => ({
      ...prev,
      outline: Array.from(new Set([state.outline_color, ...prev.outline])).slice(0, 8),
    }));
  };

  return (
    <div className="container mb-10 flex flex-col items-start justify-start">
      <div className="mb-3 flex w-full items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("layers.text", { index: index + 1 })}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200 transition hover:border-rose-400/70 hover:text-white"
          >
            {t("generator.removeText")}
          </button>
        )}
      </div>
      <div className="flex w-full flex-wrap items-center gap-3 md:w-4/5 md:flex-nowrap md:gap-5">
        <Text index={index} />
        <Color type="fill" />
        <Color type="border" />
        <FontStyle />
      </div>

      <div className="mt-4 flex w-full flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("caption.presets")}
        </span>
        {stylePresets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => applyPreset(preset)}
            className="rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-fuchsia-400/70 hover:text-white"
            type="button"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex w-full items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("caption.effect")}
        </span>
        <select
          value={state.effect}
          onChange={(e) => setEffect(e.target.value as typeof state.effect)}
          className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-fuchsia-400/80"
        >
          <option value="none">{t("caption.effect.none")}</option>
          <option value="arc">{t("caption.effect.arc")}</option>
          <option value="shake">{t("caption.effect.shake")}</option>
          <option value="outline">{t("caption.effect.outline")}</option>
          <option value="gradient">{t("caption.effect.gradient")}</option>
        </select>
      </div>

      <div className="mt-4 flex w-full flex-col gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {t("palette.title")}
        </span>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-slate-400">{t("palette.fill")}</span>
          {palette.fill.map((color) => (
            <button
              key={`fill-${color}`}
              type="button"
              onClick={() => setColor(color)}
              className="h-5 w-5 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          ))}
          <button
            type="button"
            onClick={saveFill}
            className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
          >
            {t("palette.save")}
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className="text-slate-400">{t("palette.outline")}</span>
          {palette.outline.map((color) => (
            <button
              key={`outline-${color}`}
              type="button"
              onClick={() => setOutlineColor(color)}
              className="h-5 w-5 rounded-full border border-white/10"
              style={{ backgroundColor: color }}
              aria-label={color}
            />
          ))}
          <button
            type="button"
            onClick={saveOutline}
            className="rounded-full border border-white/10 bg-slate-950/70 px-2 py-1 text-[10px] font-semibold text-slate-200"
          >
            {t("palette.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
