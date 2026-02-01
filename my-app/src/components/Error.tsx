import { MdErrorOutline } from "react-icons/md";
import { useLanguage } from "../context/LanguageContext";

export default function Error() {
  const { t } = useLanguage();
  return (
    <div className="mt-10 flex items-center justify-center gap-3 text-lg font-medium text-rose-300">
      <MdErrorOutline className="text-lg" />
      <small>
        {t("error.generic")}
      </small>
    </div>
  );
}
