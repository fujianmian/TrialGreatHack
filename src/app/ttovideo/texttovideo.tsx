import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

interface VideoJob {
  shotIndex: number;
  shotId: string;
  title: string;
  prompt: string;
  invocationArn: string;
  status: string;
  s3Path: string;
  s3Url: string;
  shot: VideoShot;
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

interface MultiVideoResponse {
  title: string;
  duration: number;
  type: string;
  transcript: string;
  style: string;
  content_analysis?: ContentAnalysis;
  totalShots: number;
  successfulJobs: number;
  failedJobsCount?: number;
  videoJobs: VideoJob[];
  failedJobs?: any[];
  estimatedTime: string;
  s3Bucket: string;
}

interface TextToVideoProps {
  inputText: string;
  onBack: () => void;
  userEmail?: string;
}

interface VideoPlayerProps {
  video: any;
  index: number;
  onError: () => void;
}

const VideoPlayer = ({ video, index, onError }: VideoPlayerProps) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (e: any) => {
    console.error(`❌ Video ${index + 1} load error:`, e);
    console.error(`Video URL: ${video.s3Url}`);
    setHasError(true);
    setIsLoading(false);
    onError();
  };

  const handleLoadStart = () => {
    console.log(`🎬 Video ${index + 1} load started:`, video.s3Url);
    setIsLoading(true);
    setHasError(false);
  };

  const handleCanPlay = () => {
    console.log(`✅ Video ${index + 1} can play`);
    setIsLoading(false);
  };

  if (hasError) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl mb-4 text-red-400"></i>
          <h3 className="text-xl font-bold mb-2">Video Load Error</h3>
          <p className="text-sm">Video {index + 1} failed to load</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-400 border-t-transparent"></div>
        </div>
      )}
      <video
        key={video.s3Url}
        controls
        className="w-full h-full object-cover rounded-xl"
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        preload="metadata"
        crossOrigin="anonymous"
      >
        <source src={video.s3Url} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </>
  );
};

export default function TextToVideo({ inputText, onBack, userEmail }: TextToVideoProps) {
  const [videoData, setVideoData] = useState<MultiVideoResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('educational');
  const [videoStatuses, setVideoStatuses] = useState<{[key: string]: any}>({});
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [allVideosComplete, setAllVideosComplete] = useState(false);
  
  // Refs to prevent infinite loops and duplicate generation
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasGeneratedRef = useRef(false);
  const generatingRef = useRef(false);
  const statusCheckCountRef = useRef(0);
  const renderCountRef = useRef(0);

  // Track renders - keep logging for development
  const currentRenderCount = ++renderCountRef.current;
  
  if (currentRenderCount % 100 === 0 || currentRenderCount < 10) {
    console.log(`🔄 Component render #${currentRenderCount}`, {
      isGenerating,
      hasVideoData: !!videoData,
      videoStatusesCount: Object.keys(videoStatuses).length,
      isCheckingStatus,
      allVideosComplete
    });
  }

  const generateVideo = useCallback(async () => {
    // Prevent duplicate generation
    if (generatingRef.current || hasGeneratedRef.current) {
      console.log('[TextToVideo] Video generation already in progress or completed, skipping...');
      return;
    }
    
    generatingRef.current = true;
    console.log('🎬 Starting video generation...');
    setIsGenerating(true);
    setError(null);

    try {
      // Generate unique request ID
      const requestId = `video-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`[TextToVideo] Starting video generation with requestId: ${requestId}`);
      
      const response = await fetch('/api/video-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: inputText, 
          style: selectedStyle,
          userEmail: userEmail || 'anonymous@example.com',
          requestId: requestId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate video');
      }

      const data = await response.json();
      console.log("🎬 Videos generation started:", data.result);
      console.log('[TextToVideo] Video generation successful');
      setVideoData(data.result);
      
      // Start checking status of all video jobs
      if (data.result.videoJobs && data.result.videoJobs.length > 0) {
        startStatusChecking(data.result.videoJobs);
      }
      
      hasGeneratedRef.current = true;
    } catch (err) {
      console.error('❌ Generation error:', err);
      console.error('[TextToVideo] Error generating video:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
      generatingRef.current = false;
    }
  }, [inputText, selectedStyle, userEmail]);

  const checkVideoStatus = async (invocationArn: string) => {
    try {
      console.log(`🔍 Checking status for: ${invocationArn}`);
      const response = await fetch('/api/video-openai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'check-status', 
          invocationArn: invocationArn 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check status');
      }

      const statusData = await response.json();
      console.log(`✅ Status for ${invocationArn}:`, statusData.status);
      
      return statusData;
    } catch (err) {
      console.error('❌ Status check error:', err);
      return { status: 'Error', error: err instanceof Error ? err.message : 'Unknown error' };
    }
  };

  const startStatusChecking = useCallback((videoJobs: VideoJob[]) => {
    console.log('🕐 Starting status checking for', videoJobs.length, 'jobs');
    
    // Clear any existing interval
    if (intervalRef.current) {
      console.log('🛑 Clearing existing interval');
      clearInterval(intervalRef.current);
    }
    
    const checkAllStatuses = async () => {
      statusCheckCountRef.current += 1;
      console.log(`🔄 Status check #${statusCheckCountRef.current}`);
      
      setIsCheckingStatus(true);
      
      const newStatuses: {[key: string]: any} = {};
      
      for (const job of videoJobs) {
        const status = await checkVideoStatus(job.invocationArn);
        newStatuses[job.invocationArn] = {
          ...status,
          s3Url: status.s3Url,
          shotId: job.shotId,
          title: job.title
        };
      }
      
      console.log('📊 Updated statuses:', Object.values(newStatuses).map(s => s.status));
      setVideoStatuses(newStatuses);
      setIsCheckingStatus(false);
      
      // Check if all jobs are complete (Completed or Failed)
      const incompleteJobs = Object.values(newStatuses).filter(
        status => status.status === 'InProgress'
      );
      
      const completedJobs = Object.values(newStatuses).filter(
        status => status.status === 'Completed'
      );
      
      const failedJobs = Object.values(newStatuses).filter(
        status => status.status === 'Failed' || status.failureMessage
      );
      
      console.log(`📈 Status Summary:`, {
        total: Object.keys(newStatuses).length,
        completed: completedJobs.length,
        failed: failedJobs.length,
        inProgress: incompleteJobs.length
      });
      
      // Mark as all complete when no more jobs are in progress
      if (incompleteJobs.length === 0 && Object.keys(newStatuses).length > 0) {
        console.log('🎉 All jobs finished! Completed:', completedJobs.length, 'Failed:', failedJobs.length);
        setAllVideosComplete(true);
        
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Check immediately
    checkAllStatuses();
    
    // Then check every 15 seconds
    intervalRef.current = setInterval(async () => {
      if (!allVideosComplete) {
        await checkAllStatuses();
      }
    }, 15000);
    
    // Cleanup after 10 minutes
    setTimeout(() => {
      if (intervalRef.current) {
        console.log('⏰ 10-minute timeout reached, clearing interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
        setAllVideosComplete(true);
      }
    }, 600000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        console.log('🧹 Component unmounting, clearing interval');
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const getCompletedVideos = useCallback(() => {
    if (!videoData || !videoData.videoJobs) return [];
    
    return videoData.videoJobs.map(job => {
      const status = videoStatuses[job.invocationArn];
      const s3Url = status?.status === 'Completed' ? status.s3Url : null;
      
      // Validate S3 URL
      const isValidUrl = s3Url && typeof s3Url === 'string' && s3Url.startsWith('http');
      
      return {
        ...job,
        status: status?.status || 'InProgress',
        s3Url: isValidUrl ? s3Url : null,
        error: status?.failureMessage || status?.error
      };
    });
  }, [videoData, videoStatuses]);

  // Memoize completed videos to prevent recalculation on every render
  const completedVideos = useMemo(() => getCompletedVideos(), [getCompletedVideos]);
  const availableVideos = useMemo(() => 
    completedVideos.filter(video => video.status === 'Completed' && video.s3Url),
    [completedVideos]
  );

  // Show enhanced loading page until all videos are complete
  if (isGenerating || (videoData && !allVideosComplete)) {
    const completedCount = completedVideos.filter(v => v.status === 'Completed' && v.s3Url).length;
    const failedCount = completedVideos.filter(v => v.status === 'Failed' || v.error).length;
    const inProgressCount = completedVideos.filter(v => v.status === 'InProgress').length;
    const totalCount = videoData?.totalShots || 0;
    
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#5E2E8F] border-t-transparent mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <i className="fas fa-video text-[#5E2E8F] text-xl"></i>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {isGenerating ? 'Creating Your Videos' : 'Processing Your Videos'}
          </h2>
          
          {isGenerating ? (
            <>
              <p className="text-gray-600 mb-4">
                Using AI to analyze your content and generate multiple engaging videos...
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-brain text-purple-500"></i>
                  <span>Analyzing content with Nova Pro</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-film text-blue-500"></i>
                  <span>Generating videos with Nova Reel</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <i className="fas fa-magic text-green-500"></i>
                  <span>Creating separate video for each scene</span>
                </div>
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-6">
                Waiting for all 3 videos to complete generation...
              </p>
              
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress</span>
                  <span>{completedCount } / 3</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500" 
                    style={{ width: `${totalCount > 0 ? ((completedCount ) / 3) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              
              {/* Status Grid */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-600">{completedCount}</div>
                  <div className="text-sm text-green-700">✅ Completed</div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
                  <div className="text-sm text-yellow-700">⏳ In Progress</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                  <div className="text-sm text-red-700">❌ Failed</div>
                </div>
              </div>
              
              {/* Video List */}
              <div className="text-left max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3 mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Video Status:</h4>
                <div className="space-y-1 text-sm">
                  {completedVideos.map((video, index) => (
                    <div key={video.shotId} className="flex items-center justify-between">
                      <span className="text-gray-600">{video.shotId}: {video.title}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        video.status === 'Completed' && video.s3Url ? 'bg-green-100 text-green-700' :
                        video.status === 'InProgress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {video.status === 'Completed' && video.s3Url ? '✅ Ready' :
                         video.status === 'InProgress' ? '⏳ Processing' : '❌ Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                {isCheckingStatus ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    <span>Checking video status...</span>
                  </div>
                ) : (
                  <span>Next check in 15 seconds...</span>
                )}
              </div>
            </>
          )}
          
          <div className="mt-4">
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              Cancel & Go Back
            </button>
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
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Videos</h2>
          <p className="text-gray-600 mb-6">{error}</p>
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

  if (!videoData && !isGenerating) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-gray-800">Create Your Videos</h1>
              <button
                onClick={onBack}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                ← Back
              </button>
            </div>
            
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎬</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Generate Multiple AI Videos</h2>
              <p className="text-gray-600">Transform your text into multiple engaging videos - one for each scene</p>
            </div>
            
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
                Generate {selectedStyle.charAt(0).toUpperCase() + selectedStyle.slice(1)} Videos
              </button>
            </div>
          </div>
          
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

  // Get the first available video for single player display
  const primaryVideo = availableVideos.length > 0 ? availableVideos[0] : null;

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl px-8 shadow-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">AI Generated Video</h1>
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-700 mb-2">{videoData?.title}</h2>
            <p className="text-gray-600">Duration: 6 seconds • AI Generated Video</p>
          </div>
        </div>

        {/* Three Video Players */}
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[0, 1, 2].map((index) => {
              const video = availableVideos[index] || null;
              const isCompleted = video && video.status === 'Completed' && video.s3Url;
              const isInProgress = video && video.status === 'InProgress';
              const isFailed = video && (video.status === 'Failed' || video.error);
              
              return (
                <div key={index} className="bg-white rounded-2xl shadow-2xl p-6">
                  <div className="aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl mb-4 relative overflow-hidden">
                    {isCompleted && video.s3Url ? (
                      <VideoPlayer 
                        video={video} 
                        index={index}
                        onError={() => {
                          // This will be handled by the VideoPlayer component
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8">
                        <div className="text-center">
                          {isInProgress ? (
                            <>
                              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-400 border-t-transparent mx-auto mb-4"></div>
                              <h3 className="text-xl font-bold mb-2">Processing...</h3>
                              <p className="text-sm">Video {index + 1} is being generated</p>
                            </>
                          ) : isFailed ? (
                            <>
                              <i className="fas fa-exclamation-triangle text-4xl mb-4 text-red-400"></i>
                              <h3 className="text-xl font-bold mb-2">Failed</h3>
                              <p className="text-sm">Video {index + 1} generation failed</p>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-video text-4xl mb-4 text-blue-400"></i>
                              <h3 className="text-xl font-bold mb-2">Video {index + 1}</h3>
                              <p className="text-sm">Waiting to start...</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h4 className="font-semibold text-gray-800 text-sm">
                      {video?.title || `Video ${index + 1}`}
                    </h4>
                    
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-video text-blue-500"></i>
                        Duration: 6s
                      </span>
                      {videoData?.style && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-palette text-purple-500"></i>
                          {videoData.style}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        isCompleted ? 'bg-green-100 text-green-700' :
                        isInProgress ? 'bg-yellow-100 text-yellow-700' :
                        isFailed ? 'bg-red-100 text-red-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {isCompleted ? '✅ Ready' :
                         isInProgress ? '⏳ Processing' :
                         isFailed ? '❌ Failed' : '⏸️ Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              Powered by Amazon Nova Pro & Nova Reel AI • YouTube-ready quality
            </p>
          </div>
        </div>

        {/* Enhanced Video Breakdown */}
        {videoData && videoData.videoJobs && videoData.videoJobs.length > 0 && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 mt-6">
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  <i className="fas fa-info-circle mr-2"></i>
                  These videos were generated using advanced AI analysis. Nova Pro analyzes your content to suggest specific backgrounds, visual elements, and scenes. Nova Reel then creates dynamic videos with contextual environments, relevant props, and professional cinematography - making each video unique and engaging rather than generic.
                </p>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <i className="fas fa-film text-purple-600"></i>
                  Enhanced Video Breakdown
                </h4>
                
                {/* Content Analysis */}
                {videoData?.content_analysis && (
                  <div className="mb-4 bg-white rounded-lg p-3 shadow-sm">
                    <h5 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
                      <i className="fas fa-brain text-blue-500"></i>
                      AI Content Analysis
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Key Themes:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {videoData.content_analysis.key_themes?.map((theme, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              {theme}
                            </span>
                          )) || []}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Visual Metaphors:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {videoData.content_analysis.visual_metaphors?.map((metaphor, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                              {metaphor}
                            </span>
                          )) || []}
                        </div>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Target Audience:</span>
                        <span className="ml-2 text-gray-600">{videoData.content_analysis.target_audience || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Emotional Tone:</span>
                        <span className="ml-2 text-gray-600">{videoData.content_analysis.emotional_tone || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Video Details for each video */}
                <div className="space-y-4">
                  {videoData.videoJobs.map((job, index) => {
                    const videoStatus = videoStatuses[job.invocationArn];
                    const isCompleted = videoStatus?.status === 'Completed' && videoStatus?.s3Url;
                    const isInProgress = videoStatus?.status === 'InProgress';
                    const isFailed = videoStatus?.status === 'Failed' || videoStatus?.failureMessage;
                    
                    return (
                      <div key={job.shotId} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                            isCompleted ? 'bg-gradient-to-r from-green-500 to-green-600' :
                            isInProgress ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                            isFailed ? 'bg-gradient-to-r from-red-500 to-red-600' :
                            'bg-gradient-to-r from-gray-500 to-gray-600'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-gray-800">{job.shot.description || job.title}</h5>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                isCompleted ? 'bg-green-100 text-green-700' :
                                isInProgress ? 'bg-yellow-100 text-yellow-700' :
                                isFailed ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {isCompleted ? '✅ Ready' :
                                 isInProgress ? '⏳ Processing' :
                                 isFailed ? '❌ Failed' : '⏸️ Pending'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed mb-3">{job.shot.prompt}</p>
                            
                            {/* Visual Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                              {job.shot.background && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">📍 Background:</span>
                                  <span className="ml-1 text-gray-600">{job.shot.background}</span>
                                </div>
                              )}
                              {job.shot.visual_elements && job.shot.visual_elements.length > 0 && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">🎨 Visual Elements:</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {job.shot.visual_elements.map((element, idx) => (
                                      <span key={idx} className="bg-green-100 text-green-800 px-1 py-0.5 rounded text-xs">
                                        {element}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {job.shot.camera_movement && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">📹 Camera:</span>
                                  <span className="ml-1 text-gray-600">{job.shot.camera_movement}</span>
                                </div>
                              )}
                              {job.shot.lighting && (
                                <div className="bg-gray-50 rounded p-2">
                                  <span className="font-medium text-gray-700">💡 Lighting:</span>
                                  <span className="ml-1 text-gray-600">{job.shot.lighting}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Source Text */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Source Text</h3>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {videoData?.transcript}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}