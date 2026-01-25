import { supabase } from "@/integrations/supabase/client";
import { AnalysisRequest, AnalysisResult } from "@/types/analysis";

export class GeminiService {
  static async analyzeFile(request: AnalysisRequest): Promise<Omit<AnalysisResult, 'id' | 'timestamp' | 'status'>> {
    const { data, error } = await supabase.functions.invoke('analyze-file', {
      body: request
    });

    if (error) {
      throw new Error(error.message || 'Failed to analyze file');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      fileName: request.fileName,
      fileType: request.fileType,
      fileSize: request.fileSize,
      analysis: data.analysis || 'No analysis available',
      insights: data.insights || [],
      suggestions: data.suggestions || []
    };
  }

  static async readFileContent(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (file.type.startsWith('image/')) {
          resolve(`[Image file: ${file.name}]`);
        } else if (file.type.startsWith('video/')) {
          resolve(`[Video file: ${file.name}]`);
        } else {
          resolve(reader.result as string);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        resolve(`[${file.type.split('/')[0]} file: ${file.name}]`);
      } else {
        reader.readAsText(file);
      }
    });
  }

  static getFileTypeCategory(file: File): string {
    const type = file.type.toLowerCase();
    if (type.includes('image')) return 'Image';
    if (type.includes('video')) return 'Video';
    if (type.includes('pdf')) return 'PDF Document';
    if (type.includes('json')) return 'JSON';
    if (type.includes('javascript') || type.includes('typescript')) return 'Code';
    if (type.includes('html')) return 'HTML';
    if (type.includes('css')) return 'CSS';
    if (type.includes('text')) return 'Text';
    if (type.includes('csv')) return 'CSV Data';
    if (type.includes('xml')) return 'XML';
    return 'Document';
  }
}
