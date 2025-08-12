import React, { useState, useEffect } from "react";
import axios from "axios";

interface Props {
    setPhotoUrl: (url: string) => void;
    selectedUrl: string | null;
    images: { secure_url: string }[];
}

const PhotoSearch: React.FC<Props> = ({ setPhotoUrl, selectedUrl, images }) => {
    const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  
    const handleSelectImage = (url: string) => {
      if (url === selectedUrl) {
        setPhotoUrl("");
      } else {
        setPhotoUrl(url);
      }
    };
  
    const allImages = uploadedImageUrl
      ? [{ secure_url: uploadedImageUrl }, ...images]
      : images;
  
    return (
      <div className="w-full space-y-2">
        {allImages.length > 0 ? (
          <div className="flex gap-4 mt-2">
            {allImages.map((img, idx) => {
              const isSelected = img.secure_url === selectedUrl;
              return (
                <div
                  key={idx}
                  className={`relative rounded-md cursor-pointer transition   ${
                    isSelected ? "ring-2 ring-blue-500" : "hover:ring-1 hover:ring-gray-400"
                  }`}
                  onClick={() => handleSelectImage(img.secure_url)}
                >
                  <img
                    src={img.secure_url}
                    alt={`Result ${idx}`}
                    className="w-24 h-24 object-cover"
                  />
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="absolute top-1 right-1 w-4 h-4 accent-blue-600 bg-white rounded border border-gray-300 shadow pointer-events-none"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-sm text-gray-400">No images found</p>
        )}
      </div>
    );
  };
  

export default PhotoSearch;