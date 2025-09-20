import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";

    if (!text.trim()) {
      return NextResponse.json({ error: "Article content cannot be empty" }, { status: 400 });
    }

    // Check if AWS credentials are available
    const hasAWSCredentials = process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY;
    
    let flashcards;
    if (hasAWSCredentials) {
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
    } else {
      console.log("⚠️ AWS credentials not found, using algorithm-based generation...");
      console.log("💡 To use AI generation, add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to .env.local");
      flashcards = generateFlashcards(text);
      console.log("✅ Algorithm generation complete, generated", flashcards.length, "flashcards");
    }

    return NextResponse.json({ result: flashcards });

  } catch (error: unknown) {
    console.error("Error generating flashcards:", error);
    
    return NextResponse.json({ 
      error: `Failed to generate flashcards: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

// Generate flashcards from text content - concept-based approach
function generateFlashcards(text: string) {
  const flashcards: Array<{id: number, front: string, back: string, category: string}> = [];
  
  // Extract key concepts and terms from the text
  const concepts = extractKeyConcepts(text);
  
  // Create flashcards for each concept
  concepts.forEach((concept, index) => {
    const explanation = generateConceptExplanation(concept, text);
    
    // Ensure front is maximum 2 words
    const frontWords = concept.term.split(' ');
    const front = frontWords.length > 2 ? frontWords.slice(0, 2).join(' ') : concept.term;
    
    flashcards.push({
      id: index + 1,
      front: front,
      back: explanation,
      category: concept.category
    });
  });
  
  return flashcards.slice(0, 10); // Return up to 10 flashcards
}

// Extract key concepts from text - focus on meaningful terms and phrases
function extractKeyConcepts(text: string): Array<{term: string, category: string, context: string}> {
  const concepts: Array<{term: string, category: string, context: string}> = [];
  
  // Extract technical terms and important phrases
  const technicalTerms = extractTechnicalTerms(text);
  const importantPhrases = extractImportantPhrases(text);
  const keyNouns = extractKeyNouns(text);
  
  // Combine and deduplicate
  const allTerms = [...technicalTerms, ...importantPhrases, ...keyNouns];
  const uniqueTerms = [...new Set(allTerms)];
  
  // Create concept objects with context
  uniqueTerms.forEach(term => {
    const context = findConceptContext(term, text);
    const category = categorizeTerm(term, context);
    
    if (context && context.length > 20) { // Only include terms with meaningful context
      concepts.push({
        term: term,
        category: category,
        context: context
      });
    }
  });
  
  // Sort by importance and return top concepts
  return concepts
    .sort((a, b) => b.context.length - a.context.length)
    .slice(0, 10);
}

// Extract technical terms (compound words, hyphenated terms, etc.)
function extractTechnicalTerms(text: string): string[] {
  const technicalPatterns = [
    /\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b/g, // CamelCase terms
    /\b\w+-\w+(?:-\w+)*\b/g, // Hyphenated terms
    /\b\w+(?:ing|tion|sion|ment|ness|ity|ism|ist|ive|al|ic|ous|ful|less)\b/g, // Technical suffixes
  ];
  
  const terms: string[] = [];
  technicalPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      terms.push(...matches.filter(term => 
        term.length > 4 && 
        !isCommonWord(term.toLowerCase()) &&
        !isStopWord(term.toLowerCase())
      ));
    }
  });
  
  return terms;
}

// Extract important phrases (maximum 2 words)
function extractImportantPhrases(text: string): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
  const phrases: string[] = [];
  
  sentences.forEach(sentence => {
    const words = sentence.trim().split(/\s+/);
    
    // Extract only 2-word phrases, focusing on meaningful combinations
    for (let i = 0; i < words.length - 1; i++) {
      const phrase = words.slice(i, i + 2).join(' ');
      
      // Check if phrase is meaningful and not a common grammatical phrase
      if (phrase.length > 6 && 
          phrase.length < 30 && 
          !phrase.match(/^[0-9\s]+$/) &&
          !isCommonPhrase(phrase.toLowerCase()) &&
          !isGrammaticalPhrase(phrase.toLowerCase()) &&
          hasMeaningfulWords(phrase)) {
        phrases.push(phrase);
      }
    }
  });
  
  // Count frequency and return most common
  const phraseCount = new Map();
  phrases.forEach(phrase => {
    phraseCount.set(phrase, (phraseCount.get(phrase) || 0) + 1);
  });
  
  return Array.from(phraseCount.entries())
    .filter(([phrase, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([phrase]) => phrase);
}

// Check if phrase contains meaningful words (not just articles, prepositions, etc.)
function hasMeaningfulWords(phrase: string): boolean {
  const words = phrase.split(' ');
  const meaningfulWords = words.filter(word => 
    word.length > 2 && 
    !isStopWord(word) && 
    !isCommonWord(word) &&
    !word.match(/^(the|a|an|and|or|but|in|on|at|to|for|of|with|by)$/i)
  );
  
  // At least one word should be meaningful
  return meaningfulWords.length > 0;
}

// Check if phrase is a grammatical construction
function isGrammaticalPhrase(phrase: string): boolean {
  const grammaticalPatterns = [
    /^(is|are|was|were|be|been|being)\s+(a|an|the)$/i,
    /^(has|have|had|having)\s+(a|an|the)$/i,
    /^(will|would|can|could|should|may|might)\s+(be|have|do)$/i,
    /^(do|does|did|done|doing)\s+(not|n't)$/i,
    /^(there|here|where|when|why|how|what|which|who|whom|whose)\s+(is|are|was|were)$/i,
    /^(this|that|these|those)\s+(is|are|was|were)$/i,
    /^(it|they|we|you|he|she|i)\s+(is|are|was|were)$/i,
    /^(and|or|but|so|yet|for|nor)\s+(the|a|an)$/i,
    /^(in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|under|over|around|near|far)\s+(the|a|an)$/i,
    // Patterns for incomplete phrases ending with "is"
    /^\w+\s+(is|are|was|were)$/i,
    // Patterns for incomplete phrases starting with "of"
    /^of\s+\w+$/i
  ];
  
  return grammaticalPatterns.some(pattern => pattern.test(phrase));
}

// Extract key nouns (important single words)
function extractKeyNouns(text: string): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => 
      word.length > 4 && 
      word.length < 20 &&
      !word.match(/^[0-9]+$/) && 
      !isStopWord(word) &&
      !isCommonWord(word) &&
      !isUnimportantWord(word)
    );
  
  const wordCount = new Map();
  words.forEach((word) => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });
  
  return Array.from(wordCount.entries())
    .filter(([word, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

// Find context for a concept from the text
function findConceptContext(term: string, text: string): string {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15);
  
  // Find sentences that contain this term
  const contextSentences = sentences.filter(s => 
    s.toLowerCase().includes(term.toLowerCase())
  );
  
  if (contextSentences.length > 0) {
    // Choose the most informative sentence
    const bestSentence = contextSentences.reduce((best, current) => 
      current.length > best.length ? current : best
    );
    
    return bestSentence.trim();
  }
  
  return "";
}

// Generate explanation for a concept
function generateConceptExplanation(concept: {term: string, category: string, context: string}, text: string): string {
  const { term, context } = concept;
  
  if (context) {
    // Create a clear, contextual explanation
    const words = context.split(' ');
    const termIndex = words.findIndex(w => w.toLowerCase().includes(term.toLowerCase()));
    
    if (termIndex !== -1) {
      // Extract surrounding context for better understanding
      const start = Math.max(0, termIndex - 2);
      const end = Math.min(words.length, termIndex + 3);
      const surroundingContext = words.slice(start, end).join(' ');
      
      return `In this context: "${surroundingContext.trim()}"`;
    }
    
    return `As described: "${context.trim()}"`;
  }
  
  // Fallback explanation
  const termCount = text.toLowerCase().split(term.toLowerCase()).length - 1;
  if (termCount > 1) {
    return `"${term}" is a key concept mentioned ${termCount} times in the text, indicating its importance to the topic.`;
  }
  
  return `"${term}" is an important term that appears in this content.`;
}

// Categorize a term based on its context
function categorizeTerm(term: string, context: string): string {
  const lowerTerm = term.toLowerCase();
  const lowerContext = context.toLowerCase();
  
  if (lowerContext.includes('definition') || lowerContext.includes('means') || lowerContext.includes('refers to')) {
    return 'Definition';
  } else if (lowerContext.includes('process') || lowerContext.includes('method') || lowerContext.includes('how')) {
    return 'Process';
  } else if (lowerContext.includes('example') || lowerContext.includes('such as') || lowerContext.includes('including')) {
    return 'Example';
  } else if (lowerContext.includes('important') || lowerContext.includes('key') || lowerContext.includes('main')) {
    return 'Key Concept';
  } else if (lowerContext.includes('technology') || lowerContext.includes('system') || lowerContext.includes('device')) {
    return 'Technology';
  } else {
    return 'General';
  }
}

// Check if phrase is a common phrase
function isCommonPhrase(phrase: string): boolean {
  const commonPhrases = new Set([
    'in order to', 'as well as', 'such as', 'for example', 'in addition', 
    'on the other hand', 'at the same time', 'as a result', 'in fact',
    'it is important', 'it should be', 'there are many', 'this is a',
    'one of the', 'part of the', 'type of', 'kind of', 'sort of',
    'is an', 'is a', 'are the', 'is the', 'was the', 'were the',
    'can be', 'will be', 'should be', 'could be', 'would be',
    'has been', 'have been', 'had been', 'will have', 'would have',
    'it is', 'it was', 'it will', 'it can', 'it should', 'it would',
    'there is', 'there are', 'there was', 'there were', 'there will',
    'this is', 'this was', 'this will', 'this can', 'this should',
    'that is', 'that was', 'that will', 'that can', 'that should',
    'and the', 'or the', 'but the', 'for the', 'with the', 'from the',
    'to the', 'of the', 'in the', 'on the', 'at the', 'by the',
    'as the', 'if the', 'when the', 'where the', 'why the', 'how the',
    'what the', 'which the', 'who the', 'whose the', 'whom the',
    'area of', 'field of', 'study of', 'branch of', 'aspect of',
    'form of', 'type of', 'kind of', 'sort of', 'way of', 'method of',
    'process of', 'result of', 'effect of', 'cause of', 'source of',
    'part of', 'piece of', 'bit of', 'lot of', 'number of', 'amount of',
    'group of', 'set of', 'series of', 'range of', 'variety of',
    'level of', 'degree of', 'extent of', 'scope of', 'scale of',
    'computing is', 'learning is', 'analysis is', 'technology is',
    'of computing', 'of learning', 'of analysis', 'of technology',
    'science is', 'research is', 'study is', 'work is',
    'of science', 'of research', 'of study', 'of work'
  ]);
  return commonPhrases.has(phrase.toLowerCase());
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

    const prompt = `Please analyze the following text and create 8-10 flashcards for effective learning.

Focus on IMPORTANT CONCEPTS with MAXIMUM 2 WORDS on the front. Include:
- Key terms and concepts (1-2 words maximum)
- Important phrases and expressions (2 words max)
- Technical terminology (1-2 words)
- Central ideas and themes (1-2 words)
- Processes and methods described (1-2 words)

IMPORTANT: Avoid grammatical phrases and incomplete phrases like:
- "is an", "are the", "can be", "will be"
- "area of", "field of", "study of", "type of"
- "part of", "form of", "method of", "process of"
- "computing is", "learning is", "analysis is", "technology is"
- "of computing", "of learning", "of analysis", "of technology"
Focus on meaningful noun phrases and technical terms.

For each flashcard:
- Front: The key concept, term, or phrase (MAXIMUM 2 WORDS, meaningful content only)
- Back: A clear, contextual explanation that:
  * Uses specific information from the text
  * Explains what the concept means in this context
  * Provides enough detail to understand the concept
  * Makes it easy to remember and apply
- Category: Choose appropriate category (Definition, Process, Example, Key Concept, Technology, General)

Examples of good flashcards:
- Front: "quantum computing" → Back: "A computing technology that uses quantum bits (qubits) which can represent both 0 and 1 simultaneously, allowing for much faster calculations than traditional computers."
- Front: "machine learning" → Back: "Computer programs that can learn and improve from experience without being explicitly programmed, used in AI applications."
- Front: "data analysis" → Back: "The process of examining, cleaning, and modeling data to discover useful information and support decision-making."

Examples of BAD flashcards to avoid:
- Front: "is an" → This is a grammatical phrase, not a concept
- Front: "can be" → This is a verb phrase, not a meaningful term
- Front: "area of" → This is an incomplete phrase, not a concept
- Front: "type of" → This is an incomplete phrase, not a concept
- Front: "computing is" → This is an incomplete phrase, not a concept
- Front: "of computing" → This is an incomplete phrase, not a concept
- Front: "the main" → This is incomplete and not a concept

Return as JSON array:
[
  {
    "front": "concept or term (max 2 words, meaningful only)",
    "back": "detailed, contextual explanation from the text",
    "category": "appropriate category"
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
              maxTokens: 2000,
              temperature: 0.3
            }
          };
        } else {
          // Anthropic Claude format
          requestBody = {
            anthropic_version: 'bedrock-2023-05-31',
            max_tokens: 2000,
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
            const flashcards = JSON.parse(jsonMatch[0]);
            
            // Validate and clean the response
            return flashcards.map((card: any, index: number) => {
              // Ensure front is maximum 2 words
              const frontWords = (card.front || `Question ${index + 1}`).split(' ');
              const front = frontWords.length > 2 ? frontWords.slice(0, 2).join(' ') : card.front || `Question ${index + 1}`;
              
              return {
                id: index + 1,
                front: front,
                back: card.back || "Answer not available",
                category: card.category || "General"
              };
            });
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