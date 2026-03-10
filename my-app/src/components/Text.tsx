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
    <div className="mr-0 w-full text-left md:mr-3">
      <div className="flex w-full flex-col items-start justify-start gap-4">
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
