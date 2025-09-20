"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InputMindmapPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputType, setInputType] = useState<'text' | 'pdf'>('text');
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const router = useRouter();

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
      setText(data.text);
    } catch (error) {
      console.error('PDF processing error:', error);
      setError('Failed to process PDF file');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMindmap = () => {
    if (!text.trim()) {
      setError("Please provide text or upload a PDF");
      return;
    }

    // Navigate to mindmap page with the text
    router.push(`/ttomap?text=${encodeURIComponent(text)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🧠</div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create Mind Map</h1>
          <p className="text-gray-600">Transform your content into a visual mind map</p>
        </div>

        {/* Input Type Selection */}
        <div className="mb-6">
          <div className="flex gap-4 mb-6 justify-center">
            <button
              onClick={() => setInputType('text')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                inputType === 'text'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📝 Text Input
            </button>
            <button
              onClick={() => setInputType('pdf')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                inputType === 'pdf'
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📄 PDF Upload
            </button>
          </div>

          {inputType === 'text' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter your content:
              </label>
              <textarea
                placeholder="Paste or type your content here. The AI will analyze it and create a visual mind map showing the relationships between concepts..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="border border-gray-300 p-4 rounded-lg w-full h-40 mb-3 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
              <div className="text-sm text-gray-500 mb-3">
                Character count: {text.length}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload PDF file:
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
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
                  <div className="text-6xl mb-4">📄</div>
                  <div className="text-xl font-medium text-gray-700 mb-2">
                    {pdfFile ? pdfFile.name : 'Click to upload PDF'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {loading ? 'Processing PDF...' : 'PDF files only'}
                  </div>
                </label>
              </div>
              {pdfText && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Extracted Text Preview:
                  </label>
                  <textarea
                    value={pdfText}
                    readOnly
                    className="border border-gray-300 p-4 rounded-lg w-full h-32 bg-gray-50 text-sm"
                    placeholder="PDF text will appear here..."
                  />
                  <div className="text-sm text-gray-500 mt-2">
                    Character count: {pdfText.length}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-800">
              <span className="font-medium">Error:</span> {error}
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <button
            onClick={() => router.back()}
            className="flex-1 py-3 px-6 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={handleGenerateMindmap}
            disabled={loading || !text.trim()}
            className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
              loading || !text.trim()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 text-white"
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </span>
            ) : (
              "Generate Mind Map →"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
