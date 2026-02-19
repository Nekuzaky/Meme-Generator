import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useMeme } from "./MemeContext";
import type { Box } from "../types/types";

export interface Caption {
  text: string;
  color: string;
  outline_color: string;
  fontFamily: string;
  fontSize: number;
  effect: "none" | "arc" | "shake" | "outline" | "gradient";
}

interface ContextProps {
  state: Caption;
  setText: (text: string) => void;
  setColor: (color: string) => void;
  setOutlineColor: (outline_color: string) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
  setEffect: (effect: Caption["effect"]) => void;
}

const TEXT = "TEXT";
const COLOR = "COLOR";
const OUTLINE_COLOR = "OUTLINE_COLOR";
const FONT_FAMILY = "FONT_FAMILY";
const FONT_SIZE = "FONT_SIZE";
const EFFECT = "EFFECT";
const RESET = "RESET";

const captionReducer = (state: Caption, action: any) => {
  const { type, payload } = action;
  switch (type) {
    case TEXT:
      return { ...state, text: payload };
    case COLOR:
      return { ...state, color: payload };
    case OUTLINE_COLOR:
      return { ...state, outline_color: payload };
    case FONT_FAMILY:
      return { ...state, fontFamily: payload };
    case FONT_SIZE:
      return { ...state, fontSize: payload };
    case EFFECT:
      return { ...state, effect: payload };
    case RESET:
      return { ...payload };
    default:
      return state;
  }
};

const initialState: Caption = {
  text: "",
  color: "#ffffff",
  outline_color: "#222222",
  fontFamily: "impact",
  fontSize: 50,
  effect: "none",
};

const toCaptionState = (box?: Partial<Box>): Caption => ({
  text: box?.text ?? initialState.text,
  color: box?.color ?? initialState.color,
  outline_color: box?.outline_color ?? initialState.outline_color,
  fontFamily: box?.fontFamily ?? initialState.fontFamily,
  fontSize: box?.fontSize ?? initialState.fontSize,
  effect: box?.effect ?? initialState.effect,
});

const CaptionContext = createContext({} as ContextProps);

interface CaptionProviderProps {
  children: React.ReactNode;
  index: number;
}

export default function CaptionProvider({ children, index }: CaptionProviderProps) {
  const { boxes } = useMeme();
  const boxForIndex = useMemo(
    () => boxes.find((item) => item.index === index),
    [boxes, index]
  );
  const [state, dispatch] = useReducer(captionReducer, toCaptionState(boxForIndex));

  useEffect(() => {
    const nextState = toCaptionState(boxForIndex);
    const hasDiff =
      state.text !== nextState.text ||
      state.color !== nextState.color ||
      state.outline_color !== nextState.outline_color ||
      state.fontFamily !== nextState.fontFamily ||
      state.fontSize !== nextState.fontSize ||
      state.effect !== nextState.effect;
    if (hasDiff) {
      dispatch({ type: RESET, payload: nextState });
    }
    // Keep local typing smooth: only resync when the source box changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxForIndex]);

  const setText = (text: string) => {
    dispatch({ type: TEXT, payload: text });
  };
  const setColor = (color: string) => {
    dispatch({ type: COLOR, payload: color });
  };
  const setOutlineColor = (outline_color: string) => {
    dispatch({ type: OUTLINE_COLOR, payload: outline_color });
  };
  const setFontFamily = (font: string) => {
    dispatch({ type: FONT_FAMILY, payload: font });
  };
  const setFontSize = (size: number) => {
    dispatch({ type: FONT_SIZE, payload: size });
  };
  const setEffect = (effect: Caption["effect"]) => {
    dispatch({ type: EFFECT, payload: effect });
  };

  return (
    <CaptionContext.Provider
      value={{
        state,
        setText,
        setColor,
        setOutlineColor,
        setFontFamily,
        setFontSize,
        setEffect,
      }}
    >
      {children}
    </CaptionContext.Provider>
  );
}

export const useCaption = () => useContext(CaptionContext);
