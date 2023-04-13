import { useCaption } from "../context/CaptionContext";

interface IProps {
  index: number;
}

export default function Text({ index }: IProps) {
  const { state, setText } = useCaption();

  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
  };

  return (
    <div className="w-full mr-3 text-left">
      <div className="flex flex-col items-start justify-start w-full gap-5">
        <input
          type="text"
          value={state.text}
          className="border-0 border-b-2 border-gray-400 text-primary-dark py-1 bg-transparent w-full focus:outline-none focus:border-primary"
          placeholder={`Text ${index + 1}`}
          onChange={handleCaptionChange}
        />
      </div>
    </div>
  );
}
