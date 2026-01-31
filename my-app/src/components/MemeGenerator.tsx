import { MdDownload } from "react-icons/md";
import domtoimage from "dom-to-image";
import { saveAs } from "file-saver";
import { useState } from "react";
import CaptionProvider from "../context/CaptionContext";
import Caption from "./Caption";
import ImageSection from "./ImageSection";

interface IProps {
  imageUrl: string;
  box_count: number;
  imageName: string;
}

export default function MemeGenerator({
  imageUrl,
  box_count,
  imageName,
}: IProps) {
  const [boxesCount, setBoxesCount] = useState(box_count);

  let boxes = [];
  for (let i = 1; i <= boxesCount; i++) {
    boxes.push(i);
  }

  const downloadMeme = async () => {
    let node = document.getElementById("downloadMeme");
    if (node) {
      const blob = await domtoimage.toBlob(node);
      saveAs(blob, imageName);
    }
  };

  const addBox = () => {
    setBoxesCount((prevCount) => prevCount + 1);
  };


  return (
    <div className="glass-card w-full p-6 md:p-8">
      <div className="flex flex-col gap-8 md:flex-row md:items-start">
        <div className="w-full md:w-1/2">
          <ImageSection image={imageUrl} />
        </div>

        <div className="w-full md:w-1/2">
          <div className="space-y-6">
            <div className="space-y-4">
              {boxes.map((_, index) => (
                <CaptionProvider key={index}>
                  <Caption index={index} />
                </CaptionProvider>
              ))}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="w-full rounded-xl border border-white/10 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-slate-100 shadow-sm transition hover:border-fuchsia-400/60 hover:text-white sm:w-auto"
                onClick={addBox}
              >
                Ajouter un texte
              </button>

              <button
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-fuchsia-500 to-rose-500 px-4 py-2 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl sm:w-auto"
                onClick={downloadMeme}
              >
                <MdDownload className="text-lg" />
                Télécharger
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
