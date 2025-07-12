import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { generateAstrologicalInterpretation } from '../../../services/deepseekApi';

const MonthlyAIInterpretation = ({ monthlyData, selectedMonth, selectedYear }) => {
  const [aiInterpretation, setAiInterpretation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    if (monthlyData && monthlyData.planetaryData && monthlyData.planetaryData.length > 0) {
      generateMonthlyInterpretation();
    }
  }, [monthlyData, selectedMonth, selectedYear]);

  const generateMonthlyInterpretation = async () => {
    if (!monthlyData?.planetaryData) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Prepare data for AI interpretation
      const interpretationData = {
        type: 'monthly_prediction',
        month: selectedMonth + 1,
        year: selectedYear,
        monthName: monthNames[selectedMonth],
        planetaryData: monthlyData.planetaryData,
        calculationDate: monthlyData.calculationDate,
        isRealData: monthlyData.isRealData
      };
      
      const result = await generateAstrologicalInterpretation(interpretationData, {
        focus: 'monthly_transits',
        temperature: 0.4
      });
      
      if (result.success) {
        // Try to parse as JSON first
        let interpretation;
        try {
          interpretation = JSON.parse(result.interpretation);
        } catch (parseError) {
          // If JSON parsing fails, use text directly
          interpretation = {
            overview: result.interpretation,
            insights: [],
            recommendations: []
          };
        }
        
        setAiInterpretation(interpretation);
      } else {
        setError(result.error || 'Failed to generate AI interpretation');
      }
    } catch (error) {
      console.error('Error generating monthly AI interpretation:', error);
      setError(error.message || 'Failed to generate interpretation');
    } finally {
      setIsLoading(false);
    }
  };

  const regenerateInterpretation = () => {
    generateMonthlyInterpretation();
  };

  if (!monthlyData) {
    return (
      <div className="bg-surface rounded-xl border border-border shadow-strong p-8 text-center">
        <Icon name="Brain" size={48} className="text-text-muted mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-text-primary mb-2">
          No Data Available
        </h3>
        <p className="text-text-secondary">
          Please wait for monthly data to load.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border shadow-strong overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent/5 to-primary/5 border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Icon name="Brain" size={20} className="text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-heading font-semibold text-text-primary">
                AI Monthly Interpretation
              </h2>
              <p className="text-sm text-text-secondary">
                Detailed analysis for {monthNames[selectedMonth]} {selectedYear}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {monthlyData.isRealData && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                <Icon name="CheckCircle" size={12} className="mr-1" />
                Real Data
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={regenerateInterpretation}
              disabled={isLoading}
              className="text-xs flex items-center space-x-2"
            >
              <Icon 
                name={isLoading ? "Loader2" : "RefreshCw"} 
                size={14} 
                className={isLoading ? 'animate-spin' : ''} 
              />
              <span>{isLoading ? 'Generating...' : 'Regenerate'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <div className="text-center py-8">
            <Icon name="Loader2" size={32} className="text-primary mx-auto mb-4 animate-spin" />
            <p className="text-text-secondary">Generating AI interpretation...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <Icon name="AlertTriangle" size={32} className="text-error mx-auto mb-4" />
            <p className="text-error mb-4">{error}</p>
            <Button
              variant="primary"
              onClick={regenerateInterpretation}
              iconName="RefreshCw"
              iconPosition="left"
            >
              Try Again
            </Button>
          </div>
        ) : aiInterpretation ? (
          <div className="space-y-6">
            {/* Main Interpretation */}
            {aiInterpretation.overview && (
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                  <Icon name="MessageSquare" size={18} className="text-primary" />
                  <span>Monthly Overview</span>
                </h4>
                <div className="prose prose-sm max-w-none">
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {typeof aiInterpretation.overview === 'string' 
                      ? aiInterpretation.overview 
                      : aiInterpretation.overview.content || JSON.stringify(aiInterpretation.overview)}
                  </p>
                </div>
              </div>
            )}

            {/* Key Insights */}
            {aiInterpretation.insights && aiInterpretation.insights.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                  <Icon name="Lightbulb" size={18} className="text-warning" />
                  <span>Key Insights</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-3">
                  {aiInterpretation.insights.map((insight, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-surface-secondary rounded-lg">
                      <Icon name="Star" size={14} className="text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-text-secondary">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {aiInterpretation.recommendations && aiInterpretation.recommendations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                  <Icon name="Target" size={18} className="text-success" />
                  <span>Recommendations</span>
                </h4>
                <div className="space-y-2">
                  {aiInterpretation.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start space-x-2 p-3 bg-surface-secondary rounded-lg">
                      <Icon name="ArrowRight" size={14} className="text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-text-secondary">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Fallback interpretations from API response */}
            {monthlyData.interpretations && monthlyData.interpretations.length > 0 && (
              <div>
                <h4 className="text-lg font-semibold text-text-primary mb-3 flex items-center space-x-2">
                  <Icon name="BookOpen" size={18} className="text-secondary" />
                  <span>Planetary Influences</span>
                </h4>
                <div className="space-y-4">
                  {monthlyData.interpretations.map((interpretation, index) => (
                    <div key={index} className="border-b border-border pb-4 last:border-b-0">
                      <h5 className="text-md font-medium text-text-primary mb-2">
                        {interpretation.title}
                      </h5>
                      <p className="text-text-secondary text-sm leading-relaxed">
                        {interpretation.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <Icon name="MessageSquare" size={32} className="text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary mb-4">No interpretation available</p>
            <Button
              variant="primary"
              onClick={generateMonthlyInterpretation}
              iconName="Sparkles"
              iconPosition="left"
            >
              Generate Interpretation
            </Button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-border bg-surface-secondary p-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4 text-text-muted">
            <div className="flex items-center space-x-1">
              <Icon name="Calendar" size={14} />
              <span>{monthNames[selectedMonth]} {selectedYear}</span>
            </div>
            {monthlyData.calculationDate && (
              <div className="flex items-center space-x-1">
                <Icon name="Clock" size={14} />
                <span>Calculated: {monthlyData.calculationDate}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-1 text-text-muted">
            <Icon name="Sparkles" size={14} />
            <span>AI Generated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthlyAIInterpretation;
