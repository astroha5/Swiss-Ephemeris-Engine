import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Image from '../../../components/AppImage';

const FilePreview = ({ file, onRemove, onRotate, processingStatus }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return 'Image';
    if (file.type === 'application/pdf') return 'FileText';
    return 'File';
  };

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  return (
    <div className="bg-surface border border-border rounded-lg p-4 space-y-4">
      {/* File Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Icon name={getFileIcon(file)} size={20} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {file.name}
            </p>
            <p className="text-xs text-text-muted">
              {formatFileSize(file.size)}
            </p>
          </div>
        </div>
        
        <Button
          variant="ghost"
          onClick={onRemove}
          iconName="X"
          size="sm"
          className="text-text-muted hover:text-error"
        />
      </div>

      {/* File Preview */}
      {isImage && (
        <div className="relative">
          <div className="w-full h-48 bg-surface-secondary rounded-lg overflow-hidden border border-border-light">
            <Image
              src={URL.createObjectURL(file)}
              alt="Kundli preview"
              className="w-full h-full object-contain"
            />
          </div>
          
          {/* Image Controls */}
          <div className="absolute top-2 right-2 flex space-x-1">
            <Button
              variant="secondary"
              onClick={onRotate}
              iconName="RotateCw"
              size="sm"
              className="bg-surface/90 backdrop-blur-sm"
            />
          </div>
        </div>
      )}

      {isPDF && (
        <div className="w-full h-32 bg-surface-secondary rounded-lg border border-border-light flex items-center justify-center">
          <div className="text-center">
            <Icon name="FileText" size={32} className="text-primary mx-auto mb-2" />
            <p className="text-sm text-text-secondary">PDF Preview</p>
          </div>
        </div>
      )}

      {/* Processing Status */}
      {processingStatus && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-text-primary">
              {processingStatus.stage}
            </span>
            <span className="text-sm text-text-muted">
              {processingStatus.progress}%
            </span>
          </div>
          
          <div className="w-full bg-surface-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${processingStatus.progress}%` }}
            />
          </div>
          
          {processingStatus.estimatedTime && (
            <p className="text-xs text-text-muted text-center">
              Estimated time remaining: {processingStatus.estimatedTime}
            </p>
          )}
        </div>
      )}

      {/* File Validation Status */}
      <div className="flex items-center space-x-2 p-3 bg-success/5 border border-success/20 rounded-lg">
        <Icon name="CheckCircle" size={16} className="text-success" />
        <span className="text-sm text-success font-medium">
          File validated successfully
        </span>
      </div>
    </div>
  );
};

export default FilePreview;