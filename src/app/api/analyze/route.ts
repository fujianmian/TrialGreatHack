import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Article content cannot be empty" }, { status: 400 });
    }

    // Try AI generation first, fallback to algorithm
    let flashcards;
    try {
      console.log("🤖 Attempting AWS Bedrock AI generation...");
      flashcards = await generateAIFlashcards(text);
      console.log("✅ AI generation successful, generated", flashcards.length, "flashcards");
    } catch (aiError) {
      console.warn("⚠️ AI generation failed, using fallback:", aiError instanceof Error ? aiError.message : String(aiError));
      console.log("🔄 Switching to algorithm-based generation...");
      flashcards = generateFlashcards(text);
      console.log("✅ Fallback generation complete, generated", flashcards.length, "flashcards");
    }

    return NextResponse.json({ result: flashcards });

  } catch (error: unknown) {
    console.error("Error generating flashcards:", error);
    
    return NextResponse.json({ 
      error: `Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Generate flashcards from text content - simple word extraction
function generateFlashcards(text: string) {
  const flashcards: Array<{id: number, front: string, back: string, category: string}> = [];
  
  // Extract meaningful words from the text
  const words = extractMeaningfulWords(text);
  
  // Create flashcards for each word
  words.forEach((word, index) => {
    const context = findWordContext(word, text);
    flashcards.push({
      id: index + 1,
      front: word, // Just the word for quick memorization
      back: context || `"${word}" is mentioned in the text as an important term.`,
      category: "Definition"
    });
  });
  
  return flashcards.slice(0, 10); // Return up to 10 flashcards
}

// Extract meaningful words from text - focus on important terms
function extractMeaningfulWords(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 5 && // Longer words are usually more important
      !word.match(/^[0-9]+$/) && 
      !isStopWord(word) &&
      !isCommonWord(word) &&
      !isUnimportantWord(word) // Filter out unimportant words
    );
  
  const wordCount = new Map();
  words.forEach((word) => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  // Prioritize words that appear multiple times or are longer (more important)
  const meaningfulWords = Array.from(wordCount.entries())
    .filter(([word, count]) => count > 0)
    .sort((a, b) => {
      // Sort by frequency first, then by length (longer words are more important)
      if (b[1] !== a[1]) return b[1] - a[1];
      return b[0].length - a[0].length;
    })
    .slice(0, 10)
    .map(([word]) => word);
  
  return meaningfulWords;
}

// Find the context/meaning of a word from the text
function findWordContext(word: string, text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  // Find the best sentence that contains this word and provides meaningful context
  const contextSentences = sentences.filter(s => 
    s.toLowerCase().includes(word.toLowerCase())
  );
  
  if (contextSentences.length > 0) {
    // Choose the sentence that's most informative (longer and more detailed)
    const bestSentence = contextSentences.reduce((best, current) => 
      current.length > best.length ? current : best
    );
    
    // Extract a more specific explanation
    const words = bestSentence.split(' ');
    const wordIndex = words.findIndex(w => w.toLowerCase().includes(word.toLowerCase()));
    
    if (wordIndex !== -1) {
      // Get context around the word (3 words before and after)
      const start = Math.max(0, wordIndex - 3);
      const end = Math.min(words.length, wordIndex + 4);
      const context = words.slice(start, end).join(' ');
      
      return `In context: "${context.trim()}"`;
    }
    
    return `As described: "${bestSentence.trim()}"`;
  }
  
  // If no specific context found, create a more meaningful explanation
  const wordCount = text.toLowerCase().split(word.toLowerCase()).length - 1;
  if (wordCount > 1) {
    return `"${word}" is a key concept mentioned ${wordCount} times in the text, indicating its importance to the topic.`;
  }
  
  return `"${word}" is an important term that appears in this content.`;
}

// Check if word is a stop word
function isStopWord(word: string): boolean {
  const stopWords = new Set([
    'this', 'that', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'each', 
    'which', 'their', 'time', 'will', 'about', 'there', 'could', 'other', 'after', 
    'first', 'well', 'also', 'where', 'much', 'some', 'these', 'would', 'every', 
    'through', 'during', 'before', 'between', 'without', 'within', 'around', 'among'
  ]);
  return stopWords.has(word.toLowerCase());
}

// Check if word is a common word that shouldn't be a concept
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

// Check if word is unimportant (common adjectives, basic words)
function isUnimportantWord(word: string): boolean {
  const unimportantWords = new Set([
    'small', 'big', 'large', 'good', 'bad', 'new', 'old', 'long', 'short', 
    'high', 'low', 'fast', 'slow', 'hot', 'cold', 'warm', 'cool', 'easy', 
    'hard', 'soft', 'hard', 'light', 'dark', 'bright', 'clean', 'dirty', 
    'fresh', 'dry', 'wet', 'thick', 'thin', 'wide', 'narrow', 'deep', 'shallow',
    'strong', 'weak', 'heavy', 'light', 'full', 'empty', 'open', 'closed',
    'right', 'wrong', 'true', 'false', 'real', 'fake', 'same', 'different',
    'first', 'last', 'next', 'previous', 'early', 'late', 'quick', 'slow',
    'simple', 'complex', 'basic', 'advanced', 'normal', 'special', 'usual',
    'common', 'rare', 'popular', 'famous', 'important', 'useful', 'helpful'
  ]);
  return unimportantWords.has(word.toLowerCase());
}


// AI-powered flashcard generation using AWS Bedrock
async function generateAIFlashcards(text: string) {
  console.log("🤖 Attempting AWS Bedrock AI generation...");
  
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

    const prompt = `Please analyze the following text and create 8-10 flashcards for quick memorization.

Focus on IMPORTANT and MEANINGFUL terms only. Avoid common adjectives like "small", "big", "good", "bad" etc.
Prioritize:
- Technical terms and concepts
- Key nouns and important words
- Terms that are central to the topic
- Words that appear multiple times
- Longer, more specific terms

For each flashcard:
- Front: Just the key word or term (for quick memorization)
- Back: Provide a SPECIFIC and RELATABLE explanation that:
  * Uses the exact context from the text
  * Explains what the term means in this specific context
  * Makes it easy to understand and remember
  * Avoids generic explanations like "is mentioned in the text"
- Category: "Definition"

Return as JSON array:
[
  {
    "front": "important word or term",
    "back": "specific, relatable explanation with context from the text",
    "category": "Definition"
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
        max_tokens: 2000,
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
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const flashcards = JSON.parse(jsonMatch[0]);
        
        // Validate and clean the response
        return flashcards.map((card: {front?: string, back?: string, category?: string}, index: number) => ({
          id: index + 1,
          front: card.front || `Question ${index + 1}`,
          back: card.back || "Answer not available",
          category: card.category || "General"
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