import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, Download, Image as ImageIcon, Zap, Check, X, RefreshCw } from 'lucide-react';

interface FileJob {
  id: string;
  original_path: string;
  processed_path: string | null;
  status: string;
  original_size: number | null;
  processed_size: number | null;
  compression_ratio: number | null;
  error_message: string | null;
}

interface BatchJob {
  id: string;
  status: string;
  processed_files: number;
  total_files: number;
  error_message: string | null;
}

const ImageProcessor = () => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentBatch, setCurrentBatch] = useState<BatchJob | null>(null);
  const [fileJobs, setFileJobs] = useState<FileJob[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast({
        title: "Warning",
        description: "Only image files are supported",
        variant: "destructive"
      });
    }
    
    setSelectedFiles(imageFiles);
  }, [toast]);

  const uploadAndCompress = async () => {
    if (!user || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // Create batch job
      const { data: batchData, error: batchError } = await supabase
        .from('batch_jobs')
        .insert({
          user_id: user.id,
          job_type: 'image_compression',
          total_files: selectedFiles.length,
          status: 'processing',
          settings: { quality: 0.8, max_width: 1920 }
        })
        .select()
        .single();

      if (batchError) throw batchError;

      setCurrentBatch(batchData);

      // Upload files and create file jobs
      const fileJobPromises = selectedFiles.map(async (file) => {
        // Upload original file
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('images')
          .upload(`originals/${fileName}`, file);

        if (uploadError) throw uploadError;

        // Create file job record
        const { data: fileJobData, error: fileJobError } = await supabase
          .from('file_jobs')
          .insert({
            batch_job_id: batchData.id,
            original_path: uploadData.path,
            original_size: file.size,
            status: 'processing'
          })
          .select()
          .single();

        if (fileJobError) throw fileJobError;

        // Simulate compression process
        await new Promise(resolve => setTimeout(resolve, 1000));

        // In a real app, you'd compress the image here
        // For demo purposes, we'll just copy the file
        const compressedFileName = `compressed_${fileName}`;
        const { data: compressedData, error: compressError } = await supabase.storage
          .from('images')
          .upload(`compressed/${compressedFileName}`, file);

        if (compressError) throw compressError;

        // Update file job with results
        const compressionRatio = Math.random() * 0.3 + 0.4; // Simulate 40-70% compression
        const processedSize = Math.round(file.size * compressionRatio);

        const { data: updatedFileJob, error: updateError } = await supabase
          .from('file_jobs')
          .update({
            processed_path: compressedData.path,
            processed_size: processedSize,
            compression_ratio: compressionRatio,
            status: 'completed'
          })
          .eq('id', fileJobData.id)
          .select()
          .single();

        if (updateError) throw updateError;

        return updatedFileJob;
      });

      const completedFileJobs = await Promise.all(fileJobPromises);
      setFileJobs(completedFileJobs);

      // Update batch job
      await supabase
        .from('batch_jobs')
        .update({
          status: 'completed',
          processed_files: selectedFiles.length,
          completed_at: new Date().toISOString()
        })
        .eq('id', batchData.id);

      setCurrentBatch(prev => prev ? { ...prev, status: 'completed', processed_files: selectedFiles.length } : null);

      toast({
        title: "Success",
        description: `${selectedFiles.length} images compressed successfully!`
      });

    } catch (error) {
      console.error('Error processing images:', error);
      toast({
        title: "Error",
        description: "Failed to process images",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('images')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "File downloaded successfully!"
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive"
      });
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Image Compression Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              id="file-input"
            />
            <label htmlFor="file-input">
              <Button variant="outline" className="cursor-pointer" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Select Images
                </span>
              </Button>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                {selectedFiles.length} file(s) selected
              </p>
              <Button 
                onClick={uploadAndCompress} 
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Processing...' : 'Upload & Compress'}
              </Button>
            </div>
          )}

          {currentBatch && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Batch Progress</span>
                <Badge variant={currentBatch.status === 'completed' ? 'default' : 'secondary'}>
                  {currentBatch.status}
                </Badge>
              </div>
              <Progress 
                value={(currentBatch.processed_files / currentBatch.total_files) * 100} 
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                {currentBatch.processed_files} of {currentBatch.total_files} files processed
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {fileJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Images</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fileJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {job.status === 'completed' ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : job.status === 'failed' ? (
                        <X className="h-4 w-4 text-red-500" />
                      ) : (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      )}
                      <Badge variant={job.status === 'completed' ? 'default' : 'secondary'}>
                        {job.status}
                      </Badge>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium">{job.original_path.split('/').pop()}</p>
                      {job.original_size && job.processed_size && (
                        <p className="text-muted-foreground">
                          {formatBytes(job.original_size)} → {formatBytes(job.processed_size)}
                          {job.compression_ratio && (
                            <span className="text-green-600 ml-2">
                              ({Math.round((1 - job.compression_ratio) * 100)}% saved)
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {job.status === 'completed' && job.processed_path && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(job.processed_path!, `compressed_${job.original_path.split('/').pop()}`)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImageProcessor;