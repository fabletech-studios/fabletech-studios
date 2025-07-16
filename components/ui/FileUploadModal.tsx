'use client';

import { useState } from 'react';
import { X, Upload, FileVideo, FileAudio, Image } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  episodeId: string;
  seriesId: string;
  fileType: 'video' | 'audio' | 'thumbnail';
  currentFile?: string;
  onSuccess: () => void;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  episodeId,
  seriesId,
  fileType,
  currentFile,
  onSuccess
}: FileUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (fileType) {
      case 'video':
        return <FileVideo className="w-12 h-12 text-red-600" />;
      case 'audio':
        return <FileAudio className="w-12 h-12 text-red-600" />;
      case 'thumbnail':
        return <Image className="w-12 h-12 text-red-600" />;
    }
  };

  const getAcceptType = () => {
    switch (fileType) {
      case 'video':
        return 'video/*';
      case 'audio':
        return 'audio/*';
      case 'thumbnail':
        return 'image/*';
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);
    formData.append('episodeId', episodeId);
    formData.append('seriesId', seriesId);

    try {
      const res = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert(`${fileType} uploaded successfully!`);
        onSuccess();
        onClose();
      } else {
        alert('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">
            {currentFile ? 'Replace' : 'Upload'} {fileType}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col items-center p-8 border-2 border-dashed border-gray-700 rounded-lg">
            {getIcon()}
            <p className="mt-4 text-gray-400">
              {currentFile ? `Current: ${currentFile.split('/').pop()}` : 'No file selected'}
            </p>
          </div>

          <label className="block">
            <input
              type="file"
              accept={getAcceptType()}
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <div className="bg-gray-800 rounded-lg p-4 text-center cursor-pointer hover:bg-gray-700 transition">
              <Upload className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <span>{file ? file.name : `Choose ${fileType} file`}</span>
            </div>
          </label>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 rounded-lg"
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}