'use client';

import { useState } from 'react';
import TextToPicture from './texttopicture';
import ChatBox from '../chatbox';


export default function TextToPicturePage() {
  const [inputText, setInputText] = useState('A beautiful landscape with mountains and a lake.');
  const [showPicture, setShowPicture] = useState(false);

  const handleGenerate = () => {
    setShowPicture(true);
  };

  const handleBack = () => {
    setShowPicture(false);
  };

  if (showPicture) {
    return <TextToPicture inputText={inputText} onBack={handleBack} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-xl">
          <h2 className="text-3xl font-bold mb-6 text-center">Text to Picture</h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-y text-base text-black focus:outline-none focus:border-[#5E2E8F] focus:ring-4 focus:ring-[#5E2E8F]/20 transition-all duration-300"
            placeholder="Enter a description for the image..."
          />
          <div className="text-center mt-6">
            <button
              onClick={handleGenerate}
              className="px-8 py-3 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300"
            >
              Generate Image
            </button>
          </div>
        </div>
      </div>
      <ChatBox />
    </div>
  );
}
