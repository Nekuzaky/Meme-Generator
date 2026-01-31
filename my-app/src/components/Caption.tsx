import { useEffect } from "react";
import { useCaption } from "../context/CaptionContext";
import { useMeme } from "../context/MemeContext";
import { stylePresets } from "../constants/constants";
import Color from "./Color";
import FontStyle from "./FontStyle";
import Text from "./Text";

interface IProps {
  index: number;
}

export default function Caption({ index }: IProps) {
  const { changeBoxes } = useMeme();
  const {
    state,
    setColor,
    setOutlineColor,
    setFontFamily,
    setFontSize,
    setEffect,
  } = useCaption();

  useEffect(() => {
    changeBoxes({ ...state, index });
    // eslint-disable-next-line
  }, [state]);

  const applyPreset = (preset: (typeof stylePresets)[number]) => {
    setFontFamily(preset.fontFamily);
    setFontSize(preset.fontSize);
    setColor(preset.color);
    setOutlineColor(preset.outline_color);
  };

  return (
    <div className="container mb-10 flex flex-col items-start justify-start">
      <div className="flex w-full items-center gap-3 md:w-4/5 md:gap-5">
        <Text index={index} />
        <Color type="fill" />
        <Color type="border" />
        <FontStyle />
      </div>

      <div className="mt-4 flex w-full flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Presets
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
          Effet
        </span>
        <select
          value={state.effect}
          onChange={(e) => setEffect(e.target.value as typeof state.effect)}
          className="rounded-lg border border-white/10 bg-slate-950 px-2 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-fuchsia-400/80"
        >
          <option value="none">Aucun</option>
          <option value="arc">Arc</option>
          <option value="shake">Shake</option>
          <option value="outline">Contour épais</option>
          <option value="gradient">Dégradé</option>
        </select>
      </div>
    </div>
  );
}
