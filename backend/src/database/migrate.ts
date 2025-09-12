import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';
import { logger } from '@/utils/logger';

interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

async function runMigration(): Promise<void> {
  const config: DatabaseConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'okaygoal',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || ''
  };

  const pool = new Pool(config);

  try {
    logger.info('Starting database migration...');

    // Read and execute schema file
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    // Split schema by statements and execute each one
    const statements = schema
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);

    for (const statement of statements) {
      try {
        await pool.query(statement);
      } catch (error: any) {
        // Ignore errors for CREATE EXTENSION and CREATE TABLE IF NOT EXISTS
        if (!error.message.includes('already exists')) {
          logger.error(`Error executing statement: ${statement.substring(0, 100)}...`);
          throw error;
        }
      }
    }

    // Verify core tables exist
    const tableCheckQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    const tables = await pool.query(tableCheckQuery);
    logger.info(`Migration completed successfully. Created ${tables.rows.length} tables:`);
    tables.rows.forEach(row => logger.info(`  - ${row.table_name}`));

    // Check if views were created
    const viewCheckQuery = `
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;

    const views = await pool.query(viewCheckQuery);
    logger.info(`Created ${views.rows.length} views:`);
    views.rows.forEach(row => logger.info(`  - ${row.table_name}`));

  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  require('dotenv').config();
  
  runMigration()
    .then(() => {
      logger.info('Database migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database migration failed:', error);
      process.exit(1);
    });
}

export default runMigration;