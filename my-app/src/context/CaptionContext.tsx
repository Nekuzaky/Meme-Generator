import { createContext, useContext, useReducer } from "react";

export interface Caption {
  text: string;
  color: string;
  outline_color: string;
  fontFamily: string;
  fontSize: number;
}

interface ContextProps {
  state: Caption;
  setText: (text: string) => void;
  setColor: (color: string) => void;
  setOutlineColor: (outline_color: string) => void;
  setFontFamily: (font: string) => void;
  setFontSize: (size: number) => void;
}

const TEXT = "TEXT";
const COLOR = "COLOR";
const OUTLINE_COLOR = "OUTLINE_COLOR";
const FONT_FAMILY = "FONT_FAMILY";
const FONT_SIZE = "FONT_SIZE";

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
    default:
      return state;
  }
};

const initialState = {
  text: "",
  color: "#ffffff",
  outline_color: "#222222",
  fontFamily: "impact",
  fontSize: 50,
};

const CaptionContext = createContext({} as ContextProps);

export default function CaptionProvider({ children }: any) {
  const [state, dispatch] = useReducer(captionReducer, initialState);

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

  return (
    <CaptionContext.Provider
      value={{
        state,
        setText,
        setColor,
        setOutlineColor,
        setFontFamily,
        setFontSize,
      }}
    >
      {children}
    </CaptionContext.Provider>
  );
}

export const useCaption = () => useContext(CaptionContext);
