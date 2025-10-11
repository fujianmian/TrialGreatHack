'use client';

import dynamic from "next/dynamic";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TextToCard from './ttocard/texttocard';
import TextToSummary from './ttosummary/texttosummary';
import TextToMap from './ttomap/texttomap';
import TextToVideo from './ttovideo/texttovideo';
import TextToQuiz from './texttoquiz/texttoquiz';
import TextToPicture from './ttopic/texttopicture';
const ExamPaper = dynamic(() => import('./components/examPaper'), { ssr: false });
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

const inputMethods: InputMethod[] = [
  { id: 'text', name: 'Text', icon: 'fas fa-font' },
  { id: 'upload', name: 'Upload', icon: 'fas fa-file-upload' },
  { id: 'url', name: 'URL', icon: 'fas fa-link' },
  { id: 'voice', name: 'Voice', icon: 'fas fa-microphone' },
];

const outputOptions: OutputOption[] = [
  { id: 'picture', name: 'Picture', icon: 'fas fa-image' },
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
  const router = useRouter();
  const [selectedInputMethod, setSelectedInputMethod] = useState('text');
  const [selectedOutputOption, setSelectedOutputOption] = useState<string>('');
  const [inputText, setInputText] = useState('A cute cat playing with a ball of yarn.');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null); // Using 'any' for SpeechRecognition to handle vendor prefixes
  const [isGenerating, setIsGenerating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showMindMap, setShowMindMap] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showPicture, setShowPicture] = useState(false);
  const [showExam, setShowExam] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [fileContents, setFileContents] = useState<{name: string, content: string}[]>([]);
  const [uploadDescription, setUploadDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<string>('Beginner');
  const [recommendation, setRecommendation] = useState<string | null>(null);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showUserMenu && !target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);


  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    } else {
      console.error('Speech recognition not supported in this browser.');
    }
  }, []);

  // Check authentication status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (selectedInputMethod === 'upload' && uploadedFiles.length > 0) {
      const allContent = fileContents.map(fc => fc.content).join('\n\n---\n\n');
      setInputText(`File Content:\n${allContent}\n\nDescription:\n${uploadDescription}`);
    }
  }, [fileContents, uploadDescription, selectedInputMethod, uploadedFiles]);

  const handleHistory = () => {
    router.push('/history');
  };

  const checkAuthStatus = async () => {
    try {
      const sessionData = sessionStorage.getItem('cognitoSession');
      const localData = localStorage.getItem('cognitoSession');
      const legacyToken = localStorage.getItem('authToken');
      
      if (sessionData || localData) {
        const session = JSON.parse((sessionData || localData) as string);
        if (session.idToken && session.email) {
          setIsAuthenticated(true);
          setUser({ email: session.email });
          return;
        }
      }
      
      if (legacyToken) {
        const userData = localStorage.getItem('userData');
        if (userData) {
          setIsAuthenticated(true);
          setUser(JSON.parse(userData));
          return;
        }
      }
      
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.log('Not authenticated:', error);
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      
      sessionStorage.removeItem('cognitoSession');
      localStorage.removeItem('cognitoSession');
      sessionStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsAuthenticated(false);
      setUser(null);
      setShowUserMenu(false);
      
      setLoading(false);
    } catch (error) {
      console.error('Logout error:', error);
      setLoading(false);
    }
  };

  async function handleRecommendation() {
    setIsRecommending(true);
    const res = await fetch("/api/recommend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userInput: inputText }),
    });

    const data = await res.json();
    if (data.recommendation) {
      const normalized = data.recommendation.toLowerCase().trim();
      setSelectedOutputOption(normalized);
      setRecommendation(normalized);
    }
    setIsRecommending(false);
  }

  const handleGenerate = () => {
    console.log('[Home] handleGenerate called. Output option:', selectedOutputOption);
    setShowFlashcards(false);
    setShowSummary(false);
    setShowMindMap(false);
    setShowVideo(false);
    setShowQuiz(false);
    setShowPicture(false);
    setShowExam(false);

    if (selectedOutputOption === 'flashcards') {
      setShowFlashcards(true);
      return;
    }
    if (selectedOutputOption === 'summary') {
      setShowSummary(true);
      return;
    }
    if (selectedOutputOption === 'mindmap') {
      setShowMindMap(true);
      return;
    }
    if (selectedOutputOption === 'video') {
      setShowVideo(true);
      return;
    }
    if (selectedOutputOption === 'quiz') {
      setShowQuiz(true);
      return;
    }
    if (selectedOutputOption === 'picture') {
      setShowPicture(true);
      return;
    }
  };

  const handleGenerateExam = () => {
    setShowExam(true);
  };

  const handleBackFromFlashcards = () => setShowFlashcards(false);
  const handleBackFromSummary = () => setShowSummary(false);
  const handleBackFromMindMap = () => setShowMindMap(false);
  const handleBackFromVideo = () => setShowVideo(false);
  const handleBackFromQuiz = () => setShowQuiz(false);
  const handleBackFromPicture = () => setShowPicture(false);
  const handleBackFromExam = () => setShowExam(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);

    for (const file of newFiles) {
      if (file.type === 'text/plain' || file.type === 'text/csv') {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          setFileContents(prev => [...prev, { name: file.name, content }]);
        };
        reader.readAsText(file);
      } else if (file.type === 'application/pdf') {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await fetch('/api/extract-pdf', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error('Failed to extract PDF text');
          const data = await response.json();
          setFileContents(prev => [...prev, { name: file.name, content: data.extractedText }]);
        } catch (err) {
          console.error('Error extracting PDF:', err);
          setFileContents(prev => [...prev, { name: file.name, content: 'Failed to extract PDF text.' }]);
        }
      } else if (file.type.startsWith('image/')) {
        const formData = new FormData();
        formData.append('file', file);
        try {
          const response = await fetch('/api/extract-image', {
            method: 'POST',
            body: formData,
          });
          if (!response.ok) throw new Error('Failed to extract image text');
          const data = await response.json();
          setFileContents(prev => [...prev, { name: file.name, content: data.extractedText }]);
        } catch (err) {
          console.error('Error extracting image text:', err);
          setFileContents(prev => [...prev, { name: file.name, content: 'Failed to extract image text.' }]);
        }
      }
    }
    
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setFileContents(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveAllFiles = () => {
    setUploadedFiles([]);
    setFileContents([]);
    setInputText('');
    setUploadDescription('');
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) {
      console.error("Speech recognition is not initialized.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setInputText(''); // Clear previous text before starting new recognition
      recognitionRef.current.start();
    }
  };

  const handleInputMethodChange = (methodId: string) => {
    setSelectedInputMethod(methodId);
    if (methodId !== 'upload') {
      setUploadedFiles([]);
      setFileContents([]);
      setUploadDescription('');
    }
    if (methodId !== 'upload' && methodId !== selectedInputMethod) {
      setInputText('');
    }
  };

  const scrollToMainContent = () => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  };

  const getQuestionCount = (difficulty: string): number => {
    switch (difficulty) {
      case 'Beginner': return 5;
      case 'Intermediate': return 10;
      case 'Advanced': return 15;
      default: return 5;
    }
  };

  if (showFlashcards) {
    return <TextToCard inputText={inputText} onBack={handleBackFromFlashcards} questionCount={getQuestionCount(difficultyLevel)} difficulty={difficultyLevel} userEmail={user?.email || 'anonymous@example.com'} />;
  }
  if (showSummary) {
    return <TextToSummary inputText={inputText} onBack={handleBackFromSummary} userEmail={user?.email || 'anonymous@example.com'} />;
  }
  if (showMindMap) {
    return <TextToMap inputText={inputText} onBack={handleBackFromMindMap} userEmail={user?.email || 'anonymous@example.com'} />;
  }
  if (showVideo) {
    return <TextToVideo inputText={inputText} onBack={handleBackFromVideo} userEmail={user?.email || 'anonymous@example.com'} />;
  }
  if (showQuiz) {
    return <TextToQuiz inputText={inputText} onBack={handleBackFromQuiz} questionCount={getQuestionCount(difficultyLevel)} difficulty={difficultyLevel} userEmail={user?.email || 'anonymous@example.com'} />;
  }
  if (showPicture) {
    return <TextToPicture inputText={inputText} onBack={handleBackFromPicture} userEmail={user?.email || 'anonymous@example.com'} />;
  }
  if (showExam) {
    return <ExamPaper inputText={inputText} onBack={handleBackFromExam} difficulty={difficultyLevel} />;
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
          
          {/* Desktop Auth Buttons / User Menu */}
          <div className="hidden lg:flex gap-4 items-center">
            {isAuthenticated ? (
              <div className="relative user-menu-container">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] flex items-center justify-center">
                    <i className="fas fa-user text-white text-sm"></i>
                  </div>
                  <span className="text-white font-medium">{user?.email || 'User'}</span>
                  <i className={`fas fa-chevron-${showUserMenu ? 'up' : 'down'} text-gray-400 text-sm`}></i>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 py-2 z-50">
                    <button
                      onClick={handleHistory}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <i className="fas fa-history text-[#D81E83]"></i>
                      <span>History</span>
                    </button>
                    <button
                      onClick={() => console.log('Profile')}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <i className="fas fa-user-circle text-[#D81E83]"></i>
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => console.log('Settings')}
                      className="w-full px-4 py-3 text-left text-white hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <i className="fas fa-cog text-[#D81E83]"></i>
                      <span>Settings</span>
                    </button>
                    <div className="border-t border-gray-700 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left text-red-400 hover:bg-gray-700 transition-colors flex items-center gap-3"
                    >
                      <i className="fas fa-sign-out-alt"></i>
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <a 
                  href="/login"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  Log In
                </a>
                <a 
                  href="/signup"
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
                >
                  Sign Up
                </a>
              </>
            )}
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
            
            {isAuthenticated ? (
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleHistory}
                  className="w-full px-4 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all flex items-center justify-center gap-2"
                >
                  <i className="fas fa-history"></i>
                  History
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 rounded-full border-2 border-red-500 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all"
                >
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex gap-3 mt-6">
                <button className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all">
                  Log In
                </button>
                <button className="flex-1 px-4 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all">
                  Sign Up
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Hero Section */}
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
            
            {/* Educator Exam Paper CTA */}
            <div className="mt-12 p-8 bg-gradient-to-r from-[#5E2E8F]/20 to-[#D81E83]/20 rounded-3xl border-2 border-[#5E2E8F]/30 backdrop-blur-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-left flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-3 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] rounded-xl">
                      <i className="fas fa-chalkboard-teacher text-2xl text-white"></i>
                    </div>
                    <h3 className="text-2xl font-bold text-white">Are you an educator?</h3>
                  </div>
                  <p className="text-lg text-gray-300">
                    Try out our service to generate professional exam papers in seconds. Perfect for teachers, tutors, and educational institutions.
                  </p>
                </div>
                <button
                  onClick={handleGenerateExam}
                  className="px-8 py-4 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold text-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl whitespace-nowrap flex items-center gap-3"
                >
                  <i className="fas fa-file-alt"></i>
                  Generate Exam Paper
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Main Content - Input/Output sections */}
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Left: Upload Area */}
                    <div className="w-full min-h-48 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center hover:border-[#5E2E8F] hover:bg-[#5E2E8F]/10 transition-all duration-300 p-4">
                      <div className="text-center w-full">
                        <i className="fas fa-cloud-upload-alt text-3xl text-gray-400 mb-3"></i>
                        <p className="text-base font-medium text-black mb-2">
                          Upload files to get started
                        </p>
                        <p className="text-sm text-gray-600 mb-4">
                          {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} uploaded
                        </p>
                        <label className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white rounded-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-colors cursor-pointer text-sm">
                          <i className="fas fa-file-upload mr-2"></i>
                          Choose Files
                          <input
                            type="file"
                            accept=".txt,.pdf,.doc,.docx,image/*"
                            onChange={handleFileUpload}
                            className="hidden"
                            multiple
                          />
                        </label>
                      </div>
                    </div>

                    {/* Right: File List */}
                    <div className="w-full min-h-48 border-2 border-gray-300 rounded-xl p-4 overflow-y-auto">
                      {uploadedFiles.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-center">
                          <div>
                            <i className="fas fa-folder-open text-3xl text-gray-400 mb-2"></i>
                            <p className="text-sm text-gray-600">No files uploaded yet</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                            <p className="text-sm font-semibold text-gray-700">Uploaded Files</p>
                            <button
                              onClick={handleRemoveAllFiles}
                              className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                              <i className="fas fa-trash mr-1"></i>
                              Clear All
                            </button>
                          </div>
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <i className="fas fa-file text-[#5E2E8F] text-lg flex-shrink-0"></i>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-gray-800 text-sm truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleRemoveFile(index)}
                                className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                title="Remove file"
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <textarea
                      value={uploadDescription}
                      onChange={(e) => setUploadDescription(e.target.value)}
                      className="w-full h-24 p-4 border-2 border-gray-200 rounded-xl resize-y text-base text-black focus:outline-none focus:border-[#5E2E8F] focus:ring-4 focus:ring-[#5E2E8F]/20 transition-all duration-300"
                      placeholder="Add a description or instructions for the AI..."
                    />
                  </div>
                </>
              ) : selectedInputMethod === 'voice' ? (
                <>
                  <div className="w-full p-4 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-center mb-4">
                    <button
                      onClick={handleVoiceInput}
                      className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isListening
                          ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                          : 'bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] hover:from-[#4A2480] hover:to-[#C41A75]'
                      }`}
                    >
                      <i className={`fas ${isListening ? 'fa-stop' : 'fa-microphone'} text-white text-4xl`}></i>
                    </button>
                    <p className="text-black mt-4 font-medium">
                      {isListening ? 'Listening... Click to stop' : 'Click to start speaking'}
                    </p>
                  </div>
                  <textarea
                    value={inputText}
                    readOnly={isListening}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full h-24 p-4 border-2 border-gray-200 rounded-xl resize-y text-base text-black focus:outline-none focus:border-[#5E2E8F] focus:ring-4 focus:ring-[#5E2E8F]/20 transition-all duration-300"
                    placeholder={isListening ? "Your transcribed text will appear here..." : "Transcribed text can be edited here."}
                  />
                </>
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-y text-base text-black focus:outline-none focus:border-[#5E2E8F] focus:ring-4 focus:ring-[#5E2E8F]/20 transition-all duration-300"
                  placeholder="Paste your text, article, or any content you want to learn from..."
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
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          {/* Output Section */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 relative" style={{border: '2px solid transparent', background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #5E2E8F, #D81E83) border-box'}}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl md:text-3xl text-[#5E2E8F] flex items-center gap-3 font-bold">
                <div className="p-2 bg-[#5E2E8F]/10 rounded-xl">
                  <i className="fas fa-magic text-xl text-[#5E2E8F]"></i>
                </div>
                Choose Output
              </h2>
              
              {isAuthenticated && (
                <button
                  onClick={handleHistory}
                  className="relative p-4 rounded-full bg-gradient-to-r from-[#9333EA] to-[#EC4899] text-white hover:from-[#7C3AED] hover:to-[#DB2777] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group border-2 border-white/20 hover:border-white/40"
                  title="Check History"
                >
                  <i className="fas fa-history text-xl"></i>
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF6B6B] rounded-full animate-pulse"></div>
                </button>
              )}
            </div>
            
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

            <div className="text-center mb-6">
              <button
                onClick={handleRecommendation}
                disabled={isRecommending}
                className="px-12 py-4 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold text-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <i className={`fas ${isRecommending ? 'fa-spinner fa-spin' : 'fa-bolt'} mr-3`}></i>
                {isRecommending ? 'Analyzing...' : 'Don\'t know which to pick? Click here!'}
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
        
        {/* Features Section */}
        <section id="features" className="mb-20">
          <h2 className="text-center text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] bg-clip-text text-transparent">
            Why Choose StudyHub?
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
      
      {/* Footer */}
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
                <a href="https://github.com/fujianmian/TrialGreatHack" className="text-gray-400 hover:text-[#5E2E8F] transition-colors">
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
            <p className="text-gray-300">© 2025 studyhub</p>
          </div>
        </div>
      </footer>
      {loading && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-white text-4xl mb-4"></i>
            <p className="text-white text-lg">Logging out...</p>
          </div>
        </div>
      )}
      <ChatBox />
    </div>
  );
}
