import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    // Try AI generation first, fallback to algorithm
    let summary;
    try {
      console.log("🤖 Attempting AWS Bedrock AI summarization...");
      summary = await generateAISummary(text);
      console.log("✅ AI summarization successful");
    } catch (aiError) {
      console.warn("⚠️ AI summarization failed, using fallback:", aiError instanceof Error ? aiError.message : String(aiError));
      console.log("🔄 Switching to algorithm-based summarization...");
      summary = generateSummary(text);
      console.log("✅ Fallback summarization complete");
    }

    return NextResponse.json({ result: summary });

  } catch (error: unknown) {
    console.error("Error generating summary:", error);
    
    return NextResponse.json({ 
      error: `Failed to generate summary: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Generate summary using algorithm
function generateSummary(text: string) {
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  const wordCount = text.split(/\s+/).length;
  
  // Create a proper summary by selecting the most important sentences
  let summary = "";
  let keyPoints: string[] = [];
  
  if (sentences.length <= 2) {
    // If very short text, just return the first sentence as summary
    summary = sentences[0] || text;
    keyPoints = [sentences[0] || text];
  } else if (sentences.length <= 4) {
    // For medium text, take first and last sentences
    summary = sentences[0] + ". " + sentences[sentences.length - 1];
    keyPoints = [sentences[0], sentences[sentences.length - 1]];
  } else {
    // For longer text, create a proper summary
    // Take first sentence (usually introduction)
    const firstSentence = sentences[0];
    
    // Find middle sentences that contain key concepts
    const middleSentences = sentences.slice(1, -1);
    const importantMiddle = middleSentences.find(s => 
      s.toLowerCase().includes('important') || 
      s.toLowerCase().includes('key') || 
      s.toLowerCase().includes('main') ||
      s.toLowerCase().includes('primary') ||
      s.length > 50
    ) || middleSentences[Math.floor(middleSentences.length / 2)];
    
    // Take last sentence (usually conclusion)
    const lastSentence = sentences[sentences.length - 1];
    
    summary = [firstSentence, importantMiddle, lastSentence]
      .filter(s => s && s.trim().length > 0)
      .join('. ');
    
    keyPoints = [firstSentence, importantMiddle, lastSentence]
      .filter(s => s && s.trim().length > 0)
      .map(s => s.trim());
  }

  // Ensure summary is shorter than original
  const summaryWords = summary.split(/\s+/).length;
  if (summaryWords >= wordCount * 0.8) {
    // If summary is too long, truncate it
    const words = summary.split(/\s+/);
    summary = words.slice(0, Math.floor(wordCount * 0.5)).join(' ') + "...";
  }

  return {
    summary: summary || "Unable to generate summary from the provided text.",
    keyPoints: keyPoints.length > 0 ? keyPoints : ["No key points could be extracted from the text."],
    wordCount: summary.split(/\s+/).length,
    originalWordCount: wordCount
  };
}

import { createBedrockClient } from "@/lib/bedrock";
import { InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

// AI-powered summary generation using AWS Bedrock
async function generateAISummary(text: string) {
  console.log("🤖 Attempting AWS Bedrock AI summarization...");
  console.log("🔍 Environment check:");
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Not set");
  console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Not set");
  
  try {
    const client = createBedrockClient();

    const prompt = `You are an expert at synthesizing information and creating original summaries. Read the following text carefully and create a NEW summary using your OWN WORDS.

CRITICAL INSTRUCTIONS:
- DO NOT copy any complete sentences from the original text
- DO NOT just cut and paste phrases from the original
- UNDERSTAND the key concepts and EXPLAIN them in your own way
- PARAPHRASE everything - use different sentence structures and vocabulary
- Create a cohesive summary that flows naturally in YOUR voice
- Extract key points and present them as bullet points, but REWRITE them in your own words

Your goal is to demonstrate understanding by expressing the same ideas differently.

Return ONLY valid JSON in this exact format:
{
  "summary": "Your paraphrased summary here (2-4 sentences, completely rewritten)",
  "keyPoints": [
    "First key concept explained in your own words",
    "Second key concept explained in your own words",
    "Third key concept explained in your own words"
  ]
}

Text to summarize:
${text}

Remember: Every word in your response must be YOUR paraphrase, not copied text.`;

    const input = {
      modelId: 'amazon.nova-pro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: prompt,
        textGenerationConfig: {
          maxTokenCount: 1500, // ✅ correct name for token limit
          stopSequences: [],
          temperature: 0.7,     // ✅ supported here
          topP: 0.9
        }
      })
    };
    console.log("🧾 Final request body:", input);


    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiResponse = responseBody.content[0].text;

    console.log("✅ AWS Bedrock response received");

    // Parse the JSON response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const summaryData = JSON.parse(jsonMatch[0]);
        const wordCount = text.split(/\s+/).length;
        
        return {
          summary: summaryData.summary || "Unable to generate summary.",
          keyPoints: summaryData.keyPoints || ["No key points available."],
          wordCount: summaryData.summary ? summaryData.summary.split(/\s+/).length : 0,
          originalWordCount: wordCount
        };
      } else {
        throw new Error("No valid JSON found in AI response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI response");
    }

  } catch (awsError) {
    console.log("❌ AWS Bedrock error:", awsError);
    throw new Error(`AWS Bedrock error: ${awsError instanceof Error ? awsError.message : 'Unknown error'}`);
  }
}