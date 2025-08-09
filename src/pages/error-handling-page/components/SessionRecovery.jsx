import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const SessionRecovery = ({ onRestore, onDismiss }) => {
  const [savedData, setSavedData] = useState(null);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    // Check for saved session data
    const checkSavedData = () => {
      try {
        const birthDetails = localStorage.getItem('astrova_birth_details');
        const formData = localStorage.getItem('astrova_form_data');
        
        if (birthDetails || formData) {
          setSavedData({
            birthDetails: birthDetails ? JSON.parse(birthDetails) : null,
            formData: formData ? JSON.parse(formData) : null,
            timestamp: Date.now()
          });
          setShowRecovery(true);
        }
      } catch (error) {
        console.error('Error checking saved data:', error);
      }
    };

    checkSavedData();
  }, []);

  const handleRestore = () => {
    if (onRestore && savedData) {
      onRestore(savedData);
    }
    setShowRecovery(false);
  };

  const handleDismiss = () => {
    // Clear saved data
    localStorage.removeItem('astrova_birth_details');
    localStorage.removeItem('astrova_form_data');
    
    if (onDismiss) {
      onDismiss();
    }
    setShowRecovery(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  if (!showRecovery || !savedData) return null;

  return (
    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 mb-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
          <Icon name="RotateCcw" size={16} className="text-warning" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary mb-1">
            Session Recovery Available
          </h4>
          <p className="text-sm text-text-secondary mb-3">
            We found your previous session data from {formatTimestamp(savedData.timestamp)}. 
            Would you like to restore your progress?
          </p>
          
          <div className="space-y-2 mb-4">
            {savedData.birthDetails && (
              <div className="flex items-center space-x-2 text-xs text-text-muted">
                <Icon name="User" size={12} />
                <span>Birth details: {savedData.birthDetails.name || 'Unnamed'}</span>
              </div>
            )}
            {savedData.formData && (
              <div className="flex items-center space-x-2 text-xs text-text-muted">
                <Icon name="FileText" size={12} />
                <span>Form data saved</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="warning"
              onClick={handleRestore}
              iconName="RotateCcw"
              iconPosition="left"
              size="xs"
            >
              Restore Session
            </Button>
            <Button
              variant="ghost"
              onClick={handleDismiss}
              iconName="X"
              iconPosition="left"
              size="xs"
            >
              Start Fresh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionRecovery;