import { NextResponse } from "next/server";
import { createBedrockClient } from "@/lib/bedrock";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

export async function POST(req: Request) {
  try {
    const { userInput } = await req.json();
    if (!userInput) {
      return NextResponse.json({ error: "Missing input" }, { status: 400 });
    }

    const client = createBedrockClient();

    // Build prompt
    const prompt = `
      You are an educational assistant. 
      The user wants to learn about: "${userInput}".
      Recommend the most effective format: one of [video, flashcards, mindmap, quiz, summary].
      Reply ONLY with the format id (exactly one word).
    `;

    const command = new InvokeModelCommand({
      modelId: "amazon.nova-pro-v1:0",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [{ text: prompt }]
          },
        ],
        inferenceConfig: {
          maxTokens: 300,
          temperature: 0.7,
          topP: 0.9,
        },
      }),
    });

    const response = await client.send(command);
    const json = JSON.parse(new TextDecoder().decode(response.body));

    // Nova returns structured content
    const output =
      json.output?.message?.content?.[0]?.text?.trim().toLowerCase() ||
      "summary";

    return NextResponse.json({ recommendation: output });
  } catch (error) {
    console.error("Bedrock error:", error);
    return NextResponse.json(
      { error: "Failed to get recommendation" },
      { status: 500 }
    );
  }
}