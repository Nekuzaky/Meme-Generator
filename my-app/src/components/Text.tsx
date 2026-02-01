import { useCaption } from "../context/CaptionContext";
import { useLanguage } from "../context/LanguageContext";

interface IProps {
  index: number;
}

export default function Text({ index }: IProps) {
  const { t } = useLanguage();
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
          className="w-full border-0 border-b-2 border-slate-600 bg-transparent py-1 text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-fuchsia-400"
          placeholder={t("text.placeholder", { index: index + 1 })}
          onChange={handleCaptionChange}
        />
      </div>
    </div>
  );
}
