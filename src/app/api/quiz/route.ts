import { NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import { createActivity } from "@/lib/db";
import { createBedrockClient } from "@/lib/bedrock";

// Store request IDs to prevent duplicate saves
const processedRequests = new Set<string>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const text = body.text || "";
    const questionCount = body.questionCount || 5;
    const difficulty = body.difficulty || "Beginner";
    const userEmail = body.userEmail || "anonymous@example.com"; // Get user email from request
    const requestId = body.requestId || `${Date.now()}-${Math.random()}`;

    // Check if this request was already processed
    if (processedRequests.has(requestId)) {
      console.log('⚠️ Duplicate request detected, skipping...');
      return NextResponse.json({ error: "Duplicate request" }, { status: 400 });
    }
    processedRequests.add(requestId);

    // Clean up old request IDs after 5 minutes
    setTimeout(() => processedRequests.delete(requestId), 300000);

    if (!text.trim()) {
      return NextResponse.json({ error: "Article content cannot be empty" }, { status: 400 });
    }

    const startTime = Date.now();

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

    const duration = Date.now() - startTime;

    // 💾 Save to database
    try {
      // Create a simple title from the first sentence
      const firstSentence = text.split(/[.!?]+/)[0].trim();
      const title = firstSentence.length > 50 ? 
        firstSentence.substring(0, 47) + '...' : 
        firstSentence;

      const activityId = await createActivity({
        userEmail: userEmail,
        type: 'quiz',
        title: title,
        inputText: text.substring(0, 500), // Store first 500 chars
        result: {
          questions: questions
        },
        status: 'completed',
        duration: duration,
        metadata: {
          difficulty: difficulty,
          questionCount: questionCount,
          score: null,
          tags: [`${difficulty}`, `${questionCount} Questions`],
          originalTitle: title
        }
      });
      
      console.log('✅ Quiz saved to database with ID:', activityId);
    } catch (dbError) {
      console.error('❌ Failed to save quiz to database:', dbError);
      // Don't fail the request if database save fails
    }

    return NextResponse.json({ result: questions });

  } catch (error: unknown) {
    console.error("Error generating quiz:", error);
    
    return NextResponse.json({ 
      error: `Failed to generate quiz: ${error instanceof Error ? error.message : 'Unknown error'}` 
    }, { status: 500 });
  }
}

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  category: string;
}

async function generateAIQuiz(text: string, questionCount: number, difficulty: string): Promise<QuizQuestion[]> {
  const client = createBedrockClient();

  const prompt = `Generate a quiz with ${questionCount} multiple-choice questions based on the following text. 
The difficulty level should be ${difficulty}.

Text: ${text}

For each question:
1. Create a clear, concise question
2. Provide 4 options with one correct answer
3. Include a brief explanation for the correct answer
4. Assign a category (General, Technical, or Advanced)

Format the response as a JSON array with objects containing:
{
  "id": number,
  "question": string,
  "options": string[],
  "correctAnswer": number (0-3),
  "explanation": string,
  "category": string
}`;

  try {
    const command = new InvokeModelCommand({
      modelId: "anthropic.claude-v2",
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({
        prompt: `\${prompt}\n\nHuman: Please generate the quiz questions as specified.\n\nAssistant: Here are the quiz questions in the requested JSON format:`,
        max_tokens: 2000,
        temperature: 0.7,
        top_p: 0.9,
      }),
    });

    const response = await client.send(command);
    const responseBody = new TextDecoder().decode(response.body);
    const parsedResponse = JSON.parse(responseBody);
    
    // Extract the JSON array from the response
    const jsonMatch = parsedResponse.completion.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Failed to parse AI response");
    }

    const questions: QuizQuestion[] = JSON.parse(jsonMatch[0]);
    return questions;
  } catch (error) {
    console.error("Error generating quiz with AI:", error);
    throw error;
  }
}

function generateQuiz(text: string, questionCount: number, difficulty: string): QuizQuestion[] {
  // Split text into sentences - be lenient to ensure enough material
  const sentences = text.split(/[.!?]+/).filter(s => {
    const trimmed = s.trim();
    const wordCount = trimmed.split(/\s+/).filter(w => w.length > 0).length;
    return wordCount >= 3 && trimmed.length > 15; // At least 3 words and 15 characters
  });
  
  if (sentences.length < 1) {
    throw new Error("Text is too short to generate meaningful questions. Please provide a longer text.");
  }

  // Extract important nouns, verbs, and adjectives
  const importantWords = text.toLowerCase()
    .split(/\s+/)
    .map(word => word.replace(/[^a-z]/gi, ''))
    .filter(word => {
      return !isUnimportantWord(word) && word.length >= 3; // Focus on meaningful words (3+ chars)
    });

  const uniqueWords = Array.from(new Set(importantWords));
  const questions: QuizQuestion[] = [];
  const usedKeyWords = new Set<string>();
  const usedSentences = new Set<number>();
  
  // Determine question difficulty
  let category = "General";
  if (difficulty === "Intermediate") {
    category = "Technical";
  } else if (difficulty === "Advanced") {
    category = "Advanced";
  }
  
  // Try to generate questions from different parts of the text
  let attempts = 0;
  const maxAttempts = Math.max(sentences.length * 5, questionCount * 10); // Ensure enough attempts
  
  while (questions.length < questionCount && attempts < maxAttempts) {
    attempts++;
    
    // Pick a sentence we haven't used yet, or loop back to reuse sentences
    const availableSentences = sentences
      .map((_, idx) => idx)
      .filter(idx => !usedSentences.has(idx));
    
    // If we've used all sentences but still need more questions, clear the used sentences
    if (availableSentences.length === 0 && questions.length < questionCount) {
      usedSentences.clear(); // Allow reusing sentences with different words
    }
    
    const sentenceIndex = availableSentences.length > 0 
      ? availableSentences[Math.floor(Math.random() * availableSentences.length)]
      : Math.floor(Math.random() * sentences.length);
    
    const sentence = sentences[sentenceIndex].trim();
    const wordsInSentence = sentence.split(/\s+/);
    
    // Find meaningful key words (nouns, verbs) that are important
    const candidateWords = wordsInSentence.filter(word => {
      const clean = word.toLowerCase().replace(/[^a-z]/gi, '');
      return !isUnimportantWord(clean) && 
             clean.length >= 3 && 
             !usedKeyWords.has(clean) &&
             uniqueWords.includes(clean);
    });

    if (candidateWords.length === 0) {
      usedSentences.add(sentenceIndex);
      continue;
    }
    
    // Try to pick an unused word from the candidates
    let keyWord = null;
    let cleanKeyWord = '';
    
    for (const word of candidateWords) {
      const clean = word.replace(/[^a-zA-Z]/g, '');
      if (!usedKeyWords.has(clean.toLowerCase())) {
        keyWord = word;
        cleanKeyWord = clean;
        break;
      }
    }
    
    // If all words in this sentence have been used, mark sentence as used and continue
    if (!keyWord) {
      usedSentences.add(sentenceIndex);
      continue;
    }

    // Create contextually relevant wrong options from the same text
    let wrongOptions = uniqueWords
      .filter(w => {
        return w !== cleanKeyWord.toLowerCase() && 
               w.length >= cleanKeyWord.length - 2 && // Similar length for plausibility
               w.length <= cleanKeyWord.length + 2 &&
               !usedKeyWords.has(w);
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    // If not enough similar-length words, broaden the search
    if (wrongOptions.length < 3) {
      const additionalOptions = uniqueWords
        .filter(w => {
          return w !== cleanKeyWord.toLowerCase() && 
                 w.length >= 3 &&
                 !usedKeyWords.has(w) &&
                 !wrongOptions.includes(w);
        })
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - wrongOptions.length);
      
      wrongOptions = [...wrongOptions, ...additionalOptions];
    }

    // Still not enough? Use generic options as last resort
    if (wrongOptions.length < 3) {
      const genericPool = [
        'animal', 'domestic', 'called', 'known', 'small', 'large', 
        'common', 'popular', 'found', 'seen', 'type', 'kind',
        'species', 'family', 'group', 'member', 'example', 'form'
      ];
      const genericOptions = genericPool
        .filter(g => g !== cleanKeyWord.toLowerCase() && !wrongOptions.includes(g))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3 - wrongOptions.length);
      wrongOptions = [...wrongOptions, ...genericOptions];
    }

    // If STILL not enough after all attempts, continue trying other sentences
    if (wrongOptions.length < 3) {
      continue;
    }

    // Create the question with better formatting
    const regex = new RegExp(`\\b${keyWord}\\b`, 'i');
    const questionText = sentence.replace(regex, '________');
    
    // Make sure the blank was created
    if (!questionText.includes('________')) {
      continue;
    }
    
    const options = [cleanKeyWord, ...wrongOptions];
    
    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Find the index of the correct answer after shuffling
    const correctAnswerIndex = options.findIndex(opt => 
      opt.toLowerCase() === cleanKeyWord.toLowerCase()
    );

    if (correctAnswerIndex === -1) {
      continue;
    }

    // Generate a more natural question format
    const questionFormats = [
      `Which word best completes this sentence?\n"${questionText}"`,
      `What is the missing word?\n"${questionText}"`,
      `Complete the sentence:\n"${questionText}"`,
      `Fill in the blank:\n"${questionText}"`
    ];
    
    const questionFormat = questionFormats[questions.length % questionFormats.length];

    questions.push({
      id: questions.length + 1,
      question: questionFormat,
      options: options,
      correctAnswer: correctAnswerIndex,
      explanation: `The correct answer is "${cleanKeyWord}". In the original text, this word is used to describe or explain an important concept related to the topic.`,
      category: category
    });
    
    usedKeyWords.add(cleanKeyWord.toLowerCase());
    usedSentences.add(sentenceIndex);
  }

  // If we still don't have enough questions, generate simpler ones from any remaining sentences
  if (questions.length < questionCount && sentences.length > 0) {
    console.log(`⚠️ Only generated ${questions.length} questions, attempting to create ${questionCount - questions.length} more...`);
    
    for (let i = 0; i < sentences.length && questions.length < questionCount; i++) {
      const sentence = sentences[i].trim();
      const words = sentence.split(/\s+/);
      
      // Find ANY word we haven't used yet (be very lenient)
      for (const word of words) {
        if (questions.length >= questionCount) break;
        
        const clean = word.toLowerCase().replace(/[^a-z]/gi, '');
        if (clean.length >= 3 && !isUnimportantWord(clean) && !usedKeyWords.has(clean)) {
          
          // Get any 3 other words from the text
          const otherWords = uniqueWords
            .filter(w => w !== clean && w.length >= 3)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          
          if (otherWords.length >= 3) {
            const regex = new RegExp(`\\b${word}\\b`, 'i');
            const questionText = sentence.replace(regex, '________');
            
            if (questionText.includes('________')) {
              const options = [clean, ...otherWords];
              
              for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
              }
              
              const correctAnswerIndex = options.findIndex(opt => opt.toLowerCase() === clean);
              
              if (correctAnswerIndex !== -1) {
                questions.push({
                  id: questions.length + 1,
                  question: `Fill in the blank:\n"${questionText}"`,
                  options: options,
                  correctAnswer: correctAnswerIndex,
                  explanation: `The correct answer is "${clean}". This word appears in the original text.`,
                  category: category
                });
                
                usedKeyWords.add(clean);
              }
            }
          }
        }
      }
    }
  }
  
  if (questions.length === 0) {
    throw new Error("Could not generate meaningful questions from the provided text. Please provide a longer, more detailed text with clear sentences.");
  }

  console.log(`✅ Successfully generated ${questions.length} questions`);
  return questions;
}

function isUnimportantWord(word: string): boolean {
  const stopWords = new Set([
    "the", "be", "to", "of", "and", "a", "in", "that", "have",
    "i", "it", "for", "not", "on", "with", "he", "as", "you",
    "do", "at", "this", "but", "his", "by", "from", "they",
    "we", "say", "her", "she", "or", "an", "will", "my", "one",
    "all", "would", "there", "their", "what", "so", "up", "out",
    "if", "about", "who", "get", "which", "go", "me"
  ]);
  return stopWords.has(word.toLowerCase());
}