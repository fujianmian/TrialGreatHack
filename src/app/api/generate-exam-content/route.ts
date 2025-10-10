import { NextResponse } from "next/server";
import { createBedrockClient } from "@/lib/bedrock";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const examPDF = formData.get('examPDF') as File;
    const materialsPDF = formData.get('materialsPDF') as File;
    const difficulty = formData.get('difficulty') as string;

    if (!examPDF || !materialsPDF) {
      return NextResponse.json(
        { error: 'Both exam paper and learning materials PDFs are required' },
        { status: 400 }
      );
    }

    console.log('📄 Extracting text from exam paper PDF...');
    const examText = await extractPDFText(examPDF);

    console.log('📚 Extracting text from learning materials PDF...');
    const materialsText = await extractPDFText(materialsPDF);

    const combinedText = `
=== EXAM PAPER FORMAT (Use this as format reference) ===
${examText}

=== LEARNING MATERIALS (Generate questions from this content) ===
${materialsText}
`;

    console.log('🤖 Generating exam paper with AI...');
    const examContent = await generateExamWithAI(combinedText, difficulty);

    return NextResponse.json({ examContent });
  } catch (error) {
    console.error('Error generating exam content:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate exam content' },
      { status: 500 }
    );
  }
}

async function extractPDFText(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/extract-pdf`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to extract PDF text');
  }

  const data = await response.json();
  return data.extractedText || '';
}

async function generateExamWithAI(combinedText: string, difficulty: string): Promise<string> {
  const client = createBedrockClient();

  const prompt = `You are an expert exam paper creator. You have been given two documents:
1. An EXAM PAPER FORMAT - which shows the structure and style of exam questions
2. LEARNING MATERIALS - the content to create new exam questions from

Your task:
- CAREFULLY analyze the EXAM PAPER FORMAT to identify its structure, including:
  * Question types (e.g., multiple choice, short answer, essay)
  * Numbering style (e.g., 1., 1), Q1, etc.)
  * Section headers (e.g., SECTION A, Part 1, etc.)
  * Point allocations (e.g., [X marks], (X points), etc.)
  * Instructions format
- EXTRACT key concepts and topics from the LEARNING MATERIALS
- CREATE a NEW exam paper that:
  * EXACTLY replicates the structure, style, and formatting of the EXAM PAPER FORMAT
  * Contains questions BASED ON the LEARNING MATERIALS content
  * Matches the ${difficulty} difficulty level
  * Has appropriate point allocations consistent with the EXAM PAPER FORMAT
  * Includes clear instructions as per the EXAM PAPER FORMAT

CRITICAL FORMATTING RULES:
1. DO NOT use markdown symbols like **, __, or ##
2. Use plain text only
3. Strictly follow the formatting of the EXAM PAPER FORMAT for section headers, question numbering, marks, and instructions
4. For multiple choice questions (if present in the format):
   - Place marks immediately after the question text
   - List options (e.g., A), B), C), D)) on separate lines without bold or special formatting
5. Ensure the output matches the EXACT structure of the EXAM PAPER FORMAT

Input:
${combinedText}

Generate the complete exam paper now, following the format of the EXAM PAPER FORMAT and using content from the LEARNING MATERIALS (plain text only):`;

  const input = {
    modelId: 'amazon.nova-pro-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        max_new_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9,
      },
    }),
  };

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);

  let responseBody;
  try {
    responseBody = JSON.parse(new TextDecoder().decode(response.body));
  } catch (error) {
    console.error('Error parsing Bedrock response:', error);
    throw new Error('Invalid response from AI model');
  }

  const aiResponse = responseBody.output?.message?.content?.[0]?.text;
  if (!aiResponse) {
    throw new Error('No valid content in AI response');
  }

  return aiResponse.trim();
}