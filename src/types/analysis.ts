export interface AnalysisResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  analysis: string;
  insights: string[];
  suggestions: string[];
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  isImage?: boolean;
  preview?: string;
}

export interface ProcessedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  result?: AnalysisResult;
  isImage?: boolean;
}

export interface AnalysisRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  content: string;
  analysisType: 'general' | 'detailed' | 'summary';
  isImage?: boolean;
  imageData?: string;
}
