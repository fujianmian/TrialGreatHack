'use client';

import { useState, useEffect } from 'react';

interface Flashcard {
  id: number;
  front: string;
  back: string;
  category?: string;
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

  const generateFlashcards = () => {
    setIsGenerating(true);
    
    // Simulate AI processing delay
    setTimeout(() => {
      // Mock flashcard generation based on input text
      const mockFlashcards: Flashcard[] = [
        {
          id: 1,
          front: "What is quantum computing?",
          back: "Quantum computing is a type of computation that harnesses quantum mechanical phenomena to process information in ways that classical computers cannot.",
          category: "Definition"
        },
        {
          id: 2,
          front: "What are qubits?",
          back: "Qubits (quantum bits) are the basic units of quantum information that can exist in superposition, representing both 0 and 1 simultaneously.",
          category: "Key Concept"
        },
        {
          id: 3,
          front: "What is quantum superposition?",
          back: "Quantum superposition is the ability of quantum particles to exist in multiple states at the same time until they are measured or observed.",
          category: "Key Concept"
        },
        {
          id: 4,
          front: "What are the main applications of quantum computing?",
          back: "Cryptography, drug discovery, financial modeling, optimization problems, and artificial intelligence are key applications of quantum computing.",
          category: "Applications"
        },
        {
          id: 5,
          front: "What is quantum entanglement?",
          back: "Quantum entanglement is a phenomenon where particles become interconnected and the state of one particle instantly influences the state of another, regardless of distance.",
          category: "Key Concept"
        }
      ];
      
      setFlashcards(mockFlashcards);
      setIsGenerating(false);
    }, 2000);
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
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-arrow-left text-xl text-gray-700"></i>
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl">
                  <i className="fas fa-layer-group text-xl text-white"></i>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Flashcard Study
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-600">Study Mode:</span>
                <select
                  value={studyMode}
                  onChange={(e) => {
                    setStudyMode(e.target.value as 'all' | 'incorrect');
                    setCurrentCardIndex(0);
                    setIsFlipped(false);
                  }}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-600"
                >
                  <option value="all">All Cards ({flashcards.length})</option>
                  <option value="incorrect">Incorrect Only ({incorrectCards.size})</option>
                </select>
              </div>
              
              <div className="text-sm text-gray-600">
                {currentCardIndex + 1} of {getFilteredCards().length}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentCardIndex + 1) / getFilteredCards().length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{width: `${((currentCardIndex + 1) / getFilteredCards().length) * 100}%`}}
            ></div>
          </div>
        </div>

        {/* Flashcard */}
        <div className="relative mb-8">
          <div 
            className={`relative w-full h-96 cursor-pointer transform-gpu transition-transform duration-700 ${
              isFlipped ? 'rotate-y-180' : ''
            }`}
            onClick={flipCard}
            style={{ transformStyle: 'preserve-3d' }}
          >
            {/* Front of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden ${isFlipped ? 'hidden' : 'block'}`}>
              <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 h-full flex flex-col justify-center items-center text-center">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {currentCard?.category}
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
                  {currentCard?.front}
                </h2>
                <div className="text-gray-500 text-sm">
                  <i className="fas fa-hand-pointer mr-2"></i>
                  Click to reveal answer
                </div>
              </div>
            </div>

            {/* Back of card */}
            <div className={`absolute inset-0 w-full h-full backface-hidden ${isFlipped ? 'block' : 'hidden'}`}>
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl shadow-2xl border border-blue-200 p-8 h-full flex flex-col justify-center items-center text-center">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    Answer
                  </span>
                </div>
                <p className="text-lg md:text-xl text-gray-700 leading-relaxed">
                  {currentCard?.back}
                </p>
                <div className="text-gray-500 text-sm mt-4">
                  <i className="fas fa-hand-pointer mr-2"></i>
                  Click to flip back
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={prevCard}
            disabled={getFilteredCards().length <= 1}
            className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-chevron-left mr-2"></i>
            Previous
          </button>

          <div className="flex gap-3">
            <button
              onClick={markIncorrect}
              className="px-6 py-3 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <i className="fas fa-times mr-2"></i>
              Incorrect
            </button>
            <button
              onClick={markCorrect}
              className="px-6 py-3 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <i className="fas fa-check mr-2"></i>
              Correct
            </button>
          </div>

          <button
            onClick={nextCard}
            disabled={getFilteredCards().length <= 1}
            className="px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <i className="fas fa-chevron-right ml-2"></i>
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
