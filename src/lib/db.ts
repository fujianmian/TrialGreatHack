import { Pool } from 'pg';

const useSSL = process.env.DB_SSL === 'true';

// ✅ Create the pool instance
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: useSSL ? { rejectUnauthorized: false } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// ✅ Helper function to execute queries
export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// ✅ Database schema initialization trigger
export async function initializeDatabase() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title TEXT NOT NULL,
        input_text TEXT,
        result JSONB,
        status VARCHAR(20) NOT NULL,
        duration INTEGER,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS summaries (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        summary_text TEXT NOT NULL,
        key_points JSONB,
        word_count INTEGER,
        original_word_count INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS quizzes (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        questions JSONB NOT NULL,
        difficulty VARCHAR(20),
        score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS mindmaps (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        nodes JSONB NOT NULL,
        connections JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS videos (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        video_url TEXT,
        transcript TEXT,
        duration INTEGER,
        style VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS pictures (
        id SERIAL PRIMARY KEY,
        activity_id INTEGER REFERENCES activities(id),
        image_url TEXT NOT NULL,
        prompt TEXT,
        style VARCHAR(50),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    throw error;
  }
}

// ✅ Helper functions
export async function createUser(email: string) {
  const result = await query(
    'INSERT INTO users (email) VALUES ($1) ON CONFLICT (email) DO NOTHING RETURNING id',
    [email]
  );
  return result.rows[0];
}

export async function getUserByEmail(email: string) {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}

export async function createActivity(data: {
  userEmail: string;
  type: string;
  title: string;
  inputText?: string;
  result?: any;
  status: string;
  duration?: number;
  metadata?: any;
}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let user = await getUserByEmail(data.userEmail);
    if (!user) {
      user = await createUser(data.userEmail);
    }

    const activityResult = await client.query(
      `INSERT INTO activities 
       (user_id, type, title, input_text, result, status, duration, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        user.id,
        data.type,
        data.title,
        data.inputText,
        data.result,
        data.status,
        data.duration,
        data.metadata,
      ]
    );

    const activityId = activityResult.rows[0].id;

    // Type-specific inserts
    switch (data.type) {
      case 'summary':
        if (data.result?.summary) {
          await client.query(
            `INSERT INTO summaries 
             (activity_id, summary_text, key_points, word_count, original_word_count)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              activityId,
              data.result.summary,
              JSON.stringify(data.result.keyPoints),
              data.result.wordCount,
              data.result.originalWordCount,
            ]
          );
        }
        break;

      case 'quiz':
        if (data.result?.questions) {
          await client.query(
            `INSERT INTO quizzes 
             (activity_id, questions, difficulty, score)
             VALUES ($1, $2, $3, $4)`,
            [
              activityId,
              JSON.stringify(data.result.questions),
              data.metadata?.difficulty,
              data.metadata?.score,
            ]
          );
        }
        break;

      case 'mindmap':
        if (data.result?.nodes) {
          await client.query(
            `INSERT INTO mindmaps 
             (activity_id, nodes, connections)
             VALUES ($1, $2, $3)`,
            [
              activityId, 
              JSON.stringify(data.result.nodes), 
              JSON.stringify(data.result.connections)
            ]
          );
        }
        break;

      case 'video':
        if (data.result?.videoUrl) {
          await client.query(
            `INSERT INTO videos 
             (activity_id, video_url, transcript, duration, style)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              activityId,
              data.result.videoUrl,
              data.result.transcript,
              data.result.duration,
              data.metadata?.style,
            ]
          );
        }
        break;

      case 'picture':
        if (data.result?.imageUrl) {
          await client.query(
            `INSERT INTO pictures 
             (activity_id, image_url, prompt, style)
             VALUES ($1, $2, $3, $4)`,
            [
              activityId,
              data.result.imageUrl,
              data.result.prompt,
              data.metadata?.style,
            ]
          );
        }
        break;
    }

    await client.query('COMMIT');
    return activityId;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function getActivitiesByUser(email: string) {
  const result = await query(
    `SELECT 
       a.*,
       CASE
         WHEN a.type = 'summary' THEN json_build_object(
           'summary', s.summary_text,
           'keyPoints', s.key_points,
           'wordCount', s.word_count,
           'originalWordCount', s.original_word_count
         )
         WHEN a.type = 'quiz' THEN json_build_object(
           'questions', q.questions,
           'difficulty', q.difficulty,
           'score', q.score
         )
         WHEN a.type = 'mindmap' THEN json_build_object(
           'nodes', m.nodes,
           'connections', m.connections
         )
         WHEN a.type = 'video' THEN json_build_object(
           'videoUrl', v.video_url,
           'transcript', v.transcript,
           'duration', v.duration,
           'style', v.style
         )
         WHEN a.type = 'picture' THEN json_build_object(
           'imageUrl', p.image_url,
           'prompt', p.prompt,
           'style', p.style
         )
       END as type_specific_data
     FROM activities a
     LEFT JOIN users u ON a.user_id = u.id
     LEFT JOIN summaries s ON a.id = s.activity_id
     LEFT JOIN quizzes q ON a.id = q.activity_id
     LEFT JOIN mindmaps m ON a.id = m.activity_id
     LEFT JOIN videos v ON a.id = v.activity_id
     LEFT JOIN pictures p ON a.id = p.activity_id
     WHERE u.email = $1
     ORDER BY a.created_at DESC`,
    [email]
  );

  return result.rows.map(row => ({
    id: row.id,
    type: row.type,
    title: row.title,
    inputText: row.input_text,
    result: { ...row.result, ...row.type_specific_data },
    status: row.status,
    duration: row.duration,
    metadata: row.metadata,
    timestamp: row.created_at,
  }));
}

// Export pool for cleanup if needed
export { pool };