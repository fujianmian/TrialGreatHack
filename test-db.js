require('dotenv').config();
const { createActivity, getActivitiesByUser } = require('./src/lib/db');

async function test() {
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
    console.log('Activities:', JSON.stringify(activities, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();