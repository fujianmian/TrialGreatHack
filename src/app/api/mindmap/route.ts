import { NextResponse } from "next/server";
import { createBedrockClient } from '@/lib/bedrock';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
    }

    // Try AI generation first, fallback to algorithm
    let mindMap;
    try {
      console.log("🤖 Attempting AWS Bedrock AI mind map generation...");
      mindMap = await generateAIMindMap(text);
      console.log("✅ AI mind map generation successful");
    } catch (aiError) {
      console.warn("⚠️ AI mind map generation failed, using fallback:", aiError instanceof Error ? aiError.message : String(aiError));
      console.log("🔄 Switching to algorithm-based mind map generation...");
      mindMap = generateMindMap(text);
      console.log("✅ Fallback mind map generation complete");
    }

    return NextResponse.json({ result: mindMap });

  } catch (error: unknown) {
    console.error("Error generating mind map:", error);
    
    return NextResponse.json({ 
      error: `Failed to generate mind map: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Generate mind map using algorithm
function generateMindMap(text: string) {
  const sentences = text.split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15);

  if (sentences.length === 0) {
    return {
      nodes: [],
      connections: [],
      title: "Empty Mind Map"
    };
  }

  // Extract key concepts and create nodes
  const nodes: Array<{id: string, label: string, level: number, x?: number, y?: number}> = [];
  const connections: Array<{from: string, to: string, strength: number}> = [];
  
  // Main topic (first sentence or extracted from text)
  const mainTopic = extractMainTopic(text);
  const mainNode = {
    id: 'main',
    label: mainTopic,
    x: 300,
    y: 150,
    level: 0
  };
  nodes.push(mainNode);

  // Extract key concepts from sentences
  const keyConcepts = extractKeyConcepts(sentences);
  
  // Create level 1 nodes (primary branches)
  const level1Nodes = keyConcepts.slice(0, 4).map((concept, index) => {
    const angle = (index * 90) - 135; // Spread around the main node
    const radius = 120;
    const x = 300 + radius * Math.cos(angle * Math.PI / 180);
    const y = 150 + radius * Math.sin(angle * Math.PI / 180);
    
    const node = {
      id: `level1_${index}`,
      label: concept,
      x: Math.max(50, Math.min(650, x - 64)), // Keep within bounds
      y: Math.max(50, Math.min(300, y - 32)),
      level: 1
    };
    
    connections.push({ from: 'main', to: node.id, strength: 1 });
    
    return node;
  });
  
  nodes.push(...level1Nodes);

  // Create level 2 nodes (secondary branches) for some level 1 nodes
  level1Nodes.slice(0, 2).forEach((parentNode, parentIndex) => {
    const subConcepts = extractSubConcepts(sentences, parentNode.label);
    subConcepts.slice(0, 2).forEach((concept, index) => {
      const angle = (index * 60) - 30; // Spread around the parent node
      const radius = 80;
      const x = parentNode.x + 64 + radius * Math.cos(angle * Math.PI / 180);
      const y = parentNode.y + 32 + radius * Math.sin(angle * Math.PI / 180);
      
      const node = {
        id: `level2_${parentIndex}_${index}`,
        label: concept,
        x: Math.max(50, Math.min(650, x - 64)),
        y: Math.max(50, Math.min(300, y - 32)),
        level: 2
      };
      
      connections.push({ from: parentNode.id, to: node.id, strength: 1 });
      
      nodes.push(node);
    });
  });

  return {
    nodes,
    connections,
    title: mainTopic
  };
}

// Extract main topic from text
function extractMainTopic(text: string): string {
  // Try to find the first sentence or extract key terms
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  
  if (sentences.length > 0) {
    const firstSentence = sentences[0];
    // Extract key terms from first sentence
    const words = firstSentence.split(' ').filter(word => 
      word.length > 4 && 
      !isCommonWord(word) &&
      !isStopWord(word)
    );
    
    if (words.length > 0) {
      return words.slice(0, 3).join(' ');
    }
    
    return firstSentence.length > 30 ? firstSentence.substring(0, 30) + '...' : firstSentence;
  }
  
  return "Main Topic";
}

// Extract key concepts from sentences
function extractKeyConcepts(sentences: string[]): string[] {
  const concepts: string[] = [];
  
  sentences.forEach(sentence => {
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 4 && 
        !isCommonWord(word) &&
        !isStopWord(word) &&
        !isUnimportantWord(word)
      );
    
    // Find meaningful concepts
    const meaningfulWords = words.filter(word => 
      word.length > 5 || 
      word.match(/^[A-Z]/) ||
      concepts.some(c => c.toLowerCase().includes(word))
    );
    
    concepts.push(...meaningfulWords.slice(0, 2));
  });
  
  // Remove duplicates and return top concepts
  return [...new Set(concepts)].slice(0, 6);
}

// Extract sub-concepts related to a parent concept
function extractSubConcepts(sentences: string[], parentConcept: string): string[] {
  const relatedSentences = sentences.filter(s => 
    s.toLowerCase().includes(parentConcept.toLowerCase())
  );
  
  const subConcepts: string[] = [];
  
  relatedSentences.forEach(sentence => {
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        word !== parentConcept.toLowerCase() &&
        !isCommonWord(word) &&
        !isStopWord(word)
      );
    
    subConcepts.push(...words.slice(0, 2));
  });
  
  return [...new Set(subConcepts)].slice(0, 3);
}

// AI-powered mind map generation using AWS Bedrock
async function generateAIMindMap(text: string) {
  console.log("🤖 Attempting AWS Bedrock AI mind map generation...");
  console.log("🔍 Environment check:");
  console.log("AWS_REGION:", process.env.AWS_REGION);
  console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "✅ Set" : "❌ Not set");
  console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "✅ Set" : "❌ Not set");
  
  // List of models to try in order of preference
  // Using Amazon Nova Pro as primary model with fallbacks
  const modelsToTry = [
    'amazon.nova-pro-v1:0',
    'amazon.nova-lite-v1:0',
    'anthropic.claude-3-haiku-20240307-v1:0',
    'anthropic.claude-3-sonnet-20240229-v1:0'
  ];
  
  console.log("🎯 Models to try:", modelsToTry);
  
  try {
    // Dynamic import to handle potential module not found errors
    const { BedrockRuntimeClient, InvokeModelCommand } = await import('@aws-sdk/client-bedrock-runtime');
    
    const client = createBedrockClient();

    const prompt = `Please analyze the following text and create a mind map structure.

Requirements:
- Extract the main topic and key concepts
- Organize concepts into hierarchical levels (0-5)
- Create relationships between concepts
- Generate a JSON structure for visualization

Return as JSON:
{
  "title": "Main topic title",
  "nodes": [
    {
      "id": "unique_id",
      "text": "concept text",
      "x": 300,
      "y": 150,
      "level": 0,
      "parent": "parent_id",
      "children": ["child_id1", "child_id2"]
    }
  ],
  "connections": [
    {
      "from": "node_id_1",
      "to": "node_id_2"
    }
  ]
}

Text to analyze:
${text}`;

    // Try each model until one works
    for (const modelId of modelsToTry) {
      try {
        console.log(`🔄 Trying model: ${modelId}`);
        
        // Different request format for Amazon Nova vs Anthropic Claude
        let requestBody;
        if (modelId.startsWith('amazon.nova')) {
          // Amazon Nova format - content must be array of objects with text property
          requestBody = {
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
              maxTokens: 1500,
              temperature: 0.3
            }
          };
        } else {
          // Anthropic Claude format
          requestBody = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 1500,
            temperature: 0.3,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          };
        }

        const input = {
          modelId: modelId,
          contentType: 'application/json',
          accept: 'application/json',
          body: JSON.stringify(requestBody)
        };

        const command = new InvokeModelCommand(input);
        const response = await client.send(command);
        
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        
        // Different response format for Amazon Nova vs Anthropic Claude
        let aiResponse;
        if (modelId.startsWith('amazon.nova')) {
          // Amazon Nova format
          aiResponse = responseBody.output.message.content[0].text;
        } else {
          // Anthropic Claude format
          aiResponse = responseBody.content[0].text;
        }

        console.log(`✅ AWS Bedrock response received from ${modelId}`);

        // Parse the JSON response
        try {
          const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const mindMapData = JSON.parse(jsonMatch[0]);
            return mindMapData;
          } else {
            throw new Error("No valid JSON found in AI response");
          }
        } catch (parseError) {
          console.error("Failed to parse AI response:", parseError);
          throw new Error("Failed to parse AI response");
        }
        
      } catch (modelError) {
        const errorMessage = modelError instanceof Error ? modelError.message : String(modelError);
        console.warn(`❌ Model ${modelId} failed:`, errorMessage);
        
        // Provide helpful guidance based on the error
        if (errorMessage.includes("don't have access")) {
          console.log("💡 TIP: You don't have access to this model. Try:");
          console.log("   1. Check your AWS Bedrock model access in the AWS Console");
          if (modelId.includes('nova')) {
            console.log("   2. Request access to Amazon Nova models in AWS Bedrock");
          } else {
            console.log("   2. Request access to Claude models in AWS Bedrock");
          }
          console.log("   3. Verify your AWS credentials have the necessary permissions");
        } else if (errorMessage.includes("invalid")) {
          console.log("💡 TIP: Model identifier is invalid. This might be a temporary issue or the model ID has changed.");
          if (modelId.includes('nova')) {
            console.log("   Nova Pro model ID: amazon.nova-pro-v1:0");
            console.log("   Nova Lite model ID: amazon.nova-lite-v1:0");
          }
        }
        
        // Log detailed error information for debugging
        if (modelError instanceof Error) {
          console.log("Error details:", {
            name: modelError.name,
            message: modelError.message
          });
        }
        
        if (modelId === modelsToTry[modelsToTry.length - 1]) {
          // If this was the last model, throw the error with helpful message
          throw new Error(`All AI models failed. Last error: ${errorMessage}. Please check your AWS Bedrock access and permissions.`);
        }
        // Otherwise, continue to the next model
        continue;
      }
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

function isUnimportantWord(word: string): boolean {
  const unimportantWords = new Set([
    'small', 'big', 'large', 'good', 'bad', 'new', 'old', 'long', 'short', 
    'high', 'low', 'fast', 'slow', 'hot', 'cold', 'warm', 'cool', 'easy', 
    'hard', 'soft', 'light', 'dark', 'bright', 'clean', 'dirty', 
    'fresh', 'dry', 'wet', 'thick', 'thin', 'wide', 'narrow', 'deep', 'shallow',
    'strong', 'weak', 'heavy', 'light', 'full', 'empty', 'open', 'closed',
    'right', 'wrong', 'true', 'false', 'real', 'fake', 'same', 'different',
    'first', 'last', 'next', 'previous', 'early', 'late', 'quick', 'slow',
    'simple', 'complex', 'basic', 'advanced', 'normal', 'special', 'usual',
    'common', 'rare', 'popular', 'famous', 'important', 'useful', 'helpful'
  ]);
  return unimportantWords.has(word.toLowerCase());
}
