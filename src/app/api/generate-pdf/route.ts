export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { jsPDF } from 'jspdf';

export async function POST(req: Request) {
  try {
    console.log('Incoming headers:', Object.fromEntries(req.headers.entries()));
    const formData = await req.formData();
    const content = formData.get('content') as string;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Create PDF
    const pdfData = createPDF(content);

    // Return PDF as response with proper headers
    return new NextResponse(pdfData as any, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="exam-paper.pdf"',
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

// Helper function to strip markdown formatting
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')  // Remove **bold**
    .replace(/\*(.*?)\*/g, '$1')      // Remove *italic*
    .replace(/__(.*?)__/g, '$1')      // Remove __bold__
    .replace(/_(.*?)_/g, '$1')        // Remove _italic_
    .replace(/##\s*/g, '')            // Remove ## headers
    .replace(/#\s*/g, '');            // Remove # headers
}

// Helper function to check if text should be bold (based on content, not markdown)
function shouldBeBold(line: string, index: number, allLines: string[]): boolean {
  const cleanLine = stripMarkdown(line);
  
  // Title (first few non-empty lines)
  if (index < 5 && cleanLine.length < 100) return true;
  
  // Section headers
  if (cleanLine.match(/^SECTION [A-Z]/i)) return true;
  if (cleanLine.match(/^Section [A-Z]/i)) return true;
  
  // Instructions line
  if (cleanLine.toLowerCase().startsWith('instructions:')) return true;
  if (cleanLine.toLowerCase().startsWith('time allowed:')) return true;
  if (cleanLine.toLowerCase().startsWith('total marks:')) return true;
  
  // Question numbers
  if (cleanLine.match(/^[0-9]+\./)) return true;
  
  return false;
}

function createPDF(content: string): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Parse and format content
  const lines = content.split('\n');
  let questionLineIndex = -1; // Track which line was the question

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines
    if (!line) {
      yPosition += 3;
      questionLineIndex = -1;
      continue;
    }

    // Strip markdown
    const cleanLine = stripMarkdown(line);

    // Check if we need a new page
    if (yPosition > pageHeight - 30) {
      doc.addPage();
      yPosition = margin;
    }

    // Detect if this is a multiple choice option
    const isMCQOption = cleanLine.match(/^[A-D]\)/i);
    
    // Don't bold MCQ options even if they come right after a question
    if (isMCQOption) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const optionLines = doc.splitTextToSize(cleanLine, maxWidth - 10);
      optionLines.forEach((optLine: string) => {
        doc.text(optLine, margin + 5, yPosition);
        yPosition += 5;
      });
      continue;
    }

    // Title lines (first few lines, centered, large)
    if (i < 3 && !cleanLine.match(/^[0-9]/) && cleanLine.length < 100) {
      doc.setFontSize(i === 0 ? 16 : 14);
      doc.setFont('helvetica', 'bold');
      const titleLines = doc.splitTextToSize(cleanLine, maxWidth);
      titleLines.forEach((titleLine: string) => {
        doc.text(titleLine, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += i === 0 ? 8 : 7;
      });
      yPosition += 2;
      continue;
    }

    // Section headers (SECTION A, SECTION B, etc.)
    if (cleanLine.match(/^SECTION [A-Z]/i)) {
      yPosition += 5;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      const headerLines = doc.splitTextToSize(cleanLine, maxWidth);
      headerLines.forEach((headerLine: string) => {
        doc.text(headerLine, margin, yPosition);
        yPosition += 7;
      });
      yPosition += 2;
      continue;
    }

    // Instructions, Time allowed, Total marks
    if (cleanLine.toLowerCase().startsWith('instructions:') || 
        cleanLine.toLowerCase().startsWith('time allowed:') ||
        cleanLine.toLowerCase().startsWith('total marks:') ||
        cleanLine.toLowerCase().startsWith('name:') ||
        cleanLine.toLowerCase().startsWith('class:')) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const instructLines = doc.splitTextToSize(cleanLine, maxWidth);
      instructLines.forEach((instLine: string) => {
        doc.text(instLine, margin, yPosition);
        yPosition += 5;
      });
      yPosition += 2;
      continue;
    }

    // Questions (starts with number followed by period)
    if (cleanLine.match(/^[0-9]+\./)) {
      yPosition += 3;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      // Extract marks if present and keep them with the question
      const questionLines = doc.splitTextToSize(cleanLine, maxWidth);
      questionLines.forEach((qLine: string) => {
        doc.text(qLine, margin, yPosition);
        yPosition += 6;
      });
      questionLineIndex = i;
      yPosition += 1;
      continue;
    }

    // Sub-questions (a), b), c), etc.)
    if (cleanLine.match(/^[a-z]\)/i)) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const subLines = doc.splitTextToSize(cleanLine, maxWidth - 10);
      subLines.forEach((subLine: string) => {
        doc.text(subLine, margin + 5, yPosition);
        yPosition += 5;
      });
      yPosition += 1;
      continue;
    }

    // Standalone marks (only if not already part of question)
    if (cleanLine.match(/^\[.*marks?\]$/i) || cleanLine.match(/^\(.*marks?\)$/i)) {
      // Skip if this was already included in the question line
      if (questionLineIndex !== i - 1) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(cleanLine, pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 5;
      }
      continue;
    }

    // Regular text (includes percentage marks like (4%), [2%])
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const textLines = doc.splitTextToSize(cleanLine, maxWidth);
    textLines.forEach((textLine: string) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(textLine, margin, yPosition);
      yPosition += 5;
    });
    yPosition += 1;
  }

  // Add page numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    
    // Add a subtle line above page number
    doc.setDrawColor(200);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // Convert to Buffer
  const pdfArrayBuffer = doc.output('arraybuffer');
  return Buffer.from(pdfArrayBuffer) as Buffer;
}