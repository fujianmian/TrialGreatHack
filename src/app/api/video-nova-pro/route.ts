import { NextResponse } from "next/server";
import { createBedrockClient } from '@/lib/bedrock';
import { InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const videoStyle = body.style || "educational";

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    console.log("🧠 Using Nova Pro directly for video generation...");
    console.log("📝 Text length:", text.length);
    console.log("🎨 Video style:", videoStyle);

    // Use Nova Pro directly
    const client = createBedrockClient();
    
    const prompt = `You are an expert video content creator and visual director specializing in creating highly engaging, visually stunning videos.

Video Style: ${videoStyle}

CRITICAL REQUIREMENTS - Create VISUALLY STUNNING videos:

1. **Content Analysis**: Deeply analyze the text to identify:
   - Key concepts, themes, and visual metaphors
   - Specific objects, locations, and scenarios mentioned
   - Emotional tone and mood
   - Target audience and context

2. **Visual Storytelling**: For each shot, provide:
   - SPECIFIC background environments (not generic studios)
   - CONCRETE visual elements and props
   - DETAILED scene descriptions with specific objects
   - Dynamic camera movements with purpose
   - Lighting and color schemes that match the content

Return as JSON:
{
  "title": "Compelling Video Title",
  "duration": 30,
  "style": "${videoStyle}",
  "content_analysis": {
    "key_themes": ["theme1", "theme2"],
    "visual_metaphors": ["metaphor1", "metaphor2"],
    "target_audience": "description",
    "emotional_tone": "tone description"
  },
  "shots": [
    {
      "prompt": "DETAILED visual description with specific background, props, camera movement, and scene details",
      "weight": 1.0,
      "description": "What happens in this shot",
      "background": "Specific background environment",
      "visual_elements": ["specific prop 1", "specific prop 2"],
      "camera_movement": "Specific camera technique",
      "lighting": "Specific lighting description"
    }
  ],
  "transcript": "Natural flowing transcript"
}

Text to analyze:
${text}`;

    const input = {
      modelId: 'amazon.nova-pro-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [
          {
            role: 'user',
            content: [
              {
                text: prompt
              }
            ]
          }
        ],
        inferenceConfig: {
          temperature: 0.7
        }
      })
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("📥 Raw Nova Pro response:", JSON.stringify(responseBody, null, 2));
    
    // Handle different response formats
    let aiResponse;
    if (responseBody.content && responseBody.content[0] && responseBody.content[0].text) {
      aiResponse = responseBody.content[0].text;
    } else if (responseBody.text) {
      aiResponse = responseBody.text;
    } else if (responseBody.output && responseBody.output.text) {
      aiResponse = responseBody.output.text;
    } else {
      console.log("📥 Available response keys:", Object.keys(responseBody));
      throw new Error("Unexpected response format from Nova Pro");
    }

    // Parse the JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const videoScript = JSON.parse(jsonMatch[0]);
      console.log("✅ Nova Pro script generation successful");
      
      // Convert to video format
      const video = {
        title: videoScript.title,
        videoUrl: "https://nova-reel-videos-20.s3.us-east-1.amazonaws.com/shot-3/m07dmm6kbacl/output.mp4", // Nova Reel fallback video
        duration: videoScript.duration,
        type: 'nova_pro_video',
        transcript: videoScript.transcript,
        slides: [],
        style: videoScript.style,
        shots: videoScript.shots,
        content_analysis: videoScript.content_analysis
      };
      
      return NextResponse.json({ result: video });
    } else {
      throw new Error("No valid JSON found in Nova Pro response");
    }

  } catch (error: unknown) {
    console.error("❌ Nova Pro video generation failed:", error);
    
    return NextResponse.json({ 
      error: `Nova Pro video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
