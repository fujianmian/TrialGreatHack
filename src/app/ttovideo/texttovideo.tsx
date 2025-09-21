'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface VideoSlide {
  id: number;
  title: string;
  content: string;
  duration: number;
  type: 'title' | 'content' | 'conclusion';
}

interface VideoShot {
  prompt: string;
  weight: number;
  description: string;
  background?: string;
  visual_elements?: string[];
  camera_movement?: string;
  lighting?: string;
}

interface ContentAnalysis {
  key_themes: string[];
  visual_metaphors: string[];
  target_audience: string;
  emotional_tone: string;
}

interface VideoResponse {
  title: string;
  slides: VideoSlide[];
  totalDuration: number;
  transcript: string;
  // Nova Reel specific fields
  videoUrl?: string;
  duration?: number;
  type?: string;
  style?: string;
  shots?: VideoShot[];
  content_analysis?: ContentAnalysis;
}

interface TextToVideoProps {
  inputText: string;
  onBack: () => void;
}

export default function TextToVideo({ inputText, onBack }: TextToVideoProps) {
  const [video, setVideo] = useState<VideoResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [selectedStyle, setSelectedStyle] = useState<string>('educational');
  const [videoLoadingState, setVideoLoadingState] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');

  const generateVideo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setVideoError(null);
    setGenerationStep('Analyzing content with AI...');

    try {
      const response = await fetch('/api/video-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText, style: selectedStyle }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      console.log("🎬 Video generated:", data.result.videoUrl);
      setVideo(data.result);
      setGenerationStep('');
      setVideoLoadingState('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setGenerationStep('');
    } finally {
      setIsGenerating(false);
    }
  }, [inputText, selectedStyle]);

  const handleVideoError = (event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const video = event.currentTarget;
    const error = video.error;
    let errorMessage = 'Failed to load video. ';
    
    if (error) {
      switch (error.code) {
        case 1:
          errorMessage += 'Video loading aborted.';
          break;
        case 2:
          errorMessage += 'Network error occurred while loading video.';
          break;
        case 3:
          errorMessage += 'Video decoding error.';
          break;
        case 4:
          errorMessage += 'Video format not supported.';
          break;
        default:
          errorMessage += `Unknown error (code: ${error.code}).`;
      }
    }
    
    console.error('Video error details:', {
      error: error,
      src: video.src,
      networkState: video.networkState,
      readyState: video.readyState
    });
    
    setVideoError(errorMessage);
    setVideoLoadingState('error');
    
    // No automatic fallback - show error instead
    console.error(`❌ Video failed to load: ${video.src}`);
    console.error(`❌ Error details: ${errorMessage}`);
  };

  const handleVideoLoadStart = () => {
    setVideoLoadingState('loading');
    setVideoError(null);
  };

  const handleVideoLoadedData = () => {
    setVideoLoadingState('loaded');
  };

  const handleVideoCanPlay = () => {
    setVideoLoadingState('loaded');
  };

  // Removed tryNextVideoUrl function - no more fallback videos

  useEffect(() => {
    // Don't auto-generate, let user choose style first
    // if (inputText.trim()) {
    //   generateVideo();
    // }
  }, [inputText, generateVideo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && video && video.slides && video.slides.length > 0 && video.slides[currentSlide]) {
      interval = setInterval(() => {
        setProgress(prev => {
          const slide = video.slides[currentSlide];
          if (!slide || typeof slide.duration !== 'number') {
            return prev;
          }
          
          const newProgress = prev + 100 / (slide.duration * 10);
          if (newProgress >= 100) {
            if (currentSlide < video.slides.length - 1) {
              setCurrentSlide(prev => prev + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 100;
            }
          }
          return newProgress;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSlide, video]);

  const playPause = () => {
    if (video && video.slides && video.slides.length > 0 && currentSlide < video.slides.length) {
      setIsPlaying(!isPlaying);
    }
  };

  const nextSlide = () => {
    if (video && video.slides && video.slides.length > 0 && currentSlide < video.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setProgress(0);
    }
  };

  const prevSlide = () => {
    if (video && video.slides && video.slides.length > 0 && currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setProgress(0);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setProgress(0);
    setIsPlaying(false);
  };

  const getSlideTypeColor = (type: string) => {
    switch (type) {
      case 'title': return 'from-blue-600 to-purple-600';
      case 'content': return 'from-green-600 to-blue-600';
      case 'conclusion': return 'from-orange-600 to-red-600';
      default: return 'from-gray-600 to-gray-800';
    }
  };

  const getSlideTypeIcon = (type: string) => {
    switch (type) {
      case 'title': return 'fas fa-play-circle';
      case 'content': return 'fas fa-info-circle';
      case 'conclusion': return 'fas fa-flag-checkered';
      default: return 'fas fa-circle';
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#5E2E8F] border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-video text-[#5E2E8F] text-xl"></i>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-black mb-4">Creating Your Video</h2>
          <p className="text-black mb-4">
            {generationStep || 'Using AI to analyze your content and generate an engaging video...'}
          </p>
          <div className="space-y-2 text-sm text-black">
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-brain text-purple-500"></i>
              <span>Analyzing content with Nova Pro AI</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-film text-blue-500"></i>
              <span>Generating dynamic visuals with Nova Reel</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <i className="fas fa-magic text-green-500"></i>
              <span>Creating YouTube-style engaging video</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-black mb-4">Error Generating Video</h2>
          <p className="text-black mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] hover:from-[#4A2480] hover:to-[#C41A75] text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!video && !isGenerating) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-black">Create Your Video</h1>
              <button
                onClick={onBack}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                ← Back
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-xl font-semibold text-black mb-2">Generate YouTube-Style Video</h2>
              <p className="text-black">Transform your text into an engaging, professional video with AI</p>
            </div>
            
            {/* Style Selector */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-black mb-2">
                Choose Video Style:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { value: 'educational', label: 'Educational', icon: '🎓', desc: 'Clear, professional presentation' },
                  { value: 'documentary', label: 'Documentary', icon: '🎬', desc: 'Cinematic, atmospheric style' },
                  { value: 'cinematic', label: 'Cinematic', icon: '🎭', desc: 'Movie-quality visuals' },
                  { value: 'modern', label: 'Modern', icon: '✨', desc: 'Contemporary, sleek design' },
                  { value: 'corporate', label: 'Corporate', icon: '💼', desc: 'Professional business style' }
                ].map((style) => (
                  <button
                    key={style.value}
                    onClick={() => setSelectedStyle(style.value)}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                      selectedStyle === style.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{style.icon}</div>
                    <div className="font-semibold mb-1">{style.label}</div>
                    <div className="text-xs opacity-75">{style.desc}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={generateVideo}
                className="mt-6 w-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] hover:from-[#4A2480] hover:to-[#C41A75] text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 text-lg"
              >
                <i className="fas fa-video"></i>
                Generate {selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Video
              </button>
            </div>
          </div>
          
          {/* Content Preview */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Your Content</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {inputText}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have a video (Nova Reel, OpenAI, or other video types) or slides
  const isNovaReelVideo = (video?.type === 'nova_reel_video' || video?.type === 'openai_video' || video?.type === 'ai_generated_video') && video?.videoUrl;
  const isSlidesPresentation = video?.type === 'slides_presentation';
  const hasSlides = video?.slides && video.slides.length > 0;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-900 rounded-3xl px-8 shadow-lg border border-gray-700 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">
              {isNovaReelVideo ? 'AI Generated Video' : isSlidesPresentation ? 'Interactive Presentation' : 'Video Presentation'}
            </h1>
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-white mb-2">{video?.title}</h2>
            {isNovaReelVideo ? (
              <p className="text-white">Duration: {video?.duration || 30} seconds • AI Generated Video</p>
            ) : isSlidesPresentation ? (
              <p className="text-white">Duration: {Math.round(video?.duration || 0)} seconds • {video?.slides?.length || 0} slides • Interactive Presentation</p>
            ) : (
              <p className="text-white">Duration: {Math.round(video?.totalDuration || 0)} seconds • {video?.slides?.length || 0} slides</p>
            )}
          </div>
          
        </div>

        {isNovaReelVideo ? (
          /* Nova Reel Video Player */
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl mb-4 relative overflow-hidden">
                {videoError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                    <div className="text-center">
                      <i className="fas fa-exclamation-triangle text-6xl mb-4 text-red-400"></i>
                      <h3 className="text-2xl font-bold mb-4">Video Error</h3>
                      <p className="text-lg leading-relaxed mb-4">{videoError}</p>
                      
                      <div className="space-y-3">
                        <div className="text-sm text-gray-300 mb-4">
                          Video failed to load. Please try generating a new video.
                        </div>
                        
                        <div className="flex gap-3 justify-center">
                          <button
                            onClick={generateVideo}
                            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                          >
                            Generate New Video
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : video.videoUrl ? (
                  <>
                    <video
                      key={video.videoUrl}
                      controls
                      className="w-full h-full object-cover rounded-xl"
                      onError={handleVideoError}
                      onLoadStart={handleVideoLoadStart}
                      onLoadedData={handleVideoLoadedData}
                      onCanPlay={handleVideoCanPlay}
                      preload="metadata"
                      crossOrigin="anonymous"
                    >
                      <source src={video.videoUrl} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                    
                    {videoLoadingState === 'loading' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="text-center text-white">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                          <p className="text-sm">Loading video...</p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                    <div className="text-center">
                      <i className="fas fa-video text-6xl mb-4 text-blue-400"></i>
                      <h3 className="text-2xl font-bold mb-4">Loading Video</h3>
                      <p className="text-lg leading-relaxed">Please wait while your video is being generated...</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-4 text-sm text-black">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-video text-blue-500"></i>
                    Duration: {video.duration || 30}s
                  </span>
                  {video.style && (
                    <span className="flex items-center gap-1">
                      <i className="fas fa-palette text-purple-500"></i>
                      Style: {video.style}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <i className="fas fa-expand text-green-500"></i>
                    16:9 Aspect Ratio
                  </span>
                  <span className="flex items-center gap-1">
                    <i className={`fas fa-circle text-xs ${videoLoadingState === 'loaded' ? 'text-green-500' : videoLoadingState === 'loading' ? 'text-yellow-500' : videoLoadingState === 'error' ? 'text-red-500' : 'text-gray-400'}`}></i>
                    {videoLoadingState === 'loaded' ? 'Loaded' : videoLoadingState === 'loading' ? 'Loading' : videoLoadingState === 'error' ? 'Error' : 'Ready'}
                  </span>
                </div>
                
                {/* Debug Information */}
                <details className="text-left mt-4">
                  <summary className="text-xs text-black cursor-pointer hover:text-gray-600">Debug Info</summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs text-gray-600 space-y-1">
                    <div><strong>Current Video URL:</strong> {video.videoUrl}</div>
                    <div><strong>Video Type:</strong> {video.type}</div>
                    <div><strong>Loading State:</strong> {videoLoadingState}</div>
                    <div><strong>Browser Support:</strong> {document.createElement('video').canPlayType('video/mp4') ? 'MP4 Supported' : 'MP4 Not Supported'}</div>
                  </div>
                </details>
                
                <p className="text-xs text-black">
                  Powered by Amazon Nova Pro & Nova Reel AI • YouTube-ready quality
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Slides-based Video Player */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-2xl p-6">
                <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl mb-4 relative overflow-hidden">
                  {hasSlides && video.slides[currentSlide] && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                      <div className="text-center">
                        <i className={`${getSlideTypeIcon(video.slides[currentSlide].type)} text-6xl mb-4 text-blue-400`}></i>
                        <h3 className="text-3xl font-bold mb-4">{video.slides[currentSlide].title}</h3>
                        <p className="text-lg leading-relaxed">{video.slides[currentSlide].content}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div 
                      className="h-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] transition-all duration-100"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-step-backward text-gray-700"></i>
                  </button>
                  
                  <button
                    onClick={playPause}
                    className="p-4 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] hover:from-[#4A2480] hover:to-[#C41A75] text-white transition-colors"
                  >
                    <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === (video?.slides?.length || 1) - 1}
                    className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <i className="fas fa-step-forward text-gray-700"></i>
                  </button>
                </div>

                {/* Slide Counter */}
                <div className="text-center mt-4 text-black">
                  Slide {currentSlide + 1} of {video?.slides?.length || 0}
                </div>
              </div>
            </div>

            {/* Slide Navigation */}
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Slides</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {hasSlides && video.slides.map((slide, index) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(index)}
                    className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                      currentSlide === index
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${getSlideTypeColor(slide.type)} flex items-center justify-center text-white text-sm font-bold`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-800 truncate">{slide.title}</div>
                        <div className="text-sm text-gray-600 truncate">{slide.content.substring(0, 50)}...</div>
                        <div className="text-xs text-gray-500">{slide.duration}s</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Transcript */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            {isNovaReelVideo ? 'Source Text' : 'Transcript'}
          </h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {video?.transcript}
            </p>
          </div>
          {isNovaReelVideo && (
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <i className="fas fa-info-circle mr-2"></i>
                  This video was generated using advanced AI analysis. Nova Pro analyzes your content to suggest specific backgrounds, visual elements, and scenes. Nova Reel then creates dynamic videos with contextual environments, relevant props, and professional cinematography - making each video unique and engaging rather than generic.
                </p>
              </div>
              
              {video.shots && video.shots.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <i className="fas fa-film text-purple-600"></i>
                    Enhanced Video Breakdown
                  </h4>
                  
                  {/* Content Analysis */}
                  {video.content_analysis && (
                    <div className="mb-4 bg-white rounded-lg p-3 shadow-sm">
                      <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                        <i className="fas fa-brain text-blue-500"></i>
                        AI Content Analysis
                      </h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Key Themes:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {video.content_analysis.key_themes?.map((theme, idx) => (
                              <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                                {theme}
                              </span>
                            )) || []}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Visual Metaphors:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {video.content_analysis.visual_metaphors?.map((metaphor, idx) => (
                              <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                {metaphor}
                              </span>
                            )) || []}
                          </div>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Target Audience:</span>
                          <span className="ml-2 text-gray-600">{video.content_analysis.target_audience || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Emotional Tone:</span>
                          <span className="ml-2 text-gray-600">{video.content_analysis.emotional_tone || 'Not specified'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    {video.shots.map((shot, index) => (
                      <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800 mb-2">{shot.description}</h5>
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">{shot.prompt}</p>
                            
                            {/* Visual Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {shot.background && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">📍 Background:</span>
                                  <span className="ml-1 text-gray-600">{shot.background}</span>
                                </div>
                              )}
                              {shot.visual_elements && shot.visual_elements.length > 0 && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">🎨 Visual Elements:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {shot.visual_elements.map((element, idx) => (
                                      <span key={idx} className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                                        {element}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {shot.camera_movement && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">📹 Camera:</span>
                                  <span className="ml-1 text-gray-600">{shot.camera_movement}</span>
                                </div>
                              )}
                              {shot.lighting && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">💡 Lighting:</span>
                                  <span className="ml-1 text-gray-600">{shot.lighting}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
