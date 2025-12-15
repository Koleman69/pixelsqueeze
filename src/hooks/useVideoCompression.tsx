import { useState } from 'react';
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
  status: 'processing' | 'completed' | 'failed';
  compressedVideo?: Blob;
  compressedUrl?: string;
  originalUrl?: string;
  error?: string;
  progress: number;
  outputFormat?: string;
}

export const useVideoCompression = () => {
  const [videoCompressions, setVideoCompressions] = useState<VideoCompressionResult[]>([]);
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
    const newCompression: VideoCompressionResult = {
      id,
      fileName: file.name,
      originalSize: file.size,
      compressedSize: 0,
      compressionRatio: 0,
      status: 'processing',
      originalUrl,
      progress: 0
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

      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const compressedBlob = await new Promise<Blob>((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          resolve(blob);
        };
        
        mediaRecorder.onerror = () => reject(new Error('Recording failed'));
        
        mediaRecorder.start(100);
        
        video.currentTime = 0;
        video.play();

        const duration = video.duration;
        
        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop();
            return;
          }
          
          ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
          
          // Update progress
          const progress = Math.min((video.currentTime / duration) * 100, 99);
          setVideoCompressions(prev => prev.map(comp => 
            comp.id === id ? { ...comp, progress } : comp
          ));
          
          requestAnimationFrame(drawFrame);
        };
        
        video.onended = () => {
          mediaRecorder.stop();
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

  const clearVideoCompressions = () => {
    // Revoke object URLs to free memory
    videoCompressions.forEach(comp => {
      if (comp.originalUrl) URL.revokeObjectURL(comp.originalUrl);
      if (comp.compressedUrl) URL.revokeObjectURL(comp.compressedUrl);
    });
    setVideoCompressions([]);
  };

  return {
    videoCompressions,
    compressVideo,
    downloadCompressedVideo,
    clearVideoCompressions
  };
};
