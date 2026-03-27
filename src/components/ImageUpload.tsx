import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { UploadCloud, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';

interface UploadedImage {
  url: string;
  publicId: string;
  optimized: {
    small: string;
    medium: string;
    large: string;
    xlarge: string;
  };
}

interface ImageUploadProps {
  onUploadComplete?: (images: UploadedImage[]) => void;
  multiple?: boolean;
  maxFiles?: number;
}

export function ImageUpload({ 
  onUploadComplete, 
  multiple = true,
  maxFiles = 5 
}: ImageUploadProps) {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setSuccess(false);

    if (acceptedFiles.length === 0) {
      setError('No valid image files provided');
      return;
    }

    if (!multiple && acceptedFiles.length > 1) {
      setError('Only one file is allowed');
      return;
    }

    if (multiple && acceptedFiles.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      
      acceptedFiles.forEach(file => {
        formData.append(multiple ? 'images' : 'image', file);
      });

      const endpoint = multiple ? '/api/images/upload-multiple' : '/api/images/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();

      if (multiple && data.images) {
        setUploadedImages(data.images);
        onUploadComplete?.(data.images);
      } else if (data.url) {
        const singleImage: UploadedImage = {
          url: data.url,
          publicId: data.publicId,
          optimized: data.optimized,
        };
        setUploadedImages([singleImage]);
        onUploadComplete?.([singleImage]);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  }, [multiple, maxFiles, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple,
    maxFiles: multiple ? maxFiles : 1,
  });

  const removeImage = async (publicId: string) => {
    try {
      await fetch('/api/images/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ publicId }),
      });

      setUploadedImages(uploadedImages.filter(img => img.publicId !== publicId));
    } catch (err) {
      setError('Failed to delete image');
    }
  };

  return (
    <Card className="dark:bg-gray-900 dark:border-gray-800">
      <CardHeader>
        <CardTitle className="dark:text-white">Image Upload</CardTitle>
        <CardDescription className="dark:text-gray-400">
          {multiple
            ? `Upload up to ${maxFiles} product images (JPEG, PNG, WebP, GIF)`
            : 'Upload a single product image (JPEG, PNG, WebP, GIF)'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-gray-300 dark:border-gray-700 hover:border-primary'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center gap-4">
            {uploading ? (
              <>
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
                <p className="text-sm font-medium dark:text-white">Uploading...</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-gray-400" />
                <div>
                  <p className="text-sm font-medium dark:text-white mb-1">
                    {isDragActive
                      ? 'Drop images here'
                      : 'Drag images here or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Maximum 10MB per file
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="dark:border-red-900 dark:bg-red-950">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="dark:text-red-200">{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              Images uploaded successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Uploaded Images Grid */}
        {uploadedImages.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-4 dark:text-white">
              Uploaded Images ({uploadedImages.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {uploadedImages.map(image => (
                <div key={image.publicId} className="relative group">
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={image.optimized.small}
                      alt="Uploaded"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeImage(image.publicId)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete image"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Optimization Badge */}
                  <Badge className="absolute bottom-2 left-2 bg-green-500 text-white text-xs">
                    Optimized
                  </Badge>
                </div>
              ))}
            </div>

            {/* Responsive Sizes */}
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-semibold mb-3 dark:text-white">Available Sizes</h4>
              <div className="space-y-2">
                {uploadedImages[0] && (
                  <>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">Mobile (300x300)</span>
                      <code className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {uploadedImages[0].optimized.small.substring(0, 50)}...
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">Tablet (600x600)</span>
                      <code className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {uploadedImages[0].optimized.medium.substring(0, 50)}...
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">Desktop (1200x900)</span>
                      <code className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {uploadedImages[0].optimized.large.substring(0, 50)}...
                      </code>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-300">4K (1920x1440)</span>
                      <code className="text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {uploadedImages[0].optimized.xlarge.substring(0, 50)}...
                      </code>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
