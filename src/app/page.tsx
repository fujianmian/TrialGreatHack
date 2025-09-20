'use client';

import { useState, useEffect } from 'react';
import TextToCard from './ttocard/texttocard';
import TextToSummary from './ttosummary/texttosummary';
import TextToMap from './ttomap/texttomap';
import TextToVideo from './ttovideo/texttovideo';
import TextToQuiz from './texttoquiz/texttoquiz';

interface InputMethod {
  id: string;
  name: string;
  icon: string;
}

interface OutputOption {
  id: string;
  name: string;
  icon: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface GeneratedContent {
  type: string;
  title: string;
  content: string;
  keyPoints: string[];
  applications: string[];
}

const inputMethods: InputMethod[] = [
  { id: 'text', name: 'Text', icon: 'fas fa-font' },
  { id: 'upload', name: 'Upload', icon: 'fas fa-file-upload' },
  { id: 'url', name: 'URL', icon: 'fas fa-link' },
  { id: 'voice', name: 'Voice', icon: 'fas fa-microphone' },
];

const outputOptions: OutputOption[] = [
  { id: 'video', name: 'Video', icon: 'fas fa-video' },
  { id: 'flashcards', name: 'Flashcards', icon: 'fas fa-layer-group' },
  { id: 'mindmap', name: 'Mind Map', icon: 'fas fa-brain' },
  { id: 'quiz', name: 'Quiz', icon: 'fas fa-question-circle' },
  { id: 'summary', name: 'Summary', icon: 'fas fa-chart-bar' },
];

const features: Feature[] = [
  {
    icon: 'fas fa-rocket',
    title: 'Save Time',
    description: 'Transform hours of study material into digestible content in seconds',
  },
  {
    icon: 'fas fa-brain',
    title: 'Better Understanding',
    description: 'AI explains concepts in multiple formats for deeper learning',
  },
  {
    icon: 'fas fa-graduation-cap',
    title: 'Personalized Learning',
    description: 'Content adapted to your learning style and level',
  },
];

export default function Home() {
  const [selectedInputMethod, setSelectedInputMethod] = useState('text');
  const [selectedOutputOption, setSelectedOutputOption] = useState('summary');
  const [inputText, setInputText] = useState('Quantum computing is an area of computing focused on developing computer technology based on the principles of quantum theory. Quantum computers use quantum bits or qubits, which can represent both 0 and 1 simultaneously, unlike classical bits. This allows quantum computers to perform certain calculations much faster than traditional computers.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

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

  const handleGenerate = () => {
    // Reset all show states first
    setShowFlashcards(false);
    setShowSummary(false);
    setShowMindMap(false);
    setShowVideo(false);
    setShowQuiz(false);
    
    // Check if flashcards are selected
    if (selectedOutputOption === 'flashcards') {
      setShowFlashcards(true);
      return;
    }

    // Check if summary is selected
    if (selectedOutputOption === 'summary') {
      setShowSummary(true);
      return;
    }

    // Check if mind map is selected
    if (selectedOutputOption === 'mindmap') {
      setShowMindMap(true);
      return;
    }

    // Check if video is selected
    if (selectedOutputOption === 'video') {
      setShowVideo(true);
      return;
    }

    // Check if quiz is selected
    if (selectedOutputOption === 'quiz') {
      setShowQuiz(true);
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);
    
    // Simulate loading delay with more realistic content
    setTimeout(() => {
      setIsGenerating(false);
      const mockContent: GeneratedContent = {
        type: selectedOutputOption,
        title: 'Quantum Computing',
        content: 'Quantum computing represents a revolutionary approach to computation that leverages the principles of quantum mechanics to process information in ways that classical computers cannot.',
        keyPoints: [
          'Uses quantum bits (qubits) that can exist in superposition',
          'Enables parallel processing of multiple states simultaneously',
          'Offers exponential speedup for specific algorithms',
          'Requires extremely low temperatures to maintain quantum states'
        ],
        applications: [
          'Cryptography and cybersecurity',
          'Drug discovery and molecular simulation',
          'Financial modeling and optimization',
          'Artificial intelligence and machine learning'
        ]
      };
      setGeneratedContent(mockContent);
    }, 2000);
  };

  const handleBackFromFlashcards = () => {
    setShowFlashcards(false);
  };

  const handleBackFromSummary = () => {
    setShowSummary(false);
  };

  const handleBackFromMindMap = () => {
    setShowMindMap(false);
  };

  const handleBackFromVideo = () => {
    setShowVideo(false);
  };

  const handleBackFromQuiz = () => {
    setShowQuiz(false);
  };

  // Show flashcard component if flashcards are selected
  if (showFlashcards) {
    return <TextToCard inputText={inputText} onBack={handleBackFromFlashcards} />;
  }

  // Show summary component if summary is selected
  if (showSummary) {
    return <TextToSummary inputText={inputText} onBack={handleBackFromSummary} />;
  }

  // Show mind map component if mind map is selected
  if (showMindMap) {
    return <TextToMap inputText={inputText} onBack={handleBackFromMindMap} />;
  }

  // Show video component if video is selected
  if (showVideo) {
    return <TextToVideo inputText={inputText} onBack={handleBackFromVideo} />;
  }

  // Show quiz component if quiz is selected
  if (showQuiz) {
    return <TextToQuiz inputText={inputText} onBack={handleBackFromQuiz} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Header */}
        <header className="flex justify-between items-center py-6 mb-10 bg-white/80 backdrop-blur-sm rounded-2xl px-8 shadow-lg border border-white/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl">
              <i className="fas fa-graduation-cap text-2xl text-white"></i>
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              EduAI
            </span>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex list-none gap-8">
              <li><a href="#" className="text-gray-700 font-semibold hover:text-blue-600 transition-colors duration-300 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a></li>
              <li><a href="#features" className="text-gray-700 font-semibold hover:text-blue-600 transition-colors duration-300 relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a></li>
              <li><a href="#how-it-works" className="text-gray-700 font-semibold hover:text-blue-600 transition-colors duration-300 relative group">
                How It Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a></li>
              <li><a href="#pricing" className="text-gray-700 font-semibold hover:text-blue-600 transition-colors duration-300 relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
              </a></li>
            </ul>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl text-gray-700`}></i>
          </button>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex gap-4">
            <button className="px-6 py-3 rounded-full border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 hover:border-blue-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              Log In
            </button>
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
              Sign Up
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mb-6 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <nav className="space-y-4">
              <a href="#" className="block text-gray-700 font-semibold hover:text-blue-600 transition-colors py-2">Home</a>
              <a href="#features" className="block text-gray-700 font-semibold hover:text-blue-600 transition-colors py-2">Features</a>
              <a href="#how-it-works" className="block text-gray-700 font-semibold hover:text-blue-600 transition-colors py-2">How It Works</a>
              <a href="#pricing" className="block text-gray-700 font-semibold hover:text-blue-600 transition-colors py-2">Pricing</a>
            </nav>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-3 rounded-full border-2 border-blue-600 text-blue-600 font-semibold hover:bg-blue-50 transition-all">
                Log In
              </button>
              <button className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all">
                Sign Up
              </button>
            </div>
          </div>
        )}
        
        {/* Enhanced Hero Section */}
        <section className="text-center py-16 mb-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent leading-tight">
              Transform Learning with AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
              Generate educational videos, detailed notes, flashcards, and more from any content with our powerful AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-10 py-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
                <i className="fas fa-rocket mr-3"></i>
                Get Started for Free
              </button>
              <button className="px-10 py-4 rounded-full border-2 border-gray-300 text-gray-700 font-semibold text-lg hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <i className="fas fa-play mr-3"></i>
                Watch Demo
              </button>
            </div>
          </div>
        </section>
        
        {/* Enhanced Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">
          {/* Input Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl md:text-3xl mb-6 text-blue-600 flex items-center gap-3 font-bold">
              <div className="p-2 bg-blue-100 rounded-xl">
                <i className="fas fa-pencil-alt text-xl"></i>
              </div>
              Input Your Content
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {inputMethods.map((method) => (
                <div
                  key={method.id}
                  className={`text-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedInputMethod === method.id
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedInputMethod(method.id)}
                >
                  <i className={`${method.icon} text-2xl mb-3 text-blue-600`}></i>
                  <p className="text-sm font-medium text-gray-700">{method.name}</p>
                </div>
              ))}
            </div>
            
            <div className="mb-6">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-y text-base focus:outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                placeholder="Paste your text, article, or any content you want to learn from..."
              />
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <i className="fas fa-cog text-blue-600"></i>
                Advanced Options
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Difficulty Level</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600">
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Language</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600">
                    <option>English</option>
                    <option>Spanish</option>
                    <option>French</option>
                    <option>German</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Output Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300">
            <h2 className="text-2xl md:text-3xl mb-6 text-blue-600 flex items-center gap-3 font-bold">
              <div className="p-2 bg-blue-100 rounded-xl">
                <i className="fas fa-magic text-xl"></i>
              </div>
              Choose Output
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {outputOptions.map((option) => (
                <div
                  key={option.id}
                  className={`text-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedOutputOption === option.id
                      ? 'border-blue-600 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedOutputOption(option.id)}
                >
                  <i className={`${option.icon} text-2xl mb-3 text-blue-600`}></i>
                  <p className="text-sm font-medium text-gray-700">{option.name}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-gray-700 flex items-center gap-2">
                <i className="fas fa-sliders-h text-blue-600"></i>
                Output Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Length</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600">
                    <option>Short</option>
                    <option>Medium</option>
                    <option>Long</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm font-medium text-gray-600">Include examples</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-12 py-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white font-semibold text-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-3`}></i>
                {isGenerating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>
        </div>
        
        
        {/* Enhanced Features Section */}
        <section id="features" className="mb-20">
          <h2 className="text-center text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Why Choose EduAI?
          </h2>
          <p className="text-center text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            Experience the future of learning with our cutting-edge AI technology
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
                  <i className={`${feature.icon} text-2xl text-white`}></i>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
      
      {/* Enhanced Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl">
                  <i className="fas fa-graduation-cap text-xl text-white"></i>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  EduAI
                </span>
              </div>
              <p className="text-gray-600 mb-4 max-w-md">
                AI-powered learning assistant for the modern student. Transform any content into engaging educational materials.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fab fa-linkedin text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-blue-600 transition-colors">
                  <i className="fab fa-github text-xl"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">API</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Status</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 mt-8 pt-8 text-center">
            <p className="text-gray-600">© 2025 EduAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}