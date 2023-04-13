import { useEffect, useState } from "react";
import { useCaption } from "../context/CaptionContext";

interface IProps {
  type: "fill" | "border";
}

export default function Color({ type }: IProps) {
  const {
    state: { color, outline_color },
    setColor,
    setOutlineColor,
  } = useCaption();
  const [textColor, setTextColor] = useState("");

  useEffect(() => {
    if (type === "fill") {
      setTextColor(color);
    } else {
      setTextColor(outline_color);
    }
  }, [color, outline_color]);

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (type === "fill") {
      setColor(e.target.value);
    } else {
      setOutlineColor(e.target.value);
    }
  };

  return (
    <div className="flex items-center">
      <input
        type="color"
        className="h-7 w-7 bg-transparent"
        value={textColor}
        onChange={handleColorChange}
      />
    </div>
  );
}
