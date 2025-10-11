"use client";
import { useState } from "react";

interface WordCard {
  word: string;
  meaning: string;
}

export default function InputPage() {
  const [text, setText] = useState("");
  const [cards, setCards] = useState<WordCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState<'text' | 'pdf'>('text');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setPdfFile(file);
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('pdf', file);

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to extract PDF text');
      }

      const data = await response.json();
      setPdfText(data.text);
      setText(data.text); // Also set the text for processing
    } catch (error) {
      console.error('PDF processing error:', error);
      setError('Failed to process PDF file');
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit() {
    if (!text.trim()) {
      setError("Please enter article content");
      return;
    }

    setLoading(true);
    setError("");
    setCards([]);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setCards(data.result || []);
      
      if (!data.result || data.result.length === 0) {
        setError("No obscure words found. Please try a longer article.");
      }

    } catch (error) {
      console.error("Request failed:", error);
      if (error instanceof Error) {
        setError(error.message || "Request failed, please try again later.");
      } else {
        setError("Request failed, please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">AI Article Vocabulary Analysis</h1>

      {/* Input Type Selection */}
      <div className="mb-6">
        <div className="flex gap-4 mb-4">
          <button
            onClick={() => setInputType('text')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputType === 'text'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📝 Text Input
          </button>
          <button
            onClick={() => setInputType('pdf')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              inputType === 'pdf'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            📄 PDF Upload
          </button>
        </div>

        {inputType === 'text' ? (
          <div>
            <label className="block text-sm font-medium mb-2">
              Please enter the article to analyze:
            </label>
            <textarea
              placeholder="Paste or type the article content you want to analyze..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg w-full h-40 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="text-sm text-gray-500 mb-3">
              Word count: {text.length}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-2">
              Upload PDF file to analyze:
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="pdf-upload"
                disabled={loading}
              />
              <label
                htmlFor="pdf-upload"
                className={`cursor-pointer ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <div className="text-4xl mb-2">📄</div>
                <div className="text-lg font-medium text-gray-700 mb-1">
                  {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                </div>
                <div className="text-sm text-gray-500">
                  {loading ? 'Processing PDF...' : 'PDF files only'}
                </div>
              </label>
            </div>
            {pdfText && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">
                  Extracted Text Preview:
                </label>
                <textarea
                  value={pdfText}
                  readOnly
                  className="border border-gray-300 p-3 rounded-lg w-full h-32 bg-gray-50 text-sm"
                  placeholder="PDF text will appear here..."
                />
                <div className="text-sm text-gray-500 mt-1">
                  Word count: {pdfText.length}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !text.trim()}
        className={`w-full py-3 px-6 rounded-lg font-medium transition-colors ${
          loading || !text.trim()
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600 text-white"
        }`}
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...
          </span>
        ) : (
          "Start Analysis"
        )}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex">
            <div className="text-red-800">
              <span className="font-medium">Error:</span> {error}
            </div>
          </div>
        </div>
      )}

      {cards.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">
            Analysis Result ({cards.length} words)
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <h3 className="font-bold text-lg mb-2 text-blue-600">
                  {card.word}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {card.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
