'use client';

import { useState, useEffect, useRef } from 'react';
import TextToCard from './ttocard/texttocard';
import TextToSummary from './ttosummary/texttosummary';
import TextToMap from './ttomap/texttomap';
import TextToVideo from './ttovideo/texttovideo';
import TextToQuiz from './texttoquiz/texttoquiz';
import ChatBox from './chatbox';

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
//trigger 

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
  const [selectedOutputOption, setSelectedOutputOption] = useState<string>('');
  const [inputText, setInputText] = useState('Quantum computing is a field of computing focused on developing computer technology based on the principles of quantum theory. Quantum computers use quantum bits or qubits, which can represent both 0 and 1 simultaneously, unlike classical bits. This allows quantum computers to perform certain calculations much faster than traditional computers.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [difficultyLevel, setDifficultyLevel] = useState<string>('Beginner');
  const [recommendation, setRecommendation] = useState<string | null>(null);

  
  // Ref for the main content section to scroll to
  const mainContentRef = useRef<HTMLDivElement>(null);

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

  // Logger for mounting
  useEffect(() => {
    console.log('[Home] Mounted');
    return () => {
      console.log('[Home] Unmounted');
    };
  }, []);


  async function handleRecommendation() {
    setLoading(true);
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: inputText }),
    });

    const data = await res.json();
    // Highlight the recommended option
    if (data.recommendation) {
      const normalized = data.recommendation.toLowerCase().trim();
      setSelectedOutputOption(normalized);
      setRecommendation(normalized); // 👈 add this
    }
    setLoading(false);
  }

  const handleGenerate = () => {
    console.log('[Home] handleGenerate called. Output option:', selectedOutputOption);
    // Reset all show states first
    setShowFlashcards(false);
    setShowSummary(false);
    setShowMindMap(false);
    setShowVideo(false);
    setShowQuiz(false);

    // Check if flashcards are selected
    if (selectedOutputOption === 'flashcards') {
      console.log('[Home] Showing flashcards for input:', inputText);
      setShowFlashcards(true);
      return;
    }

    // Check if summary is selected
    if (selectedOutputOption === 'summary') {
      console.log('[Home] Showing summary for input:', inputText);
      setShowSummary(true);
      return;
    }

    // Check if mind map is selected
    if (selectedOutputOption === 'mindmap') {
      console.log('[Home] Showing mind map for input:', inputText);
      setShowMindMap(true);
      return;
    }

    // Check if video is selected
    if (selectedOutputOption === 'video') {
      console.log('[Home] Showing video for input:', inputText);
      setShowVideo(true);
      return;
    }

    // Check if quiz is selected
    if (selectedOutputOption === 'quiz') {
      console.log('[Home] Showing quiz for input:', inputText);
      setShowQuiz(true);
      return;
    }

    setIsGenerating(true);
    console.log('[Home] Generating output for:', selectedOutputOption, 'with input:', inputText);
    // Simulate loading delay with more realistic content
    setTimeout(() => {
      setIsGenerating(false);
      console.log('[Home] Generation finished');
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('[Home] File uploaded:', file.name, 'type:', file.type);
      setUploadedFile(file);

      // Read file content based on file type
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log('[Home] FileReader loaded content:', content?.slice(0, 100));
        setFileContent(content);
        setInputText(content); // Update the main input text
      };

      if (file.type === 'text/plain' || file.type === 'text/csv') {
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        // Call your backend API route
        const formData = new FormData();
        formData.append('file', file);

        try {
          const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to extract PDF text');
          }

          const data = await response.json();
          console.log('[Home] PDF extracted text (raw):', data.extractedText?.slice(0, 100));
          console.log('[Home] PDF processed content:', data.processedContent?.slice(0, 100));

          setFileContent(data.extractedText);
          setInputText(data.processedContent); // or use extractedText depending on your need
        } catch (err) {
          console.error('[Home] Error extracting PDF:', err);
          setFileContent('Failed to extract PDF text.');
          setInputText('');
        }} 
        else if (file.type.includes('word') || file.type.includes('document')) {
              const text = await extractWordText(file);

        async function extractWordText(file: File): Promise<string> {
          // Placeholder implementation for extracting text from a Word document
          return "Extracted text from Word document (placeholder)";
        }
        console.log('[Home] Word extracted text:', text?.slice(0, 100));
        setFileContent(text);
        setInputText(text);
      } else {
        setFileContent('File uploaded successfully!');
        setInputText('File uploaded successfully!');
        console.log('[Home] Unknown file type, set generic content');
      }
    }
  };

  const handleRemoveFile = () => {
    console.log('[Home] Removing uploaded file');
    setUploadedFile(null);
    setFileContent('');
    setInputText('');
  };

  const handleInputMethodChange = (methodId: string) => {
    console.log('[Home] Input method changed:', methodId);
    setSelectedInputMethod(methodId);

    // Reset file-related state when switching away from upload
    if (methodId !== 'upload') {
      setUploadedFile(null);
      setFileContent('');
    }

    // Reset input text when switching to a new method (except upload)
    if (methodId !== 'upload' && methodId !== selectedInputMethod) {
      setInputText('');
    }
  };

  const scrollToMainContent = () => {
    console.log('[Home] Scrolling to main content');
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const getQuestionCount = (difficulty: string): number => {
    switch (difficulty) {
      case 'Beginner':
        return 5;
      case 'Intermediate':
        return 10;
      case 'Advanced':
        return 15;
      default:
        return 5;
    }
  };

  // Show flashcard component if flashcards are selected
  if (showFlashcards) {
    return <TextToCard inputText={inputText} onBack={handleBackFromFlashcards} questionCount={getQuestionCount(difficultyLevel)} difficulty={difficultyLevel} />;
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
    return <TextToQuiz inputText={inputText} onBack={handleBackFromQuiz} questionCount={getQuestionCount(difficultyLevel)} difficulty={difficultyLevel} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Enhanced Header */}
        <header className="flex justify-between items-center py-6 mb-10 bg-gray-900 rounded-3xl px-8 shadow-lg border border-gray-700">
          <div className="flex items-center">
            <div className="w-[350px] h-[120px] flex items-center justify-center">
              <img 
                src="/logo.svg" 
                alt="EduAI Logo" 
                className="w-full h-full object-contain drop-shadow-2xl filter brightness-110 contrast-110"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(147, 51, 234, 0.8)) drop-shadow(0 0 40px rgba(126, 34, 206, 0.6)) drop-shadow(0 0 60px rgba(109, 40, 217, 0.4))',
                  animation: 'logo-glow-purple 2s ease-in-out infinite alternate'
                }}
              />
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <ul className="flex list-none gap-8">
              <li><a href="#" className="text-white font-semibold hover:text-[#D81E83] transition-colors duration-300 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D81E83] transition-all duration-300 group-hover:w-full"></span>
              </a></li>
              <li><a href="#features" className="text-white font-semibold hover:text-[#D81E83] transition-colors duration-300 relative group">
                Features
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D81E83] transition-all duration-300 group-hover:w-full"></span>
              </a></li>
              <li><a href="#how-it-works" className="text-white font-semibold hover:text-[#D81E83] transition-colors duration-300 relative group">
                How It Works
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D81E83] transition-all duration-300 group-hover:w-full"></span>
              </a></li>
              <li><a href="#pricing" className="text-white font-semibold hover:text-[#D81E83] transition-colors duration-300 relative group">
                Pricing
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#D81E83] transition-all duration-300 group-hover:w-full"></span>
              </a></li>
            </ul>
          </nav>
          
          {/* Mobile Menu Button */}
          <button 
            className="lg:hidden p-2 rounded-lg hover:bg-gray-800 transition-colors"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl text-white`}></i>
          </button>
          
          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex gap-4">
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
              Log In
            </button>
            <button className="px-6 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
              Sign Up
            </button>
          </div>
        </header>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden mb-6 bg-black rounded-2xl p-6 shadow-lg border border-gray-800">
            <nav className="space-y-4">
              <a href="#" className="block text-white font-semibold hover:text-[#D81E83] transition-colors py-2">Home</a>
              <a href="#features" className="block text-white font-semibold hover:text-[#D81E83] transition-colors py-2">Features</a>
              <a href="#how-it-works" className="block text-white font-semibold hover:text-[#D81E83] transition-colors py-2">How It Works</a>
              <a href="#pricing" className="block text-white font-semibold hover:text-[#D81E83] transition-colors py-2">Pricing</a>
            </nav>
            <div className="flex gap-3 mt-6">
              <button className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all">
                Log In
              </button>
              <button className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all">
                Sign Up
              </button>
            </div>
          </div>
        )}
        
        {/* Enhanced Hero Section */}
        <section className="text-center py-16 mb-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] bg-clip-text text-transparent leading-tight">
              Transform Learning with AI
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed">
              Generate educational videos, detailed notes, flashcards, and more from any content with our powerful AI assistant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={scrollToMainContent}
                className="px-10 py-4 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold text-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                <i className="fas fa-rocket mr-3"></i>
                Get Started for Free
              </button>
              <button className="px-10 py-4 rounded-full border-2 border-gray-600 text-white font-semibold text-lg hover:border-[#5E2E8F] hover:text-[#5E2E8F] hover:bg-[#5E2E8F]/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <i className="fas fa-play mr-3"></i>
                Watch Demo
              </button>
            </div>
          </div>
        </section>
        
        {/* Enhanced Main Content */}
        <div ref={mainContentRef} className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-16">
          {/* Input Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative" style={{border: '2px solid transparent', background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #5E2E8F, #D81E83) border-box'}}>
            <h2 className="text-2xl md:text-3xl mb-6 text-[#5E2E8F] flex items-center gap-3 font-bold">
              <div className="p-2 bg-[#5E2E8F]/10 rounded-xl">
                <i className="fas fa-pencil-alt text-xl text-[#5E2E8F]"></i>
              </div>
              Input Your Content
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {inputMethods.map((method) => (
                <div
                  key={method.id}
                  className={`text-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedInputMethod === method.id
                      ? 'border-[#5E2E8F] bg-[#5E2E8F]/10 shadow-lg'
                      : 'border-gray-200 hover:border-[#5E2E8F] hover:bg-[#5E2E8F]/10'
                  }`}
                  onClick={() => handleInputMethodChange(method.id)}
                >
                  <i className={`${method.icon} text-2xl mb-3 text-[#5E2E8F]`}></i>
                  <p className="text-sm font-medium text-black">{method.name}</p>
                </div>
              ))}
            </div>
            
            <div className="mb-6">
              {selectedInputMethod === 'upload' ? (
                <div className="w-full min-h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#5E2E8F] hover:bg-[#5E2E8F]/10 transition-all duration-300 p-4">
                  {uploadedFile ? (
                    <div className="text-center p-4">
                      <div className="flex items-center justify-center mb-4">
                        <i className="fas fa-file text-4xl text-[#5E2E8F] mr-3"></i>
                        <div>
                          <p className="font-semibold text-gray-800">{uploadedFile.name}</p>
                          <p className="text-sm text-gray-700">
                            {(uploadedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <button
                          onClick={handleRemoveFile}
                          className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                        >
                          <i className="fas fa-trash mr-2"></i>
                          Remove File
                        </button>
                        {fileContent && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg max-h-32 overflow-y-auto">
                            <p className="text-sm text-gray-800 text-left">
                              {fileContent.length > 200 
                                ? fileContent.substring(0, 200) + '...' 
                                : fileContent
                              }
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center w-full">
                      <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-3"></i>
                      <p className="text-base font-medium text-black mb-2">
                        Upload a file to get started
                      </p>
                      <p className="text-xs text-gray-700 mb-3">
                        Supports TXT, PDF, and Word documents
                      </p>
                      <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white rounded-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-colors cursor-pointer text-sm">
                        <i className="fas fa-file-upload mr-2"></i>
                        Choose File
                        <input
                          type="file"
                          accept=".txt,.pdf,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}
                </div>
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-y text-base text-black focus:outline-none focus:border-[#5E2E8F] focus:ring-4 focus:ring-[#5E2E8F]/20 transition-all duration-300"
                  placeholder={
                    selectedInputMethod === 'text' 
                      ? "Paste your text, article, or any content you want to learn from..."
                      : selectedInputMethod === 'url'
                      ? "Enter a URL to extract content from..."
                      : selectedInputMethod === 'voice'
                      ? "Click the microphone to start voice input..."
                      : "Paste your text, article, or any content you want to learn from..."
                  }
                />
              )}
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-lg font-semibold mb-3 text-black flex items-center gap-2">
                <i className="fas fa-cog text-[#5E2E8F]"></i>
                Advanced Options
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Difficulty Level</label>
                  <select 
                    value={difficultyLevel}
                    onChange={(e) => setDifficultyLevel(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#5E2E8F] text-black"
                  >
                    <option value="Beginner">Beginner (5 questions)</option>
                    <option value="Intermediate">Intermediate (10 questions)</option>
                    <option value="Advanced">Advanced (15 questions)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Language</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#5E2E8F] text-black">
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
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative" style={{border: '2px solid transparent', background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #5E2E8F, #D81E83) border-box'}}>
            <h2 className="text-2xl md:text-3xl mb-6 text-[#5E2E8F] flex items-center gap-3 font-bold">
              <div className="p-2 bg-[#5E2E8F]/10 rounded-xl">
                <i className="fas fa-magic text-xl text-[#5E2E8F]"></i>
              </div>
              Choose Output
            </h2>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {outputOptions.map((option) => (
                <div
                  key={option.id}
                  className={`text-center p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 ${
                    selectedOutputOption === option.id
                      ? 'border-[#5E2E8F] bg-[#5E2E8F]/10 shadow-lg'
                      : 'border-gray-200 hover:border-[#5E2E8F] hover:bg-[#5E2E8F]/10'
                  }`}
                  onClick={() => setSelectedOutputOption(option.id)}
                >
                  <i className={`${option.icon} text-2xl mb-3 text-[#5E2E8F]`}></i>
                  <p className="text-sm font-medium text-black">{option.name}</p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={handleRecommendation}
                disabled={loading}
                className="px-12 py-4 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold text-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-3`}></i>
                {loading ? 'Analyzing...' : 'Don’t know which to pick? Click here!'}
              </button>
              {!loading && recommendation && (
                <p className="mt-2 text-sm text-gray-500 text-center">
                  We recommend: <strong className="text-[#5E2E8F]">{recommendation}</strong>
                </p>
              )}
            </div>
            
            
            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <h3 className="text-lg font-semibold mb-3 text-black flex items-center gap-2">
                <i className="fas fa-sliders-h text-[#5E2E8F]"></i>
                Output Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Length</label>
                  <select className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-[#5E2E8F] text-black">
                    <option>Short</option>
                    <option>Medium</option>
                    <option>Long</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded border-gray-300 text-[#5E2E8F] focus:ring-[#5E2E8F]/20" />
                    <span className="text-sm font-medium text-black">Include examples</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-12 py-4 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold text-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <i className={`fas ${isGenerating ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-3`}></i>
                {isGenerating ? 'Generating...' : 'Generate Content'}
              </button>
            </div>
          </div>
        </div>
        
        
        {/* Enhanced Features Section */}
        <section id="features" className="mb-20">
            <h2 className="text-center text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] bg-clip-text text-transparent">
            Why Choose EduAI?
          </h2>
          <p className="text-center text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
            Experience the future of learning with our cutting-edge AI technology
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 text-center shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300">
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
      <footer className="bg-black border-t border-gray-800 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/logo.svg" 
                    alt="EduAI Logo" 
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
              <p className="text-white mb-4 max-w-md">
                AI-powered learning assistant for the modern student. Transform any content into engaging educational materials.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-gray-400 hover:text-[#5E2E8F] transition-colors">
                  <i className="fab fa-twitter text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#5E2E8F] transition-colors">
                  <i className="fab fa-linkedin text-xl"></i>
                </a>
                <a href="#" className="text-gray-400 hover:text-[#5E2E8F] transition-colors">
                  <i className="fab fa-github text-xl"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Product</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">Features</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">Pricing</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">API</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">Integrations</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Support</h3>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">Help Center</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">Status</a></li>
                <li><a href="#" className="text-gray-300 hover:text-[#5E2E8F] transition-colors">Community</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-300">© 2025 EduAI. All rights reserved.</p>
          </div>
        </div>
      </footer>
      
      {/* Chat Widget */}
      <ChatBox />
    </div>
  );
}