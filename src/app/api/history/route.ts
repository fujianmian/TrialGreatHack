import { NextResponse } from 'next/server';
import { getActivitiesByUser, createActivity } from '@/lib/db';

export async function GET(request: Request) {
  try {
    // Get user email from query parameters or headers
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email') || request.headers.get('x-user-email');

    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // Fetch activities from PostgreSQL
    const activities = await getActivitiesByUser(userEmail);

    return NextResponse.json({
      activities,
      total: activities.length,
      user: userEmail,
    });

  } catch (error: any) {
    console.error('History fetch error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);

    return NextResponse.json(
      { 
        error: 'Failed to fetch history',
        details: error.message,
        activities: [], // Fallback to empty array
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      userEmail, 
      activityType, 
      title, 
      inputText, 
      result, 
      status = 'completed',
      duration,
      metadata 
    } = body;

    if (!userEmail || !activityType || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: userEmail, activityType, title' },
        { status: 400 }
      );
    }

    // Create activity in PostgreSQL
    const activityId = await createActivity({
      userEmail,
      type: activityType,
      title,
      inputText: inputText || '',
      result: result || null,
      status,
      duration: duration || 0,
      metadata: metadata || {},
    });

    return NextResponse.json({
      success: true,
      activityId,
      message: 'Activity recorded successfully',
    });

  } catch (error: any) {
    console.error('Activity recording error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to record activity',
      details: error.message,
    }, { status: 500 });
  }
}