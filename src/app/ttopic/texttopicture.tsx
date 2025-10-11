'use client';

import { useState, useRef } from 'react';
import ChatBox from '../chatbox';


interface TextToPictureProps {
  inputText: string;
  onBack: () => void;
  userEmail?: string;
}

const TextToPicture = ({ inputText, onBack, userEmail }: TextToPictureProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Refs to prevent duplicate generation
  const hasGeneratedRef = useRef(false);
  const generatingRef = useRef(false);

  const handleGenerateImage = async () => {
    // Prevent duplicate generation
    if (generatingRef.current || hasGeneratedRef.current) {
      console.log('[TextToPicture] Picture generation already in progress or completed, skipping...');
      return;
    }
    
    generatingRef.current = true;
    setIsLoading(true);
    setError(null);
    
    try {
      // Generate unique request ID
      const requestId = `picture-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      
      console.log(`[TextToPicture] Starting picture generation with requestId: ${requestId}`);
      
      const response = await fetch('/api/text-to-picture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: inputText,
          userEmail: userEmail || 'anonymous@example.com',
          requestId: requestId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || 'Failed to generate image');
      }

      setImageUrl(data.imageUrl);
      console.log('[TextToPicture] Picture generation successful');
      hasGeneratedRef.current = true;
    } catch (error: any) {
      setError(error.message);
      console.error('[TextToPicture] Error generating picture:', error);
    } finally {
      setIsLoading(false);
      generatingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <button
          onClick={onBack}
          className="mb-4 px-4 py-2 rounded-full bg-gray-800 hover:bg-gray-700 transition-colors"
        >
          &larr; Back
        </button>
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Text to Picture</h2>
          <p className="text-gray-300 mb-6">{inputText}</p>
          <div className="text-center">
            <button
              onClick={handleGenerateImage}
              disabled={isLoading}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 disabled:opacity-50"
            >
              {isLoading ? 'Generating...' : 'Generate Image'}
            </button>
          </div>
          {imageUrl && (
            <div className="mt-8">
              <h3 className="text-2xl font-bold mb-4 text-center">Generated Image</h3>
              <img src={imageUrl} alt="Generated from text" className="rounded-xl mx-auto" />
            </div>
          )}
          {error && (
            <div className="mt-4 text-red-400 text-center bg-red-900/50 p-4 rounded-lg">
              <p>Error: {error}</p>
            </div>
          )}
        </div>
      </div>
      <ChatBox />
    </div>
  );
};

export default TextToPicture;
