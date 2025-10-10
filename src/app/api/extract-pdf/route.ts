import { NextRequest, NextResponse } from 'next/server';
import pdfParse from 'pdf-parse';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { createBedrockClient } from '@/lib/bedrock';

export async function POST(request: NextRequest) {
  const client = createBedrockClient();
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Please upload a valid PDF file.' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    let pdfData;
    try {
      pdfData = await pdfParse(buffer, { max: 1 }); // Limit to 1 page for testing
      if (!pdfData.text.trim()) {
        return NextResponse.json({ error: 'No text extracted from PDF.' }, { status: 400 });
      }
    } catch (parseError: any) {
      console.error('PDF parsing error:', parseError.message);
      return NextResponse.json({ error: `Invalid PDF: ${parseError.message}` }, { status: 400 });
    }

    const prompt = `Extract and structure the main content from this PDF document. Focus on key sections, headings, and important text. Document text:\n\n${pdfData.text}`;
    const input = {
      modelId: 'amazon.nova-pro-v1:0',
      messages: [{ role: 'user' as const, content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 2000, temperature: 0.5, topP: 0.9 },
    };

    const command = new ConverseCommand(input);
    const response = await client.send(command);
    const generatedContent = response.output?.message?.content?.[0]?.text || 'No content generated.';

    return NextResponse.json({
      extractedText: pdfData.text,
      processedContent: generatedContent,
    });
  } catch (error: any) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: `Failed to process PDF: ${error.message}` }, { status: 500 });
  }
}