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
    <div className="container mx-auto mt-6">
      <div className="flex flex-col items-center gap-10 md:px-16 px-5 py-5 md:py-10 bg-gray-200 md:flex-row justify-evenly md:items-start md:gap-20">
        {/* Image of the meme */}
        <div className="w-full md:w-1/2">
          <ImageSection image={imageUrl} />
        </div>

        {/* Editing tools */}
        <div className="w-full md:w-1/2">
          <div className="w-full md:mx-3">
            {boxes.map((_, index) => (
              <CaptionProvider key={index}>
                <Caption index={index} />
              </CaptionProvider>
            ))}

            <div className="flex flex-col items-center gap-5 md:flex-row md:items-start">
              <button
                className="w-full px-4 py-2 border border-primary rounded text-sm font-medium text-primary hover:text-paper tracking-wider md:w-auto"
                onClick={addBox}
              >
                Ajouter un texte
              </button>

              <button
                className="flex items-center justify-center w-full gap-3 px-4 py-2 tracking-wider text-sm text-white hover:bg-primary-dark bg-gradient-to-r  from-fuchsia-500 via-fuchsia-500 to-pink-500 md:w-auto focus:outline-none"
                onClick={downloadMeme}
              >
                <MdDownload className="text-white text-lg" />
                <h4>Télécharger le Meme</h4>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
