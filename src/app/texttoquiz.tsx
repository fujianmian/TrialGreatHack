'use client';

import { useState } from 'react';

interface QuizQuestion {
  id: string;
  type: 'multiple-choice' | 'true-false' | 'fill-in-the-blank' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  numQuestions: number;
  questionTypes: string[];
  topic: string;
}

export default function TextToQuiz() {
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<{ [key: string]: string }>({});
  const [showResults, setShowResults] = useState(false);
  const [settings, setSettings] = useState<QuizSettings>({
    difficulty: 'medium',
    numQuestions: 5,
    questionTypes: ['multiple-choice', 'true-false'],
    topic: ''
  });

  const generateQuiz = async () => {
    if (!inputText.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate API call - replace with actual AI service
    setTimeout(() => {
      const mockQuiz = generateMockQuiz(inputText, settings);
      setQuiz(mockQuiz);
      setCurrentQuestion(0);
      setUserAnswers({});
      setShowResults(false);
      setIsGenerating(false);
    }, 2000);
  };

  const generateMockQuiz = (text: string, settings: QuizSettings): QuizQuestion[] => {
    // Mock quiz generation - replace with actual AI integration
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < settings.numQuestions; i++) {
      const questionTypes = settings.questionTypes;
      const type = questionTypes[Math.floor(Math.random() * questionTypes.length)] as QuizQuestion['type'];
      
      let question: QuizQuestion;
      
      switch (type) {
        case 'multiple-choice':
          question = {
            id: q${i + 1},
            type: 'multiple-choice',
            question: What is the main topic discussed in the text? (Question ${i + 1}),
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correctAnswer: 'Option B',
            explanation: 'This is the correct answer based on the text content.',
            difficulty: settings.difficulty
          };
          break;
        case 'true-false':
          question = {
            id: q${i + 1},
            type: 'true-false',
            question: The text discusses important concepts. (Question ${i + 1}),
            correctAnswer: 'True',
            explanation: 'The text contains several important concepts.',
            difficulty: settings.difficulty
          };
          break;
        case 'fill-in-the-blank':
          question = {
            id: q${i + 1},
            type: 'fill-in-the-blank',
            question: The main idea of the text is about ______. (Question ${i + 1}),
            correctAnswer: 'learning',
            explanation: 'The text focuses on learning concepts.',
            difficulty: settings.difficulty
          };
          break;
        default:
          question = {
            id: q${i + 1},
            type: 'short-answer',
            question: Summarize the key points from the text. (Question ${i + 1}),
            correctAnswer: 'Various answers accepted',
            explanation: 'Answers should cover the main concepts discussed.',
            difficulty: settings.difficulty
          };
      }
      
      questions.push(question);
    }
    
    return questions;
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    quiz.forEach(question => {
      const userAnswer = userAnswers[question.id];
      if (userAnswer === question.correctAnswer || 
          (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(userAnswer))) {
        correct++;
      }
    });
    return { correct, total: quiz.length, percentage: Math.round((correct / quiz.length) * 100) };
  };

  const resetQuiz = () => {
    setQuiz([]);
    setCurrentQuestion(0);
    setUserAnswers({});
    setShowResults(false);
    setInputText('');
  };

  if (showResults && quiz.length > 0) {
    const score = calculateScore();
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Quiz Results</h1>
              <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-4">
                <span className="text-4xl font-bold text-white">{score.percentage}%</span>
              </div>
              <p className="text-xl text-gray-600">
                You got {score.correct} out of {score.total} questions correct!
              </p>
            </div>

            <div className="space-y-6">
              {quiz.map((question, index) => {
                const userAnswer = userAnswers[question.id];
                const isCorrect = userAnswer === question.correctAnswer || 
                  (Array.isArray(question.correctAnswer) && question.correctAnswer.includes(userAnswer));
                
                return (
                  <div key={question.id} className={`p-6 rounded-xl border-2 ${
                    isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">
                        Question {index + 1}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{question.question}</p>
                    
                    {question.type === 'multiple-choice' && question.options && (
                      <div className="space-y-2 mb-4">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className={`p-3 rounded-lg ${
                            option === question.correctAnswer ? 'bg-green-100 border-green-300' :
                            option === userAnswer ? 'bg-red-100 border-red-300' :
                            'bg-gray-50 border-gray-200'
                          } border`}>
                            {option}
                            {option === question.correctAnswer && (
                              <span className="ml-2 text-green-600 font-medium">✓ Correct Answer</span>
                            )}
                            {option === userAnswer && option !== question.correctAnswer && (
                              <span className="ml-2 text-red-600 font-medium">✗ Your Answer</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {question.type === 'true-false' && (
                      <div className="space-y-2 mb-4">
                        <div className={`p-3 rounded-lg ${
                          question.correctAnswer === 'True' ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'
                        } border`}>
                          True {question.correctAnswer === 'True' && <span className="ml-2 text-green-600 font-medium">✓</span>}
                        </div>
                        <div className={`p-3 rounded-lg ${
                          question.correctAnswer === 'False' ? 'bg-green-100 border-green-300' : 'bg-gray-50 border-gray-200'
                        } border`}>
                          False {question.correctAnswer === 'False' && <span className="ml-2 text-green-600 font-medium">✓</span>}
                        </div>
                        <p className="text-sm text-gray-600">Your answer: {userAnswer || 'Not answered'}</p>
                      </div>
                    )}
                    
                    {question.type === 'fill-in-the-blank' && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">Your answer: {userAnswer || 'Not answered'}</p>
                        <p className="text-sm text-gray-600">Correct answer: {question.correctAnswer}</p>
                      </div>
                    )}
                    
                    {question.explanation && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-medium text-blue-800 mb-2">Explanation:</h4>
                        <p className="text-blue-700">{question.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center space-x-4">
              <button
                onClick={resetQuiz}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Create New Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (quiz.length > 0) {
    const question = quiz[currentQuestion];
    const userAnswer = userAnswers[question.id];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold text-gray-800">AI Quiz Generator</h1>
                <div className="text-sm text-gray-600">
                  Question {currentQuestion + 1} of {quiz.length}
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: ${((currentQuestion + 1) / quiz.length) * 100}% }}
                ></div>
              </div>
            </div>

            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">{question.question}</h2>
              
              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-3">
                  {question.options.map((option, index) => (
                    <label key={index} className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={userAnswer === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        userAnswer === option ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {userAnswer === option && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-gray-700 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'true-false' && (
                <div className="space-y-3">
                  {['True', 'False'].map((option) => (
                    <label key={option} className="flex items-center p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-all duration-200">
                      <input
                        type="radio"
                        name={question.id}
                        value={option}
                        checked={userAnswer === option}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                        userAnswer === option ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                      }`}>
                        {userAnswer === option && <div className="w-2 h-2 bg-white rounded-full"></div>}
                      </div>
                      <span className="text-gray-700 font-medium">{option}</span>
                    </label>
                  ))}
                </div>
              )}

              {question.type === 'fill-in-the-blank' && (
                <div>
                  <input
                    type="text"
                    value={userAnswer || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none text-lg"
                  />
                </div>
              )}

              {question.type === 'short-answer' && (
                <div>
                  <textarea
                    value={userAnswer || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    placeholder="Type your answer here..."
                    rows={4}
                    className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between">
              <button
                onClick={prevQuestion}
                disabled={currentQuestion === 0}
                className="px-6 py-3 bg-gray-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-all duration-200"
              >
                Previous
              </button>
              <button
                onClick={nextQuestion}
                disabled={!userAnswer}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {currentQuestion === quiz.length - 1 ? 'Finish Quiz' : 'Next Question'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">AI Quiz Generator</h1>
            <p className="text-xl text-gray-600">
              Transform any text into an interactive quiz with AI-powered question generation
            </p>
          </div>

          <div className="space-y-6">
            {/* Text Input */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Enter your text content:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Paste your educational content, article, or any text you want to turn into a quiz..."
                rows={8}
                className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none resize-none text-gray-700"
              />
            </div>

            {/* Quiz Settings */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Quiz Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={settings.difficulty}
                    onChange={(e) => setSettings(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <select
                    value={settings.numQuestions}
                    onChange={(e) => setSettings(prev => ({ ...prev, numQuestions: parseInt(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                    <option value={15}>15 Questions</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Types
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'multiple-choice', label: 'Multiple Choice' },
                      { value: 'true-false', label: 'True/False' },
                      { value: 'fill-in-the-blank', label: 'Fill in the Blank' },
                      { value: 'short-answer', label: 'Short Answer' }
                    ].map((type) => (
                      <label key={type.value} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={settings.questionTypes.includes(type.value)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSettings(prev => ({
                                ...prev,
                                questionTypes: [...prev.questionTypes, type.value]
                              }));
                            } else {
                              setSettings(prev => ({
                                ...prev,
                                questionTypes: prev.questionTypes.filter(t => t !== type.value)
                              }));
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-gray-700">{type.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic (Optional)
                  </label>
                  <input
                    type="text"
                    value={settings.topic}
                    onChange={(e) => setSettings(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Science, History, Math..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generateQuiz}
                disabled={!inputText.trim() || isGenerating || settings.questionTypes.length === 0}
                className="px-12 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xl font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Generating Quiz...
                  </div>
                ) : (
                  'Generate Quiz'
                )}
              </button>
            </div>

            {/* Features */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">AI-Powered</h3>
                <p className="text-gray-600">Advanced AI generates relevant and challenging questions from your content</p>
              </div>
              
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📝</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Multiple Formats</h3>
                <p className="text-gray-600">Support for various question types including multiple choice, true/false, and more</p>
              </div>
              
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Instant Results</h3>
                <p className="text-gray-600">Get immediate feedback with detailed explanations and scoring</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}