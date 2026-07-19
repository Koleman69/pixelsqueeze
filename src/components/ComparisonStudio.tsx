import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────────────────

export type VariantKey =
  | "original"
  | "optimized"
  | "sharpened"
  | "upscaled"
  | "print"
  | "web"
  | "social";

export interface ComparisonVariant {
  key: VariantKey;
  label: string;
  url: string;
  /** Optional short caption shown under the label chip */
  meta?: string;
}

interface ComparisonStudioProps {
  variants: ComparisonVariant[];
  title?: string;
  description?: string;
  /** Optional starting variants (defaults: first two in the list). */
  initialLeft?: VariantKey;
  initialRight?: VariantKey;
  /** Container aspect ratio (fallbacks to 16/9). */
  aspectRatio?: number;
  className?: string;
}

// ─── Component ─────────────────────────────────────────────────────────────

const VARIANT_ORDER: VariantKey[] = [
  "original",
  "optimized",
  "sharpened",
  "upscaled",
  "print",
  "web",
  "social",
];

export const ComparisonStudio = ({
  variants,
  title = "Before & After",
  description = "Drag the slider, pinch or scroll to zoom, and switch versions instantly.",
  initialLeft,
  initialRight,
  aspectRatio = 16 / 9,
  className,
}: ComparisonStudioProps) => {
  // Sort variants for consistent chip order.
  const sortedVariants = useMemo(
    () =>
      [...variants].sort(
        (a, b) => VARIANT_ORDER.indexOf(a.key) - VARIANT_ORDER.indexOf(b.key)
      ),
    [variants]
  );

  const [leftKey, setLeftKey] = useState<VariantKey>(
    initialLeft ?? sortedVariants[0]?.key
  );
  const [rightKey, setRightKey] = useState<VariantKey>(
    initialRight ?? sortedVariants[1]?.key ?? sortedVariants[0]?.key
  );

  const leftVariant = sortedVariants.find((v) => v.key === leftKey) ?? sortedVariants[0];
  const rightVariant =
    sortedVariants.find((v) => v.key === rightKey) ?? sortedVariants[1] ?? sortedVariants[0];

  const [sliderPct, setSliderPct] = useState(50);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedKeys, setLoadedKeys] = useState<Set<VariantKey>>(new Set());

  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const dragMode = useRef<"none" | "slider" | "pan">("none");
  const lastPointer = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pinchState = useRef<{ dist: number; zoom: number } | null>(null);

  // ─── Fullscreen ─────────────────────────────────────────────────────────
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // ─── Slider position from pointer ───────────────────────────────────────
  const updateSliderFromClientX = (clientX: number) => {
    const rect = stageRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderPct((x / rect.width) * 100);
  };

  // ─── Pointer handlers (unified mouse + touch + pen) ─────────────────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    lastPointer.current = { x: e.clientX, y: e.clientY };
    if (zoom > 1.02) {
      dragMode.current = "pan";
    } else {
      dragMode.current = "slider";
      updateSliderFromClientX(e.clientX);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragMode.current === "none") return;
    if (dragMode.current === "slider") {
      updateSliderFromClientX(e.clientX);
    } else if (dragMode.current === "pan") {
      const dx = e.clientX - lastPointer.current.x;
      const dy = e.clientY - lastPointer.current.y;
      lastPointer.current = { x: e.clientX, y: e.clientY };
      setPan((prev) => clampPan(prev.x + dx, prev.y + dy, zoom, stageRef.current));
    }
  };

  const endPointer = () => {
    dragMode.current = "none";
  };

  // ─── Wheel zoom ─────────────────────────────────────────────────────────
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!e.ctrlKey && !e.metaKey && Math.abs(e.deltaY) < 8) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.0025;
    setZoom((z) => clampZoom(z + delta * z));
  };

  // ─── Pinch zoom (touch) ─────────────────────────────────────────────────
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      pinchState.current = {
        dist: touchDistance(e.touches),
        zoom,
      };
    }
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && pinchState.current) {
      e.preventDefault();
      const dist = touchDistance(e.touches);
      const ratio = dist / pinchState.current.dist;
      setZoom(clampZoom(pinchState.current.zoom * ratio));
    }
  };
  const handleTouchEnd = () => {
    pinchState.current = null;
  };

  // ─── Keyboard ───────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowLeft") setSliderPct((p) => Math.max(0, p - 4));
    if (e.key === "ArrowRight") setSliderPct((p) => Math.min(100, p + 4));
    if (e.key === "+" || e.key === "=") setZoom((z) => clampZoom(z + 0.2));
    if (e.key === "-") setZoom((z) => clampZoom(z - 0.2));
    if (e.key === "0") {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
    if (e.key.toLowerCase() === "f") toggleFullscreen();
  };

  // Reset pan whenever zoom returns to 1
  useEffect(() => {
    if (zoom <= 1.02) setPan({ x: 0, y: 0 });
  }, [zoom]);

  const markLoaded = (key: VariantKey) =>
    setLoadedKeys((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });

  const swapSides = () => {
    setLeftKey(rightKey);
    setRightKey(leftKey);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSliderPct(50);
  };

  const transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;

  return (
    <Card
      ref={containerRef}
      className={cn(
        "relative overflow-hidden border-border/40 bg-card/70 backdrop-blur-xl",
        isFullscreen && "rounded-none",
        className
      )}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border/40 bg-background/60 p-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="truncate text-base font-semibold">{title}</h3>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => clampZoom(z - 0.25))} aria-label="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
            {Math.round(zoom * 100)}%
          </span>
          <Button size="sm" variant="ghost" onClick={() => setZoom((z) => clampZoom(z + 0.25))} aria-label="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={resetView} aria-label="Reset view">
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" onClick={swapSides} aria-label="Swap sides">
            <ArrowLeftRight className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="outline" onClick={toggleFullscreen} aria-label="Toggle fullscreen">
            {isFullscreen ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      {/* Variant switcher — two rails so each side is unambiguous */}
      <div className="grid gap-3 border-b border-border/40 bg-background/40 p-3 sm:grid-cols-2">
        <VariantRail
          side="Left"
          variants={sortedVariants}
          selected={leftKey}
          onSelect={setLeftKey}
        />
        <VariantRail
          side="Right"
          variants={sortedVariants}
          selected={rightKey}
          onSelect={setRightKey}
        />
      </div>

      {/* Stage */}
      <div
        ref={stageRef}
        role="slider"
        aria-label={`${leftVariant?.label} vs ${rightVariant?.label} comparison`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(sliderPct)}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerLeave={endPointer}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          aspectRatio: isFullscreen ? undefined : `${aspectRatio}`,
          height: isFullscreen ? "calc(100vh - 240px)" : undefined,
          cursor: zoom > 1.02 ? (dragMode.current === "pan" ? "grabbing" : "grab") : "col-resize",
          touchAction: "none",
        }}
        className="relative w-full select-none overflow-hidden bg-[conic-gradient(from_45deg,hsl(var(--muted))_0%,hsl(var(--background))_25%,hsl(var(--muted))_50%,hsl(var(--background))_75%,hsl(var(--muted))_100%)]"
      >
        {/* Right variant — full layer */}
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform, transformOrigin: "center center", transition: dragMode.current === "none" ? "transform 120ms ease-out" : "none" }}
        >
          {rightVariant && (
            <img
              key={`right-${rightVariant.key}`}
              src={rightVariant.url}
              alt={rightVariant.label}
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={() => markLoaded(rightVariant.key)}
              className={cn(
                "h-full w-full object-contain transition-opacity duration-200",
                loadedKeys.has(rightVariant.key) ? "opacity-100" : "opacity-0"
              )}
            />
          )}
        </div>

        {/* Left variant — clipped */}
        <div
          className="absolute inset-0 overflow-hidden will-change-[clip-path]"
          style={{ clipPath: `inset(0 ${100 - sliderPct}% 0 0)` }}
        >
          <div
            className="absolute inset-0 will-change-transform"
            style={{ transform, transformOrigin: "center center", transition: dragMode.current === "none" ? "transform 120ms ease-out" : "none" }}
          >
            {leftVariant && (
              <img
                key={`left-${leftVariant.key}`}
                src={leftVariant.url}
                alt={leftVariant.label}
                loading="lazy"
                decoding="async"
                draggable={false}
                onLoad={() => markLoaded(leftVariant.key)}
                className={cn(
                  "h-full w-full object-contain transition-opacity duration-200",
                  loadedKeys.has(leftVariant.key) ? "opacity-100" : "opacity-0"
                )}
              />
            )}
          </div>
        </div>

        {/* Side labels */}
        {leftVariant && (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-sm">
            {leftVariant.label}
          </div>
        )}
        {rightVariant && (
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-primary/90 px-3 py-1 text-[11px] font-semibold text-primary-foreground shadow-md backdrop-blur-sm">
            {rightVariant.label}
          </div>
        )}

        {/* Divider + handle */}
        <div
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.35)]"
          style={{ left: `${sliderPct}%` }}
        >
          <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-white shadow-xl transition-transform duration-150">
            <ArrowLeftRight className="h-4 w-4 text-primary" />
          </div>
        </div>

        {/* Loading skeleton for currently selected variants */}
        {(leftVariant && !loadedKeys.has(leftVariant.key)) ||
        (rightVariant && !loadedKeys.has(rightVariant.key)) ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
            <div className="flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-sm">
              <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              Loading preview…
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/40 bg-background/60 px-4 py-2 text-[11px] text-muted-foreground">
        <span>
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">←/→</kbd> slider ·{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">+/-</kbd> zoom ·{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">0</kbd> reset ·{" "}
          <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px]">F</kbd> fullscreen
        </span>
        <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[10px]">
          Drag divider · Pinch/scroll to zoom · Drag when zoomed to pan
        </Badge>
      </div>
    </Card>
  );
};

// ─── Sub-components ────────────────────────────────────────────────────────

interface VariantRailProps {
  side: "Left" | "Right";
  variants: ComparisonVariant[];
  selected: VariantKey;
  onSelect: (key: VariantKey) => void;
}

const VariantRail = ({ side, variants, selected, onSelect }: VariantRailProps) => (
  <div className="space-y-1.5">
    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
      {side} side
    </p>
    <div className="flex flex-wrap gap-1.5">
      {variants.map((v) => {
        const active = v.key === selected;
        return (
          <button
            key={`${side}-${v.key}`}
            type="button"
            onClick={() => onSelect(v.key)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-medium transition-all duration-150",
              active
                ? "border-primary/50 bg-primary/15 text-foreground shadow-[var(--shadow-glow)]"
                : "border-border/50 bg-background/60 text-muted-foreground hover:border-primary/30 hover:text-foreground"
            )}
          >
            {v.label}
            {v.meta && (
              <span className="ml-1 text-[10px] text-muted-foreground/80">· {v.meta}</span>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

// ─── Utilities ─────────────────────────────────────────────────────────────

function clampZoom(z: number) {
  return Math.max(1, Math.min(5, z));
}

function clampPan(x: number, y: number, zoom: number, stage: HTMLDivElement | null) {
  if (!stage) return { x, y };
  const rect = stage.getBoundingClientRect();
  const maxX = (rect.width * (zoom - 1)) / 2;
  const maxY = (rect.height * (zoom - 1)) / 2;
  return {
    x: Math.max(-maxX, Math.min(maxX, x)),
    y: Math.max(-maxY, Math.min(maxY, y)),
  };
}

function touchDistance(touches: React.TouchList) {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}
