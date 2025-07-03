import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const AstrologicalTermsTooltip = () => {
  const [activeTooltip, setActiveTooltip] = useState(null);

  const astrologicalTerms = [
    {
      id: 'lagna',
      term: 'Lagna (लग्न)',
      english: 'Ascendant',
      description: 'The zodiac sign rising on the eastern horizon at the time of birth. It represents your personality and physical appearance.',
      importance: 'Most important factor in Vedic astrology'
    },
    {
      id: 'navamsa',
      term: 'Navamsa (नवांश)',
      english: 'D9 Chart',
      description: 'A divisional chart that shows the strength of planets and is crucial for marriage and spiritual growth predictions.',
      importance: 'Essential for accurate predictions'
    },
    {
      id: 'dasha',
      term: 'Dasha (दशा)',
      english: 'Planetary Periods',
      description: 'Time periods ruled by different planets that influence various aspects of life events and experiences.',
      importance: 'Timing of life events'
    },
    {
      id: 'kundli',
      term: 'Kundli (कुंडली)',
      english: 'Birth Chart',
      description: 'A detailed astrological chart showing planetary positions at the exact time and place of birth.',
      importance: 'Foundation of Vedic astrology'
    },
    {
      id: 'graha',
      term: 'Graha (ग्रह)',
      english: 'Planets',
      description: 'Celestial bodies that influence human life according to their positions and movements.',
      importance: 'Primary influencing factors'
    },
    {
      id: 'rashi',
      term: 'Rashi (राशि)',
      english: 'Zodiac Sign',
      description: 'One of the 12 divisions of the zodiac, each representing different characteristics and traits.',
      importance: 'Basic personality indicators'
    }
  ];

  const toggleTooltip = (termId) => {
    setActiveTooltip(activeTooltip === termId ? null : termId);
  };

  return (
    <div className="bg-surface rounded-lg border border-border p-6 shadow-soft">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon name="BookOpen" size={20} className="text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-heading font-semibold text-text-primary">
            Astrological Terms Guide
          </h3>
          <p className="text-sm text-text-secondary font-caption">
            Understanding key Sanskrit terms used in Vedic astrology
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {astrologicalTerms.map((term) => (
          <div key={term.id} className="relative">
            <button
              type="button"
              onClick={() => toggleTooltip(term.id)}
              className={`
                w-full p-4 rounded-lg border-2 text-left transition-celestial hover-scale
                ${activeTooltip === term.id
                  ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-semibold text-text-primary text-sm">
                    {term.term}
                  </h4>
                  <p className="text-xs text-text-secondary font-caption">
                    {term.english}
                  </p>
                </div>
                <Icon 
                  name={activeTooltip === term.id ? "ChevronUp" : "ChevronDown"} 
                  size={16} 
                  className="text-text-muted" 
                />
              </div>
            </button>

            {/* Expanded Content */}
            {activeTooltip === term.id && (
              <div className="absolute z-10 w-full mt-2 p-4 bg-surface border border-border rounded-lg shadow-strong animate-slide-up">
                <div className="space-y-3">
                  <div>
                    <h5 className="text-sm font-medium text-text-primary mb-1">
                      Description
                    </h5>
                    <p className="text-xs text-text-secondary font-caption leading-relaxed">
                      {term.description}
                    </p>
                  </div>
                  
                  <div className="pt-2 border-t border-border-light">
                    <div className="flex items-center space-x-2">
                      <Icon name="Star" size={12} className="text-primary" />
                      <span className="text-xs font-medium text-primary">
                        {term.importance}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Arrow pointer */}
                <div className="absolute -top-2 left-6 w-4 h-4 bg-surface border-l border-t border-border transform rotate-45"></div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Resources */}
      <div className="mt-6 pt-6 border-t border-border-light">
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Icon name="Lightbulb" size={16} className="text-accent mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-accent mb-2">
                Learning Resources
              </h4>
              <ul className="text-xs text-text-secondary space-y-1 font-caption">
                <li>• Hover over any term to learn more about its significance</li>
                <li>• Sanskrit terms are provided with English translations</li>
                <li>• Understanding these concepts enhances chart interpretation</li>
                <li>• Each term plays a crucial role in Vedic astrological analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AstrologicalTermsTooltip;