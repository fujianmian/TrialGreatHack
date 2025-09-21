import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .map((msg: any) => `${msg.role}: ${msg.content}`)
      .join('\n');

    const systemPrompt = `You are an AI study assistant for EduAI, an educational platform that helps students with learning and content creation. You are knowledgeable about a wide range of academic subjects and study techniques.

Your primary roles are:
1. Answer study-related questions across all subjects (math, science, history, literature, etc.)
2. Provide study tips, learning strategies, and exam preparation advice
3. Help with homework, assignments, and academic concepts
4. Explain complex topics in simple, understandable ways
5. Suggest effective study methods and techniques
6. Help users understand how to use EduAI's features for better learning

EduAI Features you can recommend:
- Text to Video: Convert study materials into engaging videos
- Flashcards: Create interactive study cards for memorization
- Mind Maps: Visualize concepts and their relationships
- Quiz Generation: Practice questions for self-testing
- Summary Creation: Extract key points from long texts

Study Areas you can help with:
- Mathematics (algebra, calculus, geometry, statistics)
- Sciences (biology, chemistry, physics, earth science)
- Languages (grammar, vocabulary, literature analysis)
- History and Social Studies
- Computer Science and Programming
- Study techniques and exam preparation
- Time management and productivity
- Note-taking strategies

Always be encouraging, patient, and thorough in your explanations. If you don't know something specific, admit it and suggest resources or alternative approaches. Focus on helping students learn and succeed academically.

Keep responses helpful and detailed but not overwhelming (typically 2-4 sentences).`;

    // Prepare messages for OpenAI
    const messages = [
      {
        role: 'system' as const,
        content: systemPrompt
      },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      {
        role: 'user' as const,
        content: message
      }
    ];

    let response = '';

    try {
      console.log(`🤖 Calling OpenAI API for chatbox`);
      
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: messages,
        max_tokens: 300,
        temperature: 0.7,
        top_p: 0.9,
      });

      response = completion.choices[0]?.message?.content || 'I apologize, but I had trouble generating a response. Please try again.';
      
      console.log(`✅ OpenAI response generated successfully`);
      
    } catch (error: any) {
      console.error('❌ OpenAI API failed:', error.message);
      response = getFallbackResponse(message);
    }

    return NextResponse.json({
      response: response.trim(),
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ Chatbox API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function getFallbackResponse(message: string): string {
  const lowerMessage = message.toLowerCase();
  
  // Study-related responses
  if (lowerMessage.includes('math') || lowerMessage.includes('algebra') || lowerMessage.includes('calculus') || lowerMessage.includes('geometry')) {
    return "I can help with math problems and concepts! Whether it's algebra, calculus, geometry, or statistics, I can explain concepts step-by-step and suggest study strategies. What specific math topic are you working on?";
  }
  
  if (lowerMessage.includes('science') || lowerMessage.includes('biology') || lowerMessage.includes('chemistry') || lowerMessage.includes('physics')) {
    return "Science is fascinating! I can help explain scientific concepts, processes, and theories. Whether it's biology, chemistry, physics, or earth science, I'm here to make complex topics clearer. What science topic would you like help with?";
  }
  
  if (lowerMessage.includes('history') || lowerMessage.includes('social studies') || lowerMessage.includes('geography')) {
    return "History and social studies help us understand the world! I can help explain historical events, analyze causes and effects, and suggest study techniques for memorizing dates and facts. What historical period or topic interests you?";
  }
  
  if (lowerMessage.includes('english') || lowerMessage.includes('literature') || lowerMessage.includes('writing') || lowerMessage.includes('grammar')) {
    return "Language and literature are essential skills! I can help with grammar, essay writing, literary analysis, vocabulary building, and reading comprehension. What aspect of English or literature would you like assistance with?";
  }
  
  if (lowerMessage.includes('study') || lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('homework')) {
    return "Effective studying is key to academic success! I can suggest study techniques, time management strategies, note-taking methods, and exam preparation tips. I can also help you create flashcards, summaries, or practice quizzes using EduAI's features.";
  }
  
  if (lowerMessage.includes('programming') || lowerMessage.includes('coding') || lowerMessage.includes('computer science')) {
    return "Programming is a valuable skill! I can help explain coding concepts, debug issues, suggest best practices, and recommend learning resources. Whether you're learning Python, JavaScript, or any other language, I'm here to help.";
  }
  
  // Platform feature responses
  if (lowerMessage.includes('video') || lowerMessage.includes('generate video')) {
    return "Create engaging educational videos from your study materials! Use our 'Video' feature to transform text into visual content with AI-generated narration and graphics. Perfect for reviewing complex topics.";
  }
  
  if (lowerMessage.includes('flashcard') || lowerMessage.includes('study card')) {
    return "Flashcards are excellent for memorization! Use our 'Flashcards' feature to convert your study material into interactive cards. Great for vocabulary, formulas, definitions, and key concepts.";
  }
  
  if (lowerMessage.includes('mind map') || lowerMessage.includes('brainstorm')) {
    return "Mind maps help visualize connections between ideas! Try our 'Mind Map' feature to create visual representations of your content. Perfect for understanding relationships and organizing information.";
  }
  
  if (lowerMessage.includes('quiz') || lowerMessage.includes('practice')) {
    return "Practice makes perfect! Use our 'Quiz' generator to create practice questions from your study material. Choose your difficulty level and get instant questions to test your knowledge.";
  }
  
  if (lowerMessage.includes('summary') || lowerMessage.includes('summarize')) {
    return "Get the key points quickly! Our 'Summary' feature extracts the most important information from long texts. Perfect for reviewing and understanding main concepts before exams.";
  }
  
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return "Hello! I'm your AI study assistant. I can help with homework, explain concepts, suggest study strategies, and show you how to use EduAI's learning tools. What would you like help with today?";
  }
  
  if (lowerMessage.includes('help') || lowerMessage.includes('how to')) {
    return "I'm here to help with all your academic needs! I can answer study questions, explain concepts, suggest learning strategies, and show you how to use EduAI's features like videos, flashcards, mind maps, quizzes, and summaries.";
  }
  
  return "I'm your AI study assistant! I can help with homework questions, explain academic concepts, suggest study techniques, and show you how to use EduAI's learning tools. What would you like help with?";
}
