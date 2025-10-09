'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ChatBox from '../chatbox';

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  originalWordCount: number;
}

interface TextToSummaryProps {
  inputText: string;
  onBack: () => void;
}

export default function TextToSummary({ inputText, onBack }: TextToSummaryProps) {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const generateSummary = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsGenerating(false);
    }
  }, [inputText]);

  useEffect(() => {
    if (inputText.trim()) {
      generateSummary();
    }
  }, [inputText, generateSummary]);

  const copyToClipboard = async (text: string, type: string = 'text') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFeedback(`${type} copied to clipboard!`);
      setTimeout(() => setCopyFeedback(null), 2000);
    } catch (err) {
      setCopyFeedback('Failed to copy to clipboard');
      setTimeout(() => setCopyFeedback(null), 2000);
    }
  };

  if (isGenerating) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Generating Summary</h2>
          <p className="text-gray-600">Please wait while we analyze your text...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Generating Summary</h2>
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

  if (!summary) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="text-gray-400 text-6xl mb-6">📝</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Summary Available</h2>
          <p className="text-gray-600 mb-6">Unable to generate summary for the provided text.</p>
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
    <div className="min-h-screen bg-gray-900 p-4">
      {/* Copy Feedback Notification */}
      {copyFeedback && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>✅</span>
          <span>{copyFeedback}</span>
        </div>
      )}
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-800">Text Summary</h1>
            <button
              onClick={onBack}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
            >
              ← Back
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.originalWordCount}</div>
              <div className="text-sm text-gray-600">Original Words</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{summary.wordCount}</div>
              <div className="text-sm text-gray-600">Summary Words</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((1 - summary.wordCount / summary.originalWordCount) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Reduction</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Main Summary */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Summary</h2>
              <button
                onClick={() => copyToClipboard(summary.summary, 'Summary')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
              >
                📋 Copy
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                {summary.summary}
              </p>
            </div>
          </div>

          {/* Key Points */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Key Points</h2>
            </div>
            <ul className="space-y-3">
              {summary.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                    {index + 1}
                  </div>
                  <span className="text-gray-700 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Original Text */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Original Text</h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {inputText}
            </p>
          </div>
        </div>
      </div>
      <ChatBox />
    </div>
  );
}
