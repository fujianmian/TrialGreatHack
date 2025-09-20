import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Article content cannot be empty" }, { status: 400 });
    }

    // Try AI generation first, fallback to algorithm
    let questions;
    try {
      console.log("🤖 Attempting AWS Bedrock AI generation for quiz...");
      questions = await generateAIQuiz(text);
      console.log("✅ AI generation successful, generated", questions.length, "quiz questions");
    } catch (aiError) {
      console.warn("⚠️ AI generation failed, using fallback:", aiError instanceof Error ? aiError.message : String(aiError));
      console.log("🔄 Switching to algorithm-based generation...");
      questions = generateQuiz(text);
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
function generateQuiz(text: string) {
  const questions: any[] = [];
  
  // Extract sentences for question generation
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  
  if (sentences.length === 0) {
    return questions;
  }

  // Generate 5-8 questions based on content
  const numQuestions = Math.min(8, Math.max(5, Math.floor(sentences.length / 2)));
  
  for (let i = 0; i < numQuestions; i++) {
    const sentenceIndex = Math.floor((i / numQuestions) * sentences.length);
    const sentence = sentences[sentenceIndex].trim();
    
    if (sentence.length < 10) continue;
    
    // Extract key terms from the sentence
    const words = sentence.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !isUnimportantWord(word));
    
    if (words.length === 0) continue;
    
    const keyWord = words[Math.floor(Math.random() * words.length)];
    const question = `What is the main concept related to "${keyWord}" in the text?`;
    
    // Generate options
    const options = [
      `The concept involves ${keyWord} and its applications`,
      `It's a technical term related to ${keyWord}`,
      `The text discusses ${keyWord} in detail`,
      `It refers to the importance of ${keyWord}`
    ];
    
    questions.push({
      id: i + 1,
      question: question,
      options: options,
      correctAnswer: 0,
      explanation: `The text discusses ${keyWord} and its relevance to the main topic.`,
      category: "General"
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
async function generateAIQuiz(text: string) {
  console.log("🤖 Attempting AWS Bedrock AI generation for quiz...");
  
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

    const prompt = `Please analyze the following text and create 6-8 quiz questions for testing understanding.

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

    const input = {
      modelId: 'anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2023-05-31',
        max_tokens: 3000,
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

    console.log("✅ AWS Bedrock response received for quiz");

    // Parse the JSON response
    try {
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[0]);
        
        // Validate and clean the response
        return questions.map((question: any, index: number) => ({
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

  } catch (awsError) {
    console.log("❌ AWS Bedrock error:", awsError);
    throw new Error(`AWS Bedrock error: ${awsError instanceof Error ? awsError.message : 'Unknown error'}`);
  }
}
