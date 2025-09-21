import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory = [] } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required and must be a string' },
        { status: 400 }
      );
    }

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

    let aiResponse = '';
    let modelUsed = '';
    let success = false;
    let debugInfo: any = {};

    // 🔍 DEBUG: Check environment variable
    console.log('🔍 DEBUG: Environment check');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
    console.log('- OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length || 0);
    console.log('- OPENAI_API_KEY prefix:', process.env.OPENAI_API_KEY?.substring(0, 10) + '...');
    
    debugInfo.apiKeyExists = !!process.env.OPENAI_API_KEY;
    debugInfo.apiKeyLength = process.env.OPENAI_API_KEY?.length || 0;

    try {
      console.log('🤖 Attempting to invoke OpenAI model');
      console.log('- Model: gpt-4o-mini');
      console.log('- Messages count:', messages.length);
      console.log('- Max tokens: 300');
      console.log('- Temperature: 0.7');

      // 🔍 DEBUG: Check if API key is valid format
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is not set');
      }

      if (!process.env.OPENAI_API_KEY.startsWith('sk-')) {
        console.warn('⚠️ API key does not start with "sk-" - might be invalid format');
        debugInfo.keyFormatWarning = 'API key does not start with sk-';
      }

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      console.log('✅ OpenAI client initialized successfully');
      debugInfo.clientInitialized = true;

      // 🔍 DEBUG: Add timeout and detailed error handling
      const startTime = Date.now();
      console.log('📞 Making API call to OpenAI...');

      const response = await Promise.race([
        openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: messages,
          max_tokens: 300,
          temperature: 0.7,
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
        )
      ]) as any;

      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log('📈 API call completed');
      console.log('- Duration:', duration + 'ms');
      console.log('- Response received:', !!response);
      
      debugInfo.apiCallDuration = duration;
      debugInfo.responseReceived = !!response;

      // 🔍 DEBUG: Detailed response inspection
      console.log('🔍 Response analysis:');
      console.log('- Response object exists:', !!response);
      console.log('- Has choices:', !!response?.choices);
      console.log('- Choices length:', response?.choices?.length || 0);
      console.log('- First choice exists:', !!response?.choices?.[0]);
      console.log('- Has message:', !!response?.choices?.[0]?.message);
      console.log('- Has content:', !!response?.choices?.[0]?.message?.content);
      console.log('- Content length:', response?.choices?.[0]?.message?.content?.length || 0);

      debugInfo.responseAnalysis = {
        hasChoices: !!response?.choices,
        choicesLength: response?.choices?.length || 0,
        hasFirstChoice: !!response?.choices?.[0],
        hasMessage: !!response?.choices?.[0]?.message,
        hasContent: !!response?.choices?.[0]?.message?.content,
        contentLength: response?.choices?.[0]?.message?.content?.length || 0
      };

      if (response?.usage) {
        console.log('💰 Token usage:');
        console.log('- Prompt tokens:', response.usage.prompt_tokens);
        console.log('- Completion tokens:', response.usage.completion_tokens);
        console.log('- Total tokens:', response.usage.total_tokens);
        debugInfo.tokenUsage = response.usage;
      }

      // Log the full response structure (be careful in production)
      console.log('📋 Full response structure:', JSON.stringify(response, null, 2));

      if (response.choices && response.choices.length > 0 && response.choices[0].message?.content) {
        aiResponse = response.choices[0].message.content;
        modelUsed = 'gpt-4o-mini';
        success = true;
        console.log('✅ Successfully invoked OpenAI model:', modelUsed);
        console.log('📝 Response preview:', aiResponse.substring(0, 100) + '...');
        debugInfo.success = true;
        debugInfo.responsePreview = aiResponse.substring(0, 100);
      } else {
        console.error('❌ Invalid response structure from OpenAI');
        console.error('Expected: response.choices[0].message.content');
        console.error('Got:', {
          choices: response?.choices,
          firstChoice: response?.choices?.[0],
          message: response?.choices?.[0]?.message,
          content: response?.choices?.[0]?.message?.content
        });
        debugInfo.invalidResponseStructure = true;
        throw new Error('Invalid response structure from OpenAI API');
      }
      
    } catch (error: any) {
      console.error('❌ OpenAI model failed with detailed error:');
      console.error('- Error type:', error.constructor.name);
      console.error('- Error message:', error.message);
      console.error('- Error code:', error.code);
      console.error('- Error status:', error.status);
      console.error('- Full error:', error);
      
      debugInfo.error = {
        type: error.constructor.name,
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack
      };

      // 🔍 DEBUG: Specific error type analysis
      if (error.message?.includes('API key')) {
        console.error('🔑 API Key related error detected');
        debugInfo.apiKeyError = true;
      }
      
      if (error.message?.includes('quota') || error.message?.includes('billing')) {
        console.error('💳 Billing/Quota error detected');
        debugInfo.billingError = true;
      }
      
      if (error.message?.includes('rate limit')) {
        console.error('⏱️ Rate limit error detected');
        debugInfo.rateLimitError = true;
      }
      
      if (error.message?.includes('timeout') || error.code === 'ECONNRESET') {
        console.error('🕐 Network/Timeout error detected');
        debugInfo.networkError = true;
      }
    }

    if (!success) {
      aiResponse = getFallbackResponse(message);
      modelUsed = 'fallback';
      console.log('⚠️ OpenAI failed. Using fallback response.');
      console.log('📝 Fallback response preview:', aiResponse.substring(0, 100) + '...');
      debugInfo.usedFallback = true;
      debugInfo.fallbackReason = 'OpenAI API call failed';
    }

    // 🔍 DEBUG: Include debug info in response for troubleshooting
    return NextResponse.json({
      response: aiResponse.trim(),
      model: modelUsed,
      timestamp: new Date().toISOString(),
      debug: debugInfo // Remove this in production
    });

  } catch (error: any) {
    console.error('❌ Chatbox API error with full details:');
    console.error('- Error type:', error.constructor.name);
    console.error('- Error message:', error.message);
    console.error('- Error stack:', error.stack);
    console.error('- Full error object:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error.message,
        errorType: error.constructor.name,
        timestamp: new Date().toISOString()
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