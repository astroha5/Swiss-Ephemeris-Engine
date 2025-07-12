import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/ui/Header';
import ProgressIndicator from '../../components/ui/ProgressIndicator';
import ActionButtonCluster from '../../components/ui/ActionButtonCluster';
import ErrorBoundaryNavigation from '../../components/ui/ErrorBoundaryNavigation';
import PersonalInfoSection from './components/PersonalInfoSection';
import BirthTimingSection from './components/BirthTimingSection';
import LocationSection from './components/LocationSection';
import FormValidation from './components/FormValidation';
import AstrologicalTermsTooltip from './components/AstrologicalTermsTooltip';
import Icon from '../../components/AppIcon';
import Button from '../../components/ui/Button';
import { generateKundli, geocodeLocation } from '../../services/api';

const BirthDetailsForm = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showTermsGuide, setShowTermsGuide] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    birthDate: '',
    birthTime: '',
    birthLocation: '',
    locationData: null
  });
  const [errors, setErrors] = useState({});

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters long';
    }

    // Gender validation
    if (!formData.gender) {
      newErrors.gender = 'Please select your gender';
    }

    // Birth date validation
    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birthDate = 'Birth date cannot be in the future';
      }
    }

    // Birth time validation
    if (!formData.birthTime) {
      newErrors.birthTime = 'Birth time is required';
    } else if (!/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.birthTime)) {
      newErrors.birthTime = 'Please enter time in HH:MM format';
    }

    // Location validation
    if (!formData.birthLocation || formData.birthLocation.trim().length < 3) {
      newErrors.birthLocation = 'Birth location must be at least 3 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      const errorElement = document.getElementById(firstErrorField);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        errorElement.focus();
      }
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Ensure location is geocoded
      let locationData = formData.locationData;
      
      if (!locationData || !locationData.latitude || !locationData.longitude) {
        console.log('Geocoding location:', formData.birthLocation);
        
        try {
          locationData = await geocodeLocation(formData.birthLocation);
          
          // Update form data with geocoded location
          setFormData(prev => ({
            ...prev,
            locationData
          }));
        } catch (geocodeError) {
          console.error('Geocoding failed:', geocodeError);
          alert(`Unable to find coordinates for "${formData.birthLocation}". Please try a more specific location.`);
          return;
        }
      }

      console.log('Generating Kundli with location data:', locationData);

      // Step 2: Generate the actual chart using backend API
      const chartResponse = await generateKundli({
        ...formData,
        locationData
      });

      console.log('Chart generated successfully:', chartResponse);
      
      // Step 3: Store the REAL chart data in localStorage
      localStorage.setItem('birthChartData', JSON.stringify({
        ...formData,
        locationData,
        chartData: chartResponse.data,
        submittedAt: new Date().toISOString(),
        chartId: `CHART_${Date.now()}`,
        isRealData: true // Flag to indicate this is real data
      }));

      // Clear the form draft since we successfully submitted
      localStorage.removeItem('birthFormDraft');

      // Navigate to results
      navigate('/chart-results-dashboard', {
        state: {
          from: '/birth-details-form',
          chartGenerated: true
        }
      });
      
    } catch (error) {
      console.error('Chart generation failed:', error);
      
      // Show user-friendly error message
      let errorMessage = 'Failed to generate chart. Please try again.';
      
      if (error.message.includes('coordinates')) {
        errorMessage = 'Unable to determine location coordinates. Please check your birth location and try again.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Chart generation is taking longer than expected. Please try again.';
      } else if (error.message.includes('connect')) {
        errorMessage = 'Unable to connect to chart generation service. Please check your internet connection and try again.';
      }
      
      alert(errorMessage);
      
      // Don't navigate to error page for user errors
      if (!error.message.includes('coordinates') && !error.message.includes('Birth date and time')) {
        navigate('/error-handling-page');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    setFormData({
      fullName: '',
      gender: '',
      birthDate: '',
      birthTime: '',
      birthLocation: '',
      locationData: null
    });
    setErrors({});
  };

  const isFormValid = () => {
    return formData.fullName.trim().length >= 2 &&
           formData.gender &&
           formData.birthDate &&
           formData.birthTime &&
           formData.birthLocation.trim().length >= 3 &&
           Object.keys(errors).length === 0;
  };

  // Auto-save form data
  useEffect(() => {
    const savedData = localStorage.getItem('birthFormDraft');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        setFormData(parsedData);
      } catch (error) {
        console.error('Failed to load saved form data:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (Object.values(formData).some(value => value)) {
      localStorage.setItem('birthFormDraft', JSON.stringify(formData));
    }
  }, [formData]);

  return (
    <ErrorBoundaryNavigation>
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        
        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Page Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <Icon name="Calculator" size={32} className="text-primary" />
            </div>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-text-primary">
              Birth Details Form
            </h1>
            <p className="text-lg text-text-secondary font-body max-w-2xl mx-auto">
              Enter your precise birth information to generate your personalized Vedic astrology chart. 
              Accuracy is crucial for meaningful astrological insights.
            </p>
          </div>

          {/* Terms Guide Toggle */}
          <div className="flex justify-center">
            <Button
              variant="ghost"
              onClick={() => setShowTermsGuide(!showTermsGuide)}
              iconName={showTermsGuide ? "ChevronUp" : "BookOpen"}
              iconPosition="left"
              size="sm"
            >
              {showTermsGuide ? 'Hide' : 'Show'} Astrological Terms Guide
            </Button>
          </div>

          {/* Astrological Terms Guide */}
          {showTermsGuide && <AstrologicalTermsTooltip />}

          {/* Form Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <PersonalInfoSection 
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
              />
              
              <BirthTimingSection 
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
              />
              
              <LocationSection 
                formData={formData}
                errors={errors}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-8">
              <FormValidation 
                errors={errors}
                isValid={isFormValid()}
                formData={formData}
              />

              {/* Quick Actions */}
              <div className="bg-surface rounded-lg border border-border p-6 shadow-soft">
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-4">
                  Quick Actions
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={handleClearForm}
                    iconName="RotateCcw"
                    iconPosition="left"
                    size="sm"
                    fullWidth
                  >
                    Clear Form
                  </Button>
                </div>
              </div>

              {/* Privacy Notice */}
              <div className="bg-info/5 border border-info/20 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Icon name="Shield" size={16} className="text-info mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-info mb-1">
                      Privacy & Security
                    </h4>
                    <p className="text-xs text-text-secondary font-caption leading-relaxed">
                      Your birth details are processed securely and used only for chart generation. 
                      We do not store or share your personal information.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="fixed inset-0 z-1100 bg-background/80 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-surface rounded-xl shadow-strong border border-border p-8 text-center max-w-sm mx-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon name="Loader2" size={32} className="text-primary animate-spin" />
                </div>
                <h3 className="text-lg font-heading font-semibold text-text-primary mb-2">
                  Generating Your Chart
                </h3>
                <p className="text-sm text-text-secondary font-caption">
                  Calculating planetary positions and creating your personalized Vedic astrology chart...
                </p>
                <div className="mt-4 w-full bg-border rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
              </div>
            </div>
          )}
        </main>

        <ActionButtonCluster
          isLoading={isLoading}
          onPrimaryAction={handleSubmit}
          onSecondaryAction={() => navigate('/home-landing-page')}
          disabled={!isFormValid()}
        />
      </div>
    </ErrorBoundaryNavigation>
  );
};

export default BirthDetailsForm;