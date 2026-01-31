import { MdErrorOutline } from "react-icons/md";

export default function Error() {
  return (
    <div className="mt-10 flex items-center justify-center gap-3 text-lg font-medium text-rose-300">
      <MdErrorOutline className="text-lg" />
      <small>
        Try refreshing the page or checking your internet connection
      </small>
    </div>
  );
}
