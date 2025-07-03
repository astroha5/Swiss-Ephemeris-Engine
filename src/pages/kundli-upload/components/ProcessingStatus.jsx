import React from 'react';
import Icon from '../../../components/AppIcon';

const ProcessingStatus = ({ status, progress, stage, estimatedTime, error }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'uploading':
        return { name: 'Upload', className: 'text-primary animate-pulse' };
      case 'processing':
        return { name: 'Loader2', className: 'text-primary animate-spin' };
      case 'analyzing':
        return { name: 'Brain', className: 'text-primary animate-pulse' };
      case 'completed':
        return { name: 'CheckCircle', className: 'text-success' };
      case 'error':
        return { name: 'AlertCircle', className: 'text-error' };
      default:
        return { name: 'Clock', className: 'text-text-muted' };
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading your kundli...';
      case 'processing':
        return 'Processing image and extracting chart data...';
      case 'analyzing':
        return 'AI is analyzing your chart for interpretations...';
      case 'completed':
        return 'Analysis complete! Redirecting to results...';
      case 'error':
        return error || 'An error occurred during processing';
      default:
        return 'Preparing to process...';
    }
  };

  const statusIcon = getStatusIcon();

  if (!status || status === 'idle') return null;

  return (
    <div className="bg-surface border border-border rounded-lg p-6">
      {/* Status Header */}
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
          <Icon 
            name={statusIcon.name} 
            size={24} 
            className={statusIcon.className}
          />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            {stage || getStatusMessage()}
          </h3>
          {estimatedTime && status !== 'completed' && status !== 'error' && (
            <p className="text-sm text-text-muted">
              Estimated time: {estimatedTime}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {progress !== undefined && status !== 'completed' && status !== 'error' && (
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Progress</span>
            <span className="text-text-primary font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-surface-secondary rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Processing Steps */}
      {status === 'processing' || status === 'analyzing' ? (
        <div className="space-y-3">
          <div className="text-sm font-medium text-text-primary mb-2">
            Processing Steps:
          </div>
          
          {[
            { step: 'Image Upload', completed: true },
            { step: 'Chart Recognition', completed: status !== 'uploading' },
            { step: 'Data Extraction', completed: status === 'analyzing' || status === 'completed' },
            { step: 'AI Analysis', completed: status === 'completed' }
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className={`
                w-4 h-4 rounded-full flex items-center justify-center
                ${item.completed 
                  ? 'bg-success text-success-foreground' 
                  : 'bg-surface-secondary border border-border'
                }
              `}>
                {item.completed && (
                  <Icon name="Check" size={10} />
                )}
              </div>
              <span className={`
                text-sm
                ${item.completed ? 'text-text-primary' : 'text-text-muted'}
              `}>
                {item.step}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {/* Error Details */}
      {status === 'error' && (
        <div className="mt-4 p-3 bg-error/5 border border-error/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <Icon name="AlertTriangle" size={16} className="text-error mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-error font-medium mb-1">
                Processing Failed
              </p>
              <p className="text-xs text-text-secondary">
                {error || 'Please try uploading again or use manual entry instead.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {status === 'completed' && (
        <div className="mt-4 p-3 bg-success/5 border border-success/20 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="CheckCircle" size={16} className="text-success" />
            <p className="text-sm text-success font-medium">
              Your kundli has been successfully processed and analyzed!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingStatus;