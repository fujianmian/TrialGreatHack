import { NextResponse } from "next/server";
import { createBedrockClient } from "@/lib/bedrock";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { currentExam, refinementInstructions, difficulty } = body;

    if (!currentExam || !refinementInstructions) {
      return NextResponse.json(
        { error: 'Current exam and refinement instructions are required' },
        { status: 400 }
      );
    }

    console.log('🔄 Refining exam paper with AI...');
    const refinedExam = await refineExamWithAI(currentExam, refinementInstructions, difficulty);

    return NextResponse.json({ examContent: refinedExam });

  } catch (error) {
    console.error('Error refining exam:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refine exam' },
      { status: 500 }
    );
  }
}

async function refineExamWithAI(
  currentExam: string,
  instructions: string,
  difficulty: string
): Promise<string> {
  const client = createBedrockClient();

  const prompt = `You are an expert exam paper editor. You need to refine an existing exam paper based on specific instructions.

CURRENT EXAM PAPER:
${currentExam}

REFINEMENT INSTRUCTIONS:
${instructions}

DIFFICULTY LEVEL: ${difficulty}

Your task:
- READ the refinement instructions carefully
- MODIFY the exam paper according to the instructions
- MAINTAIN the original format and structure
- ENSURE questions remain relevant and well-formed
- Keep the difficulty level at ${difficulty}

Return the refined exam in the EXACT same format as the original, with the requested changes applied.

Format your response EXACTLY like this:
---EXAM_START---
[Modified exam content here following the same structure]
---EXAM_END---

Generate the refined exam paper now:`;

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