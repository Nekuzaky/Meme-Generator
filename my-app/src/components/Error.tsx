import { MdErrorOutline } from "react-icons/md";

export default function Error() {
  return (
    <div className="mt-10 font-medium flex gap-3 justify-center items-center text-lg text-red-600 ">
      <MdErrorOutline className="text-lg" />
      <small>
        Try refreshing the page or checking your internet connection
      </small>
    </div>
  );
}
