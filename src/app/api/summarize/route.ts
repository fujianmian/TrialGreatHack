import { NextResponse } from "next/server";
import { createActivity } from '@/lib/db';

// Track processed requests to prevent duplicates
const processedRequests = new Set<string>();

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const text = body.text || "";
    const userEmail = body.userEmail || 'anonymous@example.com';
    const requestId = body.requestId || `${Date.now()}-${Math.random()}`;

    // Check for duplicate requests
    if (processedRequests.has(requestId)) {
      console.log(`⚠️ Duplicate summary request detected: ${requestId}`);
      return NextResponse.json({ 
        error: "Duplicate request detected" 
      }, { status: 409 });
    }

    // Mark this request as being processed
    processedRequests.add(requestId);

    // Clean up old request IDs after 5 minutes
    setTimeout(() => {
      processedRequests.delete(requestId);
    }, 5 * 60 * 1000);

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    // Try AI generation first, fallback to algorithm
    let summary: any = null;
    let usedAI = false;
    
    try {
      console.log("🤖 Attempting AWS Bedrock AI summarization...");
      summary = await generateAISummary(text);
      usedAI = true;
      console.log("✅ AI summarization successful");
    } catch (aiError) {
      console.warn("⚠️ AI summarization failed, using fallback:", aiError instanceof Error ? aiError.message : String(aiError));
      console.log("🔄 Switching to algorithm-based summarization...");
      summary = generateSummary(text);
      usedAI = false;
      console.log("✅ Fallback summarization complete");
    }

    // Calculate duration
    const duration = Date.now() - startTime;

    // Create a simple title from the first sentence
    const firstSentence = text.split(/[.!?]+/)[0].trim();
    const title = firstSentence.length > 50 ? 
      firstSentence.substring(0, 47) + '...' : 
      firstSentence;

    // Save activity to database
    try {
      const activityId = await createActivity({
        userEmail: userEmail,
        type: 'summary',
        title: title,
        inputText: text.substring(0, 500), // Store first 500 chars
        result: {
          summary: summary.summary,
          keyPoints: summary.keyPoints,
          wordCount: summary.wordCount,
          originalWordCount: summary.originalWordCount
        },
        status: 'completed',
        duration: duration,
        metadata: {
          originalWordCount: summary.originalWordCount,
          summaryWordCount: summary.wordCount,
          model: usedAI ? 'Nova Pro' : 'Algorithm',
          tags: [
            `${summary.originalWordCount} words → ${summary.wordCount} words`,
            usedAI ? 'AI Generated' : 'Algorithm'
          ],
          originalTitle: title,
          usedAI
        }
      });

      console.log(`✅ Summary activity saved with ID: ${activityId}`);
    } catch (dbError) {
      console.error('❌ Failed to save summary activity to database:', dbError);
      // Don't fail the request if database save fails
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

// AI-powered summary generation using AWS Bedrock trigger
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

    // ✅ CORRECT FORMAT FOR AMAZON NOVA PRO
    const input = {
      modelId: 'amazon.nova-pro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [
          {
            role: "user",
            content: [
              {
                text: prompt
              }
            ]
          }
        ],
        inferenceConfig: {
          max_new_tokens: 1500,
          temperature: 0.7,
          top_p: 0.9
        }
      })
    };
    
    console.log("🧾 Final request body:", JSON.stringify(JSON.parse(input.body), null, 2));

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    // ✅ CORRECT RESPONSE PARSING FOR NOVA PRO
    const aiResponse = responseBody.output.message.content[0].text;

    console.log("✅ AWS Bedrock response received");
    console.log("📝 AI Response:", aiResponse);

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