import { NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// Initialize Bedrock client: to trigger
const client = new BedrockRuntimeClient({
  region: "us-east-1", // Ensure the region matches
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Article content cannot be empty" }, { status: 400 });
    }

    // Build prompt
    const prompt = `Please read the following article and identify 10 of the most obscure or uncommon words.
For each word, provide a concise explanation.
Return as a JSON array in the following format:
[
  {"word": "word1", "meaning": "explanation1"},
  {"word": "word2", "meaning": "explanation2"}
]

Article content:
${text}`;

    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              { text: prompt }
            ]
          }
        ],
        inferenceConfig: {
          maxTokens: 500,
          temperature: 0.7,
        }
      }),
    });

    console.log("Sending request to Bedrock...");
    const response = await client.send(command);

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    // ✅ Extract model reply text
    const resultText = responseBody.output?.message?.content?.[0]?.text || "";

    // Debug log
    console.log("Raw AI text:", resultText);

    let parsedResult;
    try {
      // Try to extract JSON array from text
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      parsedResult = [{
        word: "Parse failed",
        meaning: resultText.substring(0, 200) + "..."
      }];
    }

    return NextResponse.json({ result: parsedResult });

    
  } catch (error: unknown) {
    console.error("Bedrock error:", error);
    
    // More detailed error handling
    if (error instanceof Error) {
      if (error.name === 'AccessDeniedException') {
        return NextResponse.json({ 
          error: "Insufficient permissions, please check AWS IAM configuration" 
        }, { status: 403 });
      }
      if (error.name === 'ValidationException') {
        return NextResponse.json({ 
          error: "Request parameter error" 
        }, { status: 400 });
      }
      return NextResponse.json({ 
        error: `Invocation failed: ${error.message || 'Unknown error'}` 
      }, { status: 500 });
    } else {
      return NextResponse.json({ 
        error: 'Invocation failed: Unknown error' 
      }, { status: 500 });
    }
  }
}