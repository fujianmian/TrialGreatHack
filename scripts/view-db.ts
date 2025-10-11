import * as dotenv from 'dotenv';

// Load environment variables FIRST
dotenv.config();

import { query } from '../src/lib/db';

async function viewDatabase() {
  try {
    console.log('🔍 Viewing database contents...\n');

    // Check users table
    console.log('👥 USERS:');
    const users = await query('SELECT * FROM users ORDER BY created_at DESC');
    console.table(users.rows);

    // Check activities table
    console.log('\n📊 ACTIVITIES:');
    const activities = await query(`
      SELECT 
        a.id,
        u.email,
        a.type,
        a.title,
        a.status,
        a.duration,
        a.created_at
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `);
    console.table(activities.rows);

    // Activity counts by type
    console.log('\n📈 ACTIVITY COUNTS BY TYPE:');
    const counts = await query(`
      SELECT 
        type,
        COUNT(*) as count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM activities 
      GROUP BY type
      ORDER BY count DESC
    `);
    console.table(counts.rows);

    // Recent activity summary
    console.log('\n⏰ RECENT ACTIVITIES (Last 5):');
    const recent = await query(`
      SELECT 
        u.email,
        a.type,
        a.title,
        a.status,
        a.created_at
      FROM activities a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
      LIMIT 5
    `);
    recent.rows.forEach((activity, index) => {
      console.log(`${index + 1}. ${activity.email} - ${activity.type} - ${activity.title} (${activity.status})`);
    });

    // Database size info
    console.log('\n💾 DATABASE SIZE:');
    const size = await query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    `);
    console.table(size.rows);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error viewing database:', error);
    process.exit(1);
  }
}

viewDatabase();
