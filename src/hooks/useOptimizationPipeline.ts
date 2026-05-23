import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  runOptimizationPipeline,
  runBatchPipeline,
  PipelineOptions,
  PipelineResult,
  GoalPreset,
  OutputFormat,
} from '@/services/imageOptimizationPipeline';
import JSZip from 'jszip';

export interface PipelineJob {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: PipelineResult;
  error?: string;
}

function isAppleMobileDevice() {
  if (typeof navigator === 'undefined') return false;

  return /iPad|iPhone|iPod/i.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalonePwa() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia?.('(display-mode: standalone)').matches
    || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

type SaveBlobResult = 'shared' | 'downloaded' | 'opened';

async function saveBlob(blob: Blob, fileName: string): Promise<SaveBlobResult> {
  const prefersNativeShare = isAppleMobileDevice() || isStandalonePwa();
  const shareFile = new File([blob], fileName, { type: blob.type || 'application/octet-stream' });

  if (prefersNativeShare && navigator.share && navigator.canShare) {
    try {
      if (navigator.canShare({ files: [shareFile] })) {
        await navigator.share({
          files: [shareFile],
          title: fileName,
        });
        return 'shared';
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return 'shared';
      }
    }
  }

  if (prefersNativeShare && typeof window !== 'undefined') {
    const previewUrl = URL.createObjectURL(blob);
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
    setTimeout(() => URL.revokeObjectURL(previewUrl), 60000);
    return 'opened';
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      if (link.parentNode) document.body.removeChild(link);
      URL.revokeObjectURL(href);
    }, 60000);
    return 'downloaded';
  }

  throw new Error('Download is not supported in this environment.');
}

export function useOptimizationPipeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const processFiles = useCallback(async (
    files: File[],
    options: Partial<PipelineOptions> = {}
  ): Promise<PipelineResult[]> => {
    const fullOptions: PipelineOptions = {
      goal: options.goal ?? 'web',
      forceFormat: options.forceFormat,
      quality: options.quality,
      maxDimension: options.maxDimension,
      stripMetadata: options.stripMetadata ?? true,
      seoRename: options.seoRename ?? true,
      seoPrefix: options.seoPrefix,
      generateAltText: options.generateAltText ?? false,
      storeMetrics: options.storeMetrics ?? true,
      userId: user?.id,
    };

    // Create job entries
    const newJobs: PipelineJob[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      status: 'pending' as const,
      progress: 0,
    }));

    setJobs(prev => [...newJobs, ...prev]);
    setIsProcessing(true);
    setOverallProgress(0);

    const results = await runBatchPipeline(files, fullOptions, {
      onProgress: (completed, total, result) => {
        const pct = Math.round((completed / total) * 100);
        setOverallProgress(pct);

        setJobs(prev => prev.map((job, idx) => {
          // Find the matching job by index in our newJobs array
          const jobIndex = newJobs.findIndex(j => j.id === job.id);
          if (jobIndex === -1) return job;
          
          if (jobIndex < completed - 1) {
            return { ...job, status: 'completed' as const, progress: 100 };
          }
          if (jobIndex === completed - 1) {
            return {
              ...job,
              status: result ? 'completed' as const : 'failed' as const,
              progress: 100,
              result: result ?? undefined,
              error: result ? undefined : 'Processing failed',
            };
          }
          if (jobIndex === completed) {
            return { ...job, status: 'processing' as const, progress: 50 };
          }
          return job;
        }));
      },
      onError: (file, error) => {
        setJobs(prev => prev.map(job =>
          job.file === file
            ? { ...job, status: 'failed' as const, error: error.message }
            : job
        ));
      },
    });

    setIsProcessing(false);
    setOverallProgress(100);
    return results;
  }, [user?.id]);

  const downloadResult = useCallback(async (result: PipelineResult) => {
    try {
      const status = await saveBlob(result.blob, result.seoFileName);
      toast(
        status === 'opened'
          ? {
              title: 'Opened file preview',
              description: 'Your device may block direct downloads here, so the file opened in a new tab for saving.',
            }
          : {
              title: 'Download started',
              description: `Saving ${result.seoFileName}`,
            }
      );
    } catch (error) {
      console.error('Download failed:', error);
      window.open(result.url, '_blank', 'noopener,noreferrer');
      toast({
        title: 'Opened file preview',
        description: 'If your device blocks direct downloads, long-press the file and save it.',
      });
    }
  }, [toast]);

  const downloadAllAsZip = useCallback(async (results: PipelineResult[]) => {
    const zip = new JSZip();
    
    // Generate a manifest CSV
    let manifest = 'filename,alt_text,content_type,format,original_size,optimized_size,compression_ratio,dimensions\n';
    
    for (const result of results) {
      const arrayBuffer = await result.blob.arrayBuffer();
      zip.file(result.seoFileName, arrayBuffer);
      
      manifest += `"${result.seoFileName}","${result.altText}","${result.contentType}","${result.format}",${result.originalSize},${result.optimizedSize},${result.compressionRatio}%,"${result.outputWidth}x${result.outputHeight}"\n`;
    }
    
    zip.file('manifest.csv', manifest);
    
    try {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const status = await saveBlob(zipBlob, `optimized-images-${Date.now()}.zip`);
      toast(
        status === 'opened'
          ? {
              title: 'ZIP opened in a new tab',
              description: 'If the file does not save automatically on your device, use Share or Save to Files from the preview.',
            }
          : {
              title: 'ZIP ready',
              description: `Preparing ${results.length} optimized file${results.length > 1 ? 's' : ''} for download.`,
            }
      );
    } catch (error) {
      console.error('ZIP download failed:', error);
      toast({
        title: 'ZIP download failed',
        description: 'Please download files individually on this device.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const clearJobs = useCallback(() => {
    // Revoke URLs to free memory
    jobs.forEach(job => {
      if (job.result?.url) URL.revokeObjectURL(job.result.url);
    });
    setJobs([]);
    setOverallProgress(0);
  }, [jobs]);

  return {
    jobs,
    isProcessing,
    overallProgress,
    processFiles,
    downloadResult,
    downloadAllAsZip,
    clearJobs,
  };
}
