import { NextRequest, NextResponse } from 'next/server';
import { RekognitionClient, DetectTextCommand } from '@aws-sdk/client-rekognition';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    function createRekognitionClient() {
      console.log('ECS_CONTAINER_METADATA_URI:', process.env.ECS_CONTAINER_METADATA_URI);
      console.log('ECS_CONTAINER_METADATA_URI_V4:', process.env.ECS_CONTAINER_METADATA_URI_V4);
      console.log('region:', process.env.NEXT_PUBLIC_AWS_REGION);

      // Detect ECS environment
      const isECS =
        process.env.ECS_CONTAINER_METADATA_URI ||
        process.env.ECS_CONTAINER_METADATA_URI_V4;

      if (isECS) {
        // Running in ECS — rely on Task Role automatically
        console.log('🟢 Running in ECS — using Task Role credentials');
        return new RekognitionClient({
          region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
        });
      } else {
        // Running locally — use credentials from .env
        console.log('🟡 Running locally — using env credentials');
        return new RekognitionClient({
          region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
            sessionToken: process.env.AWS_SESSION_TOKEN,
          },
        });
      }
    }

    if (!file) {
      return NextResponse.json({ error: 'Please upload a valid image file.' }, { status: 400 });
    }

    // Validate file type
    const supportedTypes = ['image/jpeg', 'image/png'];
    if (!supportedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a JPEG or PNG image.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const rekognitionClient = createRekognitionClient();


    // const rekognitionClient = new RekognitionClient({
    //   region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1',
    //   credentials: {
    //     accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    //     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    //     sessionToken: process.env.AWS_SESSION_TOKEN,
    //   },
    // });

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
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json({ error: 'Failed to process the image.' }, { status: 500 });
  }
}
