import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
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

export function useOptimizationPipeline() {
  const { user } = useAuth();
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

  const downloadResult = useCallback((result: PipelineResult) => {
    const link = document.createElement('a');
    link.href = result.url;
    link.download = result.seoFileName;
    link.click();
  }, []);

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
    
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(zipBlob);
    link.download = `optimized-images-${Date.now()}.zip`;
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

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
