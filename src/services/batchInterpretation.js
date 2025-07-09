import { generateAstrologicalInterpretation } from './deepseekApi';

// Generate interpretations for specific sections in parallel
export const generateBatchInterpretations = async (chartData, birthDetails, dashaData, sections = ['overview', 'career', 'relationships', 'health', 'wealth', 'spirituality']) => {
  const interpretationPromises = sections.map(async (section) => {
    try {
      const sectionData = {
        chartData,
        birthDetails,
        dashaData,
        focus: section,
        timestamp: new Date().toISOString()
      };
      
      const result = await generateAstrologicalInterpretation(sectionData, {
        focus: section,
        temperature: 0.3,
        max_tokens: 1000 // Smaller token limit for individual sections
      });
      
      return {
        section,
        success: result.success,
        data: result.interpretation,
        model: result.model,
        error: result.error
      };
    } catch (error) {
      return {
        section,
        success: false,
        error: error.message
      };
    }
  });
  
  // Wait for all interpretations to complete
  const results = await Promise.allSettled(interpretationPromises);
  
  // Process results
  const processedResults = {};
  results.forEach((result, index) => {
    const section = sections[index];
    if (result.status === 'fulfilled' && result.value.success) {
      processedResults[section] = result.value.data;
    } else {
      console.warn(`Failed to generate ${section} interpretation:`, result.reason || result.value.error);
    }
  });
  
  return processedResults;
};

// Generate interpretations progressively (one by one with callbacks)
export const generateProgressiveInterpretations = async (chartData, birthDetails, dashaData, onSectionComplete, sections = ['overview', 'career', 'relationships', 'health', 'wealth', 'spirituality']) => {
  const results = {};
  
  for (const section of sections) {
    try {
      const sectionData = {
        chartData,
        birthDetails,
        dashaData,
        focus: section,
        timestamp: new Date().toISOString()
      };
      
      const result = await generateAstrologicalInterpretation(sectionData, {
        focus: section,
        temperature: 0.3,
        max_tokens: 1000
      });
      
      if (result.success) {
        results[section] = result.interpretation;
        onSectionComplete(section, result.interpretation);
      } else {
        console.warn(`Failed to generate ${section} interpretation:`, result.error);
      }
    } catch (error) {
      console.error(`Error generating ${section} interpretation:`, error);
    }
  }
  
  return results;
};
