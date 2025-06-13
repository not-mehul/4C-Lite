import React, { useCallback, useState } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { validateFile, parseFile, getSupportedFileTypes, getFileTypeDescription } from '../utils/fileUtils';

interface FileUploadProps {
  onFileUpload: (data: { headers: string[]; rows: string[][] }) => void;
  onError: (error: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, onError }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleFile = useCallback(async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onError(validationError);
      setUploadStatus('error');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('idle');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const data = await parseFile(file);

      if (data.rows.length === 0) {
        throw new Error('No data rows found in file');
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      setTimeout(() => {
        onFileUpload(data);
      }, 500);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse file';
      onError(errorMessage);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload, onError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const supportedTypes = getSupportedFileTypes();

  return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">
            Upload Your Camera Data File
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload your file to begin the Command Connector Compatibility analysis. Max Size: 25MB.
          </p>
        </div>

        <div
            className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 shadow-sm
          ${isDragOver
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-400'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }
          ${isUploading ? 'pointer-events-none' : 'cursor-pointer hover:shadow-md'}
        `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isUploading && document.getElementById('file-input')?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload file area"
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
                e.preventDefault();
                document.getElementById('file-input')?.click();
              }
            }}
        >
          <input
              id="file-input"
              type="file"
              accept={supportedTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
              disabled={isUploading}
          />

          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
                <>
                  <div
                      className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                  <div className="w-full max-w-xs">
                    <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                          className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{width: `${uploadProgress}%`}}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      Processing... {uploadProgress}%
                    </p>
                  </div>
                </>
            ) : uploadStatus === 'success' ? (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400"/>
                  <p className="text-green-600 dark:text-green-400 font-medium">
                    File uploaded successfully!
                  </p>
                </>
            ) : uploadStatus === 'error' ? (
                <>
                  <AlertCircle className="w-16 h-16 text-red-500 dark:text-red-400"/>
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    Upload failed. Please try again.
                  </p>
                </>
            ) : (
                <>
                  <Upload className="w-16 h-16 text-gray-400 dark:text-gray-500"/>
                  <div>
                    <p className="text-lg font-medium text-gray-900 dark:text-white">
                      Drop your file here
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                      or <span
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium">browse to upload</span>
                    </p>
                  </div>
                </>
            )}
          </div>

          <div
              className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <FileText className="w-4 h-4 mr-1"/>
              CSV files
            </div>
            <div className="flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-1"/>
              Excel files (.xlsx, .xls)
            </div>
            <div className="flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-1"/>
              OpenDocument (.ods)
            </div>
            <div className="flex items-center">
              <FileSpreadsheet className="w-4 h-4 mr-1"/>
              Numbers (.numbers)
            </div>
          </div>
        </div>
      </div>
  );
};