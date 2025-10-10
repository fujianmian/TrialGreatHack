import { NextResponse } from 'next/server';
import { createActivity, getActivitiesByUser } from '@/lib/db';

export async function GET() {
  try {
    console.log('📝 Creating test activity...');
    
    const activityId = await createActivity({
      userEmail: 'test@example.com',
      type: 'summary',
      title: 'Test Summary',
      inputText: 'This is a test',
      result: {
        summary: 'Test summary result',
        keyPoints: ['point 1', 'point 2'],
        wordCount: 10,
        originalWordCount: 20
      },
      status: 'completed',
      duration: 1000
    });

    console.log('✅ Activity created with ID:', activityId);

    console.log('📖 Fetching activities...');
    const activities = await getActivitiesByUser('test@example.com');

    return NextResponse.json({
      success: true,
      activityId,
      activities
    });
  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
