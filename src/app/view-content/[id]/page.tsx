'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

interface ActivityItem {
  id: string;
  type: 'summary' | 'quiz' | 'flashcard' | 'mindmap' | 'video' | 'picture' | 'chat';
  title: string;
  timestamp: string;
  inputText?: string;
  result?: any;
  status: 'completed' | 'failed' | 'processing';
  duration?: number;
  metadata?: any;
}

export default function ViewContentPage() {
  const router = useRouter();
  const params = useParams();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<ActivityItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (activityId) {
      fetchActivityDetails();
    }
  }, [activityId]);

  // Auto-redirect for mindmap activities
  useEffect(() => {
    if (activity && activity.type === 'mindmap' && activity.inputText) {
      const encodedText = encodeURIComponent(activity.inputText);
      router.push(`/ttomap?text=${encodedText}`);
    }
  }, [activity, router]);

  // Auto-redirect for picture activities
  useEffect(() => {
    if (activity && activity.type === 'picture' && activity.inputText) {
      const encodedText = encodeURIComponent(activity.inputText);
      router.push(`/ttopic?text=${encodedText}`);
    }
  }, [activity, router]);

  // Don't auto-redirect for flashcards - display them directly

  const fetchActivityDetails = async () => {
    try {
      setIsLoading(true);
      console.log('=== Fetching Activity ID:', activityId, '===');
      
      // Get user email from localStorage or use default
      let userEmail = 'angelphoon7@gmail.com';
      try {
        const userData = localStorage.getItem('userData');
        if (userData) {
          const parsed = JSON.parse(userData);
          userEmail = parsed.email || userEmail;
        }
      } catch (e) {
        console.log('Using default email');
      }

      // Fetch from API
      const response = await fetch(`/api/history?email=${encodeURIComponent(userEmail)}`);
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', {
        total: data.total,
        activitiesCount: data.activities?.length,
        lookingFor: activityId
      });

      if (!data.activities || data.activities.length === 0) {
        throw new Error('No activities found');
      }

      // Find the specific activity
      const foundActivity = data.activities.find((act: ActivityItem) => 
        String(act.id) === String(activityId)
      );

      if (foundActivity) {
        console.log('✅ Found activity:', {
          id: foundActivity.id,
          type: foundActivity.type,
          title: foundActivity.title?.substring(0, 50)
        });
        setActivity(foundActivity);
      } else {
        console.log('❌ Activity not found in list');
        console.log('Available IDs:', data.activities.map((a: any) => a.id).join(', '));
        throw new Error('Activity not found in response');
      }
    } catch (err) {
      console.error('Error fetching activity:', err);
      setError('Failed to load activity details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/history');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-white/10 rounded w-1/4"></div>
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded w-3/4"></div>
              <div className="h-4 bg-white/10 rounded w-1/2"></div>
            </div>
            <div className="space-y-4">
              <div className="h-4 bg-white/10 rounded"></div>
              <div className="h-4 bg-white/10 rounded"></div>
              <div className="h-4 bg-white/10 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
        <div className="text-center p-8 bg-white/10 rounded-2xl border border-white/20 max-w-md w-full">
          <div className="bg-red-500/10 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-2xl text-red-500"></i>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <button
            onClick={handleBack}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all w-full"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  if (!activity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to History</span>
          </button>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-white/10 rounded-full text-sm text-gray-300">
              {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
            </span>
            <span className="text-gray-400 text-sm">
              {new Date(activity.timestamp).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Input Box */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10">
              <h2 className="text-lg font-medium text-white">Input</h2>
            </div>
            <div className="p-6">
              <div className="font-mono text-gray-300 whitespace-pre-wrap">
                {activity.inputText}
              </div>
            </div>
          </div>

          {/* Output Box */}
          <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="p-4 bg-white/5 border-b border-white/10">
              <h2 className="text-lg font-medium text-white">Output</h2>
            </div>
            <div className="p-6">
              {!activity.result && (
                <div className="text-center text-gray-400 py-12">
                  <i className="fas fa-exclamation-circle text-5xl mb-4"></i>
                  <p className="text-lg text-white mb-2">No Output Data</p>
                  <p className="text-sm">The generated output was not saved</p>
                </div>
              )}

              {activity.type === 'quiz' && activity.result && (
                <div className="space-y-6">
                  {activity.result.questions.map((q: any, i: number) => (
                    <div key={i} className="bg-white/5 rounded-lg p-4">
                      <p className="text-white font-medium mb-3">Question {i + 1}:</p>
                      <p className="text-gray-300 mb-4">{q.question}</p>
                      <div className="space-y-2">
                        {q.options.map((option: string, idx: number) => (
                          <div 
                            key={idx}
                            className={`p-3 rounded-lg ${
                              idx === q.correctAnswer 
                                ? 'bg-green-500/20 border border-green-500/30' 
                                : 'bg-white/5 border border-white/10'
                            }`}
                          >
                            <div className="flex items-center">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                                idx === q.correctAnswer 
                                  ? 'bg-green-500 text-white' 
                                  : 'bg-white/10 text-gray-400'
                              }`}>
                                {String.fromCharCode(65 + idx)}
                              </div>
                              <span className={idx === q.correctAnswer ? 'text-white' : 'text-gray-300'}>
                                {option}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {q.explanation && (
                        <div className="mt-4 text-sm text-gray-400">
                          <p className="font-medium text-gray-300">Explanation:</p>
                          <p>{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activity.type === 'summary' && (
                <div className="space-y-6">
                  <div className="text-gray-300">
                    {activity.result.summary}
                  </div>
                  {activity.result.keyPoints && (
                    <div>
                      <h3 className="text-white font-medium mb-2">Key Points:</h3>
                      <ul className="list-disc list-inside text-gray-300 space-y-1">
                        {activity.result.keyPoints.map((point: string, i: number) => (
                          <li key={i}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="text-sm text-gray-400">
                    Original: {activity.result.originalWordCount} words • 
                    Summarized: {activity.result.wordCount} words
                  </div>
                </div>
              )}

              {activity.type === 'mindmap' && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Redirecting to Mind Map...</p>
                  </div>
                </div>
              )}

              {activity.type === 'flashcard' && activity.result && (() => {
                // Handle different possible structures of flashcard data
                const flashcards = Array.isArray(activity.result) 
                  ? activity.result 
                  : activity.result.result || activity.result.flashcards || [];
                
                if (!Array.isArray(flashcards) || flashcards.length === 0) {
                  return (
                    <div className="text-center text-gray-400 py-12">
                      <i className="fas fa-exclamation-circle text-5xl mb-4"></i>
                      <p className="text-lg text-white mb-2">No Flashcard Data</p>
                      <p className="text-sm">The flashcards were not saved or have an unexpected format</p>
                      <details className="mt-4 text-xs">
                        <summary className="cursor-pointer text-yellow-400">Debug Info</summary>
                        <pre className="mt-2 bg-black/30 p-4 rounded text-left inline-block overflow-auto max-h-96">
                          {JSON.stringify(activity.result, null, 2)}
                        </pre>
                      </details>
                    </div>
                  );
                }

                return (
                  <div className="space-y-4">
                    <div className="text-center mb-6">
                      <div className="inline-flex items-center gap-2 bg-purple-500/20 rounded-full px-4 py-2">
                        <i className="fas fa-clone text-purple-400"></i>
                        <span className="text-white font-medium">{flashcards.length} Flashcards</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((card: any, index: number) => (
                        <div key={index} className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl p-6 border border-white/10 hover:border-purple-500/50 transition-all">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-purple-500/30 text-purple-300 text-xs font-bold px-2 py-1 rounded">Card {index + 1}</span>
                              {card.category && (
                                <span className="bg-pink-500/30 text-pink-300 text-xs px-2 py-1 rounded">{card.category}</span>
                              )}
                            </div>
                            <div className="bg-white/5 rounded-lg p-4 mb-3">
                              <p className="text-xs text-gray-400 mb-1">Front:</p>
                              <p className="text-white font-medium">{card.front}</p>
                            </div>
                            <div className="bg-white/5 rounded-lg p-4">
                              <p className="text-xs text-gray-400 mb-1">Back:</p>
                              <p className="text-gray-300">{card.back}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {activity.type === 'picture' && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-white text-lg">Redirecting to Picture Generation...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-sm text-gray-400 flex items-center justify-between">
          <div>
            Generated using {activity.metadata.model}
            {activity.metadata.topic && (
              <span className="ml-2">• Topic: {activity.metadata.topic}</span>
            )}
          </div>
          <div>
            Duration: {activity.duration}ms
          </div>
        </div>
      </div>
    </div>
  );
}