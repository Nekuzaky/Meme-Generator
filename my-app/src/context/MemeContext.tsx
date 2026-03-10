import { createContext, useContext, useState } from "react";
import { Box } from "../types/types";

interface ContextProps {
  boxes: Box[];
  changeBoxes: ({ index, ...params }: Box) => void;
  replaceBoxes: (nextBoxes: Box[]) => void;
  clearBoxes: () => void;
}

export const MemeContext = createContext({} as ContextProps);

export default function MemeProvider({ children }: any) {
  const [boxes, setBoxes] = useState<Box[]>([]);

  const sortBoxes = (a: Box, b: Box) => {
    if (a.index < b.index) return -1;
    if (a.index > b.index) return 1;
    return 0;
  };

  const changeBoxes = ({ index, ...params }: Box) => {
    setBoxes((prev) =>
      [
        ...prev.filter((box) => box.index !== index),
        { index, ...params },
      ].sort(sortBoxes)
    );
  };

  const replaceBoxes = (nextBoxes: Box[]) => {
    setBoxes([...nextBoxes].sort(sortBoxes));
  };

  const clearBoxes = () => {
    setBoxes([]);
  };

  return (
    <MemeContext.Provider
      value={{
        boxes,
        changeBoxes,
        replaceBoxes,
        clearBoxes,
      }}
    >
      {children}
    </MemeContext.Provider>
  );
}

export const useMeme = () => useContext(MemeContext);
