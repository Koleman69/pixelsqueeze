import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Image, Video, FileIcon, Clock, AlertCircle, Minimize2, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SharedFileData {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  share_code: string;
  download_count: number;
  expires_at: string;
  created_at: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function SharedFile() {
  const { shareCode } = useParams<{ shareCode: string }>();
  const [fileData, setFileData] = useState<SharedFileData | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFile = async () => {
      if (!shareCode) {
        setError('No share code provided');
        setLoading(false);
        return;
      }

      try {
        // Fetch file data by share code
        const { data, error: fetchError } = await supabase
          .from('shared_files')
          .select('*')
          .eq('share_code', shareCode)
          .single();

        if (fetchError || !data) {
          setError('File not found or has been removed');
          setLoading(false);
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setIsExpired(true);
          setLoading(false);
          return;
        }

        setFileData(data);

        // Get public URL
        const { data: { publicUrl: url } } = supabase.storage
          .from('shared-files')
          .getPublicUrl(data.file_path);

        setPublicUrl(url);
      } catch (err) {
        console.error('Error fetching shared file:', err);
        setError('Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    fetchFile();
  }, [shareCode]);

  const handleDownload = async () => {
    if (!publicUrl || !fileData) return;

    try {
      const response = await fetch(publicUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileData.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Update download count (optional - this may fail without auth)
      await supabase
        .from('shared_files')
        .update({ download_count: (fileData.download_count || 0) + 1 })
        .eq('id', fileData.id);

      toast({
        title: 'Download Started',
        description: `Downloading ${fileData.file_name}`,
      });
    } catch (err) {
      console.error('Download error:', err);
      toast({
        title: 'Download Failed',
        description: 'Could not download the file',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = () => {
    if (!fileData?.file_type) return <FileIcon className="w-16 h-16" />;
    if (fileData.file_type.startsWith('image/')) return <Image className="w-16 h-16" />;
    if (fileData.file_type.startsWith('video/')) return <Video className="w-16 h-16" />;
    return <FileIcon className="w-16 h-16" />;
  };

  const isImage = fileData?.file_type?.startsWith('image/');
  const isVideo = fileData?.file_type?.startsWith('video/');

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || isExpired) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-destructive" />
          <h1 className="text-2xl font-bold mb-2">
            {isExpired ? 'Link Expired' : 'File Not Found'}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isExpired 
              ? 'This shared link has expired. Please ask the owner to share the file again.'
              : error || 'The file you are looking for does not exist or has been removed.'}
          </p>
          <Link to="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card border-b border-border px-6 py-4">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <Minimize2 className="w-6 h-6 text-primary mr-2" />
            <h1 className="text-xl font-bold">Pixelsqueeze</h1>
          </Link>
          <Badge variant="outline">
            <Clock className="w-3 h-3 mr-1" />
            Expires {formatDate(fileData?.expires_at || '')}
          </Badge>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        <Card className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Shared File</h2>
            <p className="text-muted-foreground">
              Someone shared a compressed file with you
            </p>
          </div>

          {/* Preview */}
          <div className="mb-8">
            {isImage && publicUrl && (
              <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                <img 
                  src={publicUrl} 
                  alt={fileData?.file_name}
                  className="max-w-full max-h-[500px] object-contain"
                />
              </div>
            )}
            {isVideo && publicUrl && (
              <div className="rounded-lg overflow-hidden bg-muted">
                <video 
                  src={publicUrl}
                  controls
                  className="w-full max-h-[500px]"
                />
              </div>
            )}
            {!isImage && !isVideo && (
              <div className="flex items-center justify-center py-12 bg-muted rounded-lg">
                {getFileIcon()}
              </div>
            )}
          </div>

          {/* File Info */}
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon()}
                <div>
                  <p className="font-semibold">{fileData?.file_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(fileData?.file_size || 0)} • {fileData?.file_type}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Downloads</p>
                <p className="font-semibold">{fileData?.download_count || 0}</p>
              </div>
              <div className="p-3 bg-muted/30 rounded-lg">
                <p className="text-muted-foreground">Shared</p>
                <p className="font-semibold">{formatDate(fileData?.created_at || '')}</p>
              </div>
            </div>
          </div>

          {/* Download Button */}
          <Button 
            onClick={handleDownload} 
            size="lg" 
            className="w-full bg-gradient-profit"
          >
            <Download className="w-5 h-5 mr-2" />
            Download File
          </Button>

          {/* CTA */}
          <div className="mt-8 p-4 bg-primary/5 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Compress your own images and videos for free
            </p>
            <Link to="/">
              <Button variant="outline" size="sm">
                Try Pixelsqueeze
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
