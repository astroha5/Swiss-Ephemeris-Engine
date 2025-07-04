import React from 'react';
import Icon from '../../../components/AppIcon';
import LocationSearch from '../../../components/LocationSearch';

const LocationSection = ({ formData, errors, onChange }) => {
  const handleLocationSelect = (locationData) => {
    // Update birth location string
    onChange({
      target: {
        name: 'birthLocation',
        value: locationData.displayName
      }
    });
    
    // Update location data
    onChange({
      target: {
        name: 'locationData',
        value: locationData
      }
    });
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-soft">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
          <Icon name="MapPin" size={20} className="text-secondary" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Birth Location
          </h3>
          <p className="text-sm text-text-secondary font-caption">
            Precise location ensures accurate planetary positions and house calculations
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="birthLocation" className="block text-sm font-medium text-text-primary mb-2">
            Place of Birth <span className="text-error">*</span>
          </label>
          
          <LocationSearch
            onLocationSelect={handleLocationSelect}
            initialValue={formData.birthLocation}
            placeholder="Start typing city name (e.g., New Delhi, Delhi, India)"
          />

          {errors.birthLocation && (
            <div className="flex items-center space-x-2 mt-2">
              <Icon name="AlertCircle" size={14} className="text-error" />
              <span className="text-sm text-error font-caption">{errors.birthLocation}</span>
            </div>
          )}
        </div>

        {/* Selected Location Display */}
        {formData.locationData && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon name="CheckCircle" size={16} className="text-success mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-success mb-2">
                  Location Confirmed
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-text-secondary font-caption">
                  <div>
                    <span className="font-medium">Timezone:</span> {formData.locationData.timezone}
                  </div>
                  <div>
                    <span className="font-medium">Coordinates:</span> {formData.locationData.latitude?.toFixed(4)}°N, {formData.locationData.longitude?.toFixed(4)}°E
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Icon name="Lightbulb" size={16} className="text-primary mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-primary mb-1">
                Enhanced Location Tips (स्थान सुझाव)
              </h4>
              <ul className="text-xs text-text-secondary space-y-1 font-caption">
                <li>• Choose "Precise" locations for most accurate astrological calculations</li>
                <li>• Sub-localities (e.g., North Delhi, South Delhi) provide better accuracy</li>
                <li>• Hospital location is preferred over home address when available</li>
                <li>• Timezone and coordinates are automatically calculated for precision</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSection;
