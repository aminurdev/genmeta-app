import { ImageProvider } from "@/components/context/image-context";
import { ImageGrid } from "@/components/image-grid";
import React from "react";

const Generate = () => {
  return (
    <ImageProvider>
      <div className="min-h-screen bg-background">
        <ImageGrid />
      </div>
    </ImageProvider>
  );
};

export default Generate;
