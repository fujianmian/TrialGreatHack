'use client';

import { useState, useEffect, useCallback } from 'react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

interface TextToQuizProps {
  inputText: string;
  onBack: () => void;
  questionCount: number;
  difficulty: string;
}

interface AIResponse {
  result: QuizQuestion[];
}

export default function TextToQuiz({ inputText, onBack, questionCount, difficulty }: TextToQuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [userAnswers, setUserAnswers] = useState<Map<number, number>>(new Map());

  // Logger for props
  useEffect(() => {
    console.log('[TextToQuiz] Mounted with props:', { inputText, questionCount, difficulty });
    return () => {
      console.log('[TextToQuiz] Unmounted');
    };
  }, []);

  const generateQuiz = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    console.log('[TextToQuiz] Starting quiz generation', { inputText, questionCount, difficulty });
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: inputText,
          questionCount: questionCount,
          difficulty: difficulty
        }),
      });

      console.log('[TextToQuiz] API request sent');
      if (!response.ok) {
        const errorData = await response.json();
        console.warn('[TextToQuiz] API error response:', errorData);
        throw new Error(errorData.error || 'Failed to generate quiz');
      }

      const data: AIResponse = await response.json();
      console.log('[TextToQuiz] API response received:', data);
      setQuestions(data.result);
      setIsGenerating(false);
      console.log('[TextToQuiz] Quiz questions set:', data.result);
    } catch (err) {
      console.error('[TextToQuiz] Error generating quiz:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate quiz');
      setIsGenerating(false);
      // Fallback to mock data if API fails to trigger
      const generateFallbackQuestions = (count: number, difficulty: string): QuizQuestion[] => {
        const baseQuestions = [
          {
            question: "What is the main topic discussed in the text?",
            options: ["Quantum computing basics", "Classical computing principles", "Data storage methods", "Network protocols"],
            correctAnswer: 0,
            explanation: "The text primarily discusses quantum computing and its fundamental principles.",
            category: "General"
          },
          {
            question: "What are quantum bits called?",
            options: ["Qubits", "Quantum bytes", "Quantum units", "Quantum particles"],
            correctAnswer: 0,
            explanation: "Quantum bits are called qubits, which can exist in superposition states.",
            category: "Technical"
          },
          {
            question: "How do quantum computers differ from classical computers?",
            options: ["They use different programming languages", "They can process multiple states simultaneously", "They are physically larger", "They use different operating systems"],
            correctAnswer: 1,
            explanation: "Quantum computers can process multiple states simultaneously due to quantum superposition.",
            category: "Technical"
          },
          {
            question: "What is quantum superposition?",
            options: ["A type of quantum error", "The ability to exist in multiple states", "A quantum algorithm", "A quantum measurement technique"],
            correctAnswer: 1,
            explanation: "Quantum superposition allows quantum particles to exist in multiple states simultaneously.",
            category: "Advanced"
          },
          {
            question: "Which principle allows quantum computers to be faster?",
            options: ["Quantum entanglement", "Quantum tunneling", "Quantum interference", "All of the above"],
            correctAnswer: 3,
            explanation: "All quantum principles (entanglement, tunneling, interference) contribute to quantum computing speed.",
            category: "Advanced"
          }
        ];
        // Generate questions based on difficulty and count
        const questions: QuizQuestion[] = [];
        for (let i = 0; i < count; i++) {
          const baseQuestion = baseQuestions[i % baseQuestions.length];
          questions.push({
            id: i + 1,
            ...baseQuestion,
            question: `${baseQuestion.question} (${difficulty} Level)`,
            explanation: `${baseQuestion.explanation} This is a ${difficulty.toLowerCase()} level question.`
          });
        }
        return questions;
      };
      const fallbackQuestions = generateFallbackQuestions(questionCount, difficulty);
      console.log('[TextToQuiz] Using fallback questions:', fallbackQuestions);
      setQuestions(fallbackQuestions);
    }
  }, [inputText, questionCount, difficulty]);

  useEffect(() => {
    if (inputText) {
      console.log('[TextToQuiz] inputText changed, generating quiz...');
      generateQuiz();
    }
  }, [inputText, generateQuiz]);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult || quizCompleted) return;
    console.log('[TextToQuiz] Answer selected:', answerIndex);
    setSelectedAnswer(answerIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    console.log('[TextToQuiz] Submitting answer:', {
      questionIndex: currentQuestionIndex,
      selectedAnswer,
      isCorrect
    });
    if (isCorrect) {
      setScore(prev => {
        const newScore = prev + 1;
        console.log('[TextToQuiz] Score updated:', newScore);
        return newScore;
      });
    }
    setUserAnswers(prev => {
      const newAnswers = new Map(prev.set(currentQuestionIndex, selectedAnswer));
      console.log('[TextToQuiz] User answers updated:', Array.from(newAnswers.entries()));
      return newAnswers;
    });
    setAnsweredQuestions(prev => {
      const newSet = new Set([...prev, currentQuestionIndex]);
      console.log('[TextToQuiz] Answered questions updated:', Array.from(newSet));
      return newSet;
    });
    setShowResult(true);
    console.log('[TextToQuiz] Show result set to true');
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => {
        const nextIndex = prev + 1;
        console.log('[TextToQuiz] Moving to next question:', nextIndex);
        return nextIndex;
      });
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
      console.log('[TextToQuiz] Quiz completed!');
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => {
        const prevIndex = prev - 1;
        console.log('[TextToQuiz] Moving to previous question:', prevIndex);
        return prevIndex;
      });
      const previousAnswer = userAnswers.get(currentQuestionIndex - 1);
      console.log('[TextToQuiz] Previous answer:', previousAnswer);
      setSelectedAnswer(previousAnswer !== undefined ? previousAnswer : null);
      setShowResult(answeredQuestions.has(currentQuestionIndex - 1));
    }
  };

  const resetQuiz = () => {
    console.log('[TextToQuiz] Resetting quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
    setAnsweredQuestions(new Set());
    setUserAnswers(new Map());
  };

  const retakeQuiz = () => {
    console.log('[TextToQuiz] Retaking quiz');
    resetQuiz();
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6">
            <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Generating Quiz...</h2>
          <p className="text-gray-600 max-w-md mx-auto">
            Our AI is analyzing your content and creating interactive quiz questions for better learning.
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
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <i className="fas fa-exclamation-triangle text-3xl text-red-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Quiz</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={generateQuiz}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
            <i className="fas fa-question-circle text-3xl text-gray-600"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Generated</h2>
          <p className="text-gray-600 mb-6">Unable to generate quiz questions from the provided text.</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPassing = percentage >= 70;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Home
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Quiz Complete!</h1>
            <div></div>
          </div>

          {/* Results Card */}
          <div className="bg-white rounded-3xl shadow-xl p-8 text-center mb-8">
            <div className={`inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 ${
              isPassing ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <i className={`fas ${isPassing ? 'fa-check-circle' : 'fa-times-circle'} text-4xl ${
                isPassing ? 'text-green-600' : 'text-red-600'
              }`}></i>
            </div>
            
            <h2 className="text-4xl font-bold text-gray-800 mb-2">
              {percentage}%
            </h2>
            <p className="text-xl text-gray-600 mb-6">
              You scored {score} out of {questions.length} questions
            </p>
            
            <div className="bg-gray-50 rounded-2xl p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{score}</div>
                  <div className="text-sm text-gray-600">Correct</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{questions.length - score}</div>
                  <div className="text-sm text-gray-600">Incorrect</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={retakeQuiz}
                className="w-full md:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <i className="fas fa-redo mr-2"></i>
                Retake Quiz
              </button>
              <button
                onClick={onBack}
                className="w-full md:w-auto px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold ml-4"
              >
                <i className="fas fa-home mr-2"></i>
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isAnswered = answeredQuestions.has(currentQuestionIndex);
  const userAnswer = userAnswers.get(currentQuestionIndex);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Home
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-800">Interactive Quiz</h1>
            <p className="text-gray-600">Question {currentQuestionIndex + 1} of {questions.length}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{score}</div>
            <div className="text-sm text-gray-600">Score</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-300"
              style={{width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`}}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                {currentQuestion.category}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 leading-relaxed">
              {currentQuestion.question}
            </h2>
          </div>

          {/* Answer Options */}
          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => {
              let optionClass = "w-full p-4 text-left border-2 rounded-xl transition-all duration-200 cursor-pointer ";
              
              if (isAnswered && showResult) {
                if (index === currentQuestion.correctAnswer) {
                  optionClass += "border-green-500 bg-green-50 text-green-800";
                } else if (index === userAnswer && index !== currentQuestion.correctAnswer) {
                  optionClass += "border-red-500 bg-red-50 text-red-800";
                } else {
                  optionClass += "border-gray-200 bg-gray-50 text-gray-600";
                }
              } else if (selectedAnswer === index) {
                optionClass += "border-blue-500 bg-blue-50 text-blue-800";
              } else {
                optionClass += "border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700";
              }

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isAnswered && showResult}
                  className={optionClass}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      (isAnswered && showResult && index === currentQuestion.correctAnswer) ||
                      (selectedAnswer === index && !isAnswered)
                        ? 'border-current bg-current text-white'
                        : 'border-gray-300'
                    }`}>
                      {isAnswered && showResult && index === currentQuestion.correctAnswer && (
                        <i className="fas fa-check text-xs"></i>
                      )}
                      {isAnswered && showResult && index === userAnswer && index !== currentQuestion.correctAnswer && (
                        <i className="fas fa-times text-xs"></i>
                      )}
                      {!isAnswered && selectedAnswer === index && (
                        <div className="w-2 h-2 bg-current rounded-full"></div>
                      )}
                    </div>
                    <span className="font-medium">{option}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {isAnswered && showResult && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <i className="fas fa-lightbulb text-yellow-500"></i>
                Explanation
              </h3>
              <p className="text-gray-700 leading-relaxed">{currentQuestion.explanation}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-chevron-left mr-2"></i>
              Previous
            </button>

            {!isAnswered ? (
              <button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Submit Answer
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
              >
                {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next Question'}
                <i className="fas fa-chevron-right ml-2"></i>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
