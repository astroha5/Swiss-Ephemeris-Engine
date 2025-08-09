import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';
import Icon from '../AppIcon';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      previousPath: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo,
      previousPath: window.location.pathname
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorBoundaryNavigationContent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          previousPath={this.state.previousPath}
          onRetry={() => {
            this.setState({ hasError: false, error: null, errorInfo: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}

const ErrorBoundaryNavigationContent = ({ error, errorInfo, previousPath, onRetry }) => {
  const navigate = useNavigate();

  const getErrorType = () => {
    if (error?.message?.includes('chart') || error?.message?.includes('processing')) {
      return 'processing';
    }
    if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
      return 'network';
    }
    return 'system';
  };

  const getErrorContent = () => {
    const errorType = getErrorType();
    
    switch (errorType) {
      case 'processing':
        return {
          icon: 'AlertTriangle',
          title: 'Chart Generation Failed',
          message: 'We encountered an issue while generating your astrological chart. Please verify your birth details and try again.',
          primaryAction: {
            label: 'Retry Generation',
            onClick: onRetry
          },
          secondaryAction: {
            label: 'Check Details',
            onClick: () => navigate('/birth-details-form')
          }
        };
      
      case 'network':
        return {
          icon: 'Wifi',
          title: 'Connection Issue',
          message: 'Please check your internet connection and try again. Your progress has been saved.',
          primaryAction: {
            label: 'Retry Connection',
            onClick: onRetry
          },
          secondaryAction: {
            label: 'Go Home',
            onClick: () => navigate('/home-landing-page')
          }
        };
      
      default:
        return {
          icon: 'AlertCircle',
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Don\'t worry, your data is safe. Please try again or contact support.',
          primaryAction: {
            label: 'Try Again',
            onClick: onRetry
          },
          secondaryAction: {
            label: 'Go Home',
            onClick: () => navigate('/home-landing-page')
          }
        };
    }
  };

  const errorContent = getErrorContent();

  return (
    <div className="fixed inset-0 z-1200 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface rounded-xl shadow-strong border border-border max-w-md w-full animate-scale-in">
        <div className="p-6 text-center">
          {/* Error Icon */}
          <div className="mx-auto w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
            <Icon 
              name={errorContent.icon} 
              size={32} 
              className="text-error"
            />
          </div>

          {/* Error Title */}
          <h2 className="text-xl font-heading font-semibold text-text-primary mb-2">
            {errorContent.title}
          </h2>

          {/* Error Message */}
          <p className="text-text-secondary font-body mb-6 leading-relaxed">
            {errorContent.message}
          </p>

          {/* Navigation Breadcrumb */}
          {previousPath && (
            <div className="bg-surface-secondary rounded-md p-3 mb-6">
              <div className="flex items-center justify-center space-x-2 text-sm text-text-muted">
                <Icon name="MapPin" size={14} />
                <span className="font-caption">
                  Error occurred on: {previousPath.replace('/', '').replace('-', ' ')}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={errorContent.primaryAction.onClick}
              iconName="RefreshCw"
              iconPosition="left"
              size="lg"
              fullWidth
              className="shadow-medium"
            >
              {errorContent.primaryAction.label}
            </Button>

            <Button
              variant="ghost"
              onClick={errorContent.secondaryAction.onClick}
              iconName="ArrowLeft"
              iconPosition="left"
              size="md"
              fullWidth
            >
              {errorContent.secondaryAction.label}
            </Button>
          </div>

          {/* Support Link */}
          <div className="mt-6 pt-4 border-t border-border-light">
            <button
              onClick={() => navigate('/error-handling-page')}
              className="text-sm text-text-muted hover:text-primary transition-celestial font-caption"
            >
              Need more help? Visit our support page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const ErrorBoundaryNavigation = ({ children }) => {
  return <ErrorBoundary>{children}</ErrorBoundary>;
};

export default ErrorBoundaryNavigation;