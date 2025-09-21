import { NextRequest, NextResponse } from 'next/server';
// @ts-expect-error
import pdfParse from 'pdf-parse';
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { createBedrockClient } from '@/lib/bedrock';

const client = createBedrockClient();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // Validate file
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Please upload a valid PDF file.' }, { status: 400 });
    }

    // Validate file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit. Size: ${(file.size / 1024 / 1024).toFixed(2)}MB` },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Extract text from PDF
    const pdfData = await pdfParse(buffer);
    const extractedText = pdfData.text;

    if (!extractedText.trim()) {
      return NextResponse.json({ error: 'No text could be extracted from the PDF.' }, { status: 400 });
    }

    // Prepare prompt for Amazon Nova Pro
    const prompt = `Extract and structure the main content from this PDF document. Focus on key sections, headings, and important text. If it's a report or article, summarize the core information while preserving details. Document text:\n\n${extractedText}`;
    const input = {
      modelId: 'amazon.nova-pro-v1:0', // Verify this model ID in AWS Bedrock
      messages: [{ role: 'user' as const, content: [{ text: prompt }] }],
      inferenceConfig: { maxTokens: 2000, temperature: 0.5, topP: 0.9 },
    };

    const command = new ConverseCommand(input);
    const response = await client.send(command);
    const generatedContent = response.output?.message?.content?.[0]?.text || 'No content generated.';

    return NextResponse.json({
      extractedText, // Raw text from pdf-parse
      processedContent: generatedContent, // Structured content from Nova Pro
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: 'Failed to process the PDF.' }, { status: 500 });
  }
}