import { pool, query } from '../config/database';
import { SCHEMA_SQL } from './schema.sql';

export const initializeDatabase = async (): Promise<void> => {
  console.log('🔄 Initializing PostgreSQL database tables and enums...');
  try {
    // Test connectivity
    const testResult = await query('SELECT NOW() as current_time, current_database() as db_name;');
    console.log(`✅ Connected to database: "${testResult.rows[0].db_name}" at ${testResult.rows[0].current_time}`);

    // Execute idempotent schema setup
    await query(SCHEMA_SQL);
    console.log('✅ Database schema initialized successfully (users, projects, tasks, enums, indexes).');
  } catch (error) {
    console.error('❌ Failed to initialize database schema:', error);
    throw error;
  }
};

// If run directly via CLI (npm run db:init)
if (require.main === module) {
  initializeDatabase()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async () => {
      await pool.end();
      process.exit(1);
    });
}
