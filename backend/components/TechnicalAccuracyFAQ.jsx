import React from 'react';

const TechnicalAccuracyFAQ = () => {
  const faqs = [
    {
      question: "Why are my calculations different from other apps?",
      answer: (
        <div>
          <p className="mb-3 font-medium">
            We use Swiss Ephemeris with precise historical time zones and scientific-grade Ayanamsa calculations. Other apps often use approximations.
          </p>
          <div className="space-y-2">
            <p><strong>Time Zones:</strong> We correctly handle historical US time zones (Central vs Eastern before standardization)</p>
            <p><strong>Ayanamsa:</strong> We use exact Swiss Ephemeris calculations vs simplified approximations</p>
            <p><strong>Coordinates:</strong> Precise lat/lng handling with proper validation</p>
          </div>
        </div>
      )
    },
    {
      question: "How accurate are your birth charts?",
      answer: (
        <ul className="space-y-2">
          <li><strong>Planetary Positions:</strong> Scientific-grade accuracy using Swiss Ephemeris</li>
          <li><strong>Time Handling:</strong> Historical timezone precision for dates back to 1900+</li>
          <li><strong>Ascendant Signs:</strong> 60%+ accuracy in testing vs reference charts</li>
          <li><strong>Moon Signs:</strong> Continuously improving through enhanced time zone handling</li>
        </ul>
      )
    },
    {
      question: "Why might my Moon sign differ from other sources?",
      answer: (
        <ol className="space-y-2 list-decimal list-inside">
          <li><strong>Different Ayanamsa epochs</strong> - We use precise Swiss Ephemeris values</li>
          <li><strong>Time zone assumptions</strong> - Many apps guess historical time zones incorrectly</li>
          <li><strong>Coordinate precision</strong> - We validate exact birth location coordinates</li>
        </ol>
      )
    },
    {
      question: "What makes your calculations trustworthy?",
      answer: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span><strong>Swiss Ephemeris Engine</strong> - NASA-grade astronomical calculations</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span><strong>Historical Time Zone Database</strong> - Proper handling of pre-standardization periods</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span><strong>Coordinate Validation</strong> - Ensures accurate geographic positioning</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-600">✅</span>
            <span><strong>Debug Mode Available</strong> - Transparency in calculation methods</span>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Technical Accuracy FAQ
        </h1>
        <p className="text-gray-600">
          Quick reference for understanding our calculation methods
        </p>
      </div>

      <div className="space-y-6">
        {faqs.map((faq, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {faq.question}
            </h3>
            <div className="text-gray-700">
              {faq.answer}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Quick Verification
        </h3>
        <div className="space-y-3 text-blue-800">
          <div>
            <p className="font-medium mb-2">Having doubts? Contact support for:</p>
            <ul className="space-y-1 list-disc list-inside ml-4">
              <li>Debug report of your specific chart</li>
              <li>Comparison with professional astrology software</li>
              <li>Technical explanation of any differences</li>
            </ul>
          </div>
          <p>
            <strong>Professional astrologers:</strong> Ask about our advanced calculation modes and batch processing tools.
          </p>
        </div>
      </div>

      <div className="mt-6 text-center text-gray-500 italic">
        Our goal: Provide the most astronomically accurate birth charts available in consumer astrology software.
      </div>
    </div>
  );
};

export default TechnicalAccuracyFAQ;
