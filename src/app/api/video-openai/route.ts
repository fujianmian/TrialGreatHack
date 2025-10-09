import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, StartAsyncInvokeCommand, GetAsyncInvokeCommand } from '@aws-sdk/client-bedrock-runtime';
import OpenAI from 'openai';
import { createBedrockClient } from '@/lib/bedrock';

const NOVA_REGION = 'us-east-1';
// Use the S3 bucket from environment variables
const S3_BUCKET_NAME = process.env.AWS_S3_BUCKET || 'study-hub-videos-generation';
const OUTPUT_S3_URI = `s3://${S3_BUCKET_NAME}/`;

export async function POST(request: NextRequest) {
  try {
    console.log('API route hit');
    const { prompt, action, invocationArn, text, style } = await request.json();
    console.log('Received request:', { prompt, action, invocationArn, text, style });

    const client = createBedrockClient();

    console.log('Bedrock client initialized for region:', NOVA_REGION);

    // Handle status checking
    if (action === 'check-status' && invocationArn) {
      console.log('Checking status for:', invocationArn);
      try {
        const command = new GetAsyncInvokeCommand({
          invocationArn: invocationArn
        });
        const statusResponse = await client.send(command);
        console.log('Status response:', statusResponse);

        return NextResponse.json({
          status: statusResponse.status,
          invocationArn: invocationArn,
          outputLocation: statusResponse.status === 'Completed' ? 
            `${statusResponse.outputDataConfig?.s3OutputDataConfig?.s3Uri}output.mp4` : null,
          // Construct actual S3 URL using the real output path
          s3Url: statusResponse.status === 'Completed' && statusResponse.outputDataConfig?.s3OutputDataConfig?.s3Uri ? 
            statusResponse.outputDataConfig.s3OutputDataConfig.s3Uri.replace(`s3://${S3_BUCKET_NAME}/`, `https://${S3_BUCKET_NAME}.s3.${NOVA_REGION}.amazonaws.com/`) + '/output.mp4' : null,
          failureMessage: statusResponse.failureMessage
        });
      } catch (statusError: any) {
        console.error('Status check error:', statusError);
        return NextResponse.json(
          { message: 'Failed to check job status', error: statusError.message },
          { status: 500 }
        );
      }
    }

    // Handle OpenAI script generation + Nova Reel video generation
    if (text) {
      const videoStyle = style || "educational";

      if (!text.trim()) {
        return NextResponse.json({ error: "Text content cannot be empty" }, { status: 400 });
      }

      console.log("🤖 Using OpenAI for script generation...");
      console.log("📝 Text length:", text.length);
      console.log("🎨 Video style:", videoStyle);


      // Use OpenAI for script generation
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      const openaiPrompt = `You are an expert video content creator and visual director specializing in creating highly engaging, visually stunning videos.

Video Style: ${videoStyle}

CRITICAL REQUIREMENTS - Create VISUALLY STUNNING videos:

0. Strictly need and only 3 video.

1. **Content Analysis**: Deeply analyze the text to identify:
   - Key concepts, themes, and visual metaphors
   - Specific objects, locations, and scenarios mentioned
   - Emotional tone and mood
   - Target audience and context

2. **Visual Storytelling**: For each shot, provide:
   - SPECIFIC background environments (not generic studios)
   - CONCRETE visual elements and props
   - DETAILED scene descriptions with specific objects
   - Dynamic camera movements with purpose
   - Lighting and color schemes that match the content

3. **Background Suggestions**: Instead of generic backgrounds, suggest:
   - Real-world locations relevant to the content
   - Specific environments (labs, offices, nature, urban, etc.)
   - Contextual props and visual elements
   - Relevant imagery and symbols

4. **Visual Engagement**: Make each shot visually interesting with:
   - Specific visual metaphors for abstract concepts
   - Relevant props, charts, or demonstrations
   - Dynamic scenes with movement and activity
   - Professional cinematography techniques

Return as JSON:
{
  "title": "Compelling Video Title",
  "duration": 30,
  "style": "${videoStyle}",
  "content_analysis": {
    "key_themes": ["theme1", "theme2"],
    "visual_metaphors": ["metaphor1", "metaphor2"],
    "target_audience": "description",
    "emotional_tone": "tone description"
  },
  "shots": [
    {
      "prompt": "DETAILED visual description with specific background, props, camera movement, and scene details",
      "weight": 1.0,
      "description": "What happens in this shot",
      "background": "Specific background environment",
      "visual_elements": ["specific prop 1", "specific prop 2"],
      "camera_movement": "Specific camera technique",
      "lighting": "Specific lighting description"
    }
  ],
  "transcript": "Natural flowing transcript"
}

Text to analyze:
${text}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert video content analyst and script writer specializing in creating engaging, professional video content. Always respond with valid JSON."
          },
          {
            role: "user",
            content: openaiPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const aiResponse = response.choices[0]?.message?.content;
      if (!aiResponse) {
        throw new Error("No response from OpenAI");
      }

      // Parse the JSON response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON found in OpenAI response");
      }

      const videoScript = JSON.parse(jsonMatch[0]);
      console.log("✅ OpenAI script generation successful");
      console.log(`📊 Generated ${videoScript.shots.length} shots/slides`);

      // 🔥 NEW: Generate SEPARATE videos for each shot/slide
      const videoJobs = [];
      const failedJobs = [];

      console.log('🎬 Generating individual videos for each shot with Nova Reel...');

      for (let i = 0; i < videoScript.shots.length; i++) {
        const shot = videoScript.shots[i];
        const shotPrompt = shot.prompt;

        try {
          // Validate individual shot prompt length (Nova Reel limit: 512 characters)
          if (shotPrompt.length > 512) {
            const truncatedPrompt = shotPrompt.substring(0, 512);
            console.log(`⚠️ Shot ${i + 1} prompt truncated from ${shotPrompt.length} to 512 characters`);
            shot.truncatedPrompt = truncatedPrompt;
            shot.originalLength = shotPrompt.length;
          }

          const finalPrompt = shotPrompt.length > 512 ? shotPrompt.substring(0, 512) : shotPrompt;
          console.log(`🎥 Processing shot ${i + 1}/${videoScript.shots.length}: ${finalPrompt.substring(0, 100)}...`);

          // Create Nova Reel request for this specific shot
          const novaRequest = {
            taskType: "TEXT_VIDEO",
            textToVideoParams: {
              text: finalPrompt
            },
            videoGenerationConfig: {
              durationSeconds: 6, // Max 6 seconds for Nova Reel
              fps: 24,
              dimension: "1280x720",
              seed: Math.floor(Math.random() * 1000000)
            }
          };

          const startCommand = new StartAsyncInvokeCommand({
            modelId: 'amazon.nova-reel-v1:1',
            modelInput: novaRequest,
            outputDataConfig: {
              s3OutputDataConfig: {
                s3Uri: `${OUTPUT_S3_URI}shot-${i + 1}/`
              }
            }
          });

          // Retry logic for rate limiting
          let retries = 3;
          let startResponse;
          
          while (retries > 0) {
            try {
              startResponse = await client.send(startCommand);
              break; // Success, exit retry loop
            } catch (retryError: any) {
              if (retryError.message.includes('Too many requests') && retries > 1) {
                const waitTime = (4 - retries) * 5000; // 5s, 10s, 15s
                console.log(`⏳ Rate limited. Waiting ${waitTime/1000}s before retry... (${retries-1} retries left)`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
                retries--;
              } else {
                throw retryError; // Re-throw if not rate limit or out of retries
              }
            }
          }

          if (!startResponse) {
            throw new Error('Failed after all retries');
          }

          // Store job info for this shot
          const videoJob = {
            shotIndex: i,
            shotId: `shot-${i + 1}`,
            title: shot.description || `Shot ${i + 1}`,
            prompt: finalPrompt,
            invocationArn: startResponse.invocationArn,
            status: 'InProgress',
            s3Path: `${OUTPUT_S3_URI}shot-${i + 1}/`,
            // Don't construct S3 URL here - wait for completion to get actual path
            s3Url: null,
            shot: shot // Include original shot data
          };

          videoJobs.push(videoJob);
          console.log(`✅ Shot ${i + 1} job started: ${startResponse.invocationArn}`);

          // Add delay between requests to avoid rate limiting
          if (i < videoScript.shots.length - 1) {
            console.log(`⏳ Waiting 3 seconds before next shot...`);
            await new Promise(resolve => setTimeout(resolve, 3000)); // Increased to 3 seconds
          }

        } catch (error: any) {
          console.error(`❌ Failed to start job for shot ${i + 1}:`, error.message);
          failedJobs.push({
            shotIndex: i,
            shotId: `shot-${i + 1}`,
            error: error.message,
            shot: shot
          });
        }
      }

      console.log(`🎯 Successfully started ${videoJobs.length} video generation jobs`);
      if (failedJobs.length > 0) {
        console.log(`⚠️ Failed to start ${failedJobs.length} jobs`);
      }

      // Construct the response with all video jobs
      const result = {
        title: videoScript.title,
        duration: videoScript.duration,
        type: 'openai_video',
        transcript: videoScript.transcript,
        style: videoScript.style,
        content_analysis: videoScript.content_analysis,
        totalShots: videoScript.shots.length,
        successfulJobs: videoJobs.length,
        failedJobs: failedJobs.length,
        videoJobs: videoJobs,
        estimatedTime: '1-3 minutes per video',
        s3Bucket: S3_BUCKET_NAME
      };

      return NextResponse.json({ 
        message: `🎥 Started ${videoJobs.length} video generation jobs (${failedJobs.length} failed)`,
        result: result
      });
    }

    // Handle direct Nova Reel generation (original functionality)
    if (!prompt) {
      return NextResponse.json(
        { message: 'Either "text" (for OpenAI + Nova Reel) or "prompt" (for direct Nova Reel) is required' },
        { status: 400 }
      );
    }

    // Validate prompt length (Nova Reel limit: 512 characters)
    if (prompt.length > 512) {
      return NextResponse.json(
        {
          message: 'Prompt too long',
          error: `Prompt must be 512 characters or less. Your prompt is ${prompt.length} characters.`,
          limit: 512,
          currentLength: prompt.length,
          suggestion: 'Please shorten your prompt and try again.'
        },
        { status: 400 }
      );
    }

    console.log('Using direct Nova Reel with prompt:', prompt);
    console.log('Using fixed S3 output URI:', OUTPUT_S3_URI);

    // Use the Nova Reel implementation approach from the second file
    const novaRequest = {
      taskType: "TEXT_VIDEO",
      textToVideoParams: {
        text: prompt
      },
      videoGenerationConfig: {
        durationSeconds: 6, // Max 6 seconds for Nova Reel
        fps: 24,
        dimension: "1280x720",
        seed: Math.floor(Math.random() * 1000000)
      }
    };

    console.log('Nova Reel request:', JSON.stringify(novaRequest, null, 2));

    const startCommand = new StartAsyncInvokeCommand({
      modelId: 'amazon.nova-reel-v1:1',
      modelInput: novaRequest,
      outputDataConfig: {
        s3OutputDataConfig: {
          s3Uri: OUTPUT_S3_URI
        }
      }
    });

    console.log('Starting async invoke with fixed S3 URI:', OUTPUT_S3_URI);

    const startResponse = await client.send(startCommand);
    console.log('✅ Async invoke successful! Start Response:', startResponse);

    return NextResponse.json({
      message: '🎥 Video generation job started successfully!',
      invocationArn: startResponse.invocationArn,
      status: 'InProgress',
      estimatedTime: '1-3 minutes',
      s3Bucket: S3_BUCKET_NAME,
      outputUri: OUTPUT_S3_URI
    });

  } catch (error: any) {
    console.error('❌ Detailed error:', {
      message: error.message,
      name: error.name,
      fault: error.$fault,
      metadata: error.$metadata
    });

    // Handle specific error cases
    if (error.name === 'ValidationException' && error.message.includes('Invalid Output Config')) {
      return NextResponse.json(
        {
          message: '🚨 S3 Bucket Not Found or Not Accessible',
          error: `The S3 bucket "${S3_BUCKET_NAME}" doesn't exist or Bedrock can't access it`,
          instructions: [
            '1. 🌐 Go to AWS S3 Console (https://s3.console.aws.amazon.com/)',
            `2. 📦 Create bucket named: "${S3_BUCKET_NAME}"`,
            '3. 🌍 Set region to: US East (N. Virginia) us-east-1',
            '4. 🔐 Add bucket policy to allow bedrock.amazonaws.com access',
            '5. ✅ Try again after creating the bucket'
          ],
          bucketName: S3_BUCKET_NAME,
          region: NOVA_REGION
        },
        { status: 400 }
      );
    }

    if (error.name === 'ValidationException' && error.message.includes('model identifier')) {
      return NextResponse.json(
        {
          message: 'Nova Reel model not available',
          error: 'Model not available in this region or access not granted',
          region: NOVA_REGION
        },
        { status: 400 }
      );
    }

    if (error.name === 'AccessDeniedException') {
      return NextResponse.json(
        {
          message: 'Access denied',
          error: 'Either model access or S3 permissions issue',
          suggestions: [
            'Check Nova Reel access in Bedrock console',
            'Verify S3 bucket permissions',
            'Ensure AWS credentials are correct'
          ]
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      {
        message: 'Internal Server Error',
        error: error.message,
        name: error.name || 'UNKNOWN_ERROR',
        fault: error.$fault
      },
      { status: 500 }
    );
  }
}
