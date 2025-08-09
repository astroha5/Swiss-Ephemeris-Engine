import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import Icon from '../AppIcon';

const PremiumUpsellModal = ({ isOpen, onClose, onUpgrade }) => {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="bg-surface rounded-xl shadow-strong border border-border p-6 w-full max-w-md max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="flex items-center mb-3">
            <Icon name="Crown" size={24} className="text-primary mr-2" />
            <h3 className="text-xl font-heading font-semibold text-text-primary">Go Premium for Faster, Accurate Results</h3>
          </div>
          <p className="text-sm text-text-secondary mb-4">
            Upgrade to Premium for just ₹99/month and get priority speed with higher-accuracy AI models. You can continue with Free to use slower models.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={onUpgrade} iconName="Zap" iconPosition="left">Upgrade – ₹99/month</Button>
            <Button variant="outline" onClick={onClose}>Continue with Free</Button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PremiumUpsellModal;


