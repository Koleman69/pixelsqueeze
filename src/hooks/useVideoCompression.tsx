import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export type VideoOutputFormat = 'webm' | 'mp4';

export interface VideoCompressionSettings {
  quality: 'low' | 'medium' | 'high';
  maxWidth: number;
  maxHeight: number;
  videoBitrate: number; // kbps
  outputFormat: VideoOutputFormat;
  preserveAudio: boolean;
}

export interface VideoCompressionResult {
  id: string;
  fileName: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  status: 'processing' | 'completed' | 'failed' | 'paused' | 'cancelled';
  compressedVideo?: Blob;
  compressedUrl?: string;
  originalUrl?: string;
  error?: string;
  progress: number;
  outputFormat?: string;
  startTime?: number;
  estimatedTimeRemaining?: number;
  pausedTime?: number; // Track time spent paused
}

export type QueuePriority = 'high' | 'normal' | 'low';

export interface QueuedVideo {
  id: string;
  file: File;
  fileName: string;
  fileSize: number;
  priority: QueuePriority;
}

interface VideoCompressionRef {
  video: HTMLVideoElement;
  mediaRecorder: MediaRecorder;
}

export const useVideoCompression = () => {
  const [videoCompressions, setVideoCompressions] = useState<VideoCompressionResult[]>([]);
  const [videoQueue, setVideoQueue] = useState<QueuedVideo[]>([]);
  const [isQueueProcessing, setIsQueueProcessing] = useState(false);
  const compressionRefs = useRef<Map<string, VideoCompressionRef>>(new Map());
  const { toast } = useToast();

  const compressVideo = async (
    file: File,
    settings: VideoCompressionSettings = { 
      quality: 'medium', 
      maxWidth: 1280, 
      maxHeight: 720, 
      videoBitrate: 1000,
      outputFormat: 'webm',
      preserveAudio: true
    }
  ): Promise<string> => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const originalUrl = URL.createObjectURL(file);

    // Add initial entry
    const startTime = Date.now();
    const newCompression: VideoCompressionResult = {
      id,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: 0,
      compressionRatio: 0,
      status: 'processing',
      originalUrl,
      progress: 0,
      startTime
    };

    setVideoCompressions(prev => [newCompression, ...prev]);

    try {
      // Create video element to read the source
      const video = document.createElement('video');
      video.src = originalUrl;
      video.muted = true;
      
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error('Failed to load video'));
      });

      // Calculate target dimensions
      let targetWidth = video.videoWidth;
      let targetHeight = video.videoHeight;
      
      if (targetWidth > settings.maxWidth) {
        const ratio = settings.maxWidth / targetWidth;
        targetWidth = settings.maxWidth;
        targetHeight = Math.round(targetHeight * ratio);
      }
      
      if (targetHeight > settings.maxHeight) {
        const ratio = settings.maxHeight / targetHeight;
        targetHeight = settings.maxHeight;
        targetWidth = Math.round(targetWidth * ratio);
      }

      // Create canvas for frame processing
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d')!;

      // Get quality-based bitrate
      let bitrate = settings.videoBitrate * 1000;
      if (settings.quality === 'low') bitrate = 500000;
      else if (settings.quality === 'high') bitrate = 2500000;

      // Determine MIME type based on output format preference
      let mimeType: string;
      if (settings.outputFormat === 'mp4') {
        // Try MP4 first (Safari, some Chrome versions)
        if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
          mimeType = 'video/mp4;codecs=avc1';
        } else if (MediaRecorder.isTypeSupported('video/mp4')) {
          mimeType = 'video/mp4';
        } else {
          // Fallback to WebM if MP4 not supported
          mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
            ? 'video/webm;codecs=vp9'
            : 'video/webm;codecs=vp8';
        }
      } else {
        // WebM format
        mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') 
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp8')
            ? 'video/webm;codecs=vp8'
            : 'video/webm';
      }

      // Create stream from canvas
      const stream = canvas.captureStream(30);
      
      // Add audio track if preserveAudio is enabled
      if (settings.preserveAudio) {
        try {
          // Create an audio context to capture audio from the video
          const audioContext = new AudioContext();
          const source = audioContext.createMediaElementSource(video);
          const destination = audioContext.createMediaStreamDestination();
          source.connect(destination);
          source.connect(audioContext.destination); // Also connect to speakers for playback
          
          // Add audio tracks to the stream
          destination.stream.getAudioTracks().forEach(track => {
            stream.addTrack(track);
          });
        } catch (audioError) {
          console.warn('Could not capture audio track:', audioError);
        }
      }

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: bitrate
      });

      // Store refs for pause/resume functionality
      compressionRefs.current.set(id, { video, mediaRecorder });

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          compressionRefs.current.delete(id);
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        
        mediaRecorder.onerror = () => {
          compressionRefs.current.delete(id);
          reject(new Error('Recording failed'));
        };
        
        mediaRecorder.start(100);
        
        video.currentTime = 0;
        video.play();

        const duration = video.duration;
        let pausedDuration = 0;
        let lastPauseTime = 0;
        
        const drawFrame = () => {
          if (video.ended) {
            mediaRecorder.stop();
            return;
          }
          
          // Check if paused (video.paused but not ended)
          if (video.paused && !video.ended) {
            // Don't stop, just wait for resume
            requestAnimationFrame(drawFrame);
            return;
          }
          
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          
          // Update progress and estimate time remaining
          const progress = Math.min((video.currentTime / duration) * 100, 99);
          const elapsedTime = (Date.now() - startTime - pausedDuration) / 1000;
          let estimatedTimeRemaining: number | undefined;
          
          if (progress > 5) {
            const totalEstimatedTime = (elapsedTime / progress) * 100;
            estimatedTimeRemaining = Math.max(0, totalEstimatedTime - elapsedTime);
          }
          
          setVideoCompressions(prev => prev.map(comp => 
            comp.id === id ? { ...comp, progress, estimatedTimeRemaining } : comp
          ));
          
          requestAnimationFrame(drawFrame);
        };
        
        video.onended = () => {
          mediaRecorder.stop();
        };
        
        video.onpause = () => {
          lastPauseTime = Date.now();
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
          }
        };
        
        video.onplay = () => {
          if (lastPauseTime > 0) {
            pausedDuration += Date.now() - lastPauseTime;
            lastPauseTime = 0;
          }
          if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
          }
        };
        
        drawFrame();
      });

      const compressedUrl = URL.createObjectURL(compressedBlob);
      const compressionRatio = ((file.size - compressedBlob.size) / file.size) * 100;

      // Determine actual output format from MIME type
      const actualFormat = compressedBlob.type.includes('mp4') ? 'mp4' : 'webm';

      // Update with final result
      setVideoCompressions(prev => prev.map(comp => 
        comp.id === id 
          ? {
              ...comp,
              compressedSize: compressedBlob.size,
              compressionRatio: Math.max(0, compressionRatio),
              status: 'completed' as const,
              compressedVideo: compressedBlob,
              compressedUrl,
              progress: 100,
              outputFormat: actualFormat
            }
          : comp
      ));

      toast({
        title: "Video Compression Complete",
        description: `Reduced by ${compressionRatio.toFixed(1)}%`,
      });

      return id;
    } catch (error) {
      console.error('Video compression error:', error);
      
      setVideoCompressions(prev => prev.map(comp => 
        comp.id === id 
          ? { ...comp, status: 'failed' as const, error: (error as Error).message, progress: 0 }
          : comp
      ));

      toast({
        title: "Video Compression Failed",
        description: (error as Error).message,
        variant: "destructive"
      });

      throw error;
    }
  };

  const downloadCompressedVideo = (compressionId: string) => {
    const compression = videoCompressions.find(c => c.id === compressionId);
    if (compression?.compressedUrl) {
      const link = document.createElement('a');
      link.href = compression.compressedUrl;
      const extension = compression.outputFormat || (compression.compressedVideo?.type.includes('webm') ? 'webm' : 'mp4');
      link.download = `compressed_${compression.fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
      link.click();
    }
  };

  // Queue management functions
  const addToQueue = useCallback((files: File[], priority: QueuePriority = 'normal') => {
    const newQueueItems: QueuedVideo[] = files.map(file => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      file,
      fileName: file.name,
      fileSize: file.size,
      priority
    }));
    setVideoQueue(prev => [...prev, ...newQueueItems]);
    
    toast({
      title: "Added to Queue",
      description: `${files.length} video(s) added to compression queue`,
    });
  }, [toast]);

  const updatePriority = useCallback((id: string, priority: QueuePriority) => {
    setVideoQueue(prev => prev.map(item =>
      item.id === id ? { ...item, priority } : item
    ));
  }, []);

  const removeFromQueue = useCallback((id: string) => {
    setVideoQueue(prev => prev.filter(item => item.id !== id));
  }, []);

  const moveQueueItemUp = useCallback((id: string) => {
    setVideoQueue(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index <= 0) return prev;
      const newQueue = [...prev];
      [newQueue[index - 1], newQueue[index]] = [newQueue[index], newQueue[index - 1]];
      return newQueue;
    });
  }, []);

  const moveQueueItemDown = useCallback((id: string) => {
    setVideoQueue(prev => {
      const index = prev.findIndex(item => item.id === id);
      if (index === -1 || index >= prev.length - 1) return prev;
      const newQueue = [...prev];
      [newQueue[index], newQueue[index + 1]] = [newQueue[index + 1], newQueue[index]];
      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setVideoQueue([]);
  }, []);

  const processQueue = useCallback(async (settings: VideoCompressionSettings) => {
    if (videoQueue.length === 0 || isQueueProcessing) return;
    
    setIsQueueProcessing(true);
    
    // Sort queue by priority before processing (high first, then normal, then low)
    const priorityOrder: Record<QueuePriority, number> = { high: 0, normal: 1, low: 2 };
    const sortedQueue = [...videoQueue].sort((a, b) => 
      priorityOrder[a.priority] - priorityOrder[b.priority]
    );
    
    setVideoQueue([]); // Clear queue as we start processing
    
    for (const item of sortedQueue) {
      try {
        await compressVideo(item.file, settings);
      } catch (error) {
        console.error(`Failed to compress ${item.fileName}:`, error);
      }
    }
    
    setIsQueueProcessing(false);
    
    toast({
      title: "Queue Complete",
      description: `Finished processing ${sortedQueue.length} video(s)`,
    });
  }, [videoQueue, isQueueProcessing, compressVideo, toast]);

  const compressVideoBatch = async (
    files: File[],
    settings: VideoCompressionSettings
  ): Promise<string[]> => {
    const ids: string[] = [];
    
    // Process videos sequentially to avoid overwhelming the browser
    for (const file of files) {
      try {
        const id = await compressVideo(file, settings);
        ids.push(id);
      } catch (error) {
        console.error(`Failed to compress ${file.name}:`, error);
        // Continue with other videos even if one fails
      }
    }
    
    return ids;
  };

  const downloadAllVideos = async () => {
    const completedCompressions = videoCompressions.filter(c => 
      c.status === 'completed' && c.compressedVideo
    );

    if (completedCompressions.length === 0) {
      toast({
        title: "No Videos Ready",
        description: "No compressed videos available for download",
        variant: "destructive"
      });
      return;
    }

    // Import JSZip dynamically
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();

    completedCompressions.forEach((compression) => {
      if (compression.compressedVideo) {
        const extension = compression.outputFormat || 'webm';
        const fileName = `compressed_${compression.fileName.replace(/\.[^/.]+$/, '')}.${extension}`;
        zip.file(fileName, compression.compressedVideo);
      }
    });

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `compressed-videos-${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({
        title: "Download Complete",
        description: `Downloaded ${completedCompressions.length} compressed videos as ZIP`,
      });
    } catch (error) {
      console.error('Bulk download error:', error);
      toast({
        title: "Download Failed",
        description: "Failed to create ZIP file",
        variant: "destructive"
      });
    }
  };

  const pauseCompression = (compressionId: string) => {
    const ref = compressionRefs.current.get(compressionId);
    if (ref && !ref.video.paused) {
      ref.video.pause();
      setVideoCompressions(prev => prev.map(comp =>
        comp.id === compressionId ? { ...comp, status: 'paused' as const } : comp
      ));
    }
  };

  const resumeCompression = (compressionId: string) => {
    const ref = compressionRefs.current.get(compressionId);
    if (ref && ref.video.paused) {
      ref.video.play();
      setVideoCompressions(prev => prev.map(comp =>
        comp.id === compressionId ? { ...comp, status: 'processing' as const } : comp
      ));
    }
  };

  const cancelCompression = (compressionId: string) => {
    const ref = compressionRefs.current.get(compressionId);
    if (ref) {
      // Stop the video and media recorder
      ref.video.pause();
      ref.video.src = '';
      if (ref.mediaRecorder.state !== 'inactive') {
        ref.mediaRecorder.stop();
      }
      compressionRefs.current.delete(compressionId);
      
      setVideoCompressions(prev => prev.map(comp =>
        comp.id === compressionId 
          ? { ...comp, status: 'cancelled' as const, progress: 0 } 
          : comp
      ));

      toast({
        title: "Compression Cancelled",
        description: "Video compression has been aborted",
      });
    }
  };

  const clearVideoCompressions = () => {
    // Revoke object URLs to free memory
    videoCompressions.forEach(comp => {
      if (comp.originalUrl) URL.revokeObjectURL(comp.originalUrl);
      if (comp.compressedUrl) URL.revokeObjectURL(comp.compressedUrl);
    });
    compressionRefs.current.clear();
    setVideoCompressions([]);
  };

  return {
    videoCompressions,
    videoQueue,
    isQueueProcessing,
    compressVideo,
    compressVideoBatch,
    downloadCompressedVideo,
    downloadAllVideos,
    clearVideoCompressions,
    pauseCompression,
    resumeCompression,
    cancelCompression,
    addToQueue,
    removeFromQueue,
    moveQueueItemUp,
    moveQueueItemDown,
    clearQueue,
    processQueue,
    updatePriority
  };
};
