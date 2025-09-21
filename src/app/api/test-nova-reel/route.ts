import { NextResponse } from "next/server";
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

export async function GET() {
  try {
    // Test basic Nova Reel API access
    const client = new BedrockRuntimeClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    });

    // Simple test request
    const testRequest = {
      text_prompts: [{
        text: "A simple test video of a person waving hello",
        weight: 1.0
      }],
      duration: 6, // Just 6 seconds for testing
      output_format: "mp4"
    };

    console.log("🧪 Testing Nova Reel API with:", JSON.stringify(testRequest, null, 2));

    const input = {
      modelId: 'amazon.nova-reel-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(testRequest)
    };

    const command = new InvokeModelCommand(input);
    const response = await client.send(command);
    
    console.log("🧪 Test response:", response);
    console.log("🧪 Response status:", response.$metadata?.httpStatusCode);
    
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    console.log("🧪 Parsed response:", JSON.stringify(responseBody, null, 2));

    return NextResponse.json({ 
      success: true, 
      status: response.$metadata?.httpStatusCode,
      response: responseBody,
      message: "Nova Reel test successful" 
    });

  } catch (error: unknown) {
    console.error("🧪 Nova Reel test failed:", error);
    
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      message: "Nova Reel test failed" 
    }, { status: 500 });
  }
}
