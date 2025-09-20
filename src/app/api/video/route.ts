import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    // Try AI generation first, fallback to algorithm
    let video;
    try {
      console.log("🤖 Attempting AWS Bedrock AI video generation...");
      video = await generateAIVideo(text);
      console.log("✅ AI video generation successful");
    } catch (aiError) {
      console.warn("⚠️ AI video generation failed, using fallback:", aiError instanceof Error ? aiError.message : String(aiError));
      console.log("🔄 Switching to algorithm-based video generation...");
      video = generateVideo(text);
      console.log("✅ Fallback video generation complete");
    }

    return NextResponse.json({ result: video });

  } catch (error: unknown) {
    console.error("Error generating video:", error);
    
    return NextResponse.json({ 
      error: `Failed to generate video: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Generate video using algorithm
function generateVideo(text: string) {
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length === 0) {
    return {
      title: "Empty Video",
      slides: [],
      totalDuration: 0,
      transcript: ""
    };
  }

  // Extract main topic for title
  const title = extractMainTopic(text);
  
  // Create slides from sentences
  const slides: any[] = [];
  let totalDuration = 0;

  // Title slide
  slides.push({
    id: 1,
    title: title,
    content: "Welcome to this presentation",
    duration: 3,
    type: 'title'
  });
  totalDuration += 3;

  // Content slides
  const contentSentences = sentences.slice(0, 5); // Take first 5 sentences
  contentSentences.forEach((sentence, index) => {
    const words = sentence.split(' ');
    const slideTitle = words.slice(0, 4).join(' ');
    const slideContent = sentence;
    const duration = Math.max(3, Math.min(8, Math.ceil(words.length / 3))); // 3-8 seconds based on content length
    
    slides.push({
      id: index + 2,
      title: slideTitle,
      content: slideContent,
      duration: duration,
      type: 'content'
    });
    totalDuration += duration;
  });

  // Conclusion slide
  slides.push({
    id: slides.length + 1,
    title: "Thank You",
    content: "Thank you for watching this presentation",
    duration: 3,
    type: 'conclusion'
  });
  totalDuration += 3;

  // Create transcript
  const transcript = slides.map(slide => `${slide.title}: ${slide.content}`).join('\n\n');

  return {
    title,
    slides,
    totalDuration,
    transcript
  };
}

// Extract main topic from text
function extractMainTopic(text: string): string {
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    const words = firstSentence.split(' ').filter(word => 
      word.length > 4 && 
      !isCommonWord(word) &&
      !isStopWord(word)
    );
    
    if (words.length > 0) {
      return words.slice(0, 4).join(' ');
    }
    
    return firstSentence.length > 40 ? firstSentence.substring(0, 40) + '...' : firstSentence;
  }
  
  return "Presentation";
}

// AI-powered video generation using AWS Bedrock
async function generateAIVideo(text: string) {
  console.log("🤖 Attempting AWS Bedrock AI video generation...");
  
  try {
    // Dynamic import to handle potential module not found errors
    const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const prompt = `Please analyze the following text and create a video presentation structure.

Requirements:
- Create a compelling title for the presentation
- Break the content into 4-6 slides with appropriate titles
- Each slide should have engaging content
- Determine appropriate duration for each slide (3-8 seconds)
- Create a transcript combining all slide content
- Organize slides with types: 'title', 'content', 'conclusion'

Return as JSON:
{
  "title": "Presentation Title",
  "slides": [
    {
      "id": 1,
      "title": "Slide Title",
      "content": "Slide content text",
      "duration": 5,
      "type": "title"
    }
  ],
  "totalDuration": 30,
  "transcript": "Full transcript text"
}

Text to analyze:
${text}`;

    const input = {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 1500,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const aiResponse = responseBody.content[0].text;

    console.log("✅ AWS Bedrock response received");

    // Parse the JSON response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const videoData = JSON.parse(jsonMatch[0]);
        return videoData;
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

// Helper functions
function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'this', 'that', 'these', 'those', 'there', 'then', 'when', 'where', 
    'what', 'why', 'how', 'who', 'which', 'and', 'or', 'but', 'for', 'nor', 
    'yet', 'so', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 
    'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 
    'below', 'between', 'among', 'under', 'over', 'around', 'near', 'far'
  ]);
  return commonWords.has(word.toLowerCase());
}

function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 
    'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 
    'first', 'well', 'also', 'where', 'much', 'some', 'these', 'would', 'every', 
    'through', 'during', 'before', 'between', 'without', 'within', 'around', 'among'
  ]);
  return stopWords.has(word.toLowerCase());
}
