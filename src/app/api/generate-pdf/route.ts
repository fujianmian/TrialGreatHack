import { NextResponse } from "next/server";
import PDFDocument from 'pdfkit';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    // Create PDF
    const pdfBuffer = await createPDF(content);

    // Convert Buffer to Uint8Array for Response compatibility
    const pdfArray = new Uint8Array(pdfBuffer);

    // Return PDF as response with proper type
    return new Response(pdfArray, {
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

function createPDF(content: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72,
        },
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Parse and format content
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) {
          doc.moveDown(0.5);
          continue;
        }

        // Title (first non-empty line or all caps)
        if (i === 0 || (line === line.toUpperCase() && line.length < 100 && !line.match(/^[0-9]/))) {
          doc.fontSize(18)
             .font('Helvetica-Bold')
             .text(line, { align: 'center' });
          doc.moveDown(1);
          continue;
        }

        // Section headers (starts with "Section" or ends with ":")
        if (line.match(/^Section [A-Z]/i) || (line.endsWith(':') && line.length < 80)) {
          doc.fontSize(14)
             .font('Helvetica-Bold')
             .text(line);
          doc.moveDown(0.5);
          continue;
        }

        // Questions (starts with number)
        if (line.match(/^[0-9]+\./)) {
          doc.moveDown(0.3);
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text(line);
          doc.moveDown(0.3);
          continue;
        }

        // Sub-questions (starts with letter)
        if (line.match(/^[a-z]\)/i)) {
          doc.fontSize(11)
             .font('Helvetica')
             .text(line, { indent: 20 });
          doc.moveDown(0.2);
          continue;
        }

        // Marks indication
        if (line.match(/\[.*marks?\]/i) || line.match(/\(.*marks?\)/i)) {
          doc.fontSize(10)
             .font('Helvetica-Oblique')
             .text(line, { align: 'right' });
          doc.moveDown(0.5);
          continue;
        }

        // Instructions or regular text
        if (line.toLowerCase().startsWith('instructions:') || 
            line.toLowerCase().startsWith('time allowed:') ||
            line.toLowerCase().startsWith('total marks:')) {
          doc.fontSize(11)
             .font('Helvetica-Bold')
             .text(line);
          doc.moveDown(0.3);
          continue;
        }

        // Regular text
        doc.fontSize(11)
           .font('Helvetica')
           .text(line, { align: 'justify' });
        doc.moveDown(0.2);

        // Add new page if needed
        if (doc.y > 700) {
          doc.addPage();
        }
      }

      // Add footer with page numbers
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        
        // Footer line
        doc.strokeColor('#5E2E8F')
           .lineWidth(1)
           .moveTo(72, 770)
           .lineTo(523, 770)
           .stroke();

        // Page number
        doc.fontSize(9)
           .font('Helvetica')
           .fillColor('#666666')
           .text(
             `Page ${i + 1} of ${pages.count}`,
             72,
             775,
             { align: 'center', width: 451 }
           );
      }

      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}