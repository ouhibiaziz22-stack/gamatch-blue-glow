import { useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface OptimizedImage {
  url: string;
  optimized?: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
}

interface ProductImageGalleryProps {
  images: OptimizedImage[];
  productName: string;
  rating?: number;
}

export function ProductImageGallery({
  images,
  productName,
  rating = 0,
}: ProductImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const currentImage = images[selectedIndex];
  const displayUrl = currentImage?.optimized?.large || currentImage?.url;
  const thumbnailUrl = currentImage?.optimized?.small || currentImage?.url;

  const handlePrevious = () => {
    setSelectedIndex(prev => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setSelectedIndex(prev => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePos({ x: x * 100, y: y * 100 });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious();
    if (e.key === 'ArrowRight') handleNext();
  };

  if (!images || images.length === 0) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg aspect-square flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">No images available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Image Viewer */}
      <div
        className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 group"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setIsZoomed(false)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        {/* Main Image */}
        <img
          src={displayUrl}
          alt={productName}
          className={`w-full h-full object-cover transition-transform duration-300 cursor-zoom-in ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          style={{
            transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
          }}
          onMouseEnter={() => setIsZoomed(true)}
        />

        {/* Rating Badge */}
        {rating > 0 && (
          <Badge className="absolute top-4 left-4 bg-yellow-500 text-white">
            ⭐ {rating}/5
          </Badge>
        )}

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevious}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </>
        )}

        {/* Zoom Indicator */}
        <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 text-white px-3 py-2 rounded-lg text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          <ZoomIn className="w-4 h-4" />
          Hover to zoom
        </div>

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-2 rounded-lg text-xs">
            {selectedIndex + 1} / {images.length}
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, idx) => {
            const thumbUrl = image?.optimized?.small || image?.url;
            return (
              <button
                key={idx}
                onClick={() => setSelectedIndex(idx)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === idx
                    ? 'border-primary ring-2 ring-primary/50'
                    : 'border-gray-300 dark:border-gray-700 hover:border-primary'
                }`}
                aria-label={`View image ${idx + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt={`${productName} ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Image Info */}
      <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs text-gray-600 dark:text-gray-400 space-y-1">
        <p>
          <strong>Format:</strong> WebP (optimized)
        </p>
        <p>
          <strong>Responsive Sizes:</strong> Mobile, Tablet, Desktop, 4K
        </p>
        <p>
          <strong>Navigation:</strong> Click arrows or press ← →
        </p>
      </div>
    </div>
  );
}
