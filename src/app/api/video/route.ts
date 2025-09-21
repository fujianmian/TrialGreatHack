import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const videoStyle = body.style || "educational"; // Default style

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    // Try Nova Reel video generation first, fallback to slides
    let video;
    try {
      console.log("🎬 Attempting Nova Reel video generation...");
      video = await generateNovaReelVideo(text, videoStyle);
      console.log("✅ Nova Reel video generation successful");
    } catch (novaError) {
      console.warn("⚠️ Nova Reel video generation failed, using slides fallback:", novaError instanceof Error ? novaError.message : String(novaError));
      console.log("🔄 Switching to slides-based video generation...");
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
  const slides: Array<{id: number, title: string, content: string, duration: number, type: string}> = [];
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

// Enhanced Nova Reel video generation with Nova Pro content analysis
async function generateNovaReelVideo(text: string, videoStyle: string = "educational") {
  console.log("🎬 Attempting enhanced Nova Reel video generation...");
  
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

    // First, use Nova Pro to analyze content and create engaging video script
    console.log("🤖 Analyzing content with Nova Pro...");
    const videoScript = await generateVideoScriptWithNovaPro(client, text, videoStyle);
    
    console.log("🎬 Generating engaging video with Nova Reel...");
    
    // Create enhanced video generation request for Nova Reel with specific visual details
    const videoRequest = {
      text_prompts: videoScript.shots.map((shot, index) => ({
        text: `Shot ${index + 1}: ${shot.prompt}. Background: ${shot.background || 'professional studio'}. Visual elements: ${shot.visual_elements?.join(', ') || 'dynamic graphics'}. Camera: ${shot.camera_movement || 'smooth tracking'}. Lighting: ${shot.lighting || 'professional lighting'}`,
        weight: shot.weight || 1.0
      })),
      duration: videoScript.duration,
      output_format: "mp4",
      quality: "high",
      style: videoScript.style,
      aspect_ratio: "16:9", // YouTube standard
      motion_intensity: "high", // More dynamic movement
      camera_movement: "dynamic",
      background_type: "contextual", // Use contextual backgrounds
      visual_complexity: "detailed" // More detailed visuals
    };

    const input = {
      modelId: 'amazon.nova-reel-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(videoRequest)
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log("✅ Enhanced Nova Reel response received");

    // Extract video information from Nova Reel response
    if (responseBody.video_url || responseBody.s3_location) {
      const videoUrl = responseBody.video_url || responseBody.s3_location;
      
      return {
        title: videoScript.title,
        videoUrl: videoUrl,
        duration: videoScript.duration,
        type: 'nova_reel_video',
        transcript: videoScript.transcript,
        slides: [], // Empty for actual video
        style: videoScript.style,
        shots: videoScript.shots
      };
    } else {
      throw new Error("No video URL found in Nova Reel response");
    }

  } catch (novaError) {
    console.log("❌ Nova Reel error:", novaError);
    throw new Error(`Nova Reel error: ${novaError instanceof Error ? novaError.message : 'Unknown error'}`);
  }
}

// Use Nova Pro to generate engaging video script
async function generateVideoScriptWithNovaPro(client: any, text: string, videoStyle: string = "educational") {
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
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 2000,
      temperature: 0.7,
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
    // Fallback to simple script generation
    return generateFallbackVideoScript(text);
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

// Enhanced fallback video script generation with specific visual elements
function generateFallbackVideoScript(text: string) {
  const title = extractTitleFromText(text);
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 20);
  
  // Analyze content to suggest relevant backgrounds and visuals
  const contentAnalysis = analyzeContentForVisuals(text);
  
  const shots = [
    {
      prompt: `Dynamic opening shot: Professional presenter in ${contentAnalysis.background} with animated title graphics showing "${title}". Camera slowly zooms in with cinematic lighting, ${contentAnalysis.visualElements.join(', ')} in the background.`,
      weight: 1.0,
      description: "Opening title sequence",
      background: contentAnalysis.background,
      visual_elements: contentAnalysis.visualElements,
      camera_movement: "slow zoom in",
      lighting: "cinematic lighting"
    },
    ...sentences.slice(0, 3).map((sentence, index) => {
      const visualContext = getVisualContextForSentence(sentence);
      return {
        prompt: `Shot ${index + 2}: ${visualContext.scene} showing "${sentence.substring(0, 50)}..." with ${visualContext.cameraMovement}, ${visualContext.background}, and ${visualContext.lighting}. Features ${visualContext.elements.join(', ')}.`,
        weight: 1.0,
        description: `Content section ${index + 1}`,
        background: visualContext.background,
        visual_elements: visualContext.elements,
        camera_movement: visualContext.cameraMovement,
        lighting: visualContext.lighting
      };
    }),
    {
      prompt: `Closing shot: Professional conclusion in ${contentAnalysis.background} with animated graphics, call-to-action elements, and smooth camera pull-back revealing ${contentAnalysis.visualElements.join(', ')} in the complete scene.`,
      weight: 1.0,
      description: "Conclusion",
      background: contentAnalysis.background,
      visual_elements: contentAnalysis.visualElements,
      camera_movement: "smooth pull-back",
      lighting: "professional lighting"
    }
  ];

  return {
    title,
    duration: shots.length * 6,
    style: "educational",
    content_analysis: contentAnalysis,
    shots,
    transcript: text
  };
}

// Analyze content to suggest relevant visual elements
function analyzeContentForVisuals(text: string) {
  const lowerText = text.toLowerCase();
  
  // Determine background based on content
  let background = "modern professional studio";
  let visualElements = ["dynamic graphics", "professional lighting"];
  
  if (lowerText.includes("science") || lowerText.includes("research") || lowerText.includes("experiment")) {
    background = "modern laboratory with scientific equipment";
    visualElements = ["microscopes", "test tubes", "data charts", "scientific diagrams"];
  } else if (lowerText.includes("business") || lowerText.includes("corporate") || lowerText.includes("company")) {
    background = "corporate office with city skyline view";
    visualElements = ["office equipment", "charts", "business graphics", "city buildings"];
  } else if (lowerText.includes("technology") || lowerText.includes("software") || lowerText.includes("digital")) {
    background = "high-tech workspace with multiple screens";
    visualElements = ["computer screens", "digital displays", "tech gadgets", "code visualizations"];
  } else if (lowerText.includes("health") || lowerText.includes("medical") || lowerText.includes("doctor")) {
    background = "modern medical facility";
    visualElements = ["medical equipment", "health charts", "anatomical models", "medical devices"];
  } else if (lowerText.includes("education") || lowerText.includes("learning") || lowerText.includes("student")) {
    background = "modern classroom with interactive displays";
    visualElements = ["educational materials", "books", "interactive boards", "learning tools"];
  } else if (lowerText.includes("nature") || lowerText.includes("environment") || lowerText.includes("green")) {
    background = "natural environment with outdoor setting";
    visualElements = ["plants", "natural lighting", "environmental elements", "outdoor scenery"];
  }
  
  return {
    background,
    visualElements,
    key_themes: extractThemes(text),
    visual_metaphors: generateVisualMetaphors(text),
    target_audience: "general audience",
    emotional_tone: "professional and engaging"
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
  
  return metaphors.length > 0 ? metaphors : ["professional presentation", "dynamic visuals"];
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
