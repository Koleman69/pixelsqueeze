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
}

export interface ProcessedFile {
  id: string;
  file: File;
  preview?: string;
  status: 'pending' | 'uploading' | 'analyzing' | 'completed' | 'error';
  progress: number;
  result?: AnalysisResult;
}

export interface AnalysisRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  content: string;
  analysisType: 'general' | 'detailed' | 'summary';
}
