'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import ChatBox from '../chatbox';

// Update the interface to include pageNumber and onDocumentLoadSuccess
const PDFViewer = dynamic<{
  pdfUrl: string;
  pageNumber?: number;
  onDocumentLoadSuccess?: ({ numPages }: { numPages: number }) => void;
}>(
  () => import('./PDFViewer'),
  { ssr: false }
);

interface ExamPaperProps {
  inputText: string;
  onBack: () => void;
  difficulty: string;
}

export default function ExamPaper({ inputText, onBack, difficulty }: ExamPaperProps) {
  const [examPDF, setExamPDF] = useState<File | null>(null);
  const [materialsPDF, setMaterialsPDF] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedExam, setGeneratedExam] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [refinementText, setRefinementText] = useState('');
  const [isRefining, setIsRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExamUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setExamPDF(e.target.files[0]);
      setError(null);
    }
  };

  const handleMaterialsUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMaterialsPDF(e.target.files[0]);
      setError(null);
    }
  };

  const handleGenerate = async () => {
    if (!examPDF || !materialsPDF) {
      setError('Please upload both exam paper and learning materials PDFs');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('examPDF', examPDF);
      formData.append('materialsPDF', materialsPDF);
      formData.append('difficulty', difficulty);

      // Fetch the PDF from /api/generate-exam
      const pdfResponse = await fetch('/api/generate-exam', {
        method: 'POST',
        body: formData,
      });

      if (!pdfResponse.ok) {
        const errorText = await pdfResponse.text();
        throw new Error(errorText || 'Failed to generate exam');
      }

      // Validate the response content type
      const contentType = pdfResponse.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Invalid response: Expected a PDF');
      }

      // Handle the response as a PDF blob
      const pdfBlob = await pdfResponse.blob();
      console.log('PDF Blob size:', pdfBlob.size, 'type:', pdfBlob.type);
      if (pdfBlob.size === 0 || pdfBlob.type !== 'application/pdf') {
        throw new Error('Invalid PDF blob received');
      }

      // Revoke previous URL if it exists
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);

      const url = URL.createObjectURL(pdfBlob);
      console.log('Generated pdfUrl:', url);
      setPdfUrl(url);
      setPageNumber(1);
      setNumPages(0); // Reset numPages to trigger onDocumentLoadSuccess

      // Fetch the exam content for refinement
      const contentResponse = await fetch('/api/generate-exam-content', {
        method: 'POST',
        body: formData,
      });

      if (!contentResponse.ok) {
        const errorText = await contentResponse.text();
        throw new Error(errorText || 'Failed to fetch exam content');
      }

      const contentData = await contentResponse.json();
      setGeneratedExam(contentData.examContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate exam');
      console.error('Error generating exam:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = async () => {
    if (!refinementText.trim() || !generatedExam) return;

    setIsRefining(true);
    setError(null);

    try {
      const response = await fetch('/api/refine-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentExam: generatedExam,
          refinementInstructions: refinementText,
          difficulty,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to refine exam');
      }

      const data = await response.json();
      setGeneratedExam(data.examContent);

      // Revoke previous URL if it exists
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);

      // Regenerate PDF
      const pdfBlob = await generatePDFBlob(data.examContent);
      console.log('Refined PDF Blob size:', pdfBlob.size, 'type:', pdfBlob.type);
      if (pdfBlob.size === 0 || pdfBlob.type !== 'application/pdf') {
        throw new Error('Invalid refined PDF blob received');
      }

      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setRefinementText('');
      setPageNumber(1);
      setNumPages(0); // Reset numPages to trigger onDocumentLoadSuccess
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine exam');
      console.error('Error refining exam:', err);
    } finally {
      setIsRefining(false);
    }
  };

  const generatePDFBlob = async (content: string): Promise<Blob> => {
    const formData = new FormData();
    formData.append('content', content);

    const response = await fetch('/api/generate-pdf', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to generate PDF');
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/pdf')) {
      throw new Error('Invalid response: Expected a PDF');
    }

    const pdfBlob = await response.blob();
    if (pdfBlob.size === 0 || pdfBlob.type !== 'application/pdf') {
      throw new Error('Invalid PDF blob received from /api/generate-pdf');
    }

    return pdfBlob;
  };

  const handleDownload = () => {
    if (!pdfUrl) return;

    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = `exam-paper-${Date.now()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('onDocumentLoadSuccess called with', numPages, 'pages');
    setNumPages(numPages);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <header className="flex justify-between items-center py-6 mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gray-800 hover:bg-gray-700 transition-all"
          >
            <i className="fas fa-arrow-left"></i>
            <span>Back to Home</span>
          </button>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] bg-clip-text text-transparent">
            AI Exam Paper Generator
          </h1>
          <div className="w-32"></div>
        </header>

        {!pdfUrl ? (
          /* Upload Section */
          <div className="max-w-4xl mx-auto">
            <div
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl"
              style={{
                border: '2px solid transparent',
                background:
                  'linear-gradient(white, white) padding-box, linear-gradient(135deg, #5E2E8F, #D81E83) border-box',
              }}
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                <i className="fas fa-file-upload text-[#5E2E8F]"></i>
                Upload Required Files
              </h2>

              {error && (
                <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Exam Paper Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#5E2E8F] transition-all">
                  <label className="block cursor-pointer">
                    <div className="text-center">
                      <i className="fas fa-file-pdf text-4xl text-[#5E2E8F] mb-3"></i>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Exam Paper Format (PDF)
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload a sample exam paper for format reference
                      </p>
                      {examPDF ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                          <i className="fas fa-check-circle"></i>
                          <span>{examPDF.name}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white rounded-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-all">
                          <i className="fas fa-upload"></i>
                          <span>Choose File</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleExamUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Learning Materials Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-[#D81E83] transition-all">
                  <label className="block cursor-pointer">
                    <div className="text-center">
                      <i className="fas fa-book text-4xl text-[#D81E83] mb-3"></i>
                      <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Learning Materials (PDF)
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Upload the content to generate exam questions from
                      </p>
                      {materialsPDF ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                          <i className="fas fa-check-circle"></i>
                          <span>{materialsPDF.name}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#D81E83] to-[#5E2E8F] text-white rounded-lg hover:from-[#C41A75] hover:to-[#4A2480] transition-all">
                          <i className="fas fa-upload"></i>
                          <span>Choose File</span>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleMaterialsUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Difficulty Level Display */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-gray-700">
                    <i className="fas fa-layer-group text-[#5E2E8F] mr-2"></i>
                    <strong>Difficulty Level:</strong> {difficulty}
                  </p>
                </div>

                {/* Generate Button */}
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !examPDF || !materialsPDF}
                  className="w-full px-8 py-4 rounded-full bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] text-white font-semibold text-lg hover:from-[#4A2480] hover:to-[#C41A75] transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isGenerating ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-3"></i>
                      Generating Exam Paper...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-magic mr-3"></i>
                      Generate Exam Paper
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PDF Viewer Section */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PDF Preview */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                <div className="bg-gradient-to-r from-[#5E2E8F] to-[#D81E83] p-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <i className="fas fa-file-pdf"></i>
                    Generated Exam Paper
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-white text-sm">
                      Page {pageNumber} of {numPages}
                    </span>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-white text-[#5E2E8F] rounded-lg font-semibold hover:bg-gray-100 transition-all flex items-center gap-2"
                    >
                      <i className="fas fa-download"></i>
                      Download PDF
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-gray-100">
                  <div className="bg-white rounded-lg shadow-inner overflow-auto max-h-[calc(100vh-300px)]">
                    {pdfUrl && (
                      <PDFViewer
                        pdfUrl={pdfUrl}
                        pageNumber={pageNumber}
                        onDocumentLoadSuccess={onDocumentLoadSuccess}
                      />
                    )}
                  </div>

                  {/* Pagination */}
                  {numPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-4">
                      <button
                        onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
                        disabled={pageNumber <= 1}
                        className="px-4 py-2 bg-[#5E2E8F] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A2480] transition-all"
                      >
                        <i className="fas fa-chevron-left"></i>
                      </button>
                      <span className="text-gray-700 font-medium">
                        {pageNumber} / {numPages}
                      </span>
                      <button
                        onClick={() => setPageNumber(Math.min(numPages, pageNumber + 1))}
                        disabled={pageNumber >= numPages}
                        className="px-4 py-2 bg-[#5E2E8F] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#4A2480] transition-all"
                      >
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Refinement Panel */}
            <div className="lg:col-span-1">
              <div
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl sticky top-6"
                style={{
                  border: '2px solid transparent',
                  background:
                    'linear-gradient(white, white) padding-box, linear-gradient(135deg, #5E2E8F, #D81E83) border-box',
                }}
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="fas fa-edit text-[#D81E83]"></i>
                  Refine Exam
                </h3>

                {error && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <textarea
                  value={refinementText}
                  onChange={(e) => setRefinementText(e.target.value)}
                  placeholder="Enter refinement instructions... 
                  
Examples:
- Add more multiple choice questions
- Make questions more challenging
- Focus on specific topics
- Adjust question difficulty"
                  className="w-full h-64 p-4 border-2 border-gray-300 rounded-xl resize-none text-gray-800 focus:outline-none focus:border-[#5E2E8F] focus:ring-4 focus:ring-[#5E2E8F]/20 transition-all mb-4"
                />

                <button
                  onClick={handleRefine}
                  disabled={isRefining || !refinementText.trim() || !generatedExam}
                  className="w-full px-6 py-3 rounded-full bg-gradient-to-r from-[#D81E83] to-[#5E2E8F] text-white font-semibold hover:from-[#C41A75] hover:to-[#4A2480] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isRefining ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Refining...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync-alt mr-2"></i>
                      Regenerate with Changes
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    if (pdfUrl) URL.revokeObjectURL(pdfUrl);
                    setGeneratedExam(null);
                    setPdfUrl(null);
                    setExamPDF(null);
                    setMaterialsPDF(null);
                    setRefinementText('');
                    setError(null);
                    setPageNumber(1);
                    setNumPages(0);
                  }}
                  className="w-full mt-3 px-6 py-3 rounded-full border-2 border-gray-300 text-gray-700 font-semibold hover:border-[#5E2E8F] hover:text-[#5E2E8F] transition-all"
                >
                  <i className="fas fa-redo mr-2"></i>
                  Start Over
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ChatBox />
    </div>
  );
}