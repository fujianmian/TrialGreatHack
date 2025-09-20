'use client';

import { useState, useEffect } from 'react';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  category?: string;
}

interface AIResponse {
  result: Array<{
    front: string;
    back: string;
    category: string;
  }>;
}

interface TextToCardProps {
  inputText: string;
  onBack: () => void;
}

export default function TextToCard({ inputText, onBack }: TextToCardProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [studyMode, setStudyMode] = useState<'all' | 'incorrect'>('all');
  const [incorrectCards, setIncorrectCards] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Add Font Awesome to head
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Generate flashcards from input text
  useEffect(() => {
    if (inputText) {
      generateFlashcards();
    }
  }, [inputText]);

  const generateFlashcards = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate flashcards');
      }

      const data: AIResponse = await response.json();
      
      // Convert AI response to flashcard format
      const generatedFlashcards: Flashcard[] = data.result.map((item, index) => ({
        id: index + 1,
        front: item.front,
        back: item.back,
        category: item.category
      }));

      setFlashcards(generatedFlashcards);
      setIsGenerating(false);
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
      setIsGenerating(false);
      
      // Fallback to mock data if AI fails
      const fallbackFlashcards: Flashcard[] = [
        {
          id: 1,
          front: "What is the main topic?",
          back: "This content discusses various concepts and terminology.",
          category: "General"
        },
        {
          id: 2,
          front: "What are the key concepts?",
          back: "The key concepts include important terms and definitions from the content.",
          category: "General"
        }
      ];
      setFlashcards(fallbackFlashcards);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev + 1) % getFilteredCards().length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCardIndex((prev) => (prev - 1 + getFilteredCards().length) % getFilteredCards().length);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const markIncorrect = () => {
    const currentCard = getFilteredCards()[currentCardIndex];
    if (currentCard) {
      setIncorrectCards(prev => new Set([...prev, currentCard.id]));
    }
    nextCard();
  };

  const markCorrect = () => {
    const currentCard = getFilteredCards()[currentCardIndex];
    if (currentCard) {
      setIncorrectCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(currentCard.id);
        return newSet;
      });
    }
    nextCard();
  };

  const getFilteredCards = () => {
    if (studyMode === 'incorrect') {
      return flashcards.filter(card => incorrectCards.has(card.id));
    }
    return flashcards;
  };

  const resetStudy = () => {
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setIncorrectCards(new Set());
  };

  const currentCard = getFilteredCards()[currentCardIndex];

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Generating Flashcards...</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Our AI is analyzing your content and creating interactive flashcards for better learning.
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 max-w-md mx-auto mt-6">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full animate-pulse" style={{width: '70%'}}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Flashcards</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={generateFlashcards}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <i className="fas fa-redo mr-2"></i>
              Try Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Main
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (getFilteredCards().length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <i className="fas fa-check-circle text-3xl text-green-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Great Job!</h2>
          <p className="text-gray-600 mb-6">
            {studyMode === 'incorrect' 
              ? "You've mastered all the incorrect cards!" 
              : "You've completed all flashcards!"}
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={resetStudy}
              className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <i className="fas fa-redo mr-2"></i>
              Study Again
            </button>
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Main
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Enhanced Header */}
        <header className="bg-gradient-to-r from-white/90 to-blue-50/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={onBack}
                  className="group p-3 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:-translate-x-1"
                >
                  <i className="fas fa-arrow-left text-xl text-gray-700 group-hover:text-blue-600 transition-colors"></i>
                </button>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg">
                    <i className="fas fa-layer-group text-2xl text-white"></i>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Flashcard Study
                    </h1>
                    <p className="text-sm text-gray-600">AI-generated interactive learning</p>
                  </div>
                </div>
              </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <i className="fas fa-cog text-blue-600"></i>
                  Study Mode:
                </span>
                <select
                  value={studyMode}
                  onChange={(e) => {
                    setStudyMode(e.target.value as 'all' | 'incorrect');
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 bg-white shadow-sm"
                >
                  <option value="all">All Cards ({flashcards.length})</option>
                  <option value="incorrect">Incorrect Only ({incorrectCards.size})</option>
                </select>
              </div>
              
              <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl px-4 py-2 shadow-sm">
                <div className="text-sm font-semibold text-gray-700 text-center">
                  <div className="text-lg font-bold text-blue-700">{currentCardIndex + 1}</div>
                  <div className="text-xs text-gray-600">of {getFilteredCards().length}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Progress Bar */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <i className="fas fa-chart-line text-white text-sm"></i>
              </div>
              <span className="text-lg font-semibold text-gray-800">Study Progress</span>
            </div>
            <div className="bg-gradient-to-r from-blue-100 to-indigo-100 rounded-xl px-4 py-2">
              <span className="text-lg font-bold text-blue-700">
                {Math.round(((currentCardIndex + 1) / getFilteredCards().length) * 100)}%
              </span>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
            <div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{width: `${((currentCardIndex + 1) / getFilteredCards().length) * 100}%`}}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>Card {currentCardIndex + 1} of {getFilteredCards().length}</span>
            <span>{getFilteredCards().length - currentCardIndex - 1} remaining</span>
          </div>
        </div>

        {/* Enhanced Flashcard */}
        <div className="relative mb-8 perspective-1000">
          <div 
            className={`relative w-full h-96 cursor-pointer transform-gpu transition-transform duration-700 hover:scale-105 ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={flipCard}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden ${isFlipped ? 'hidden' : 'block'}`}>
              <div className="bg-gradient-to-br from-white via-blue-50 to-indigo-50 rounded-3xl shadow-2xl border border-gray-200 p-8 h-full flex flex-col justify-center items-center text-center relative overflow-hidden group">
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-semibold rounded-full shadow-lg">
                      <i className="fas fa-tag mr-2"></i>
                      {currentCard?.category}
                    </span>
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-6 leading-tight">
                    {currentCard?.front}
                  </h2>
                  <div className="flex items-center justify-center text-gray-500 text-sm bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                    <i className="fas fa-hand-pointer mr-2 animate-bounce"></i>
                    Click to reveal answer
                  </div>
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden ${isFlipped ? 'block' : 'hidden'}`}>
              <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 rounded-3xl shadow-2xl border border-green-200 p-8 h-full flex flex-col justify-center items-center text-center relative overflow-hidden group">
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full opacity-50 group-hover:opacity-70 transition-opacity duration-300"></div>
                <div className="absolute bottom-4 left-4 w-16 h-16 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-full opacity-40 group-hover:opacity-60 transition-opacity duration-300"></div>
                
                <div className="relative z-10">
                  <div className="mb-6">
                    <span className="inline-block px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold rounded-full shadow-lg">
                      <i className="fas fa-check-circle mr-2"></i>
                      Answer
                    </span>
                  </div>
                  <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-6">
                    {currentCard?.back}
                  </p>
                  <div className="flex items-center justify-center text-gray-500 text-sm bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
                    <i className="fas fa-hand-pointer mr-2 animate-bounce"></i>
                    Click to flip back
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-8">
          <button
            onClick={prevCard}
            disabled={getFilteredCards().length <= 1}
            className="group px-8 py-4 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-lg"
          >
            <i className="fas fa-chevron-left mr-3 group-hover:-translate-x-1 transition-transform duration-300"></i>
            Previous
          </button>

          <div className="flex gap-4">
            <button
              onClick={markIncorrect}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/25"
            >
              <i className="fas fa-times mr-3 group-hover:rotate-90 transition-transform duration-300"></i>
              Incorrect
            </button>
            <button
              onClick={markCorrect}
              className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-500/25"
            >
              <i className="fas fa-check mr-3 group-hover:scale-110 transition-transform duration-300"></i>
              Correct
            </button>
          </div>

          <button
            onClick={nextCard}
            disabled={getFilteredCards().length <= 1}
            className="group px-8 py-4 rounded-2xl border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-1 hover:shadow-lg"
          >
            Next
            <i className="fas fa-chevron-right ml-3 group-hover:translate-x-1 transition-transform duration-300"></i>
          </button>
        </div>

        {/* Study Stats */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Study Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{flashcards.length}</div>
              <div className="text-sm text-gray-600">Total Cards</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{flashcards.length - incorrectCards.size}</div>
              <div className="text-sm text-gray-600">Mastered</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{incorrectCards.size}</div>
              <div className="text-sm text-gray-600">Need Review</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{Math.round(((flashcards.length - incorrectCards.size) / flashcards.length) * 100)}%</div>
              <div className="text-sm text-gray-600">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
