import React, { useState, useRef } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const UploadZone = ({ onFileSelect, isProcessing, acceptedFiles }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => 
      acceptedFiles.includes(file.type) || 
      acceptedFiles.some(type => file.name.toLowerCase().endsWith(type.split('/')[1]))
    );
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles[0]);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const openCameraDialog = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full">
      {/* Main Upload Zone */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 md:p-12 text-center transition-celestial cursor-pointer
          ${isDragOver 
            ? 'border-primary bg-primary/5 scale-[1.02]' 
            : 'border-border hover:border-primary/50 hover:bg-primary/2'
          }
          ${isProcessing ? 'pointer-events-none opacity-60' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        {/* Upload Icon */}
        <div className="mx-auto w-16 h-16 md:w-20 md:h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Icon 
            name={isProcessing ? "Loader2" : "Upload"} 
            size={32} 
            className={`text-primary ${isProcessing ? 'animate-spin' : ''}`}
          />
        </div>

        {/* Upload Text */}
        <div className="space-y-2 mb-6">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-text-primary">
            {isProcessing ? 'Processing Upload...' : 'Upload Your Kundli'}
          </h3>
          <p className="text-text-secondary font-body">
            Drag and drop your kundli image or PDF here, or click to browse
          </p>
        </div>

        {/* File Format Info */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {['JPG', 'PNG', 'PDF'].map((format) => (
            <span 
              key={format}
              className="px-3 py-1 bg-surface-secondary rounded-full text-xs font-medium text-text-muted border border-border-light"
            >
              {format}
            </span>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            variant="primary"
            onClick={(e) => {
              e.stopPropagation();
              openFileDialog();
            }}
            iconName="FolderOpen"
            iconPosition="left"
            disabled={isProcessing}
            className="min-w-[140px]"
          >
            Browse Files
          </Button>
          
          {/* Camera Button - Mobile Only */}
          <div className="sm:hidden">
            <Button
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                openCameraDialog();
              }}
              iconName="Camera"
              iconPosition="left"
              disabled={isProcessing}
              className="min-w-[140px]"
            >
              Take Photo
            </Button>
          </div>
        </div>

        {/* Hidden File Inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Upload Tips */}
      <div className="mt-6 p-4 bg-surface-secondary rounded-lg border border-border-light">
        <div className="flex items-start space-x-3">
          <Icon name="Info" size={16} className="text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-text-primary">
              Tips for Best Results
            </h4>
            <ul className="text-xs text-text-secondary space-y-1 font-caption">
              <li>• Ensure the entire chart is visible and well-lit</li>
              <li>• North Indian style charts work best</li>
              <li>• Avoid shadows and reflections on the image</li>
              <li>• Maximum file size: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadZone;