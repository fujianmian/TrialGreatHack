'use client';
import React, { useState, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface PDFViewerProps {
  pdfUrl: string;
  pageNumber?: number;
  onDocumentLoadSuccess?: ({ numPages }: { numPages: number }) => void;
}

export default function PDFViewer({ pdfUrl, pageNumber = 1, onDocumentLoadSuccess }: PDFViewerProps) {
  const [width, setWidth] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Memoize options to prevent unnecessary reloads
  const options = useMemo(() => ({
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    cMapPacked: true,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  }), []);

  // Update width for responsive PDF rendering
  useEffect(() => {
    const updateWidth = () => {
      const container = document.querySelector('.pdf-viewer');
      if (container) {
        setWidth(container.getBoundingClientRect().width);
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Debug: Log the worker source being used
  useEffect(() => {
    console.log('PDF.js Worker Source:', pdfjs.GlobalWorkerOptions.workerSrc);
    console.log('PDF.js Version:', pdfjs.version);
  }, []);

  return (
    <div className="pdf-viewer">
      {error ? (
        <div className="flex flex-col items-center justify-center p-12 text-red-500">
          <i className="fas fa-exclamation-circle text-4xl mb-4"></i>
          <p className="font-semibold">Failed to load PDF</p>
          <p className="text-sm text-gray-600 mt-2">{error}</p>
        </div>
      ) : (
        <Document
          file={pdfUrl}
          onLoadSuccess={(pdf) => {
            console.log('PDF loaded successfully:', pdf.numPages, 'pages');
            setError(null);
            onDocumentLoadSuccess?.({ numPages: pdf.numPages });
          }}
          onLoadError={(error) => {
            console.error('PDF load error:', error);
            setError(error.message || 'Unknown error occurred');
          }}
          loading={
            <div className="flex flex-col items-center justify-center p-12">
              <i className="fas fa-spinner fa-spin text-4xl text-[#5E2E8F] mb-4"></i>
              <p className="text-gray-600">Loading PDF...</p>
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center p-12 text-red-500">
              <i className="fas fa-exclamation-circle text-4xl mb-4"></i>
              <p className="font-semibold">Failed to load PDF document</p>
            </div>
          }
          options={options}
        >
          <Page
            pageNumber={pageNumber}
            width={width || undefined}
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="mx-auto"
            loading={
              <div className="flex items-center justify-center p-8">
                <i className="fas fa-spinner fa-spin text-2xl text-[#5E2E8F]"></i>
              </div>
            }
            onLoadError={(error) => {
              console.error('Page load error:', error);
              setError(`Failed to load page ${pageNumber}: ${error.message}`);
            }}
          />
        </Document>
      )}
    </div>
  );
}