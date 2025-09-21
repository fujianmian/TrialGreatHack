import { NextResponse } from "next/server";
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const videoStyle = body.style || "educational";

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    console.log("🤖 Using OpenAI directly for video generation...");
    console.log("📝 Text length:", text.length);
    console.log("🎨 Video style:", videoStyle);

    // Use OpenAI directly for script generation
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

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

3. **Background Suggestions**: Instead of generic backgrounds, suggest:
   - Real-world locations relevant to the content
   - Specific environments (labs, offices, nature, urban, etc.)
   - Contextual props and visual elements
   - Relevant imagery and symbols

4. **Visual Engagement**: Make each shot visually interesting with:
   - Specific visual metaphors for abstract concepts
   - Relevant props, charts, or demonstrations
   - Dynamic scenes with movement and activity
   - Professional cinematography techniques

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

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert video content analyst and script writer specializing in creating engaging, professional video content. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const videoScript = JSON.parse(jsonMatch[0]);
      console.log("✅ OpenAI script generation successful");
      
      // Convert to video format
      const video = {
        title: videoScript.title,
        videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", // Mock URL for now
        duration: videoScript.duration,
        type: 'openai_video',
        transcript: videoScript.transcript,
        slides: [],
        style: videoScript.style,
        shots: videoScript.shots,
        content_analysis: videoScript.content_analysis
      };
      
      return NextResponse.json({ result: video });
    } else {
      throw new Error("No valid JSON found in OpenAI response");
    }

  } catch (error: unknown) {
    console.error("❌ OpenAI video generation failed:", error);
    
    return NextResponse.json({ 
      error: `OpenAI video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}
