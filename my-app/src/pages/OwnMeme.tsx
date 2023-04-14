import { useState } from "react";
import { MdImage, MdInfo } from "react-icons/md";
import MemeGenerator from "../components/MemeGenerator";

export default function OwnMeme() {
  const [imageUrl, setImageUrl] = useState<string | null>("");
  const [imageName, setImageName] = useState("");
  const [imageLink, setImageLink] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const files = e.target.files;
    if (files) {
      setImageName(files[0].name);
      setImageUrl(URL.createObjectURL(files[0]));
    }
  };

  const handleImageLink = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageLink(e.target.value);
  };

  const resetState = () => {
    setImageUrl(null);
    setImageLink("");
    setImageName("");
  };

  return (
    <div className="container mx-auto mt-12">
     
    </div>
  );
}
