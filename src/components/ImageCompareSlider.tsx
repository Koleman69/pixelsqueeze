import { useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Maximize2, Minimize2 } from "lucide-react";

interface ImageCompareSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
  beforeSize?: string;
  afterSize?: string;
  compressionRatio?: number;
  className?: string;
  compact?: boolean;
}

export const ImageCompareSlider = ({ 
  beforeImage, 
  afterImage, 
  beforeLabel = "Original",
  afterLabel = "Optimized",
  beforeSize,
  afterSize,
  compressionRatio,
  className = "",
  compact = false
}: ImageCompareSliderProps) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percentage = Math.max(2, Math.min((x / rect.width) * 100, 98));
    setSliderPosition(percentage);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    handleMove(e.clientX);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    handleMove(e.touches[0].clientX);
  }, [handleMove]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  }, [isDragging, handleMove]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Handle global mouse events for smooth dragging
  const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  }, [isDragging, handleMove]);

  const handleGlobalMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Add/remove global listeners
  useState(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleGlobalMouseMove);
        window.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  });

  const aspectClass = isExpanded ? "aspect-[4/3]" : compact ? "aspect-video" : "aspect-video";

  return (
    <div className={`relative rounded-lg overflow-hidden bg-muted ${className}`}>
      {/* Expand button */}
      {!compact && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute top-2 right-2 z-20 p-1.5 rounded-md bg-background/80 hover:bg-background text-foreground transition-colors"
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      )}

      <div 
        ref={containerRef}
        className={`relative w-full ${aspectClass} cursor-col-resize select-none touch-none overflow-hidden transition-all duration-300`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* After/Optimized Image (Background - full) */}
        <img
          src={afterImage}
          alt={afterLabel}
          className="absolute inset-0 w-full h-full object-contain bg-muted"
          draggable={false}
        />
        
        {/* Before/Original Image (Clipped) */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={beforeImage}
            alt={beforeLabel}
            className="absolute inset-0 w-full h-full object-contain bg-muted"
            draggable={false}
          />
        </div>

        {/* Labels */}
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="bg-background/80 text-foreground text-xs backdrop-blur-sm">
            {beforeLabel}
            {beforeSize && <span className="ml-1 opacity-70">({beforeSize})</span>}
          </Badge>
        </div>
        
        <div className="absolute top-2 z-10" style={{ right: `calc(${100 - sliderPosition}% + 8px)` }}>
          {sliderPosition > 30 && (
            <Badge className="bg-primary text-primary-foreground text-xs">
              {afterLabel}
              {afterSize && <span className="ml-1 opacity-80">({afterSize})</span>}
              {compressionRatio !== undefined && compressionRatio > 0 && (
                <span className="ml-1 text-green-300">-{compressionRatio}%</span>
              )}
            </Badge>
          )}
        </div>

        {/* Slider Line */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white/90 shadow-lg z-10 transition-shadow"
          style={{ 
            left: `${sliderPosition}%`,
            boxShadow: isDragging ? '0 0 10px rgba(255,255,255,0.5)' : 'none'
          }}
        >
          {/* Slider Handle */}
          <div 
            className={`
              absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
              ${compact ? 'w-8 h-8' : 'w-10 h-10'} 
              bg-white rounded-full shadow-xl flex items-center justify-center 
              cursor-col-resize border-2 border-primary
              transition-transform duration-150
              ${isDragging ? 'scale-110' : 'hover:scale-105'}
            `}
          >
            <GripVertical className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-primary`} />
          </div>
        </div>

        {/* Percentage indicator */}
        {isDragging && (
          <div 
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10"
          >
            <Badge variant="secondary" className="bg-background/90 text-xs font-mono backdrop-blur-sm">
              {Math.round(sliderPosition)}% / {Math.round(100 - sliderPosition)}%
            </Badge>
          </div>
        )}

        {/* Instruction hint (shows briefly) */}
        {!isDragging && sliderPosition === 50 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 animate-pulse">
            <Badge variant="outline" className="bg-background/70 text-xs backdrop-blur-sm">
              ← Drag to compare →
            </Badge>
          </div>
        )}
      </div>
    </div>
  );
};
