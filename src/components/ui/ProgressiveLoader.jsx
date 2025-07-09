import React, { useState, useEffect } from 'react';
import Icon from '../AppIcon';

const ProgressiveLoader = ({ isLoading, currentStep, totalSteps, steps }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        const nextIndex = prev + 1;
        if (nextIndex < steps.length) {
          setCompletedSteps((completed) => [...completed, prev]);
          return nextIndex;
        }
        return prev;
      });
    }, 3000); // Change step every 3 seconds

    return () => clearInterval(interval);
  }, [isLoading, steps.length]);

  if (!isLoading) return null;

  return (
    <div className="space-y-4">
      {steps.map((step, index) => (
        <div
          key={index}
          className={`flex items-center space-x-3 p-4 rounded-lg transition-all duration-500 ${
            index === currentStepIndex
              ? 'bg-primary/10 border border-primary/20'
              : completedSteps.includes(index)
              ? 'bg-success/10 border border-success/20'
              : 'bg-surface-secondary border border-border-light'
          }`}
        >
          <div className="flex-shrink-0">
            {completedSteps.includes(index) ? (
              <Icon name="CheckCircle" size={20} className="text-success" />
            ) : index === currentStepIndex ? (
              <Icon name="Loader2" size={20} className="text-primary animate-spin" />
            ) : (
              <Icon name="Circle" size={20} className="text-text-muted" />
            )}
          </div>
          
          <div className="flex-1">
            <div className={`font-medium ${
              index === currentStepIndex ? 'text-primary' : 
              completedSteps.includes(index) ? 'text-success' : 'text-text-muted'
            }`}>
              {step.title}
            </div>
            <div className="text-sm text-text-muted mt-1">
              {step.description}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProgressiveLoader;
