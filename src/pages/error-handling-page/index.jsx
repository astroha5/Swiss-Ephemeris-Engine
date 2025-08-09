import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ActionButtonCluster from '../../components/ui/ActionButtonCluster';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';

// Import components
import ErrorTypeCard from './components/ErrorTypeCard';
import SessionRecovery from './components/SessionRecovery';
import TroubleshootingPanel from './components/TroubleshootingPanel';
import ContactSupport from './components/ContactSupport';
import ErrorBreadcrumb from './components/ErrorBreadcrumb';

const ErrorHandlingPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedErrorType, setSelectedErrorType] = useState('system');
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [errorContext, setErrorContext] = useState(null);

  useEffect(() => {
    // Get error context from navigation state or URL params
    const urlParams = new URLSearchParams(location.search);
    const errorType = urlParams.get('type') || 'system';
    const errorSource = urlParams.get('source') || 'unknown';
    const previousPath = urlParams.get('from') || '/home-landing-page';

    setSelectedErrorType(errorType);
    setErrorContext({
      type: errorType,
      source: errorSource,
      page: previousPath,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, [location]);

  const errorTypes = [
    {
      type: 'processing',
      title: 'Chart Generation Failed',
      description: 'Our AI system encountered an issue while generating your astrological chart. This could be due to invalid birth data or processing errors.',
      icon: 'AlertTriangle',
      primaryAction: {
        label: 'Retry Generation',
        onClick: () => navigate('/birth-details-form'),
        variant: 'primary',
        icon: 'RefreshCw'
      },
      secondaryAction: {
        label: 'Check Details',
        onClick: () => navigate('/birth-details-form'),
        variant: 'ghost',
        icon: 'CheckCircle'
      },
      tips: [
        'Verify birth date and time accuracy',
        'Ensure location is correctly selected',
        'Check time zone settings',
        'Use 24-hour time format'
      ]
    },
    {
      type: 'network',
      title: 'Connection Issue',
      description: 'Unable to connect to our servers. Please check your internet connection and try again. Your progress has been saved.',
      icon: 'Wifi',
      primaryAction: {
        label: 'Retry Connection',
        onClick: () => window.location.reload(),
        variant: 'primary',
        icon: 'RefreshCw'
      },
      secondaryAction: {
        label: 'Go Offline',
        onClick: () => navigate('/home-landing-page'),
        variant: 'ghost',
        icon: 'WifiOff'
      },
      tips: [
        'Check your internet connection',
        'Try refreshing the page',
        'Disable VPN if using one',
        'Clear browser cache'
      ]
    },
    {
      type: 'system',
      title: 'System Error',
      description: 'An unexpected error occurred in our system. Our technical team has been notified. Your data is safe and will be restored.',
      icon: 'AlertCircle',
      primaryAction: {
        label: 'Try Again',
        onClick: () => navigate('/home-landing-page'),
        variant: 'primary',
        icon: 'RotateCcw'
      },
      secondaryAction: {
        label: 'Contact Support',
        onClick: () => setShowTroubleshooting(true),
        variant: 'ghost',
        icon: 'HelpCircle'
      },
      tips: [
        'Refresh the page and try again',
        'Clear browser cache and cookies',
        'Try using a different browser',
        'Contact support if issue persists'
      ]
    }
  ];

  const currentError = errorTypes.find(error => error.type === selectedErrorType) || errorTypes[3];

  const handleSessionRestore = (savedData) => {
    console.log('Restoring session data:', savedData);
    
    // Navigate based on available data
    if (savedData.birthDetails) {
      navigate('/birth-details-form', { state: { restoreData: savedData.birthDetails } });
    } else {
      navigate('/home-landing-page');
    }
  };

  const handleSupportSubmit = (supportData) => {
    console.log('Support request submitted:', supportData);
    // Show success message or redirect
    alert('Support request submitted successfully! We\'ll get back to you within 24 hours.');
  };

  const customActions = {
    primary: {
      label: currentError.primaryAction.label,
      onClick: currentError.primaryAction.onClick,
      variant: currentError.primaryAction.variant,
      icon: currentError.primaryAction.icon
    },
    secondary: {
      label: 'Get Help',
      onClick: () => setShowTroubleshooting(!showTroubleshooting),
      variant: 'ghost',
      icon: 'HelpCircle'
    }
  };

  return (
    <ErrorBoundaryNavigation>
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        
        <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Error Breadcrumb */}
            <ErrorBreadcrumb
              errorSource={errorContext?.source}
              previousPath={errorContext?.page}
              onNavigateBack={() => navigate(errorContext?.page || '/home-landing-page')}
            />

            {/* Session Recovery */}
            <SessionRecovery
              onRestore={handleSessionRestore}
              onDismiss={() => console.log('Session recovery dismissed')}
            />

            {/* Main Error Display */}
            <div className="text-center mb-8">
              <div className="mx-auto w-20 h-20 bg-error/10 rounded-full flex items-center justify-center mb-6">
                <Icon name={currentError.icon} size={40} className="text-error" />
              </div>
              
              <h1 className="text-3xl font-heading font-bold text-text-primary mb-4">
                Oops! Something went wrong
              </h1>
              
              <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-8">
                Don't worry - these things happen. We're here to help you get back on track quickly.
              </p>
            </div>

            {/* Error Type Selection */}
            <div className="mb-8">
              <h2 className="text-xl font-heading font-semibold text-text-primary mb-4">
                What type of issue are you experiencing?
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {errorTypes.map((error) => (
                  <ErrorTypeCard
                    key={error.type}
                    errorType={error.type}
                    title={error.title}
                    description={error.description}
                    icon={error.icon}
                    primaryAction={error.primaryAction}
                    secondaryAction={error.secondaryAction}
                    tips={error.tips}
                    isActive={selectedErrorType === error.type}
                    onSelect={setSelectedErrorType}
                  />
                ))}
              </div>
            </div>

            {/* Troubleshooting Panel */}
            {showTroubleshooting && (
              <div className="mb-8">
                <TroubleshootingPanel errorType={selectedErrorType} />
              </div>
            )}

            {/* Contact Support */}
            <div className="mb-8">
              <ContactSupport
                errorContext={errorContext}
                onSubmit={handleSupportSubmit}
              />
            </div>

            {/* Quick Actions */}
            <div className="bg-surface rounded-lg border border-border shadow-soft p-6">
              <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
                Quick Actions
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/home-landing-page')}
                  iconName="Home"
                  iconPosition="left"
                  fullWidth
                  className="justify-start"
                >
                  Go Home
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => navigate('/birth-details-form')}
                  iconName="Edit3"
                  iconPosition="left"
                  fullWidth
                  className="justify-start"
                >
                  New Chart
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => window.location.reload()}
                  iconName="RefreshCw"
                  iconPosition="left"
                  fullWidth
                  className="justify-start"
                >
                  Refresh Page
                </Button>
                
                <Button
                  variant="ghost"
                  onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                  iconName="HelpCircle"
                  iconPosition="left"
                  fullWidth
                  className="justify-start"
                >
                  Get Help
                </Button>
              </div>
            </div>
          </div>
        </main>

        <ActionButtonCluster
          customActions={customActions}
          className="lg:hidden"
        />
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default ErrorHandlingPage;