import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export type EnhanceLevel = 'none' | 'level1' | 'level2';

export interface VideoEnhanceResult {
  id: string;
  fileName: string;
  originalFile: File;
  originalUrl: string;
  originalSize: number;
  
  // Enhancement states
  enhanceLevel: EnhanceLevel;
  enhancedUrl?: string;
  enhancedBlob?: Blob;
  enhancedSize?: number;
  
  // Compression states
  isCompressed: boolean;
  compressedUrl?: string;
  compressedBlob?: Blob;
  compressedSize?: number;
  estimatedSavings?: number;
  
  // Processing states
  status: 'uploading' | 'uploaded' | 'enhancing' | 'enhanced' | 'compressing' | 'ready' | 'error';
  progress: number;
  error?: string;
  
  // Timing
  uploadStartTime?: number;
  processingTime?: number;
}

export interface ShareOptions {
  platform: 'download' | 'icloud' | 'gdrive' | 'dropbox' | 'link' | 'gmail' | 'outlook' | 'yahoo' | 'mail';
  customName?: string;
  message?: string;
}

// Check if WebCodecs API is available for faster processing
const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof VideoDecoder !== 'undefined';

export const useVideoEnhance = () => {
  const [videos, setVideos] = useState<VideoEnhanceResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  // Generate unique ID
  const generateId = () => `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Format file size helper
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Fast video processing using higher playback rate
  const processVideoFast = async (
    sourceUrl: string,
    videoId: string,
    bitrate: number,
    applyFilters?: (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void
  ): Promise<Blob> => {
    const videoEl = document.createElement('video');
    videoEl.src = sourceUrl;
    videoEl.muted = true;
    videoEl.playsInline = true;
    videoEl.preload = 'auto';
    videoEl.crossOrigin = 'anonymous';

    // Wait for video to be fully loadable
    await new Promise<void>((resolve, reject) => {
      videoEl.oncanplaythrough = () => resolve();
      videoEl.onloadedmetadata = () => {
        // Fallback if canplaythrough doesn't fire
        setTimeout(() => resolve(), 100);
      };
      videoEl.onerror = () => reject(new Error('Failed to load video'));
      videoEl.load();
    });

    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth;
    canvas.height = videoEl.videoHeight;
    const ctx = canvas.getContext('2d', { 
      alpha: false, 
      desynchronized: true,
      willReadFrequently: false 
    })!;

    // Use higher frame rate for capture to account for speed boost
    const targetFps = 60;
    const stream = canvas.captureStream(targetFps);
    
    // Add audio track if available (at normal speed)
    let audioContext: AudioContext | null = null;
    try {
      audioContext = new AudioContext();
      const source = audioContext.createMediaElementSource(videoEl);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    } catch (e) {
      console.warn('Could not capture audio:', e);
    }

    // Use VP9 for better compression, VP8 as fallback
    const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
      ? 'video/webm;codecs=vp9' 
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
        ? 'video/webm;codecs=vp8'
        : 'video/webm';

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: bitrate
    });

    const chunks: Blob[] = [];
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    return new Promise<Blob>((resolve, reject) => {
      mediaRecorder.onstop = () => {
        if (audioContext) audioContext.close();
        resolve(new Blob(chunks, { type: mimeType }));
      };
      mediaRecorder.onerror = () => {
        if (audioContext) audioContext.close();
        reject(new Error('Recording failed'));
      };
      
      // Request data more frequently for smoother processing
      mediaRecorder.start(50);
      
      videoEl.currentTime = 0;
      
      // Speed up playback for faster processing (2x-4x depending on video length)
      const duration = videoEl.duration;
      let playbackRate = 1;
      
      // For videos under 30s, use normal speed for quality
      // For videos 30s-2min, use 2x
      // For videos 2-5min, use 3x
      // For videos over 5min, use 4x
      if (duration > 300) {
        playbackRate = 4;
      } else if (duration > 120) {
        playbackRate = 3;
      } else if (duration > 30) {
        playbackRate = 2;
      }
      
      videoEl.playbackRate = playbackRate;
      
      // Handle autoplay with proper promise handling
      videoEl.play().catch((playError) => {
        console.warn('Autoplay blocked, retrying:', playError);
        videoEl.muted = true;
        videoEl.play().catch((err) => {
          reject(new Error('Video playback failed: ' + err.message));
        });
      });

      let lastFrameTime = 0;
      const frameInterval = 1000 / targetFps;
      
      const drawFrame = (timestamp: number) => {
        if (videoEl.ended || videoEl.paused) {
          if (videoEl.ended) mediaRecorder.stop();
          return;
        }

        // Throttle frame drawing to target FPS
        if (timestamp - lastFrameTime >= frameInterval) {
          // Apply filters if provided
          if (applyFilters) {
            applyFilters(ctx, canvas);
          }
          
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          lastFrameTime = timestamp;
        }

        // Update progress based on actual time, accounting for playback rate
        const actualProgress = Math.min((videoEl.currentTime / duration) * 100, 99);
        setVideos(prev => prev.map(v => 
          v.id === videoId ? { ...v, progress: actualProgress } : v
        ));

        requestAnimationFrame(drawFrame);
      };

      videoEl.onended = () => {
        mediaRecorder.stop();
      };
      
      requestAnimationFrame(drawFrame);
    });
  };

  // Upload video with fast processing
  const uploadVideo = useCallback(async (file: File): Promise<string> => {
    const id = generateId();
    const originalUrl = URL.createObjectURL(file);
    
    const newVideo: VideoEnhanceResult = {
      id,
      fileName: file.name,
      originalFile: file,
      originalUrl,
      originalSize: file.size,
      enhanceLevel: 'none',
      isCompressed: false,
      status: 'uploading',
      progress: 0,
      uploadStartTime: Date.now(),
    };

    setVideos(prev => [newVideo, ...prev]);

    // Fast upload simulation - instant for local files
    setVideos(prev => prev.map(v => 
      v.id === id ? { ...v, status: 'uploaded', progress: 100 } : v
    ));

    toast({
      title: "Upload Complete",
      description: `${file.name} ready for processing`,
    });

    return id;
  }, [toast]);

  // Level 1 Enhancement: Fast clarity and sharpness boost
  const enhanceLevel1 = useCallback(async (videoId: string): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    setIsProcessing(true);
    const startTime = Date.now();
    
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, status: 'enhancing', progress: 0 } : v
    ));

    try {
      const applyEnhancement = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        // Level 1: Light enhancement for clarity
        ctx.filter = 'contrast(1.08) saturate(1.05) brightness(1.02)';
      };

      // Use higher bitrate for quality enhancement
      const enhancedBlob = await processVideoFast(
        video.originalUrl,
        videoId,
        6000000, // 6 Mbps for good quality
        applyEnhancement
      );

      const enhancedUrl = URL.createObjectURL(enhancedBlob);
      const processingTime = Date.now() - startTime;

      setVideos(prev => prev.map(v => 
        v.id === videoId ? {
          ...v,
          status: 'enhanced',
          enhanceLevel: 'level1',
          enhancedUrl,
          enhancedBlob,
          enhancedSize: enhancedBlob.size,
          progress: 100,
          processingTime
        } : v
      ));

      toast({
        title: "Enhancement Complete",
        description: `Video enhanced in ${(processingTime / 1000).toFixed(1)}s`,
      });

    } catch (error) {
      console.error('Enhancement error:', error);
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, status: 'error', error: (error as Error).message } : v
      ));
      toast({
        title: "Enhancement Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [videos, toast]);

  // Level 2 Enhancement: Maximum quality boost
  const enhanceLevel2 = useCallback(async (videoId: string): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    // If no level 1 enhancement, do level 1 first then level 2
    const sourceUrl = video.enhancedUrl || video.originalUrl;

    setIsProcessing(true);
    const startTime = Date.now();
    
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, status: 'enhancing', progress: 0 } : v
    ));

    try {
      const applyEnhancement = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        // Level 2: Stronger enhancement
        ctx.filter = 'contrast(1.12) saturate(1.08) brightness(1.03)';
      };

      // Higher bitrate for maximum quality
      const enhancedBlob = await processVideoFast(
        sourceUrl,
        videoId,
        8000000, // 8 Mbps for high quality
        applyEnhancement
      );

      // Revoke old enhanced URL
      if (video.enhancedUrl) URL.revokeObjectURL(video.enhancedUrl);
      
      const enhancedUrl = URL.createObjectURL(enhancedBlob);
      const processingTime = Date.now() - startTime;

      setVideos(prev => prev.map(v => 
        v.id === videoId ? {
          ...v,
          status: 'enhanced',
          enhanceLevel: 'level2',
          enhancedUrl,
          enhancedBlob,
          enhancedSize: enhancedBlob.size,
          progress: 100,
        } : v
      ));

      toast({
        title: "Level 2 Enhancement Complete",
        description: `Maximum quality applied in ${(processingTime / 1000).toFixed(1)}s`,
      });

    } catch (error) {
      console.error('Level 2 enhancement error:', error);
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, status: 'error', error: (error as Error).message } : v
      ));
      toast({
        title: "Enhancement Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [videos, toast]);

  // Fast compression with intelligent bitrate selection
  const compressVideo = useCallback(async (videoId: string): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const sourceUrl = video.enhancedUrl || video.originalUrl;
    const sourceSize = video.enhancedSize || video.originalSize;

    setIsProcessing(true);
    const startTime = Date.now();
    
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, status: 'compressing', progress: 0 } : v
    ));

    try {
      // Get video metadata for smart bitrate selection
      const videoEl = document.createElement('video');
      videoEl.src = sourceUrl;
      videoEl.muted = true;
      
      await new Promise<void>((resolve, reject) => {
        videoEl.onloadedmetadata = () => resolve();
        videoEl.onerror = () => reject(new Error('Failed to load video'));
      });

      // Smart bitrate based on resolution and content
      const resolution = videoEl.videoWidth * videoEl.videoHeight;
      let targetBitrate: number;
      
      if (resolution >= 3840 * 2160) { // 4K
        targetBitrate = 6000000; // 6 Mbps
      } else if (resolution >= 1920 * 1080) { // Full HD
        targetBitrate = 3000000; // 3 Mbps
      } else if (resolution >= 1280 * 720) { // HD
        targetBitrate = 2000000; // 2 Mbps
      } else {
        targetBitrate = 1500000; // 1.5 Mbps for smaller
      }

      const compressedBlob = await processVideoFast(
        sourceUrl,
        videoId,
        targetBitrate
      );

      const compressedUrl = URL.createObjectURL(compressedBlob);
      const savings = ((sourceSize - compressedBlob.size) / sourceSize) * 100;
      const processingTime = Date.now() - startTime;

      setVideos(prev => prev.map(v => 
        v.id === videoId ? {
          ...v,
          status: 'ready',
          isCompressed: true,
          compressedUrl,
          compressedBlob,
          compressedSize: compressedBlob.size,
          estimatedSavings: Math.max(0, savings),
          progress: 100,
        } : v
      ));

      toast({
        title: "Compression Complete",
        description: `Reduced by ${Math.max(0, savings).toFixed(1)}% in ${(processingTime / 1000).toFixed(1)}s`,
      });

    } catch (error) {
      console.error('Compression error:', error);
      setVideos(prev => prev.map(v => 
        v.id === videoId ? { ...v, status: 'error', error: (error as Error).message } : v
      ));
      toast({
        title: "Compression Failed",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [videos, toast]);

  // Share video to various platforms
  const shareVideo = useCallback(async (videoId: string, options: ShareOptions): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const blob = video.compressedBlob || video.enhancedBlob || video.originalFile;
    const url = video.compressedUrl || video.enhancedUrl || video.originalUrl;
    
    const fileName = options.customName 
      ? `${options.customName}.webm`
      : `optimized_${video.fileName.replace(/\.[^/.]+$/, '')}.webm`;

    switch (options.platform) {
      case 'download':
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Download Started",
          description: fileName,
        });
        break;

      case 'gmail':
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&body=${encodeURIComponent(options.message || 'Check out this video!')}`);
        toast({
          title: "Opening Gmail",
          description: "Attach the downloaded video to your email",
        });
        break;

      case 'outlook':
        window.open(`https://outlook.live.com/mail/0/deeplink/compose?body=${encodeURIComponent(options.message || 'Check out this video!')}`);
        toast({
          title: "Opening Outlook",
          description: "Attach the downloaded video to your email",
        });
        break;

      case 'yahoo':
        window.open(`https://compose.mail.yahoo.com/?body=${encodeURIComponent(options.message || 'Check out this video!')}`);
        toast({
          title: "Opening Yahoo Mail",
          description: "Attach the downloaded video to your email",
        });
        break;

      case 'mail':
        window.location.href = `mailto:?subject=${encodeURIComponent('Video Share')}&body=${encodeURIComponent(options.message || 'Check out this video!')}`;
        toast({
          title: "Opening Email Client",
          description: "Attach the downloaded video to your email",
        });
        break;

      case 'gdrive':
        window.open('https://drive.google.com/drive/my-drive');
        toast({
          title: "Opening Google Drive",
          description: "Upload your video to Google Drive",
        });
        break;

      case 'dropbox':
        window.open('https://www.dropbox.com/home');
        toast({
          title: "Opening Dropbox",
          description: "Upload your video to Dropbox",
        });
        break;

      case 'icloud':
        window.open('https://www.icloud.com/iclouddrive');
        toast({
          title: "Opening iCloud Drive",
          description: "Upload your video to iCloud",
        });
        break;

      default:
        // Copy link to clipboard
        try {
          await navigator.clipboard.writeText(url);
          toast({
            title: "Link Copied",
            description: "Video link copied to clipboard",
          });
        } catch (e) {
          toast({
            title: "Copy Failed",
            description: "Could not copy link to clipboard",
            variant: "destructive"
          });
        }
    }
  }, [videos, toast]);

  // Remove video from list
  const removeVideo = useCallback((videoId: string) => {
    setVideos(prev => {
      const video = prev.find(v => v.id === videoId);
      if (video) {
        // Revoke all object URLs
        URL.revokeObjectURL(video.originalUrl);
        if (video.enhancedUrl) URL.revokeObjectURL(video.enhancedUrl);
        if (video.compressedUrl) URL.revokeObjectURL(video.compressedUrl);
      }
      return prev.filter(v => v.id !== videoId);
    });
  }, []);

  // Clear all videos
  const clearAll = useCallback(() => {
    videos.forEach(video => {
      URL.revokeObjectURL(video.originalUrl);
      if (video.enhancedUrl) URL.revokeObjectURL(video.enhancedUrl);
      if (video.compressedUrl) URL.revokeObjectURL(video.compressedUrl);
    });
    setVideos([]);
  }, [videos]);

  // Get video by ID
  const getVideo = useCallback((videoId: string): VideoEnhanceResult | undefined => {
    return videos.find(v => v.id === videoId);
  }, [videos]);

  return {
    videos,
    isProcessing,
    uploadVideo,
    enhanceLevel1,
    enhanceLevel2,
    compressVideo,
    shareVideo,
    removeVideo,
    clearAll,
    getVideo,
    formatFileSize,
  };
};
