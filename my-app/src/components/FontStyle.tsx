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
        <BiFont className="text-primary text-2xl" />
      </button>

      {isOpen && (
        <div
          ref={menuRef}
          className="absolute z-50 px-5 right-0 py-5 bg-zinc-300 rounded-md mt-1"
        >
          <div className="flex flex-col items-start">
            <span>Font Family</span>
            <select
              value={fontFamily}
              onChange={handleFontFamilyChange}
              className="px-1 mt-1 text-sm bg-gray-100 border-2 border-gray-400 rounded cursor-pointer focus:outline-none"
            >
              {fontOptions}
            </select>
          </div>

          <div className="mt-5 flex flex-col items-start">
            <span>Font Size</span>
            <input
              type="range"
              min="10"
              max="50"
              value={fontSize}
              className="cursor-pointer mt-1 w-full"
              onChange={handleFontSizeChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
