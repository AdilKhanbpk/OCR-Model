import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CloudUpload, File, X, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface FileUploadProps {
  onUploadComplete?: (result: any) => void;
}

export default function FileUpload({ onUploadComplete }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [languageHints, setLanguageHints] = useState('en');
  const [detectHandwriting, setDetectHandwriting] = useState(false);
  const [outputFormat, setOutputFormat] = useState('text');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await apiRequest('POST', '/api/dashboard/upload', formData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Upload successful',
        description: 'Your file has been processed successfully.',
      });
      setSelectedFiles([]);
      onUploadComplete?.(data);
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp', '.tiff'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select at least one file to upload.',
        variant: 'destructive',
      });
      return;
    }

    for (const file of selectedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('languageHints', languageHints);
      formData.append('detectHandwriting', detectHandwriting.toString());
      formData.append('searchablePdf', (outputFormat === 'searchable-pdf').toString());

      try {
        await uploadMutation.mutateAsync(formData);
      } catch (error) {
        // Error handled in mutation
        break;
      }
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4">Upload Documents</h3>
            
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors duration-300 ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary'
              }`}
              data-testid="file-upload-zone"
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <CloudUpload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    Drag & drop files here
                  </p>
                  <p className="text-muted-foreground mb-4">
                    or click to browse files
                  </p>
                  <Button type="button" variant="outline">
                    Choose Files
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Supports: JPG, PNG, PDF, TIFF • Max size: 50MB per file
                </p>
              </div>
            </div>

            {/* Selected Files */}
            {selectedFiles.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="font-medium text-foreground">Selected Files:</h4>
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <File className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      data-testid={`remove-file-${index}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* OCR Options */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-medium text-foreground mb-4">OCR Options</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={languageHints} onValueChange={setLanguageHints}>
                    <SelectTrigger id="language" data-testid="language-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ur">Urdu</SelectItem>
                      <SelectItem value="ar">Arabic</SelectItem>
                      <SelectItem value="en,ur">English + Urdu</SelectItem>
                      <SelectItem value="auto">Auto-detect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="output-format">Output Format</Label>
                  <Select value={outputFormat} onValueChange={setOutputFormat}>
                    <SelectTrigger id="output-format" data-testid="output-format-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Plain Text</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="searchable-pdf">Searchable PDF</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center space-x-2">
                <Checkbox
                  id="handwriting"
                  checked={detectHandwriting}
                  onCheckedChange={(checked) => setDetectHandwriting(checked === true)}
                  data-testid="handwriting-checkbox"
                />
                <Label htmlFor="handwriting" className="text-sm">
                  Detect handwriting
                </Label>
              </div>
            </CardContent>
          </Card>

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploadMutation.isPending}
            className="w-full"
            data-testid="upload-button"
          >
            {uploadMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CloudUpload className="w-4 h-4 mr-2" />
                Upload & Process Files
              </>
            )}
          </Button>

          {/* Error Display */}
          {uploadMutation.error && (
            <div className="flex items-center space-x-2 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <p className="text-sm text-destructive">
                {uploadMutation.error.message}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
