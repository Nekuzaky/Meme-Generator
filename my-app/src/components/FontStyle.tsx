import { useEffect, useRef, useState } from "react";
import { BiFont } from "react-icons/bi";
import { fontStyles } from "../constants/constants";
import { useCaption } from "../context/CaptionContext";

export default function FontStyle() {
  const { setFontFamily, setFontSize, state } = useCaption();
  const { fontSize, fontFamily } = state;
  const [isOpen, setIsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleDropDown = () => {
    setIsOpen((prevState) => !prevState);
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFontFamily(e.target.value);
  };

  const fontOptions = fontStyles.map((fontStyle, index) => (
    <option key={index} value={fontStyle}>
      {fontStyle}
    </option>
  ));

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFontSize(parseInt(e.target.value));
  };

  return (
    <div className="relative">
      <button
        onClick={handleDropDown}
        className="flex items-center justify-center"
      >
        <BiFont className="text-fuchsia-400 text-2xl" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute z-50 right-0 mt-2 rounded-xl border border-white/10 bg-slate-900/90 px-5 py-5 text-slate-100 shadow-xl shadow-fuchsia-500/10"
        >
          <div className="flex flex-col items-start">
            <span className="text-sm text-slate-300">Font Family</span>
            <select
              value={fontFamily}
              onChange={handleFontFamilyChange}
              className="mt-1 cursor-pointer rounded border border-white/10 bg-slate-950 px-2 py-1 text-sm text-slate-100 focus:outline-none focus:border-fuchsia-400/80"
            >
              {fontOptions}
            </select>
          </div>

          <div className="mt-5 flex flex-col items-start">
            <span className="text-sm text-slate-300">Font Size</span>
            <input
              type="range"
              min="10"
              max="50"
              value={fontSize}
              className="mt-2 w-full cursor-pointer accent-fuchsia-400"
              onChange={handleFontSizeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
