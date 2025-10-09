import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, DetectTextCommand } from '@aws-sdk/client-rekognition';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'Please upload a valid image file.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const rekognitionClient = new RekognitionClient({
      region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        sessionToken: process.env.AWS_SESSION_TOKEN,
      },
    });

    const command = new DetectTextCommand({
      Image: {
        Bytes: buffer,
      },
    });

    const response = await rekognitionClient.send(command);
    const textDetections = response.TextDetections || [];
    const extractedText = textDetections
      .filter((text) => text.Type === 'LINE')
      .map((text) => text.DetectedText)
      .join('\n');

    return NextResponse.json({ extractedText });
  } catch (error: any) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Failed to process the image.', details: error.message || 'An unknown error occurred.' }, { status: 500 });
  }
}
