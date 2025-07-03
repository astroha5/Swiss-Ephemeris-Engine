import { analyzeKundliImage } from './deepseekApi';
import { convertToBase64, compressImage, validateImageFile } from '../utils';

// Process uploaded kundli image
export const processKundliImage = async (file, onProgress) => {
  try {
    // Validate file
    validateImageFile(file);
    
    // Update progress
    onProgress?.({ stage: 'Validating file...', progress: 10 });

    // Compress image if needed
    const compressedFile = file.size > 2 * 1024 * 1024 
      ? await compressImage(file, 1920, 0.8)
      : file;
    
    onProgress?.({ stage: 'Optimizing image...', progress: 25 });

    // Convert to base64
    const base64Data = await convertToBase64(compressedFile);
    
    onProgress?.({ stage: 'Uploading to AI service...', progress: 40 });

    // Analyze with DeepSeek VL
    const analysisResult = await analyzeKundliImage(base64Data);
    
    if (!analysisResult.success) {
      throw new Error(analysisResult.error || 'Failed to analyze kundli image');
    }

    onProgress?.({ stage: 'Processing AI analysis...', progress: 70 });

    // Parse the analysis result
    const chartData = parseAnalysisResult(analysisResult.analysis);
    
    onProgress?.({ stage: 'Generating interpretations...', progress: 85 });

    // Generate detailed interpretation
    const interpretationResult = await generateInterpretation(chartData);
    
    onProgress?.({ stage: 'Finalizing results...', progress: 95 });

    return {
      success: true,
      chartData,
      interpretation: interpretationResult,
      originalAnalysis: analysisResult.analysis,
      metadata: {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        processedAt: new Date().toISOString(),
        model: analysisResult.model,
        usage: analysisResult.usage
      }
    };

  } catch (error) {
    console.error('Image processing error:', error);
    return {
      success: false,
      error: error.message || 'Failed to process kundli image',
      timestamp: new Date().toISOString()
    };
  }
};

// Parse AI analysis result into structured data
const parseAnalysisResult = (analysisText) => {
  try {
    // Try to parse as JSON first
    if (analysisText.includes('{') && analysisText.includes('}')) {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    // Fallback: parse structured text
    const chartData = {
      chartType: extractValue(analysisText, 'Chart Type'),
      chartStyle: extractValue(analysisText, 'Chart Style'),
      ascendant: extractValue(analysisText, 'Ascendant'),
      planets: extractPlanetaryPositions(analysisText),
      houses: extractHouseData(analysisText),
      specialFeatures: extractSpecialFeatures(analysisText),
      quality: extractValue(analysisText, 'Chart Quality')
    };

    return chartData;

  } catch (error) {
    console.error('Failed to parse analysis result:', error);
    return {
      rawAnalysis: analysisText,
      parseError: error.message
    };
  }
};

// Extract specific values from analysis text
const extractValue = (text, key) => {
  const regex = new RegExp(`${key}:?\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : null;
};

// Extract planetary positions
const extractPlanetaryPositions = (text) => {
  const planets = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
  const positions = {};

  planets.forEach(planet => {
    const regex = new RegExp(`${planet}:?\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      positions[planet] = match[1].trim();
    }
  });

  return positions;
};

// Extract house data
const extractHouseData = (text) => {
  const houses = {};
  
  // Look for house patterns like "1st House", "House 1", etc.
  for (let i = 1; i <= 12; i++) {
    const patterns = [
      `${i}st House:?\\s*([^\\n]+)`,
      `${i}nd House:?\\s*([^\\n]+)`,
      `${i}rd House:?\\s*([^\\n]+)`,
      `${i}th House:?\\s*([^\\n]+)`,
      `House ${i}:?\\s*([^\\n]+)`
    ];

    for (const pattern of patterns) {
      const match = text.match(new RegExp(pattern, 'i'));
      if (match) {
        houses[i] = match[1].trim();
        break;
      }
    }
  }

  return houses;
};

// Extract special features
const extractSpecialFeatures = (text) => {
  const features = [];
  const keywords = ['yoga', 'conjunction', 'aspect', 'dosha', 'raj yoga', 'dhana yoga'];

  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword}[^\\n.]+)`, 'gi');
    const matches = text.match(regex);
    if (matches) {
      features.push(...matches);
    }
  });

  return features;
};

// Generate comprehensive interpretation
const generateInterpretation = async (chartData) => {
  try {
    // This could be expanded to use the DeepSeek API for interpretation
    // For now, return a structured format based on the chart data
    
    return {
      overview: generateOverview(chartData),
      career: generateCareerInterpretation(chartData),
      relationships: generateRelationshipInterpretation(chartData),
      health: generateHealthInterpretation(chartData),
      wealth: generateWealthInterpretation(chartData),
      spirituality: generateSpiritualInterpretation(chartData)
    };

  } catch (error) {
    console.error('Failed to generate interpretation:', error);
    return {
      error: 'Failed to generate interpretation',
      rawData: chartData
    };
  }
};

// Generate overview interpretation
const generateOverview = (chartData) => {
  const ascendant = chartData.ascendant || 'Unknown';
  const chartType = chartData.chartType || 'Birth Chart';
  
  return {
    title: 'Chart Overview',
    content: `This ${chartType} shows your ${ascendant} ascendant, which influences your overall personality and life approach. The chart reveals various planetary positions that shape different aspects of your life.`,
    keyPoints: [
      `Ascendant: ${ascendant}`,
      `Chart Type: ${chartType}`,
      `Chart Style: ${chartData.chartStyle || 'Not specified'}`,
      `Quality: ${chartData.quality || 'Analyzable'}`
    ]
  };
};

// Additional interpretation functions would go here
const generateCareerInterpretation = (chartData) => ({
  title: 'Career & Profession',
  content: 'Career analysis based on the planetary positions in your chart...',
  keyPoints: ['Professional strengths identified', 'Career timing analyzed']
});

const generateRelationshipInterpretation = (chartData) => ({
  title: 'Relationships & Marriage',
  content: 'Relationship patterns and marriage prospects based on your chart...',
  keyPoints: ['Partnership compatibility assessed', 'Marriage timing evaluated']
});

const generateHealthInterpretation = (chartData) => ({
  title: 'Health & Wellness',
  content: 'Health indications and wellness recommendations based on your chart...',
  keyPoints: ['Health strengths identified', 'Preventive measures suggested']
});

const generateWealthInterpretation = (chartData) => ({
  title: 'Wealth & Finance',
  content: 'Financial prospects and wealth accumulation potential...',
  keyPoints: ['Income sources analyzed', 'Investment timing suggested']
});

const generateSpiritualInterpretation = (chartData) => ({
  title: 'Spirituality & Growth',
  content: 'Spiritual inclinations and growth opportunities...',
  keyPoints: ['Spiritual practices recommended', 'Growth areas identified']
});

export default {
  processKundliImage,
  parseAnalysisResult,
  generateInterpretation
};