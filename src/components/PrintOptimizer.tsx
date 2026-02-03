import { useState, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Printer,
  Globe,
  Wand2,
  Download,
  RotateCcw,
  ZoomIn,
  Maximize2,
  Loader2,
  Sparkles,
  Crop,
  Image as ImageIcon,
  Frame,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Standard print sizes in inches
const PRINT_PRESETS = [
  { name: "Letter", width: 8.5, height: 11, category: "document" },
  { name: "Legal", width: 8.5, height: 14, category: "document" },
  { name: "Photo 4x6", width: 4, height: 6, category: "photo" },
  { name: "Photo 5x7", width: 5, height: 7, category: "photo" },
  { name: "Photo 8x10", width: 8, height: 10, category: "photo" },
  { name: "16x20", width: 16, height: 20, category: "poster" },
  { name: "18x24", width: 18, height: 24, category: "poster" },
  { name: "20x20", width: 20, height: 20, category: "poster" },
  { name: "24x36", width: 24, height: 36, category: "poster" },
  { name: "Banner 2x6 ft", width: 24, height: 72, category: "banner" },
  { name: "Banner 3x8 ft", width: 36, height: 96, category: "banner" },
  { name: "Banner 4x10 ft", width: 48, height: 120, category: "banner" },
];

// DPI options for print quality
const DPI_OPTIONS = [
  { value: 72, label: "72 DPI (Web)" },
  { value: 150, label: "150 DPI (Draft)" },
  { value: 300, label: "300 DPI (Print)" },
  { value: 600, label: "600 DPI (High Quality)" },
];

// Frame styles
const FRAME_STYLES = [
  { id: "none", name: "No Frame", color: "transparent", width: 0 },
  { id: "thin-white", name: "Thin White", color: "#FFFFFF", width: 2 },
  { id: "thin-black", name: "Thin Black", color: "#000000", width: 2 },
  { id: "medium-white", name: "Medium White", color: "#FFFFFF", width: 5 },
  { id: "medium-black", name: "Medium Black", color: "#000000", width: 5 },
  { id: "thick-white", name: "Thick White", color: "#FFFFFF", width: 10 },
  { id: "thick-black", name: "Thick Black", color: "#000000", width: 10 },
  { id: "gold", name: "Gold", color: "#D4AF37", width: 5 },
  { id: "silver", name: "Silver", color: "#C0C0C0", width: 5 },
  { id: "wood", name: "Wood Brown", color: "#8B4513", width: 8 },
  { id: "custom", name: "Custom", color: "#000000", width: 5 },
];

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function PrintOptimizer() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  // Image state
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);

  // Size settings
  const [unit, setUnit] = useState<"in" | "cm">("in");
  const [selectedPreset, setSelectedPreset] = useState<string>("");
  const [customWidth, setCustomWidth] = useState<number>(8.5);
  const [customHeight, setCustomHeight] = useState<number>(11);
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [dpi, setDpi] = useState<number>(300);

  // Crop settings
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);
  const [cropWidth, setCropWidth] = useState<number>(100);
  const [cropHeight, setCropHeight] = useState<number>(100);
  const [zoom, setZoom] = useState<number>(100);

  // Enhancement settings
  const [enhanceSharpness, setEnhanceSharpness] = useState<boolean>(true);
  const [enhanceClarity, setEnhanceClarity] = useState<boolean>(true);
  const [upscaleEnabled, setUpscaleEnabled] = useState<boolean>(true);
  const [aiEnhance, setAiEnhance] = useState<boolean>(false);
  const [aiPrompt, setAiPrompt] = useState<string>("");

  // Frame settings
  const [frameStyle, setFrameStyle] = useState<string>("none");
  const [customFrameColor, setCustomFrameColor] = useState<string>("#000000");
  const [customFrameWidth, setCustomFrameWidth] = useState<number>(5);

  // Processing state
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [outputMode, setOutputMode] = useState<"print" | "web">("print");
  const [downloadReady, setDownloadReady] = useState<boolean>(false);

  // Calculate target dimensions
  const getTargetDimensions = useCallback(() => {
    let width = customWidth;
    let height = customHeight;

    if (orientation === "landscape" && width < height) {
      [width, height] = [height, width];
    } else if (orientation === "portrait" && width > height) {
      [width, height] = [height, width];
    }

    // Convert to cm if needed (1 inch = 2.54 cm)
    const multiplier = unit === "cm" ? 1 / 2.54 : 1;
    const inchWidth = width * multiplier;
    const inchHeight = height * multiplier;

    // Calculate pixel dimensions based on DPI
    const pixelWidth = Math.round(inchWidth * dpi);
    const pixelHeight = Math.round(inchHeight * dpi);

    return { inchWidth, inchHeight, pixelWidth, pixelHeight };
  }, [customWidth, customHeight, orientation, unit, dpi]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);

      const img = new Image();
      img.onload = () => {
        setOriginalImage(img);
        // Reset crop to full image
        setCropX(0);
        setCropY(0);
        setCropWidth(100);
        setCropHeight(100);
        setZoom(100);
        setProcessedImage(null);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handlePresetSelect = (presetName: string) => {
    setSelectedPreset(presetName);
    const preset = PRINT_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setCustomWidth(preset.width);
      setCustomHeight(preset.height);
    }
  };

  const toggleOrientation = () => {
    setOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
  };

  const applySharpening = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    strength: number = 0.5
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const copy = new Uint8ClampedArray(data);

    const kernel = [
      0, -strength, 0,
      -strength, 1 + 4 * strength, -strength,
      0, -strength, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              sum += copy[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
            }
          }
          const idx = (y * width + x) * 4 + c;
          data[idx] = Math.max(0, Math.min(255, sum));
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyClarity = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
  ) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Increase contrast in midtones
    for (let i = 0; i < data.length; i += 4) {
      for (let c = 0; c < 3; c++) {
        const value = data[i + c];
        // S-curve for midtone contrast
        const normalized = value / 255;
        const enhanced = normalized < 0.5
          ? 2 * normalized * normalized
          : 1 - 2 * (1 - normalized) * (1 - normalized);
        data[i + c] = Math.round(enhanced * 255 * 0.3 + value * 0.7);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const processImage = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setDownloadReady(false);

    try {
      const { pixelWidth, pixelHeight } = getTargetDimensions();

      // Get frame settings
      const frameConfig = FRAME_STYLES.find(f => f.id === frameStyle) || FRAME_STYLES[0];
      const frameWidth = frameStyle === "custom" ? customFrameWidth : frameConfig.width;
      const frameColor = frameStyle === "custom" ? customFrameColor : frameConfig.color;
      
      // Calculate frame in pixels (percentage of smaller dimension)
      const framePixels = frameStyle !== "none" 
        ? Math.round((frameWidth / 100) * Math.min(pixelWidth, pixelHeight))
        : 0;

      // Create canvas for processing (add frame space)
      const canvas = document.createElement("canvas");
      canvas.width = pixelWidth + (framePixels * 2);
      canvas.height = pixelHeight + (framePixels * 2);
      const ctx = canvas.getContext("2d")!;

      // Draw frame background if enabled
      if (framePixels > 0) {
        ctx.fillStyle = frameColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Enable high-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Calculate crop area from percentages
      const srcX = (cropX / 100) * originalImage.width;
      const srcY = (cropY / 100) * originalImage.height;
      const srcWidth = (cropWidth / 100) * originalImage.width;
      const srcHeight = (cropHeight / 100) * originalImage.height;

      // Draw cropped and scaled image (inside frame area)
      ctx.drawImage(
        originalImage,
        srcX,
        srcY,
        srcWidth,
        srcHeight,
        framePixels,
        framePixels,
        pixelWidth,
        pixelHeight
      );

      // Apply enhancements to the image area (not the frame)
      if (enhanceSharpness || enhanceClarity) {
        // Get just the image data (exclude frame)
        const imageData = ctx.getImageData(framePixels, framePixels, pixelWidth, pixelHeight);
        
        // Create temp canvas for enhancements
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = pixelWidth;
        tempCanvas.height = pixelHeight;
        const tempCtx = tempCanvas.getContext("2d")!;
        tempCtx.putImageData(imageData, 0, 0);

        if (enhanceSharpness) {
          applySharpening(tempCtx, pixelWidth, pixelHeight, 0.4);
        }

        if (enhanceClarity) {
          applyClarity(tempCtx, pixelWidth, pixelHeight);
        }

        // Put enhanced image back
        const enhancedData = tempCtx.getImageData(0, 0, pixelWidth, pixelHeight);
        ctx.putImageData(enhancedData, framePixels, framePixels);
      }

      let resultDataUrl = canvas.toDataURL("image/png", 1.0);

      // AI Enhancement if enabled
      if (aiEnhance && (aiPrompt || enhanceClarity)) {
        toast({
          title: "AI Enhancement",
          description: "Enhancing image with AI...",
        });

        const base64Data = resultDataUrl.split(",")[1];
        const prompt = aiPrompt || "Enhance this image for high-quality printing. Improve clarity, reduce noise, and optimize colors while maintaining natural appearance.";

        const { data: session } = await supabase.auth.getSession();
        if (!session?.session?.access_token) {
          throw new Error("Please sign in to use AI enhancement");
        }

        const response = await supabase.functions.invoke("ai-edit-image", {
          body: {
            imageBase64: base64Data,
            prompt: prompt,
            editType: "enhance",
          },
        });

        if (response.error) {
          throw new Error(response.error.message || "AI enhancement failed");
        }

        if (response.data?.editedImage) {
          resultDataUrl = response.data.editedImage;
        }
      }

      // For web output, optimize file size
      if (outputMode === "web") {
        const webCanvas = document.createElement("canvas");
        const maxWebSize = 2000;
        const scale = Math.min(1, maxWebSize / Math.max(canvas.width, canvas.height));
        webCanvas.width = Math.round(canvas.width * scale);
        webCanvas.height = Math.round(canvas.height * scale);
        const webCtx = webCanvas.getContext("2d")!;
        webCtx.imageSmoothingEnabled = true;
        webCtx.imageSmoothingQuality = "high";

        const tempImg = new Image();
        await new Promise((resolve) => {
          tempImg.onload = resolve;
          tempImg.src = resultDataUrl;
        });

        webCtx.drawImage(tempImg, 0, 0, webCanvas.width, webCanvas.height);
        resultDataUrl = webCanvas.toDataURL("image/jpeg", 0.85);
      }

      setProcessedImage(resultDataUrl);
      setDownloadReady(true);

      toast({
        title: "Image processed successfully!",
        description: `Ready for ${outputMode === "print" ? "printing" : "web"}. Click Download to save.`,
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement("a");
    const fileName = imageFile?.name?.replace(/\.[^/.]+$/, "") || "image";
    const { inchWidth, inchHeight } = getTargetDimensions();
    const suffix = outputMode === "print" ? `_print_${inchWidth}x${inchHeight}` : "_web_optimized";
    const ext = outputMode === "print" ? "png" : "jpg";

    link.download = `${fileName}${suffix}.${ext}`;
    link.href = processedImage;
    link.click();

    toast({
      title: "Download started",
      description: `Saving ${link.download}`,
    });
  };

  const resetSettings = () => {
    setCropX(0);
    setCropY(0);
    setCropWidth(100);
    setCropHeight(100);
    setZoom(100);
    setProcessedImage(null);
  };

  const { pixelWidth, pixelHeight, inchWidth, inchHeight } = getTargetDimensions();

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {!imageDataUrl ? (
        <Card className="p-8 text-center border-dashed border-2 cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          <div className="max-w-md mx-auto">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Upload Image for Print Preparation</h3>
            <p className="text-muted-foreground mb-4">
              Crop, resize, upscale and optimize your images for professional printing or web publishing
            </p>
            <Button size="lg">
              <ImageIcon className="w-4 h-4 mr-2" />
              Select Image
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview Panel */}
          <Card className="lg:col-span-2 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Crop className="w-4 h-4" />
                Preview
              </h3>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={resetSettings}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Change Image
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>
            </div>

            {/* Image Preview */}
            <div className="relative bg-muted rounded-lg overflow-hidden mb-4"
              style={{ aspectRatio: `${inchWidth} / ${inchHeight}` }}>
              {processedImage ? (
                <img
                  src={processedImage}
                  alt="Processed"
                  className="w-full h-full object-contain"
                />
              ) : imageDataUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={imageDataUrl}
                    alt="Original"
                    className="w-full h-full object-contain"
                    style={{
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: "center",
                    }}
                  />
                  {/* Crop overlay visualization */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div
                      className="absolute border-2 border-primary border-dashed"
                      style={{
                        left: `${cropX}%`,
                        top: `${cropY}%`,
                        width: `${cropWidth}%`,
                        height: `${cropHeight}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Manual Crop Sliders */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Crop X Position</Label>
                  <Slider
                    value={[cropX]}
                    onValueChange={([v]) => setCropX(v)}
                    max={100 - cropWidth}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Crop Y Position</Label>
                  <Slider
                    value={[cropY]}
                    onValueChange={([v]) => setCropY(v)}
                    max={100 - cropHeight}
                    step={1}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm mb-2 block">Crop Width: {cropWidth}%</Label>
                  <Slider
                    value={[cropWidth]}
                    onValueChange={([v]) => {
                      setCropWidth(v);
                      if (cropX + v > 100) setCropX(100 - v);
                    }}
                    min={10}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <Label className="text-sm mb-2 block">Crop Height: {cropHeight}%</Label>
                  <Slider
                    value={[cropHeight]}
                    onValueChange={([v]) => {
                      setCropHeight(v);
                      if (cropY + v > 100) setCropY(100 - v);
                    }}
                    min={10}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm mb-2 block flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom: {zoom}%
                </Label>
                <Slider
                  value={[zoom]}
                  onValueChange={([v]) => setZoom(v)}
                  min={50}
                  max={200}
                  step={5}
                />
              </div>
            </div>
          </Card>

          {/* Settings Panel */}
          <Card className="p-4 space-y-6">
            {/* Size Selection */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Maximize2 className="w-4 h-4" />
                Output Size
              </h4>

              <Tabs defaultValue="preset" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="preset" className="flex-1">Presets</TabsTrigger>
                  <TabsTrigger value="custom" className="flex-1">Custom</TabsTrigger>
                </TabsList>

                <TabsContent value="preset" className="space-y-3 mt-3">
                  <Select value={selectedPreset} onValueChange={handlePresetSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a size..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="" disabled>Documents</SelectItem>
                      {PRINT_PRESETS.filter(p => p.category === "document").map(preset => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name} ({preset.width}" × {preset.height}")
                        </SelectItem>
                      ))}
                      <SelectItem value="" disabled>Photos</SelectItem>
                      {PRINT_PRESETS.filter(p => p.category === "photo").map(preset => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name} ({preset.width}" × {preset.height}")
                        </SelectItem>
                      ))}
                      <SelectItem value="" disabled>Posters</SelectItem>
                      {PRINT_PRESETS.filter(p => p.category === "poster").map(preset => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name} ({preset.width}" × {preset.height}")
                        </SelectItem>
                      ))}
                      <SelectItem value="" disabled>Banners</SelectItem>
                      {PRINT_PRESETS.filter(p => p.category === "banner").map(preset => (
                        <SelectItem key={preset.name} value={preset.name}>
                          {preset.name} ({preset.width}" × {preset.height}")
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>

                <TabsContent value="custom" className="space-y-3 mt-3">
                  <div className="flex gap-2 mb-2">
                    <Button
                      variant={unit === "in" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnit("in")}
                    >
                      Inches
                    </Button>
                    <Button
                      variant={unit === "cm" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setUnit("cm")}
                    >
                      Centimeters
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Width ({unit})</Label>
                      <Input
                        type="number"
                        value={customWidth}
                        onChange={(e) => setCustomWidth(Number(e.target.value))}
                        min={1}
                        max={120}
                        step={0.5}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Height ({unit})</Label>
                      <Input
                        type="number"
                        value={customHeight}
                        onChange={(e) => setCustomHeight(Number(e.target.value))}
                        min={1}
                        max={120}
                        step={0.5}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Orientation Toggle */}
              <div className="flex items-center justify-between mt-3 p-2 bg-muted rounded-lg">
                <span className="text-sm">Orientation</span>
                <div className="flex gap-1">
                  <Button
                    variant={orientation === "portrait" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setOrientation("portrait")}
                  >
                    Portrait
                  </Button>
                  <Button
                    variant={orientation === "landscape" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setOrientation("landscape")}
                  >
                    Landscape
                  </Button>
                </div>
              </div>
            </div>

            {/* DPI Selection */}
            <div>
              <Label className="text-sm mb-2 block">Print Quality (DPI)</Label>
              <Select value={String(dpi)} onValueChange={(v) => setDpi(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DPI_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Output: {pixelWidth.toLocaleString()} × {pixelHeight.toLocaleString()} px
              </p>
            </div>

            {/* Enhancement Options */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Enhancements
              </h4>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Sharpen for Print</Label>
                <Switch
                  checked={enhanceSharpness}
                  onCheckedChange={setEnhanceSharpness}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Enhance Clarity</Label>
                <Switch
                  checked={enhanceClarity}
                  onCheckedChange={setEnhanceClarity}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm">Auto Upscale</Label>
                <Switch
                  checked={upscaleEnabled}
                  onCheckedChange={setUpscaleEnabled}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm flex items-center gap-1">
                  <Wand2 className="w-3 h-3" />
                  AI Enhancement
                  <Badge variant="outline" className="text-[10px] ml-1">PRO</Badge>
                </Label>
                <Switch
                  checked={aiEnhance}
                  onCheckedChange={setAiEnhance}
                />
              </div>

              {aiEnhance && (
                <div>
                  <Label className="text-xs mb-1 block">AI Instructions (optional)</Label>
                  <Input
                    placeholder="e.g., Make colors more vibrant"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="text-sm"
                  />
                </div>
              )}
            </div>

            {/* Frame Options */}
            <div className="space-y-3">
              <h4 className="font-medium flex items-center gap-2">
                <Frame className="w-4 h-4" />
                Frame / Border
              </h4>

              <Select value={frameStyle} onValueChange={setFrameStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frame style..." />
                </SelectTrigger>
                <SelectContent>
                  {FRAME_STYLES.map(frame => (
                    <SelectItem key={frame.id} value={frame.id}>
                      <div className="flex items-center gap-2">
                        {frame.id !== "none" && frame.id !== "custom" && (
                          <div 
                            className="w-4 h-4 rounded border border-border"
                            style={{ backgroundColor: frame.color }}
                          />
                        )}
                        {frame.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {frameStyle === "custom" && (
                <div className="space-y-3 p-3 bg-muted rounded-lg">
                  <div>
                    <Label className="text-xs mb-1 block">Frame Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={customFrameColor}
                        onChange={(e) => setCustomFrameColor(e.target.value)}
                        className="w-12 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        type="text"
                        value={customFrameColor}
                        onChange={(e) => setCustomFrameColor(e.target.value)}
                        placeholder="#000000"
                        className="flex-1 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs mb-1 block">Frame Width: {customFrameWidth}%</Label>
                    <Slider
                      value={[customFrameWidth]}
                      onValueChange={([v]) => setCustomFrameWidth(v)}
                      min={1}
                      max={15}
                      step={1}
                    />
                  </div>
                </div>
              )}

              {frameStyle !== "none" && frameStyle !== "custom" && (
                <p className="text-xs text-muted-foreground">
                  {FRAME_STYLES.find(f => f.id === frameStyle)?.width}% border will be added around the image
                </p>
              )}
            </div>

            {/* Output Mode */}
            <div>
              <Label className="text-sm mb-2 block">Optimize For</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={outputMode === "print" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOutputMode("print")}
                  className="flex items-center gap-1"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  variant={outputMode === "web" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOutputMode("web")}
                  className="flex items-center gap-1"
                >
                  <Globe className="w-4 h-4" />
                  Web
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <Button
                className="w-full"
                onClick={processImage}
                disabled={isProcessing || !originalImage}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Process Image
                  </>
                )}
              </Button>

              {processedImage && (
                <Button
                  className="w-full h-16 text-lg font-bold bg-profit hover:bg-profit/90 text-profit-foreground animate-pulse shadow-profit"
                  onClick={downloadImage}
                  size="lg"
                >
                  <Download className="w-6 h-6 mr-3" />
                  Download {outputMode === "print" ? "Print-Ready" : "Web-Optimized"}
                </Button>
              )}
            </div>

            {/* Info */}
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Final Size:</strong> {inchWidth.toFixed(1)}" × {inchHeight.toFixed(1)}"
              {unit === "cm" && ` (${(inchWidth * 2.54).toFixed(1)} × ${(inchHeight * 2.54).toFixed(1)} cm)`}
              <br />
              <strong>Resolution:</strong> {pixelWidth.toLocaleString()} × {pixelHeight.toLocaleString()} pixels @ {dpi} DPI
              {frameStyle !== "none" && (
                <>
                  <br />
                  <strong>Frame:</strong> {FRAME_STYLES.find(f => f.id === frameStyle)?.name || "Custom"}
                </>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Sticky Download Banner when processed */}
      {processedImage && downloadReady && (
        <Card className="fixed bottom-4 left-1/2 -translate-x-1/2 p-6 bg-card border-2 border-profit shadow-profit z-50 flex items-center gap-6">
          <div className="flex items-center gap-2 text-profit">
            <Check className="w-6 h-6" />
            <span className="font-bold text-lg">Image Ready!</span>
          </div>
          <Button
            className="h-14 px-8 text-lg font-bold bg-profit hover:bg-profit/90 text-profit-foreground shadow-profit"
            onClick={downloadImage}
          >
            <Download className="w-6 h-6 mr-3" />
            Download Now
          </Button>
        </Card>
      )}
    </div>
  );
}
