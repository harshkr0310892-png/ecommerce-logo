import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, ZoomIn, ZoomOut, RotateCw, X, ChevronLeft, ChevronRight } from "lucide-react";

interface PhotoViewerModalProps {
  photoUrls: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const PhotoViewerModal = ({ photoUrls, initialIndex = 0, onClose }: PhotoViewerModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);

  const currentPhotoUrl = photoUrls[currentIndex];

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = currentPhotoUrl;
    link.download = `contact-photo-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
  };

  const goToPrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : photoUrls.length - 1));
    handleReset();
  };

  const goToNext = () => {
    setCurrentIndex(prev => (prev < photoUrls.length - 1 ? prev + 1 : 0));
    handleReset();
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Modal header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">
            Photo {currentIndex + 1} of {photoUrls.length}
          </h3>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Photo container with navigation arrows */}
        <div className="flex-1 flex items-center justify-center overflow-hidden rounded-lg bg-black/20 relative">
          {/* Left arrow */}
          {photoUrls.length > 1 && (
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
            >
              <ChevronLeft className="w-8 h-8 text-yellow-400" />
            </button>
          )}

          <img
            ref={imgRef}
            src={currentPhotoUrl}
            alt={`Contact submission photo ${currentIndex + 1}`}
            className="max-w-full max-h-[70vh] object-contain"
            style={{
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease"
            }}
          />

          {/* Right arrow */}
          {photoUrls.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/30 hover:bg-black/50 rounded-full p-2 transition-colors"
            >
              <ChevronRight className="w-8 h-8 text-yellow-400" />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <Button variant="secondary" onClick={handleZoomIn} className="flex items-center gap-2">
            <ZoomIn className="w-4 h-4" />
            Zoom In
          </Button>
          <Button variant="secondary" onClick={handleZoomOut} className="flex items-center gap-2">
            <ZoomOut className="w-4 h-4" />
            Zoom Out
          </Button>
          <Button variant="secondary" onClick={handleRotate} className="flex items-center gap-2">
            <RotateCw className="w-4 h-4" />
            Rotate
          </Button>
          <Button variant="secondary" onClick={handleReset} className="flex items-center gap-2">
            Reset
          </Button>
          <Button variant="default" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
};