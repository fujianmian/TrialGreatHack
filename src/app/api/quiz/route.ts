import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const questionCount = body.questionCount || 5;
    const difficulty = body.difficulty || "Beginner";

    if (!text.trim()) {
      return NextResponse.json({ error: "Article content cannot be empty" }, { status: 400 });
    }

    // Try AI generation first, fallback to algorithm
    let questions;
    try {
      console.log("🤖 Attempting AWS Bedrock AI generation for quiz...");
      questions = await generateAIQuiz(text, questionCount, difficulty);
      console.log("✅ AI generation successful, generated", questions.length, "quiz questions");
    } catch (aiError) {
      console.warn("⚠️ AI generation failed, using fallback:", aiError instanceof Error ? aiError.message : String(aiError));
      console.log("🔄 Switching to algorithm-based generation...");
      questions = generateQuiz(text, questionCount, difficulty);
      console.log("✅ Fallback generation complete, generated", questions.length, "quiz questions");
    }

    return NextResponse.json({ result: questions });

  } catch (error: unknown) {
    console.error("Error generating quiz:", error);
    
    return NextResponse.json({ 
      error: `Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Generate quiz questions from text content - simple algorithm
function generateQuiz(text: string, questionCount: number, difficulty: string) {
  const questions: Array<{id: number, question: string, options: string[], correctAnswer: number, explanation: string, category: string}> = [];
  
  // Extract sentences for question generation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length === 0) {
    return questions;
  }

  // Generate the exact requested number of questions
  for (let i = 0; i < questionCount; i++) {
    // Cycle through sentences if we need more questions than sentences
    const sentenceIndex = i % sentences.length;
    const sentence = sentences[sentenceIndex].trim();
    
    if (sentence.length < 10) continue;
    
    // Extract key terms from the sentence
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !isUnimportantWord(word));
    
    if (words.length === 0) continue;
    
    const keyWord = words[Math.floor(Math.random() * words.length)];
    
    // Create different question types based on difficulty
    let question, options, explanation, category;
    
    if (difficulty === 'Beginner') {
      question = `What is the main concept related to "${keyWord}" in the text?`;
      options = [
        `The concept involves ${keyWord} and its applications`,
        `It's a technical term related to ${keyWord}`,
        `The text discusses ${keyWord} in detail`,
        `It refers to the importance of ${keyWord}`
      ];
      explanation = `The text discusses ${keyWord} and its relevance to the main topic.`;
      category = "General";
    } else if (difficulty === 'Intermediate') {
      question = `How does "${keyWord}" relate to the overall topic discussed?`;
      options = [
        `${keyWord} is a fundamental concept that supports the main ideas`,
        `${keyWord} provides context for understanding the broader subject`,
        `${keyWord} is mentioned as an example of the main concepts`,
        `${keyWord} helps explain the key principles in the text`
      ];
      explanation = `The text uses ${keyWord} to illustrate and support the main concepts being discussed.`;
      category = "Conceptual";
    } else { // Advanced
      question = `What is the significance of "${keyWord}" in the context of this content?`;
      options = [
        `${keyWord} represents a critical component that enables the main functionality`,
        `${keyWord} serves as a foundational element for the advanced concepts`,
        `${keyWord} demonstrates the complexity of the subject matter`,
        `${keyWord} illustrates the practical application of theoretical principles`
      ];
      explanation = `The text positions ${keyWord} as a key element that demonstrates the depth and complexity of the subject matter.`;
      category = "Advanced";
    }
    
    questions.push({
      id: i + 1,
      question: question,
      options: options,
      correctAnswer: 0,
      explanation: explanation,
      category: category
    });
  }
  
  return questions;
}

function isUnimportantWord(word: string): boolean {
  const unimportantWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
    'would', 'could', 'should', 'may', 'might', 'can', 'must', 'shall',
    'from', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'up', 'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
    'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
    'now', 'helpful'
  ]);
  return unimportantWords.has(word.toLowerCase());
}

// AI-powered quiz generation using AWS Bedrock
async function generateAIQuiz(text: string, questionCount: number, difficulty: string) {
  console.log("🤖 Attempting AWS Bedrock AI generation for quiz...");
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
    
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    const prompt = `Please analyze the following text and create exactly ${questionCount} quiz questions for testing understanding at ${difficulty} level.

Focus on creating questions that test:
- Key concepts and main ideas
- Important details and facts
- Understanding of relationships between concepts
- Application of knowledge

For each question:
- Create a clear, well-formatted question
- Provide 4 multiple choice options (A, B, C, D)
- Mark the correct answer (0-3 index)
- Provide a detailed explanation of why the answer is correct
- Assign an appropriate category (e.g., "General", "Technical", "Conceptual")

Return as JSON array:
[
  {
    "id": 1,
    "question": "Clear, well-formatted question here?",
    "options": [
      "Option A",
      "Option B", 
      "Option C",
      "Option D"
    ],
    "correctAnswer": 0,
    "explanation": "Detailed explanation of why this answer is correct and what the other options represent.",
    "category": "General"
  }
]

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
              maxTokens: 3000,
              temperature: 0.3
            }
          };
        } else {
          // Anthropic Claude format
          requestBody = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 3000,
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
          const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const questions = JSON.parse(jsonMatch[0]);
            
            // Validate and clean the response, limit to requested count
            return questions.slice(0, questionCount).map((question: {question?: string, options?: string[], correctAnswer?: number, explanation?: string, category?: string}, index: number) => ({
              id: index + 1,
              question: question.question || `Question ${index + 1}`,
              options: question.options || ["Option A", "Option B", "Option C", "Option D"],
              correctAnswer: question.correctAnswer || 0,
              explanation: question.explanation || "No explanation available",
              category: question.category || "General"
            }));
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
