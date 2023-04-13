import { useEffect } from "react";
import { Rnd } from "react-rnd";
import { useMeme } from "../context/MemeContext";

interface IProps {
  image: string;
}

export default function ImageSection({ image }: IProps) {
  const { boxes, clearBoxes } = useMeme();

  const getTop = (index: number) => 70 * index;

  const getBorder = (color: string) =>
    ` 2px 0 0 ${color}, -2px 0 0 ${color}, 0 2px 0 ${color}, 0 -2px 0 ${color}, 1px 1px ${color}, -1px -1px 0 ${color}, 1px -1px 0 ${color}, -1px 1px 0 ${color}`;

  const getStyle = (
    outline_color: string,
    font_color: string,
    fontStyle: string,
    fontSize: number
  ) =>
    ({
      fontFamily: fontStyle,
      fontSize: `${fontSize}px`,
      textShadow: getBorder(outline_color),
      color: font_color,
      overflowWrap: "break-word",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    } as React.CSSProperties);

  useEffect(() => {
    return () => {
      clearBoxes();
    };
    // eslint-disable-next-line
  }, [image]);

  return (
    <div
      className="container relative mx-auto w-full md:w-11/12"
      id="downloadMeme"
    >
      <img
        src={image}
        alt="memeImage"
        className="relative object-contain w-full overflow-auto"
      />

      {boxes !== undefined &&
        boxes.map(
          ({ outline_color, color, fontFamily, fontSize, text }, index) => (
            <Rnd
              style={getStyle(outline_color, color, fontFamily, fontSize)}
              default={
                {
                  x: 20,
                  y: getTop(index),
                } as any
              }
              key={index}
              bounds="#downloadMeme"
            >
              {text}
            </Rnd>
          )
        )}
    </div>
  );
}
