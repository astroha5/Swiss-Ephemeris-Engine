import React, { useState } from 'react';

const AccuracyTooltip = ({ trigger = "info" }) => {
  const [isOpen, setIsOpen] = useState(false);

  const condensedFAQs = [
    {
      question: "Why different from other apps?",
      answer: "We use Swiss Ephemeris with precise historical time zones and scientific-grade calculations vs approximations."
    },
    {
      question: "How accurate are charts?",
      answer: "NASA-grade planetary positions, historical timezone precision, 60%+ ascendant accuracy in testing."
    },
    {
      question: "Moon sign differences?",
      answer: "Different Ayanamsa epochs, time zone assumptions, and coordinate precision affect calculations."
    },
    {
      question: "What makes us trustworthy?",
      answer: "Swiss Ephemeris engine, historical time zone database, coordinate validation, and transparent debug mode."
    }
  ];

  const TriggerIcon = () => {
    if (trigger === "info") {
      return (
        <svg className="w-4 h-4 text-blue-500 hover:text-blue-700 cursor-pointer" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <span className="text-blue-500 hover:text-blue-700 cursor-pointer text-sm font-medium">
        Why might this differ?
      </span>
    );
  };

  return (
    <div className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>
        <TriggerIcon />
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Calculation Accuracy
                  </h3>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  {condensedFAQs.map((faq, index) => (
                    <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                      <p className="text-gray-700 text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 text-sm">
                    <strong>Our goal:</strong> Provide the most astronomically accurate birth charts available in consumer astrology software.
                  </p>
                </div>

                <div className="mt-4 text-center">
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AccuracyTooltip;
