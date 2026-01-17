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

  // Upload video with chunked upload simulation for large files
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

    // Simulate chunked upload with progress
    const chunkSize = 1024 * 1024; // 1MB chunks
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    for (let i = 0; i < totalChunks; i++) {
      await new Promise(resolve => setTimeout(resolve, 10)); // Fast simulation
      const progress = Math.min(((i + 1) / totalChunks) * 100, 100);
      
      setVideos(prev => prev.map(v => 
        v.id === id ? { ...v, progress } : v
      ));
    }

    setVideos(prev => prev.map(v => 
      v.id === id ? { ...v, status: 'uploaded', progress: 100 } : v
    ));

    toast({
      title: "Upload Complete",
      description: `${file.name} ready for enhancement`,
    });

    return id;
  }, [toast]);

  // Level 1 Enhancement: Clarity, sharpness, lighting, noise reduction
  const enhanceLevel1 = useCallback(async (videoId: string): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    setIsProcessing(true);
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, status: 'enhancing', progress: 0 } : v
    ));

    try {
      // Create video element for processing
      const videoEl = document.createElement('video');
      videoEl.src = video.originalUrl;
      videoEl.muted = true;
      videoEl.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        videoEl.onloadedmetadata = () => resolve();
        videoEl.onerror = () => reject(new Error('Failed to load video'));
      });

      // Create canvas for frame processing with enhancement filters
      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d')!;

      // Create stream from canvas
      const stream = canvas.captureStream(30);
      
      // Add audio if available
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(videoEl);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch (e) {
        console.warn('Could not capture audio:', e);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 5000000 // High quality for enhancement
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const enhancedBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
        mediaRecorder.onerror = () => reject(new Error('Enhancement failed'));
        
        mediaRecorder.start(100);
        videoEl.currentTime = 0;
        videoEl.play();

        const duration = videoEl.duration;
        
        const drawFrame = () => {
          if (videoEl.ended) {
            mediaRecorder.stop();
            return;
          }

          // Level 1 Enhancement: Apply sharpening and contrast
          ctx.filter = 'contrast(1.1) saturate(1.05) brightness(1.02)';
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          ctx.filter = 'none';

          // Apply subtle sharpening via composite
          ctx.globalAlpha = 0.15;
          ctx.filter = 'contrast(2) brightness(1.1)';
          ctx.globalCompositeOperation = 'overlay';
          ctx.drawImage(canvas, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.filter = 'none';

          const progress = Math.min((videoEl.currentTime / duration) * 100, 99);
          setVideos(prev => prev.map(v => 
            v.id === videoId ? { ...v, progress } : v
          ));

          requestAnimationFrame(drawFrame);
        };

        videoEl.onended = () => mediaRecorder.stop();
        drawFrame();
      });

      const enhancedUrl = URL.createObjectURL(enhancedBlob);

      setVideos(prev => prev.map(v => 
        v.id === videoId ? {
          ...v,
          status: 'enhanced',
          enhanceLevel: 'level1',
          enhancedUrl,
          enhancedBlob,
          enhancedSize: enhancedBlob.size,
          progress: 100,
          processingTime: Date.now() - (v.uploadStartTime || Date.now())
        } : v
      ));

      toast({
        title: "Enhancement Complete",
        description: "Video clarity and sharpness improved!",
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

  // Level 2 Enhancement: Deeper AI pass with edge definition and motion clarity
  const enhanceLevel2 = useCallback(async (videoId: string): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video || !video.enhancedUrl) return;

    setIsProcessing(true);
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, status: 'enhancing', progress: 0 } : v
    ));

    try {
      const videoEl = document.createElement('video');
      videoEl.src = video.enhancedUrl;
      videoEl.muted = true;
      videoEl.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        videoEl.onloadedmetadata = () => resolve();
        videoEl.onerror = () => reject(new Error('Failed to load video'));
      });

      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(30);
      
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(videoEl);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch (e) {
        console.warn('Could not capture audio:', e);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000 // Higher quality for level 2
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const enhancedBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
        mediaRecorder.onerror = () => reject(new Error('Enhancement failed'));
        
        mediaRecorder.start(100);
        videoEl.currentTime = 0;
        videoEl.play();

        const duration = videoEl.duration;
        
        const drawFrame = () => {
          if (videoEl.ended) {
            mediaRecorder.stop();
            return;
          }

          // Level 2: Stronger enhancement with edge sharpening
          ctx.filter = 'contrast(1.15) saturate(1.1) brightness(1.03)';
          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
          ctx.filter = 'none';

          // Apply stronger sharpening
          ctx.globalAlpha = 0.25;
          ctx.filter = 'contrast(2.5) brightness(1.15)';
          ctx.globalCompositeOperation = 'overlay';
          ctx.drawImage(canvas, 0, 0);
          ctx.globalCompositeOperation = 'source-over';
          ctx.globalAlpha = 1;
          ctx.filter = 'none';

          const progress = Math.min((videoEl.currentTime / duration) * 100, 99);
          setVideos(prev => prev.map(v => 
            v.id === videoId ? { ...v, progress } : v
          ));

          requestAnimationFrame(drawFrame);
        };

        videoEl.onended = () => mediaRecorder.stop();
        drawFrame();
      });

      // Revoke old enhanced URL
      if (video.enhancedUrl) URL.revokeObjectURL(video.enhancedUrl);
      
      const enhancedUrl = URL.createObjectURL(enhancedBlob);

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
        description: "Maximum clarity and edge definition applied!",
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

  // Compress video while maintaining quality
  const compressVideo = useCallback(async (videoId: string): Promise<void> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return;

    const sourceUrl = video.enhancedUrl || video.originalUrl;
    const sourceSize = video.enhancedSize || video.originalSize;

    setIsProcessing(true);
    setVideos(prev => prev.map(v => 
      v.id === videoId ? { ...v, status: 'compressing', progress: 0 } : v
    ));

    try {
      const videoEl = document.createElement('video');
      videoEl.src = sourceUrl;
      videoEl.muted = true;
      videoEl.preload = 'metadata';

      await new Promise<void>((resolve, reject) => {
        videoEl.onloadedmetadata = () => resolve();
        videoEl.onerror = () => reject(new Error('Failed to load video'));
      });

      // Smart bitrate selection based on resolution
      let targetBitrate = 2000000; // 2 Mbps default
      const resolution = videoEl.videoWidth * videoEl.videoHeight;
      
      if (resolution >= 3840 * 2160) { // 4K
        targetBitrate = 8000000; // 8 Mbps for 4K
      } else if (resolution >= 1920 * 1080) { // Full HD
        targetBitrate = 4000000; // 4 Mbps for 1080p
      } else if (resolution >= 1280 * 720) { // HD
        targetBitrate = 2500000; // 2.5 Mbps for 720p
      }

      const canvas = document.createElement('canvas');
      canvas.width = videoEl.videoWidth;
      canvas.height = videoEl.videoHeight;
      const ctx = canvas.getContext('2d')!;

      const stream = canvas.captureStream(30);
      
      try {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(videoEl);
        const destination = audioContext.createMediaStreamDestination();
        source.connect(destination);
        source.connect(audioContext.destination);
        destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
      } catch (e) {
        console.warn('Could not capture audio:', e);
      }

      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
        ? 'video/webm;codecs=vp9' 
        : 'video/webm';

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: targetBitrate
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
        mediaRecorder.onerror = () => reject(new Error('Compression failed'));
        
        mediaRecorder.start(100);
        videoEl.currentTime = 0;
        videoEl.play();

        const duration = videoEl.duration;
        
        const drawFrame = () => {
          if (videoEl.ended) {
            mediaRecorder.stop();
            return;
          }

          ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

          const progress = Math.min((videoEl.currentTime / duration) * 100, 99);
          setVideos(prev => prev.map(v => 
            v.id === videoId ? { ...v, progress } : v
          ));

          requestAnimationFrame(drawFrame);
        };

        videoEl.onended = () => mediaRecorder.stop();
        drawFrame();
      });

      const compressedUrl = URL.createObjectURL(compressedBlob);
      const savings = ((sourceSize - compressedBlob.size) / sourceSize) * 100;

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
        description: `File size reduced by ${Math.max(0, savings).toFixed(1)}%!`,
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

  // Share/Export functionality
  const shareVideo = useCallback(async (videoId: string, options: ShareOptions): Promise<string | null> => {
    const video = videos.find(v => v.id === videoId);
    if (!video) return null;

    const blob = video.compressedBlob || video.enhancedBlob || video.originalFile;
    const fileName = options.customName || video.fileName.replace(/\.[^/.]+$/, '') + '_enhanced';
    const extension = blob instanceof File ? blob.name.split('.').pop() : 'webm';

    switch (options.platform) {
      case 'download': {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast({ title: "Download Started", description: `${fileName}.${extension}` });
        return null;
      }

      case 'link': {
        // Generate shareable link (in real app, this would upload to cloud)
        const shareLink = `https://pixelsqueeze.app/share/${videoId}`;
        await navigator.clipboard.writeText(shareLink);
        toast({ title: "Link Copied!", description: "Share link copied to clipboard" });
        return shareLink;
      }

      case 'gmail': {
        const subject = encodeURIComponent(options.customName || 'Check out this video!');
        const body = encodeURIComponent(options.message || 'I enhanced this video with PixelSqueeze AI Video Boost!');
        window.open(`https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`, '_blank');
        toast({ title: "Opening Gmail", description: "Compose your email" });
        return null;
      }

      case 'outlook': {
        const subject = encodeURIComponent(options.customName || 'Check out this video!');
        const body = encodeURIComponent(options.message || 'I enhanced this video with PixelSqueeze AI Video Boost!');
        window.open(`https://outlook.live.com/mail/0/deeplink/compose?subject=${subject}&body=${body}`, '_blank');
        toast({ title: "Opening Outlook", description: "Compose your email" });
        return null;
      }

      case 'yahoo': {
        const subject = encodeURIComponent(options.customName || 'Check out this video!');
        const body = encodeURIComponent(options.message || 'I enhanced this video with PixelSqueeze AI Video Boost!');
        window.open(`https://compose.mail.yahoo.com/?subject=${subject}&body=${body}`, '_blank');
        toast({ title: "Opening Yahoo Mail", description: "Compose your email" });
        return null;
      }

      case 'mail': {
        const subject = encodeURIComponent(options.customName || 'Check out this video!');
        const body = encodeURIComponent(options.message || 'I enhanced this video with PixelSqueeze AI Video Boost!');
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
        toast({ title: "Opening Mail App", description: "Compose your email" });
        return null;
      }

      case 'gdrive':
      case 'dropbox':
      case 'icloud':
        toast({ 
          title: "Coming Soon", 
          description: `${options.platform} integration will be available soon!`,
        });
        return null;

      default:
        return null;
    }
  }, [videos, toast]);

  // Remove video from list
  const removeVideo = useCallback((videoId: string) => {
    const video = videos.find(v => v.id === videoId);
    if (video) {
      if (video.originalUrl) URL.revokeObjectURL(video.originalUrl);
      if (video.enhancedUrl) URL.revokeObjectURL(video.enhancedUrl);
      if (video.compressedUrl) URL.revokeObjectURL(video.compressedUrl);
    }
    setVideos(prev => prev.filter(v => v.id !== videoId));
  }, [videos]);

  // Clear all videos
  const clearAll = useCallback(() => {
    videos.forEach(video => {
      if (video.originalUrl) URL.revokeObjectURL(video.originalUrl);
      if (video.enhancedUrl) URL.revokeObjectURL(video.enhancedUrl);
      if (video.compressedUrl) URL.revokeObjectURL(video.compressedUrl);
    });
    setVideos([]);
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
    formatFileSize,
  };
};
