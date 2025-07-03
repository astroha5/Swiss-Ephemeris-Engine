import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ActionButtonCluster from '../../components/ui/ActionButtonCluster';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import UploadZone from './components/UploadZone';
import FilePreview from './components/FilePreview';
import ProcessingStatus from './components/ProcessingStatus';
import UploadInstructions from './components/UploadInstructions';
import AlternativeOptions from './components/AlternativeOptions';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { processKundliImage } from '../../services/imageProcessing';
import { validateApiKey } from '../../services/deepseekApi';

const KundliUpload = () => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({
    status: 'idle', // idle, uploading, processing, analyzing, completed, error
    progress: 0,
    stage: '',
    estimatedTime: '',
    error: null
  });
  const [showInstructions, setShowInstructions] = useState(true);
  const [apiKeyValid, setApiKeyValid] = useState(null);
  const [processedResults, setProcessedResults] = useState(null);

  const acceptedFileTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf'
  ];

  // Check API key validity on component mount
  useEffect(() => {
    const checkApiKey = async () => {
      try {
        const result = await validateApiKey();
        setApiKeyValid(result.valid);
        
        if (!result.valid) {
          console.warn('DeepSeek API key validation failed:', result.error);
        }
      } catch (error) {
        console.error('API key validation error:', error);
        setApiKeyValid(false);
      }
    };

    checkApiKey();
  }, []);

  // Process uploaded file with DeepSeek AI
  const processWithDeepSeek = async (file) => {
    try {
      const result = await processKundliImage(file, (progress) => {
        setProcessingStatus(prev => ({
          ...prev,
          progress: progress.progress,
          stage: progress.stage,
          estimatedTime: getEstimatedTime(progress.progress)
        }));
      });

      if (result.success) {
        setProcessedResults(result);
        setProcessingStatus({
          status: 'completed',
          progress: 100,
          stage: 'Analysis complete!',
          estimatedTime: '',
          error: null
        });

        // Navigate to results with the processed data
        setTimeout(() => {
          navigate('/chart-results-dashboard', { 
            state: { 
              chartData: result.chartData,
              interpretation: result.interpretation,
              metadata: result.metadata
            }
          });
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to process kundli image');
      }

    } catch (error) {
      console.error('Processing error:', error);
      setProcessingStatus({
        status: 'error',
        progress: 0,
        stage: '',
        estimatedTime: '',
        error: error.message || 'Failed to process the uploaded file. Please try again or use manual entry.'
      });
    }
  };

  // Fallback simulation for when API is not available
  const simulateProcessing = async (file) => {
    const stages = [
      { status: 'uploading', stage: 'Uploading file...', progress: 20, time: '30 seconds' },
      { status: 'processing', stage: 'Processing image and extracting chart data...', progress: 50, time: '45 seconds' },
      { status: 'analyzing', stage: 'AI is analyzing your chart for interpretations...', progress: 80, time: '15 seconds' },
      { status: 'completed', stage: 'Analysis complete!', progress: 100, time: '' }
    ];

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      setProcessingStatus({
        status: stage.status,
        progress: stage.progress,
        stage: stage.stage,
        estimatedTime: stage.time,
        error: null
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Navigate to results after completion
    setTimeout(() => {
      navigate('/chart-results-dashboard');
    }, 1500);
  };

  const getEstimatedTime = (progress) => {
    if (progress < 25) return '2-3 minutes';
    if (progress < 50) return '1-2 minutes';
    if (progress < 75) return '30-60 seconds';
    if (progress < 95) return '15-30 seconds';
    return 'Almost done...';
  };

  const handleFileSelect = async (file) => {
    // Validate file type
    if (!acceptedFileTypes.includes(file.type)) {
      setProcessingStatus({
        status: 'error',
        progress: 0,
        stage: '',
        estimatedTime: '',
        error: 'Please upload a valid image (JPG, PNG) or PDF file.'
      });
      return;
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setProcessingStatus({
        status: 'error',
        progress: 0,
        stage: '',
        estimatedTime: '',
        error: 'File size must be less than 10MB. Please compress your image and try again.'
      });
      return;
    }

    setUploadedFile(file);
    setShowInstructions(false);
    
    // Start processing
    setProcessingStatus({
      status: 'uploading',
      progress: 5,
      stage: 'Preparing to process your kundli...',
      estimatedTime: '2-3 minutes',
      error: null
    });

    try {
      // Use DeepSeek AI if API key is valid, otherwise fallback to simulation
      if (apiKeyValid) {
        await processWithDeepSeek(file);
      } else {
        console.warn('DeepSeek API not available, using simulation mode');
        await simulateProcessing(file);
      }
    } catch (error) {
      console.error('File processing failed:', error);
      setProcessingStatus({
        status: 'error',
        progress: 0,
        stage: '',
        estimatedTime: '',
        error: error.message || 'Failed to process the uploaded file. Please try again or use manual entry.'
      });
    }
  };

  const handleFileRemove = () => {
    setUploadedFile(null);
    setProcessedResults(null);
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      stage: '',
      estimatedTime: '',
      error: null
    });
    setShowInstructions(true);
  };

  const handleFileRotate = () => {
    // In a real implementation, this would rotate the image
    console.log('Rotating image...');
  };

  const handleRetryProcessing = () => {
    if (uploadedFile) {
      if (apiKeyValid) {
        processWithDeepSeek(uploadedFile);
      } else {
        simulateProcessing(uploadedFile);
      }
    }
  };

  const handleManualEntry = () => {
    navigate('/birth-details-form');
  };

  const customActions = {
    primary: {
      label: processingStatus.status === 'error' ? 'Try Again' : 'Process Upload',
      icon: processingStatus.status === 'error' ? 'RefreshCw' : 'Upload',
      onClick: processingStatus.status === 'error' ? handleRetryProcessing : () => {},
      variant: 'primary',
      loading: ['uploading', 'processing', 'analyzing'].includes(processingStatus.status)
    },
    secondary: {
      label: 'Manual Entry Instead',
      icon: 'Edit3',
      onClick: handleManualEntry,
      variant: 'secondary'
    }
  };

  return (
    <ErrorBoundaryNavigation>
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        
        <main className="pt-4 pb-32 lg:pb-8">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Icon name="Upload" size={24} className="text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">
                    Upload Your Kundli
                  </h1>
                  <p className="text-text-secondary font-body">
                    Upload your existing kundli for AI-powered analysis and interpretation
                  </p>
                </div>
              </div>

              {/* API Status Indicator */}
              {apiKeyValid !== null && (
                <div className={`
                  inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium
                  ${apiKeyValid 
                    ? 'bg-success/10 text-success border border-success/20' :'bg-warning/10 text-warning border border-warning/20'
                  }
                `}>
                  <Icon 
                    name={apiKeyValid ? 'CheckCircle' : 'AlertCircle'} 
                    size={12} 
                  />
                  <span>
                    {apiKeyValid ? 'AI Analysis Available' : 'AI Analysis Unavailable (Demo Mode)'}
                  </span>
                </div>
              )}

              {/* Breadcrumb */}
              <div className="flex items-center justify-center space-x-2 text-sm text-text-muted mt-4">
                <Button
                  variant="link"
                  onClick={() => navigate('/home-landing-page')}
                  className="text-text-muted hover:text-primary p-0 h-auto"
                >
                  Home
                </Button>
                <Icon name="ChevronRight" size={14} />
                <span className="text-primary">Upload Kundli</span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Upload Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Upload Zone */}
                <UploadZone
                  onFileSelect={handleFileSelect}
                  isProcessing={['uploading', 'processing', 'analyzing'].includes(processingStatus.status)}
                  acceptedFiles={acceptedFileTypes}
                />

                {/* File Preview */}
                {uploadedFile && (
                  <FilePreview
                    file={uploadedFile}
                    onRemove={handleFileRemove}
                    onRotate={handleFileRotate}
                    processingStatus={processingStatus.status !== 'idle' ? processingStatus : null}
                  />
                )}

                {/* Processing Status */}
                {processingStatus.status !== 'idle' && (
                  <ProcessingStatus
                    status={processingStatus.status}
                    progress={processingStatus.progress}
                    stage={processingStatus.stage}
                    estimatedTime={processingStatus.estimatedTime}
                    error={processingStatus.error}
                  />
                )}

                {/* Alternative Options - Show when no file or error */}
                {(!uploadedFile || processingStatus.status === 'error') && (
                  <AlternativeOptions />
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                {showInstructions && <UploadInstructions />}
              </div>
            </div>
          </div>
        </main>

        {/* Action Buttons */}
        {uploadedFile && (
          <ActionButtonCluster
            customActions={customActions}
            disabled={processingStatus.status === 'completed'}
          />
        )}
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default KundliUpload;