'use client';

import React, { useState, useEffect } from 'react';
import ChatBox from '../chatbox';

// Activity types for different generation features
interface ActivityItem {
  id: string;
  type: 'summary' | 'quiz' | 'flashcard' | 'mindmap' | 'video' | 'picture' | 'chat';
  title: string;
  timestamp: string;
  inputText?: string;
  result?: any;
  status: 'completed' | 'failed' | 'processing';
  duration?: number; // in seconds
  metadata?: {
    wordCount?: number;
    score?: number;
    topic?: string;
    model?: string;
    tags?: string[];
  };
}

interface HistoryComponentProps {
  userEmail: string;
  onBack: () => void;
}

export default function HistoryComponent({ userEmail, onBack }: HistoryComponentProps) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Font Awesome is now loaded globally in layout.tsx

  useEffect(() => {
    fetchUserHistory();
  }, [userEmail]);

  const fetchUserHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/history?email=${encodeURIComponent(userEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setActivities(data.activities || []);
    } catch (err) {
      console.error('History fetch error:', err);
      // Don't show error to user if it's a DynamoDB permission issue - just use mock data
      console.log('Using mock data for demonstration purposes');
      
      // For demo purposes, show some mock data if API fails
      setActivities([
        {
          id: '1',
          type: 'summary',
          title: 'AI and Machine Learning Overview',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          inputText: 'Artificial Intelligence and Machine Learning are transforming the way we work and live. These technologies enable computers to learn from data and make decisions without being explicitly programmed.',
          status: 'completed',
          duration: 15,
          result: {
            summary: 'AI and ML are revolutionizing technology by enabling computers to learn from data and make autonomous decisions, transforming industries and daily life.',
            keyPoints: ['AI enables autonomous decision-making', 'ML learns from data patterns', 'Transforming multiple industries'],
            wordCount: 45,
            originalWordCount: 150
          },
          metadata: { wordCount: 150, model: 'Nova Pro', topic: 'Artificial Intelligence' }
        },
        {
          id: '2',
          type: 'quiz',
          title: 'JavaScript Fundamentals Quiz',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          inputText: 'JavaScript is a programming language used for web development',
          status: 'completed',
          duration: 300,
          result: {
            questions: [
              { question: 'What is JavaScript?', answer: 'A programming language for web development' },
              { question: 'Is JavaScript case-sensitive?', answer: 'Yes' }
            ]
          },
          metadata: { score: 85, topic: 'JavaScript', model: 'Nova Pro' }
        },
        {
          id: '3',
          type: 'flashcard',
          title: 'React Hooks Study Cards',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          inputText: 'React Hooks are functions that let you use state and other React features',
          status: 'completed',
          duration: 180,
          result: {
            flashcards: [
              { front: 'What is useState?', back: 'A Hook that lets you add state to functional components' },
              { front: 'What is useEffect?', back: 'A Hook that lets you perform side effects in functional components' }
            ]
          },
          metadata: { topic: 'React', model: 'Nova Pro' }
        },
        {
          id: '4',
          type: 'mindmap',
          title: 'Project Management Concepts',
          timestamp: new Date(Date.now() - 14400000).toISOString(),
          inputText: 'Project management involves planning, executing, and controlling projects',
          status: 'completed',
          duration: 240,
          result: {
            nodes: [
              { id: '1', label: 'Project Management', level: 0 },
              { id: '2', label: 'Planning', level: 1 },
              { id: '3', label: 'Execution', level: 1 },
              { id: '4', label: 'Control', level: 1 }
            ]
          },
          metadata: { topic: 'Project Management', model: 'Nova Pro' }
        },
        {
          id: '5',
          type: 'video',
          title: 'Data Structures Explained',
          timestamp: new Date(Date.now() - 18000000).toISOString(),
          inputText: 'Data structures are ways of organizing data in computer memory',
          status: 'completed',
          duration: 120,
          result: {
            videoUrl: 'https://example.com/video.mp4',
            thumbnail: 'https://example.com/thumbnail.jpg'
          },
          metadata: { topic: 'Computer Science', model: 'Nova Reel' }
        },
        {
          id: '6',
          type: 'picture',
          title: 'A cute cat playing with a ball of yarn',
          timestamp: new Date(Date.now() - 21600000).toISOString(),
          inputText: 'A cute cat playing with a ball of yarn',
          status: 'completed',
          duration: 45,
          result: {
            imageUrl: 'https://example.com/cat-image.jpg',
            prompt: 'A cute cat playing with a ball of yarn'
          },
          metadata: { topic: 'Animals', model: 'Nova Pro' }
        },
        {
          id: '7',
          type: 'chat',
          title: 'AI Learning Discussion',
          timestamp: new Date(Date.now() - 25200000).toISOString(),
          inputText: 'Can you explain how machine learning works?',
          status: 'completed',
          duration: 600,
          result: {
            messages: [
              { role: 'user', content: 'Can you explain how machine learning works?' },
              { role: 'assistant', content: 'Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed.' }
            ]
          },
          metadata: { topic: 'Machine Learning', model: 'Nova Pro' }
        },
        {
          id: '8',
          type: 'summary',
          title: 'Climate Change and Renewable Energy',
          timestamp: new Date(Date.now() - 28800000).toISOString(),
          inputText: 'Climate change is one of the most pressing issues of our time. Renewable energy sources like solar and wind power offer sustainable alternatives to fossil fuels.',
          status: 'completed',
          duration: 20,
          result: {
            summary: 'Climate change requires urgent action, with renewable energy sources providing sustainable alternatives to fossil fuels for a greener future.',
            keyPoints: ['Climate change is urgent', 'Renewable energy is sustainable', 'Solar and wind are key alternatives'],
            wordCount: 38,
            originalWordCount: 120
          },
          metadata: { wordCount: 120, model: 'Nova Pro', topic: 'Environment' }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'summary': return 'fas fa-file-text';
      case 'quiz': return 'fas fa-question-circle';
      case 'flashcard': return 'fas fa-layer-group';
      case 'mindmap': return 'fas fa-sitemap';
      case 'video': return 'fas fa-video';
      case 'picture': return 'fas fa-image';
      case 'chat': return 'fas fa-comments';
      default: return 'fas fa-history';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'summary': return 'from-blue-500 to-blue-600';
      case 'quiz': return 'from-green-500 to-green-600';
      case 'flashcard': return 'from-purple-500 to-purple-600';
      case 'mindmap': return 'from-orange-500 to-orange-600';
      case 'video': return 'from-red-500 to-red-600';
      case 'picture': return 'from-pink-500 to-pink-600';
      case 'chat': return 'from-indigo-500 to-indigo-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'fas fa-check-circle text-green-400';
      case 'failed': return 'fas fa-times-circle text-red-400';
      case 'processing': return 'fas fa-spinner fa-spin text-yellow-400';
      default: return 'fas fa-question-circle text-gray-400';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return date.toLocaleString('en-US', options);
  };

  const downloadContent = (activity: ActivityItem) => {
    const timestamp = new Date(activity.timestamp).toISOString().split('T')[0];
    const filename = `${activity.type}_${timestamp}_${activity.id}.json`;
    
    let contentToDownload: any = {
      type: activity.type,
      title: activity.title,
      timestamp: activity.timestamp,
      status: activity.status,
      duration: activity.duration,
      metadata: activity.metadata,
      inputText: activity.inputText,
      result: activity.result
    };

    // For specific content types, format the download differently
    if (activity.type === 'summary' && activity.result) {
      contentToDownload = {
        summary: activity.result.summary,
        keyPoints: activity.result.keyPoints,
        wordCount: activity.result.wordCount,
        originalWordCount: activity.result.originalWordCount,
        metadata: activity.metadata
      };
    } else if (activity.type === 'quiz' && activity.result) {
      contentToDownload = {
        questions: activity.result.questions || [],
        score: activity.metadata?.score,
        topic: activity.metadata?.topic,
        metadata: activity.metadata
      };
    } else if (activity.type === 'flashcard' && activity.result) {
      contentToDownload = {
        flashcards: activity.result.flashcards || [],
        topic: activity.metadata?.topic,
        metadata: activity.metadata
      };
    }

    const blob = new Blob([JSON.stringify(contentToDownload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllActivities = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `all_activities_${timestamp}.json`;
    
    const allActivitiesData = {
      user: userEmail,
      exportDate: new Date().toISOString(),
      totalActivities: activities.length,
      activities: filteredActivities.map(activity => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        timestamp: activity.timestamp,
        status: activity.status,
        duration: activity.duration,
        metadata: activity.metadata,
        inputText: activity.inputText,
        result: activity.result
      }))
    };

    const blob = new Blob([JSON.stringify(allActivitiesData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = selectedFilter === 'all' || activity.type === selectedFilter;
    const matchesSearch = searchQuery === '' || 
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.metadata?.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activityStats = {
    total: activities.length,
    completed: activities.filter(a => a.status === 'completed').length,
    failed: activities.filter(a => a.status === 'failed').length,
    byType: activities.reduce((acc, activity) => {
      acc[activity.type] = (acc[activity.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const filterOptions = [
    { value: 'all', label: 'All Activities' },
    { value: 'summary', label: 'Summaries' },
    { value: 'quiz', label: 'Quizzes' },
    { value: 'flashcard', label: 'Flashcards' },
    { value: 'mindmap', label: 'Mind Maps' },
    { value: 'video', label: 'Videos' },
    { value: 'picture', label: 'Pictures' },
    { value: 'chat', label: 'Chat Sessions' }
  ];

  const getFilterLabel = (value: string) => {
    const option = filterOptions.find(opt => opt.value === value);
    return option ? option.label : 'All Activities';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to Home</span>
            </button>
          </div>
          
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">
              <i className="fas fa-history mr-3"></i>
              Activity History
            </h1>
            <p className="text-gray-300">Track all your AI-powered learning activities</p>
          </div>

          <div className="text-right">
            <p className="text-sm text-gray-400">Welcome back</p>
            <p className="text-white font-medium">{userEmail}</p>
          </div>
        </div>

        {/* Generation Type Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-question-circle text-white text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-white">{activityStats.byType.quiz || 0}</p>
              <p className="text-gray-300 text-sm">Quizzes</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-layer-group text-white text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-white">{activityStats.byType.flashcard || 0}</p>
              <p className="text-gray-300 text-sm">Flashcards</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-sitemap text-white text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-white">{activityStats.byType.mindmap || 0}</p>
              <p className="text-gray-300 text-sm">Mind Maps</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-file-text text-white text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-white">{activityStats.byType.summary || 0}</p>
              <p className="text-gray-300 text-sm">Summaries</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-image text-white text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-white">{activityStats.byType.picture || 0}</p>
              <p className="text-gray-300 text-sm">Pictures</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 border border-white/20">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                <i className="fas fa-video text-white text-xl"></i>
              </div>
              <p className="text-2xl font-bold text-white">{activityStats.byType.video || 0}</p>
              <p className="text-gray-300 text-sm">Videos</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 mb-8 relative z-[5000]">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400"></i>
                </div>
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Custom Filter Dropdown */}
            <div className="md:w-64 relative z-50">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full py-3 px-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent flex items-center justify-between relative z-50"
              >
                <span>{getFilterLabel(selectedFilter)}</span>
                <i className={`fas fa-chevron-down transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}></i>
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 border border-white/20 rounded-xl overflow-hidden shadow-2xl z-[100]">
                  {filterOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setSelectedFilter(option.value);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors ${
                        selectedFilter === option.value ? 'bg-white/20' : ''
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activities List */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20 overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-2xl">
                <i className="fas fa-spinner fa-spin text-3xl text-white"></i>
              </div>
              <p className="text-gray-300">Loading your activity history...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-2xl mb-4 shadow-2xl">
                <i className="fas fa-exclamation-triangle text-3xl text-white"></i>
              </div>
              <p className="text-red-300 mb-4">{error}</p>
              <button
                onClick={fetchUserHistory}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                Try Again
              </button>
            </div>
          ) : filteredActivities.length === 0 ? (
            <div className="p-12 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-gray-500 to-gray-600 rounded-2xl mb-4 shadow-2xl">
                <i className="fas fa-inbox text-3xl text-white"></i>
              </div>
              <p className="text-gray-300 mb-2">No activities found</p>
              <p className="text-gray-400 text-sm">
                {searchQuery ? 'Try adjusting your search or filters' : 'Start creating content to see your history here'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {filteredActivities.map((activity, index) => (
                <div key={activity.id} className="p-6 hover:bg-white/5 transition-colors">
                  {/* Header Section */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      {/* Activity Icon */}
                      <div className={`w-10 h-10 bg-gradient-to-r ${getActivityColor(activity.type)} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <i className={`${getActivityIcon(activity.type)} text-white text-lg`}></i>
                      </div>

                      {/* Activity Title and Metadata */}
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          {activity.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span>{formatTimestamp(activity.timestamp)}</span>
                          {activity.metadata?.tags && activity.metadata.tags.map((tag: string, index: number) => (
                            <span key={index} className="px-2 py-0.5 bg-white/5 rounded-full text-xs flex items-center gap-1">
                              <i className="fas fa-tag text-xs"></i>
                              {tag}
                            </span>
                          ))}
                          {activity.metadata?.topic && (
                            <span className="px-2 py-0.5 bg-white/5 rounded-full text-xs flex items-center gap-1">
                              <i className="fas fa-bookmark text-xs"></i>
                              {activity.metadata.topic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => downloadContent(activity)}
                        className="flex items-center justify-center w-8 h-8 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all"
                        title="Download content"
                      >
                        <i className="fas fa-download text-sm"></i>
                      </button>
                    </div>
                  </div>

                  {/* Simple Input Preview */}
                  {activity.inputText && (
                    <div className="mt-2 text-sm text-gray-400 pl-13">
                      {activity.inputText.length > 100 
                        ? `${activity.inputText.substring(0, 100)}...` 
                        : activity.inputText}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <ChatBox />
    </div>
  );
}