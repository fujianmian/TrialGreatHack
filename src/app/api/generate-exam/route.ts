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

    const pdfFormData = new FormData();
    pdfFormData.append('content', examContent);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const pdfResponse = await fetch(`${baseUrl}/api/generate-pdf`, {
      method: 'POST',
      body: pdfFormData,
    });

    if (!pdfResponse.ok) {
      throw new Error('Failed to generate PDF');
    }

    const pdfData = await pdfResponse.arrayBuffer();

    return new NextResponse(pdfData, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="exam-paper.pdf"',
      },
    });
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
  if (!response.ok) throw new Error('Failed to extract PDF text');
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

CRITICAL FORMATTING RULES:
1. DO NOT use markdown symbols like **, __, or ##
2. Use plain text only
3. Section headers should be in ALL CAPS or start with "Section"
4. Marks should be placed immediately after the question text, not after answer options
5. For multiple choice questions:
   - Question text followed by marks [X marks]
   - Then list options A), B), C), D) on separate lines
   - Options should NOT be bold or have any special formatting

Format your response EXACTLY like this:
---EXAM_START---
[EXAM TITLE IN CAPS]
[Course/Subject information]
Time allowed: [X] minutes
Total Marks: [X]

SECTION A: MULTIPLE CHOICE QUESTIONS
Instructions: Choose the correct answer from the options provided.

1. [Question text] [2 marks]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

2. [Question text] [2 marks]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]

SECTION B: SHORT ANSWER QUESTIONS
Instructions: Answer the questions in the space provided.

1. [Question text] [4 marks]

2. [Question text] [4 marks]

---EXAM_END---

Input:
${combinedText}

Generate the complete exam paper now (remember: NO markdown symbols, plain text only):`;

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