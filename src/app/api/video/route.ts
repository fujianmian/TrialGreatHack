import { NextResponse } from "next/server";
import OpenAI from 'openai';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { createBedrockClient } from '@/lib/bedrock';

interface VideoSlide {
  id: number;
  title: string;
  content: string;
  duration: number;
  type: 'title' | 'content' | 'conclusion';
  background?: string;
  visual_elements?: string[];
  camera_movement?: string;
  lighting?: string;
}

interface VideoShot {
  prompt: string;
  weight: number;
  description: string;
  background?: string;
  visual_elements?: string[];
  camera_movement?: string;
  lighting?: string;
}

interface ContentAnalysis {
  key_themes: string[];
  visual_metaphors: string[];
  target_audience: string;
  emotional_tone: string;
}

interface EnhancedContentAnalysis {
  enhancedContent: string;
  keyPoints: string[];
  visualOpportunities: string[];
  narrativeElements: string[];
  recommendedVisuals: string[];
  contentStructure: string;
  emotionalTone: string;
  targetAudience: string;
}

interface VideoResponse {
  title: string;
  slides: VideoSlide[];
  totalDuration: number;
  transcript: string;
  // Nova Reel specific fields
  videoUrl?: string;
  duration?: number;
  type?: string;
  style?: string;
  shots?: VideoShot[];
  content_analysis?: ContentAnalysis;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const videoStyle = body.style || "educational"; // Default style

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    // Multi-AI video generation pipeline: OpenAI + Nova Pro + Nova Reel
    let video;
    try {
      console.log("🚀 Starting Multi-AI video generation pipeline...");
      console.log("📝 Text length:", text.length);
      console.log("🎨 Video style:", videoStyle);
      console.log("🔑 AWS Region:", process.env.AWS_REGION);
      console.log("🪣 S3 Bucket:", process.env.AWS_S3_BUCKET ? "Set" : "Not set");
      
      video = await generateMultiAIVideo(text, videoStyle);
      console.log("✅ Multi-AI video generation successful");
    } catch (multiAIError) {
      console.error("❌ Multi-AI video generation failed:", multiAIError instanceof Error ? multiAIError.message : String(multiAIError));
      throw new Error(`Video generation failed: ${multiAIError instanceof Error ? multiAIError.message : 'Unknown error'}`);
    }

    return NextResponse.json({ result: video });

  } catch (error: unknown) {
    console.error("Error generating video:", error);
    
    // Provide more specific error messages
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Check for specific error types
      if (errorMessage.includes('AWS credentials not found')) {
        errorMessage = 'AWS credentials not configured. Please check your environment variables.';
      } else if (errorMessage.includes('No shots available')) {
        errorMessage = 'Failed to generate video content. Please try again with different text.';
      } else if (errorMessage.includes('OpenAI')) {
        errorMessage = 'AI service temporarily unavailable. Please try again.';
      } else if (errorMessage.includes('doesn\'t support the model') || errorMessage.includes('Nova Reel')) {
        errorMessage = 'Nova Reel video generation is not available in your AWS region. Please check your AWS region configuration or contact AWS support.';
      } else if (errorMessage.includes('Nova Reel not available')) {
        errorMessage = 'Nova Reel video generation service is not available. Please try again later or contact support.';
      }
    }
    
    return NextResponse.json({ 
      error: `Failed to generate video: ${errorMessage}` 
    }, { status: 500 });
  }
}



// Multi-AI video generation pipeline: OpenAI + OpenAI (Nova Reel disabled)
async function generateMultiAIVideo(text: string, videoStyle: string = "educational") {
  console.log("🤖 Step 1: OpenAI content enhancement...");
  
  // Step 1: Use OpenAI to enhance and analyze the content
  const openaiAnalysis = await enhanceContentWithOpenAI(text, videoStyle);
  console.log("✅ OpenAI analysis complete");
  
  console.log("🧠 Step 2: OpenAI script generation...");
  
  // Step 2: Use OpenAI for script generation
  const openaiScript = await generateVideoScriptWithOpenAI(openaiAnalysis.enhancedContent, videoStyle);
  console.log("✅ OpenAI script generation complete");
  
  console.log("🎬 Step 3: OpenAI video generation (Nova Reel unavailable)...");
  
  // Step 3: Generate actual video content using slides and shots
  console.log("🎬 Generating slides-based video content...");
  
    // Use slides from the script
    const slides = openaiScript.slides || [];
  
  // Generate actual video using AI video generation service
  const videoUrl = await generateActualVideo(openaiScript, videoStyle);
  
  const openaiVideo = {
    title: openaiScript.title,
    videoUrl: videoUrl,
    duration: openaiScript.duration,
    type: "nova_reel_video",
    transcript: openaiScript.transcript,
    slides: [], // No slides - actual video only
    style: videoStyle,
    shots: openaiScript.shots,
    content_analysis: openaiScript.content_analysis
  };
  console.log("✅ OpenAI video generation complete");
  
  return openaiVideo;
}

// Generate actual video using Nova Reel
async function generateActualVideo(script: VideoResponse, style: string): Promise<string> {
  console.log("🎬 Generating actual video using Nova Reel...");
  
  try {
    // Use Nova Reel for actual video generation
    console.log("📤 Sending video generation request to Nova Reel...");
    const novaVideo = await generateNovaReelVideo(script.transcript, style, script);
    
    console.log("✅ Nova Reel video generation complete");
    return novaVideo.videoUrl;
  } catch (error) {
    console.error("❌ Nova Reel video generation failed:", error);
    
    // Check if Nova Reel is not available in this region
    if (error instanceof Error && error.message.includes('doesn\'t support the model')) {
      throw new Error("Nova Reel video generation is not available in your AWS region. Please check your AWS region configuration or contact AWS support to enable Nova Reel in your region.");
    }
    
    throw error;
  }
}

// Create slides from script when Nova Reel is not available
function createSlidesFromScript(script: VideoResponse): VideoSlide[] {
  console.log("📊 Creating slides from script...");
  
  const slides: VideoSlide[] = [];
  
  // If we have shots, create slides from them
  if (script.shots && script.shots.length > 0) {
    script.shots.forEach((shot, index) => {
      slides.push({
        id: index + 1,
        title: shot.description || `Slide ${index + 1}`,
        content: shot.prompt || 'Content slide',
        background: shot.background || 'professional',
        visual_elements: shot.visual_elements || [],
        camera_movement: shot.camera_movement || 'static',
        lighting: shot.lighting || 'professional',
        duration: Math.max(5, Math.floor((script.duration || 30) / (script.shots?.length || 1))), // Distribute duration
        type: index === 0 ? 'title' : index === (script.shots?.length || 1) - 1 ? 'conclusion' : 'content'
      });
    });
  } else {
    // Create slides from transcript if no shots available
    const transcript = script.transcript || '';
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length > 0) {
      // Create title slide
      slides.push({
        id: 1,
        title: script.title || "Presentation",
        content: sentences[0] || 'Welcome to the presentation',
        background: 'professional',
        visual_elements: ['dynamic graphics'],
        camera_movement: 'static',
        lighting: 'professional',
        duration: 8,
        type: 'title'
      });
      
      // Create content slides
      const contentSentences = sentences.slice(1);
      contentSentences.forEach((sentence, index) => {
        if (sentence.trim().length > 0) {
          slides.push({
            id: index + 2,
            title: `Point ${index + 1}`,
            content: sentence.trim(),
            background: 'professional',
            visual_elements: ['content graphics'],
            camera_movement: 'static',
            lighting: 'professional',
            duration: Math.max(5, Math.floor((script.duration || 30) / (contentSentences.length + 1))),
            type: index === contentSentences.length - 1 ? 'conclusion' : 'content'
          });
        }
      });
    }
  }
  
  // Ensure we have at least one slide
  if (slides.length === 0) {
    slides.push({
      id: 1,
      title: script.title || "Content Presentation",
      content: script.transcript || 'No content available',
      background: 'professional',
      visual_elements: ['dynamic graphics'],
      camera_movement: 'static',
      lighting: 'professional',
      duration: script.duration || 30,
      type: 'content'
    });
  }
  
  console.log(`✅ Created ${slides.length} slides from script`);
  return slides;
}

// Create video generation prompt from script
function createVideoPrompt(script: VideoResponse, style: string): string {
  const shots = script.shots || [];
  const title = script.title || "Generated Video";
  
  let prompt = `Create a ${style} style video titled "${title}". `;
  
  if (shots.length > 0) {
    prompt += "The video should include these scenes: ";
    shots.forEach((shot: VideoShot, index: number) => {
      prompt += `${index + 1}. ${shot.prompt} `;
    });
  } else {
    prompt += `Content: ${script.transcript || "Educational content presentation"}`;
  }
  
  prompt += ` Style: ${style}. Duration: ${script.duration || 30} seconds.`;
  
  return prompt;
}


// Enhanced Nova Reel video generation with Nova Pro content analysis
async function generateNovaReelVideo(text: string, videoStyle: string = "educational", enhancedScript?: VideoResponse) {
  console.log("🎬 Attempting enhanced Nova Reel video generation...");
  
  try {
    const client = createBedrockClient();

    // Use the enhanced script from the multi-AI pipeline
    let videoScript;
    if (enhancedScript) {
      console.log("📝 Using enhanced script from multi-AI pipeline...");
      videoScript = enhancedScript;
    } else {
      console.log("🤖 Analyzing content with Nova Pro...");
      videoScript = await generateVideoScriptWithNovaPro(client, text, videoStyle);
    }
    
    console.log("🎬 Generating engaging video with Nova Reel...");
    
    // Create simplified video generation request for Nova Reel
    // Using only the basic parameters that Nova Reel supports
    const shots = videoScript.shots || [];
    if (shots.length === 0) {
      throw new Error("No shots available for video generation");
    }
    
    const videoRequest = {
      text_prompts: shots.map((shot: VideoShot, index: number) => ({
        text: `Shot ${index + 1}: ${shot.prompt || 'Visual content'}. Background: ${shot.background || 'professional studio'}. Visual elements: ${shot.visual_elements?.join(', ') || 'dynamic graphics'}. Camera: ${shot.camera_movement || 'smooth tracking'}. Lighting: ${shot.lighting || 'professional lighting'}`,
        weight: shot.weight || 1.0
      })),
      duration: videoScript.duration || 30,
      output_format: "mp4"
    };

    // Try different possible Nova Reel model IDs
    const possibleModelIds = [
      'amazon.nova-reel-v1:0',
      'amazon.nova-reel-v1',
      'amazon.nova-reel',
      'amazon.nova-reel-v2:0',
      'amazon.nova-reel-v2'
    ];
    
    let response = null;
    let lastError = null;
    
    for (const modelId of possibleModelIds) {
      try {
        console.log(`🔄 Trying Nova Reel model ID: ${modelId}`);
        
        const input = {
          modelId: modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(videoRequest)
        };

        console.log("📤 Sending request to Nova Reel with:", JSON.stringify(videoRequest, null, 2));
        
        const command = new InvokeModelCommand(input);
        response = await client.send(command);
        
        console.log(`✅ Successfully connected to Nova Reel with model: ${modelId}`);
        break; // Success, exit the loop
        
      } catch (modelError) {
        console.log(`❌ Model ${modelId} failed:`, modelError instanceof Error ? modelError.message : String(modelError));
        lastError = modelError;
        continue; // Try next model
      }
    }
    
    if (!response) {
      // Nova Reel is not available, create slides-based presentation instead
      console.log("❌ Nova Reel not available in this region. Creating slides-based presentation...");
      
      // Create slides from the script for presentation
      const scriptToUse = enhancedScript || {
        title: "Generated Presentation",
        slides: [],
        totalDuration: 30,
        transcript: "No content available",
        duration: 30,
        shots: [],
        content_analysis: undefined
      };
      const slides = createSlidesFromScript(scriptToUse);
      
      return {
        title: enhancedScript?.title || "Generated Presentation",
        videoUrl: null, // No video URL since we're creating slides
        duration: enhancedScript?.duration || 30,
        type: 'slides_presentation',
        transcript: enhancedScript?.transcript || '',
        slides: slides,
        style: videoStyle,
        shots: enhancedScript?.shots || [],
        content_analysis: enhancedScript?.content_analysis
      };
    }
    
    console.log("📥 Raw Nova Reel response:", response);
    console.log("📥 Response status:", response.$metadata?.httpStatusCode);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("📥 Parsed Nova Reel response body:", JSON.stringify(responseBody, null, 2));
    
    console.log("✅ Enhanced Nova Reel response received");

    // Extract video information from Nova Reel response
    if (responseBody.video_url || responseBody.s3_location) {
      const videoUrl = responseBody.video_url || responseBody.s3_location;
      
      console.log("🎬 Video URL found:", videoUrl);
      
      return {
        title: videoScript.title,
        videoUrl: videoUrl,
        duration: videoScript.duration,
        type: 'nova_reel_video',
        transcript: videoScript.transcript,
        slides: [], // Empty for actual video
        style: videoScript.style,
        shots: videoScript.shots,
        content_analysis: videoScript.content_analysis
      };
    } else {
      console.log("❌ No video URL found in response. Available keys:", Object.keys(responseBody));
      throw new Error("No video URL found in Nova Reel response");
    }

  } catch (novaError) {
    console.log("❌ Nova Reel error:", novaError);
    throw new Error(`Nova Reel error: ${novaError instanceof Error ? novaError.message : 'Unknown error'}`);
  }
}

// Use Nova Pro to generate engaging video script
async function generateVideoScriptWithNovaPro(client: BedrockRuntimeClient, text: string, videoStyle: string = "educational") {
  const styleGuidelines = getStyleGuidelines(videoStyle);
  
  const prompt = `You are an expert video content creator and visual director specializing in creating highly engaging, visually stunning YouTube videos. Your task is to analyze the content and create a dynamic video script with specific visual elements, backgrounds, and scenes.

Video Style: ${videoStyle}
${styleGuidelines}

CRITICAL REQUIREMENTS - Make videos VISUALLY ENGAGING:

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
  "title": "Compelling YouTube Title",
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
    const aiResponse = responseBody.content[0].text;

    // Parse the JSON response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
      const videoScript = JSON.parse(jsonMatch[0]);
      return videoScript;
      } else {
      throw new Error("No valid JSON found in Nova Pro response");
      }
    } catch (parseError) {
    console.error("Failed to parse Nova Pro response:", parseError);
    throw new Error("Failed to parse Nova Pro response");
  }
}

// Get style-specific guidelines for video generation
function getStyleGuidelines(style: string): string {
  const guidelines: Record<string, string> = {
    educational: `
Educational Style Guidelines:
- Clean, professional presentation with clear graphics
- Modern studio setup with good lighting
- Use charts, diagrams, and visual aids
- Professional presenter or animated graphics
- Calm, informative tone with smooth transitions
- Bright, clear colors that enhance readability`,

    documentary: `
Documentary Style Guidelines:
- Cinematic, atmospheric lighting and composition
- Real-world locations and authentic settings
- Natural lighting and realistic environments
- Professional voice-over style
- Smooth, deliberate camera movements
- Rich, natural colors and textures`,

    cinematic: `
Cinematic Style Guidelines:
- Movie-quality cinematography and lighting
- Dramatic camera angles and movements
- High contrast lighting and shadows
- Professional film-grade visuals
- Smooth, cinematic transitions
- Rich, saturated colors with depth`,

    modern: `
Modern Style Guidelines:
- Contemporary, sleek design elements
- Minimalist backgrounds with clean lines
- Vibrant, modern color palettes
- Dynamic animations and transitions
- Tech-inspired visual elements
- Smooth, fluid camera movements`,

    corporate: `
Corporate Style Guidelines:
- Professional, polished presentation
- Clean, business-appropriate backgrounds
- Corporate colors and branding elements
- Professional lighting and setup
- Clear, authoritative presentation style
- Subtle, professional animations`
  };

  return guidelines[style] || guidelines.educational;
}

// Generate video script using OpenAI directly
async function generateVideoScriptWithOpenAI(text: string, videoStyle: string = "educational") {
  try {
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
      
      // Ensure required fields exist with fallbacks
      if (!videoScript.shots || !Array.isArray(videoScript.shots)) {
        videoScript.shots = [];
      }
      if (!videoScript.title) {
        videoScript.title = "Generated Video";
      }
      if (!videoScript.duration) {
        videoScript.duration = 30;
      }
      if (!videoScript.transcript) {
        videoScript.transcript = text;
      }
      if (!videoScript.style) {
        videoScript.style = videoStyle;
      }
      
      console.log("✅ OpenAI video script generation successful");
      return videoScript;
    } else {
      throw new Error("No valid JSON found in OpenAI response");
    }

  } catch (error) {
    console.error("❌ OpenAI video script generation failed:", error);
    throw new Error("OpenAI video script generation failed");
  }
}

// OpenAI content enhancement and analysis
async function enhanceContentWithOpenAI(text: string, videoStyle: string) {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an expert content analyst and video production specialist. Analyze the following text and enhance it for video production.

Text to analyze: "${text}"
Video Style: ${videoStyle}

Your task:
1. Analyze the content structure and identify key points
2. Enhance the content for video storytelling
3. Identify visual opportunities and metaphors
4. Suggest engaging narrative elements
5. Recommend specific visual elements and scenes

Return as JSON:
{
  "enhancedContent": "Enhanced version of the content optimized for video",
  "keyPoints": ["point1", "point2", "point3"],
  "visualOpportunities": ["opportunity1", "opportunity2"],
  "narrativeElements": ["element1", "element2"],
  "recommendedVisuals": ["visual1", "visual2"],
  "contentStructure": "structured analysis of content flow",
  "emotionalTone": "recommended emotional tone",
  "targetAudience": "identified target audience"
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert video content analyst specializing in creating engaging, professional video content. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiResponse = response.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error("No response from OpenAI");
    }

    // Parse the JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      console.log("✅ OpenAI analysis successful");
      return analysis;
    } else {
      throw new Error("No valid JSON found in OpenAI response");
    }

  } catch (error) {
    console.error("❌ OpenAI enhancement failed:", error);
    // Fallback to basic analysis
    return {
      enhancedContent: text,
      keyPoints: text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10),
      visualOpportunities: ["dynamic graphics", "professional presentation"],
      narrativeElements: ["clear structure", "engaging flow"],
      recommendedVisuals: ["charts", "graphics", "animations"],
      contentStructure: "linear presentation",
      emotionalTone: "professional",
      targetAudience: "general audience"
    };
  }
}

// Advanced Nova Pro script generation with OpenAI enhancement
async function generateAdvancedVideoScriptWithNovaPro(text: string, videoStyle: string, openaiAnalysis: EnhancedContentAnalysis) {
  try {
    const client = createBedrockClient();

    const styleGuidelines = getStyleGuidelines(videoStyle);
    
    const prompt = `You are an expert video content creator and visual director specializing in creating highly engaging, visually stunning YouTube videos. 

ENHANCED CONTENT ANALYSIS (from OpenAI):
- Enhanced Content: ${openaiAnalysis.enhancedContent}
- Key Points: ${openaiAnalysis.keyPoints?.join(', ')}
- Visual Opportunities: ${openaiAnalysis.visualOpportunities?.join(', ')}
- Narrative Elements: ${openaiAnalysis.narrativeElements?.join(', ')}
- Recommended Visuals: ${openaiAnalysis.recommendedVisuals?.join(', ')}
- Content Structure: ${openaiAnalysis.contentStructure}
- Emotional Tone: ${openaiAnalysis.emotionalTone}
- Target Audience: ${openaiAnalysis.targetAudience}

Video Style: ${videoStyle}
${styleGuidelines}

CRITICAL REQUIREMENTS - Create VISUALLY STUNNING videos:

1. **Enhanced Content Integration**: Use the OpenAI analysis to create superior video content
2. **Advanced Visual Storytelling**: Create compelling visual narratives with specific scenes
3. **Professional Cinematography**: Specify detailed camera movements, lighting, and composition
4. **Contextual Environments**: Design specific, relevant backgrounds and settings
5. **Dynamic Visual Elements**: Include specific props, graphics, and visual metaphors

Return as JSON:
{
  "title": "Compelling YouTube Title",
  "duration": 30,
  "style": "${videoStyle}",
  "content_analysis": {
    "key_themes": ["theme1", "theme2"],
    "visual_metaphors": ["metaphor1", "metaphor2"],
    "target_audience": "${openaiAnalysis.targetAudience}",
    "emotional_tone": "${openaiAnalysis.emotionalTone}",
    "openai_enhancements": {
      "visual_opportunities": ${JSON.stringify(openaiAnalysis.visualOpportunities)},
      "narrative_elements": ${JSON.stringify(openaiAnalysis.narrativeElements)},
      "recommended_visuals": ${JSON.stringify(openaiAnalysis.recommendedVisuals)}
    }
  },
  "shots": [
    {
      "prompt": "DETAILED visual description incorporating OpenAI insights with specific background, props, camera movement, and scene details",
      "weight": 1.0,
      "description": "What happens in this shot",
      "background": "Specific background environment",
      "visual_elements": ["specific prop 1", "specific prop 2"],
      "camera_movement": "Specific camera technique",
      "lighting": "Specific lighting description"
    }
  ],
  "transcript": "Natural flowing transcript incorporating enhanced content"
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
    const aiResponse = responseBody.content[0].text;

    // Parse the JSON response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const videoScript = JSON.parse(jsonMatch[0]);
      console.log("✅ Advanced Nova Pro script generation successful");
      return videoScript;
    } else {
      throw new Error("No valid JSON found in Nova Pro response");
    }
  } catch (error) {
    console.error("❌ Advanced Nova Pro script generation failed:", error);
    throw new Error("Advanced Nova Pro script generation failed");
  }
}


// Analyze content to suggest relevant visual elements
function analyzeContentForVisuals(text: string) {
  const lowerText = text.toLowerCase();
  
  // Determine background based on content
  let background = "modern professional studio";
  let visualElements = ["dynamic graphics", "professional lighting"];
  let emotionalTone = "professional and engaging";
  
  if (lowerText.includes("science") || lowerText.includes("research") || lowerText.includes("experiment")) {
    background = "modern laboratory with scientific equipment";
    visualElements = ["microscopes", "test tubes", "data charts", "scientific diagrams"];
    emotionalTone = "scientific and precise";
  } else if (lowerText.includes("business") || lowerText.includes("corporate") || lowerText.includes("company")) {
    background = "corporate office with city skyline view";
    visualElements = ["office equipment", "charts", "business graphics", "city buildings"];
    emotionalTone = "corporate and authoritative";
  } else if (lowerText.includes("technology") || lowerText.includes("software") || lowerText.includes("digital")) {
    background = "high-tech workspace with multiple screens";
    visualElements = ["computer screens", "digital displays", "tech gadgets", "code visualizations"];
    emotionalTone = "innovative and cutting-edge";
  } else if (lowerText.includes("health") || lowerText.includes("medical") || lowerText.includes("doctor")) {
    background = "modern medical facility";
    visualElements = ["medical equipment", "health charts", "anatomical models", "medical devices"];
    emotionalTone = "caring and professional";
  } else if (lowerText.includes("education") || lowerText.includes("learning") || lowerText.includes("student")) {
    background = "modern classroom with interactive displays";
    visualElements = ["educational materials", "books", "interactive boards", "learning tools"];
    emotionalTone = "educational and inspiring";
  } else if (lowerText.includes("nature") || lowerText.includes("environment") || lowerText.includes("green")) {
    background = "natural environment with outdoor setting";
    visualElements = ["plants", "natural lighting", "environmental elements", "outdoor scenery"];
    emotionalTone = "natural and calming";
  } else if (lowerText.includes("creative") || lowerText.includes("art") || lowerText.includes("design")) {
    background = "creative studio with artistic elements";
    visualElements = ["art supplies", "design tools", "color palettes", "creative displays"];
    emotionalTone = "creative and inspiring";
  } else if (lowerText.includes("finance") || lowerText.includes("money") || lowerText.includes("investment")) {
    background = "financial trading floor with multiple monitors";
    visualElements = ["financial charts", "trading screens", "market data", "analytical tools"];
    emotionalTone = "professional and analytical";
  } else if (lowerText.includes("food") || lowerText.includes("cooking") || lowerText.includes("recipe")) {
    background = "modern kitchen with professional equipment";
    visualElements = ["cooking utensils", "fresh ingredients", "kitchen appliances", "food presentation"];
    emotionalTone = "warm and appetizing";
  } else if (lowerText.includes("travel") || lowerText.includes("vacation") || lowerText.includes("tourism")) {
    background = "travel destination with scenic views";
    visualElements = ["travel maps", "suitcases", "camera equipment", "destination landmarks"];
    emotionalTone = "adventurous and exciting";
  }
  
  return {
    background,
    visualElements,
    key_themes: extractThemes(text),
    visual_metaphors: generateVisualMetaphors(text),
    target_audience: determineTargetAudience(text),
    emotional_tone: emotionalTone
  };
}

// Get visual context for individual sentences
function getVisualContextForSentence(sentence: string) {
  const lowerSentence = sentence.toLowerCase();
  
  if (lowerSentence.includes("chart") || lowerSentence.includes("graph") || lowerSentence.includes("data")) {
    return {
      scene: "Data visualization with animated charts and graphs",
      background: "modern data center with screens",
      elements: ["animated charts", "data visualizations", "graphs", "analytics displays"],
      cameraMovement: "dynamic tracking shot",
      lighting: "cool blue lighting"
    };
  } else if (lowerSentence.includes("process") || lowerSentence.includes("step")) {
    return {
      scene: "Process demonstration with visual workflow",
      background: "professional workspace",
      elements: ["workflow diagrams", "process steps", "interactive elements"],
      cameraMovement: "smooth panning",
      lighting: "warm professional lighting"
    };
  } else if (lowerSentence.includes("result") || lowerSentence.includes("outcome")) {
    return {
      scene: "Results presentation with visual impact",
      background: "presentation room with large displays",
      elements: ["results graphics", "impact visualizations", "success indicators"],
      cameraMovement: "dramatic reveal",
      lighting: "dramatic spotlight"
    };
  } else if (lowerSentence.includes("technology") || lowerSentence.includes("software")) {
    return {
      scene: "Technology demonstration with modern interface",
      background: "high-tech lab with multiple screens",
      elements: ["software interfaces", "code displays", "digital animations", "tech gadgets"],
      cameraMovement: "smooth zoom and pan",
      lighting: "cool white lighting"
    };
  } else if (lowerSentence.includes("business") || lowerSentence.includes("corporate")) {
    return {
      scene: "Business presentation with professional graphics",
      background: "corporate boardroom with city view",
      elements: ["business charts", "corporate graphics", "office equipment", "city skyline"],
      cameraMovement: "steady professional tracking",
      lighting: "warm corporate lighting"
    };
  } else if (lowerSentence.includes("education") || lowerSentence.includes("learning")) {
    return {
      scene: "Educational content with interactive elements",
      background: "modern classroom with smart boards",
      elements: ["educational graphics", "interactive displays", "learning materials", "books"],
      cameraMovement: "gentle educational movement",
      lighting: "bright educational lighting"
    };
  } else if (lowerSentence.includes("health") || lowerSentence.includes("medical")) {
    return {
      scene: "Healthcare information with medical visuals",
      background: "modern medical facility",
      elements: ["medical charts", "health graphics", "medical equipment", "anatomical models"],
      cameraMovement: "clinical steady movement",
      lighting: "clean medical lighting"
    };
  } else if (lowerSentence.includes("creative") || lowerSentence.includes("art")) {
    return {
      scene: "Creative presentation with artistic elements",
      background: "creative studio with artistic ambiance",
      elements: ["art supplies", "creative graphics", "design tools", "color palettes"],
      cameraMovement: "dynamic creative movement",
      lighting: "warm creative lighting"
    };
  } else {
    return {
      scene: "Content presentation with relevant visuals",
      background: "professional studio",
      elements: ["content graphics", "visual aids", "supporting imagery"],
      cameraMovement: "smooth camera movement",
      lighting: "professional lighting"
    };
  }
}

// Extract key themes from text
function extractThemes(text: string): string[] {
  const themes: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("innovation") || lowerText.includes("technology")) themes.push("innovation");
  if (lowerText.includes("growth") || lowerText.includes("development")) themes.push("growth");
  if (lowerText.includes("success") || lowerText.includes("achievement")) themes.push("success");
  if (lowerText.includes("future") || lowerText.includes("trend")) themes.push("future");
  if (lowerText.includes("solution") || lowerText.includes("problem")) themes.push("solutions");
  
  return themes.length > 0 ? themes : ["professional", "informative"];
}

// Generate visual metaphors
function generateVisualMetaphors(text: string): string[] {
  const metaphors: string[] = [];
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("growth") || lowerText.includes("increase")) metaphors.push("growing tree or upward arrow");
  if (lowerText.includes("connection") || lowerText.includes("network")) metaphors.push("network diagram or connected nodes");
  if (lowerText.includes("balance") || lowerText.includes("equilibrium")) metaphors.push("scales or balanced elements");
  if (lowerText.includes("flow") || lowerText.includes("stream")) metaphors.push("flowing water or smooth transitions");
  if (lowerText.includes("innovation") || lowerText.includes("breakthrough")) metaphors.push("light bulb or rocket launch");
  if (lowerText.includes("collaboration") || lowerText.includes("teamwork")) metaphors.push("handshake or puzzle pieces");
  if (lowerText.includes("security") || lowerText.includes("protection")) metaphors.push("shield or lock");
  if (lowerText.includes("speed") || lowerText.includes("fast")) metaphors.push("racing car or lightning bolt");
  
  return metaphors.length > 0 ? metaphors : ["professional presentation", "dynamic visuals"];
}

// Determine target audience based on content
function determineTargetAudience(text: string): string {
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes("student") || lowerText.includes("education") || lowerText.includes("learning")) {
    return "students and educators";
  } else if (lowerText.includes("business") || lowerText.includes("corporate") || lowerText.includes("professional")) {
    return "business professionals";
  } else if (lowerText.includes("developer") || lowerText.includes("programming") || lowerText.includes("coding")) {
    return "software developers";
  } else if (lowerText.includes("marketing") || lowerText.includes("advertising") || lowerText.includes("promotion")) {
    return "marketing professionals";
  } else if (lowerText.includes("finance") || lowerText.includes("investment") || lowerText.includes("trading")) {
    return "financial professionals";
  } else if (lowerText.includes("health") || lowerText.includes("medical") || lowerText.includes("wellness")) {
    return "healthcare professionals";
  } else if (lowerText.includes("creative") || lowerText.includes("art") || lowerText.includes("design")) {
    return "creative professionals";
  } else if (lowerText.includes("science") || lowerText.includes("research") || lowerText.includes("technology")) {
    return "scientists and researchers";
  } else {
    return "general audience";
  }
}

// Extract title from text for video
function extractTitleFromText(text: string): string {
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
  
  return "Generated Video";
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
