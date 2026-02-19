import axios from "axios";
import { createContext, useContext, useEffect, useState } from "react";
import { Box, Meme } from "../types/types";

interface ContextProps {
  boxes: Box[];
  allMemes: Meme[];
  isLoading: boolean;
  isError: boolean;
  changeBoxes: ({ index, ...params }: Box) => void;
  replaceBoxes: (nextBoxes: Box[]) => void;
  removeBox: (index: number) => void;
  fetchMemes: () => Promise<void>;
  clearBoxes: () => void;
  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  filteredMemes: Meme[];
  setFilteredMemes: React.Dispatch<React.SetStateAction<Meme[]>>;
}

export const MemeContext = createContext({} as ContextProps);

export default function MemeProvider({ children }: any) {
  const [allMemes, setAllMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [boxes, setBoxes] = useState<Box[]>([]);
  const [query, setQuery] = useState("");
  const [filteredMemes, setFilteredMemes] = useState<Meme[]>([]);

  const API_ENDPOINT = "https://api.imgflip.com/get_memes";

  useEffect(() => {
    if (allMemes.length === 0) {
      fetchMemes();
    }
  }, []);

  useEffect(() => {
    setFilteredMemes(
      allMemes.filter((meme) => {
        const regex = new RegExp(query, "gi");
        return meme.name.match(regex);
      })
    );
  }, [query, allMemes]);

  const fetchMemes = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(API_ENDPOINT);
      const { data } = res.data;
      setAllMemes(data.memes);
      setIsLoading(false);
    } catch (err) {
      setIsError(true);
      setIsLoading(false);
    }
  };

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

  const removeBox = (index: number) => {
    setBoxes((prev) =>
      prev
        .filter((box) => box.index !== index)
        .sort(sortBoxes)
        .map((box, nextIndex) => ({ ...box, index: nextIndex }))
    );
  };

  const clearBoxes = () => {
    setBoxes([]);
  };

  return (
    <MemeContext.Provider
      value={{
        boxes,
        allMemes,
        isLoading,
        isError,
        changeBoxes,
        replaceBoxes,
        removeBox,
        fetchMemes,
        clearBoxes,
        query,
        setQuery,
        filteredMemes,
        setFilteredMemes,
      }}
    >
      {children}
    </MemeContext.Provider>
  );
}

export const useMeme = () => useContext(MemeContext);
