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

    // Extract text from both PDFs
    console.log('📄 Extracting text from exam paper PDF...');
    const examText = await extractPDFText(examPDF);
    
    console.log('📚 Extracting text from learning materials PDF...');
    const materialsText = await extractPDFText(materialsPDF);

    // Combine texts with clear markers
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
    console.error('Error generating exam:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate exam' },
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
- CAREFULLY identify which section is the exam format and which is the learning materials
- ANALYZE the exam format: question types (multiple choice, short answer, essay), numbering style, section headers, point allocations, instructions format
- EXTRACT key concepts and topics from the learning materials
- CREATE a NEW exam paper that:
  * Follows the EXACT format structure of the exam paper (same question types, numbering, sections)
  * Contains questions BASED ON the learning materials content
  * Matches the ${difficulty} difficulty level
  * Has appropriate point allocations
  * Includes clear instructions

CRITICAL: Return the exam paper in a structured format that can be converted to PDF. Use clear section headers, question numbering, and formatting.

Format your response EXACTLY like this:
---EXAM_START---
[EXAM TITLE]
[Course/Subject information]
[Time allowed, instructions, etc.]

Section A: [Section Name]
Instructions: [Any specific instructions]

1. [Question text]
   a) [Sub-question if applicable]
   b) [Sub-question if applicable]
   [X marks]

2. [Question text]
   [X marks]

[Continue with all sections...]

---EXAM_END---

Input:
${combinedText}

Generate the complete exam paper now:`;

  const input = {
    modelId: 'amazon.nova-pro-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      messages: [
        {
          role: "user",
          content: [{ text: prompt }]
        }
      ],
      inferenceConfig: {
        max_new_tokens: 4000,
        temperature: 0.7,
        top_p: 0.9
      }
    })
  };

  const command = new InvokeModelCommand(input);
  const response = await client.send(command);
  
  const responseBody = JSON.parse(new TextDecoder().decode(response.body));
  const aiResponse = responseBody.output.message.content[0].text;

  // Extract content between markers
  const startMarker = '---EXAM_START---';
  const endMarker = '---EXAM_END---';
  
  const startIdx = aiResponse.indexOf(startMarker);
  const endIdx = aiResponse.indexOf(endMarker);
  
  if (startIdx !== -1 && endIdx !== -1) {
    return aiResponse.substring(startIdx + startMarker.length, endIdx).trim();
  }
  
  // Fallback: return full response if markers not found
  return aiResponse;
}