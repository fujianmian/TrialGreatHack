'use client';

import React, { useState } from 'react';

interface ChatBoxProps {
  onClose?: () => void;
}

export default function ChatBox({ onClose }: ChatBoxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hi! I'm your AI study assistant. I can help with homework questions, explain academic concepts, suggest study strategies, and show you how to use EduAI's learning tools like videos, flashcards, mind maps, quizzes, and summaries. What would you like help with today?", sender: 'bot', timestamp: new Date() }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentMessage = inputText;
    setInputText('');
    setIsTyping(true);

    try {
      // Prepare conversation history for context
      const conversationHistory = messages
        .filter(msg => msg.id > 1) // Skip the initial greeting
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }));

      // Call OpenAI API directly
      const response = await fetch('/api/chatbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: "You are an AI study assistant for EduAI. You can help with homework questions, explain academic concepts, suggest study strategies, and guide users on how to use learning tools like videos, flashcards, mind maps, quizzes, and summaries. Be helpful, encouraging, and educational in your responses."
            },
            ...conversationHistory,
            {
              role: 'user',
              content: currentMessage
            }
          ],
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API call failed: ${response.status}`);
      }

      const data = await response.json();
      
      const botMessage = {
        id: messages.length + 2,
        text: data.choices?.[0]?.message?.content || "I apologize, but I'm having trouble responding right now. Please try again.",
        sender: 'bot' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat API error:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I'm experiencing some technical difficulties. Please try again in a moment, or feel free to explore our features directly!",
        sender: 'bot' as const,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 flex items-center justify-center group chat-widget-float"
          style={{
            filter: 'drop-shadow(0 4px 12px rgba(94, 46, 143, 0.3))'
          }}
        >
          <i className="fas fa-comments text-white text-2xl group-hover:scale-110 transition-transform duration-200"></i>
        </button>
        
        {/* Notification badge */}
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-white text-xs font-bold">1</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <i className="fas fa-robot text-white text-sm"></i>
            </div>
            <div>
              <h3 className="text-white font-semibold">AI Study Assistant</h3>
              <p className="text-white/80 text-xs">Powered by Nova Pro • Ask any study question</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <i className="fas fa-times text-white text-sm"></i>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    message.sender === 'user'
                      ? 'bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className={`text-xs mt-1 ${
                    message.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-xl focus:outline-none focus:border-[#5E2E8F] focus:ring-2 focus:ring-[#5E2E8F]/20 text-sm text-black"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className="w-10 h-10 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] rounded-xl flex items-center justify-center text-white hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="fas fa-paper-plane text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
