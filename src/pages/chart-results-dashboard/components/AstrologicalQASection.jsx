import React, { useState, useRef, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import { toast } from 'react-hot-toast';
import { marked } from 'marked';

const AstrologicalQASection = ({ chartData }) => {
  const [question, setQuestion] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  // Predefined example questions to help users get started
  const exampleQuestions = [
    "What does my birth chart reveal about my career prospects?",
    "How do the current planetary transits affect my relationships?",
    "What are my strongest planetary influences?",
    "When is the best time for me to start new ventures?",
    "What challenges might I face in the next year according to my dasha periods?"
  ];

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    
    if (!question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (!chartData) {
      toast.error('Chart data is required for Q&A');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user question to conversations
    const userMessage = {
      id: Date.now(),
      type: 'question',
      content: question.trim(),
      timestamp: new Date()
    };

    setConversations(prev => [...prev, userMessage]);
    setQuestion('');

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
      const response = await fetch(`${backendUrl}/api/ai/astrological-qa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: userMessage.content,
          chartData: chartData
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Add AI response to conversations
      const aiMessage = {
        id: Date.now() + 1,
        type: 'answer',
        content: data.answer || 'I apologize, but I could not generate a response to your question.',
        timestamp: new Date(),
        sources: data.sources || []
      };

      setConversations(prev => [...prev, aiMessage]);
      
    } catch (err) {
      console.error('Error submitting question:', err);
      setError('Failed to get an answer. Please try again.');
      toast.error('Failed to get an answer. Please try again.');
      
      // Remove the user question if the API call failed
      setConversations(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleQuestion = (exampleQuestion) => {
    setQuestion(exampleQuestion);
  };

  const clearConversation = () => {
    setConversations([]);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Icon name="MessageCircle" size={32} className="text-primary" />
          <h2 className="text-3xl font-heading font-bold text-text-primary">
            Astrological Q&A
          </h2>
        </div>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Ask specific questions about your birth chart, planetary influences, or life guidance. 
          Get personalized insights based on your unique astrological profile.
        </p>
      </div>

      {/* Example Questions */}
      {conversations.length === 0 && (
        <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
          <h3 className="font-heading font-semibold text-text-primary mb-4 flex items-center space-x-2">
            <Icon name="Lightbulb" size={20} className="text-amber-500" />
            <span>Example Questions</span>
          </h3>
          <div className="grid gap-3">
            {exampleQuestions.map((example, index) => (
              <button
                key={index}
                onClick={() => handleExampleQuestion(example)}
                className="text-left p-3 rounded-lg border border-border-light hover:border-primary/50 hover:bg-primary/5 transition-celestial group"
              >
                <div className="flex items-start space-x-3">
                  <Icon 
                    name="HelpCircle" 
                    size={16} 
                    className="text-primary mt-0.5 group-hover:text-primary" 
                  />
                  <span className="text-sm text-text-secondary group-hover:text-text-primary">
                    {example}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conversation History */}
      {conversations.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-semibold text-text-primary flex items-center space-x-2">
              <Icon name="MessagesSquare" size={20} />
              <span>Conversation</span>
            </h3>
            <button
              onClick={clearConversation}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-text-secondary hover:text-red-500 hover:bg-red-50 rounded-lg transition-celestial"
            >
              <Icon name="Trash2" size={16} />
              <span>Clear</span>
            </button>
          </div>

          <div className="bg-surface rounded-xl border border-border shadow-soft p-6 max-h-96 overflow-y-auto space-y-4">
            {conversations.map((message) => (
              <div key={message.id} className={`flex ${message.type === 'question' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] rounded-lg px-4 py-3 space-y-2
                  ${message.type === 'question' 
                    ? 'bg-primary text-primary-foreground ml-4' 
                    : 'bg-muted text-text-primary mr-4'
                  }
                `}>
                  <div className="flex items-start space-x-2">
                    <Icon 
                      name={message.type === 'question' ? 'User' : 'Sparkles'} 
                      size={16} 
                      className={message.type === 'question' ? 'text-primary-foreground' : 'text-primary'}
                    />
                    <div className="flex-1">
<div className="text-sm" dangerouslySetInnerHTML={{ __html: marked(message.content) }}></div>
                      {message.sources && message.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border-light">
                          <p className="text-xs text-text-muted mb-1">Based on:</p>
                          <div className="flex flex-wrap gap-1">
                            {message.sources.map((source, index) => (
                              <span 
                                key={index} 
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                              >
                                {source}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-xs opacity-75 text-right">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[85%] rounded-lg px-4 py-3 bg-muted text-text-primary mr-4">
                  <div className="flex items-center space-x-2">
                    <Icon name="Sparkles" size={16} className="text-primary animate-spin" />
                    <span className="text-sm">Analyzing your chart...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Question Input Form */}
      <div className="bg-surface rounded-xl border border-border shadow-soft p-6">
        <form onSubmit={handleSubmitQuestion} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="question" className="block text-sm font-medium text-text-primary">
              Ask Your Question
            </label>
            <div className="relative">
              <textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What would you like to know about your astrological chart?"
                className="w-full p-4 pr-12 border border-border rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none bg-background text-text-primary placeholder-text-muted"
                rows={3}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-3">
                <Icon name="MessageCircle" size={20} className="text-text-muted" />
              </div>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <Icon name="AlertCircle" size={16} />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">
              {question.length}/500 characters
            </span>
            <button
              type="submit"
              disabled={isLoading || !question.trim() || question.length > 500}
              className="flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-celestial"
            >
              {isLoading ? (
                <>
                  <Icon name="Loader2" size={16} className="animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Icon name="Send" size={16} />
                  <span>Ask Question</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-xl border border-border p-6">
        <h3 className="font-heading font-semibold text-text-primary mb-3 flex items-center space-x-2">
          <Icon name="Info" size={20} className="text-primary" />
          <span>Tips for Better Answers</span>
        </h3>
        <ul className="space-y-2 text-sm text-text-secondary">
          <li className="flex items-start space-x-2">
            <Icon name="CheckCircle" size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span>Be specific about the area of life you're asking about (career, relationships, health, etc.)</span>
          </li>
          <li className="flex items-start space-x-2">
            <Icon name="CheckCircle" size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span>Ask about timing ("When is a good time for...") for transit-based guidance</span>
          </li>
          <li className="flex items-start space-x-2">
            <Icon name="CheckCircle" size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span>Reference specific planets or houses if you know them</span>
          </li>
          <li className="flex items-start space-x-2">
            <Icon name="CheckCircle" size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
            <span>Ask follow-up questions to dive deeper into any topic</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default AstrologicalQASection;
