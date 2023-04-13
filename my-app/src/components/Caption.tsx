import { useEffect } from "react";
import { useCaption } from "../context/CaptionContext";
import { useMeme } from "../context/MemeContext";
import Color from "./Color";
import FontStyle from "./FontStyle";
import Text from "./Text";

interface IProps {
  index: number;
}

export default function Caption({ index }: IProps) {
  const { changeBoxes } = useMeme();
  const { state } = useCaption();

  useEffect(() => {
    changeBoxes({ ...state, index });
    // eslint-disable-next-line
  }, [state]);

  return (
    <div className="container flex flex-col items-start justify-start mb-10">
      <div className="flex md:w-4/5 items-center w-full gap-3 md:gap-5">
        <Text index={index} />
        <Color type="fill" />
        <Color type="border" />
        <FontStyle />
      </div>
    </div>
  );
}
