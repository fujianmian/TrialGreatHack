'use client';

import React, { useState, useEffect, useCallback } from 'react';

interface VideoSlide {
  id: number;
  title: string;
  content: string;
  duration: number;
  type: 'title' | 'content' | 'conclusion';
}

interface VideoResponse {
  title: string;
  slides: VideoSlide[];
  totalDuration: number;
  transcript: string;
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

  const generateVideo = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      setVideo(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [inputText]);

  useEffect(() => {
    if (inputText.trim()) {
      generateVideo();
    }
  }, [inputText, generateVideo]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && video) {
      interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev + 100 / (video.slides[currentSlide].duration * 10);
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
    if (video && currentSlide < video.slides.length) {
      setIsPlaying(!isPlaying);
    }
  };

  const nextSlide = () => {
    if (video && currentSlide < video.slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setProgress(0);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Generating Video</h2>
          <p className="text-gray-600">Please wait while we create your video presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Video</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-gray-400 text-6xl mb-6">🎬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Video Available</h2>
          <p className="text-gray-600 mb-6">Unable to generate video for the provided text.</p>
          <button
            onClick={onBack}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Video Presentation</h1>
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{video.title}</h2>
            <p className="text-gray-600">Duration: {Math.round(video.totalDuration)} seconds • {video.slides.length} slides</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-2xl p-6">
              <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl mb-4 relative overflow-hidden">
                {video.slides[currentSlide] && (
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
                    className="h-full bg-blue-500 transition-all duration-100"
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
                  className="p-4 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                >
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} text-xl`}></i>
                </button>
                
                <button
                  onClick={nextSlide}
                  disabled={currentSlide === video.slides.length - 1}
                  className="p-3 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <i className="fas fa-step-forward text-gray-700"></i>
                </button>
              </div>

              {/* Slide Counter */}
              <div className="text-center mt-4 text-gray-600">
                Slide {currentSlide + 1} of {video.slides.length}
              </div>
            </div>
          </div>

          {/* Slide Navigation */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Slides</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {video.slides.map((slide, index) => (
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

        {/* Transcript */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Transcript</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {video.transcript}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
