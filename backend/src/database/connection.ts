import { Pool, PoolClient, QueryResult } from 'pg';
import { createClient, RedisClientType } from 'redis';
import { logger } from '@/utils/logger';
import { DatabaseConfig } from '@/types';

class Database {
  private pool: Pool;
  private redis: RedisClientType;
  private static instance: Database;

  private constructor() {
    const config: DatabaseConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'okaygoal',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || ''
    };

    this.pool = new Pool({
      ...config,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      statement_timeout: 30000,
      query_timeout: 30000
    });

    this.redis = createClient({
      url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
      password: process.env.REDIS_PASSWORD || undefined
    });

    // Don't initialize connections immediately - let health check handle it gracefully
    // this.initializeConnections();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async initializeConnections(): Promise<void> {
    try {
      // Test PostgreSQL connection
      const client = await this.pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      logger.info('PostgreSQL connected successfully');

      // Initialize Redis connection
      await this.redis.connect();
      await this.redis.ping();
      logger.info('Redis connected successfully');

      // Set up connection error handlers
      this.pool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
      });

      this.redis.on('error', (err) => {
        logger.error('Redis connection error:', err);
      });

    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  // PostgreSQL query methods
  public async query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    
    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;
      
      if (duration > 1000) {
        logger.warn(`Slow query detected (${duration}ms):`, { text, params });
      }
      
      return result;
    } catch (error) {
      logger.error('Database query error:', { text, params, error });
      throw error;
    }
  }

  public async queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  public async queryMany<T = any>(text: string, params?: any[]): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  public async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // Redis methods
  public getRedis(): RedisClientType {
    return this.redis;
  }

  public async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      logger.error('Redis GET error:', { key, error });
      return null;
    }
  }

  public async set(key: string, value: string, ttl?: number): Promise<boolean> {
    try {
      if (ttl) {
        await this.redis.setEx(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
      return true;
    } catch (error) {
      logger.error('Redis SET error:', { key, value, ttl, error });
      return false;
    }
  }

  public async del(key: string): Promise<boolean> {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', { key, error });
      return false;
    }
  }

  public async exists(key: string): Promise<boolean> {
    try {
      return (await this.redis.exists(key)) > 0;
    } catch (error) {
      logger.error('Redis EXISTS error:', { key, error });
      return false;
    }
  }

  // Cache helpers
  public async getFromCache<T>(key: string): Promise<T | null> {
    try {
      const cached = await this.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      logger.error('Cache parse error:', { key, error });
      return null;
    }
  }

  public async setInCache<T>(key: string, value: T, ttl: number = 300): Promise<boolean> {
    try {
      return await this.set(key, JSON.stringify(value), ttl);
    } catch (error) {
      logger.error('Cache stringify error:', { key, value, error });
      return false;
    }
  }

  // Transaction support
  public async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Health check
  public async healthCheck(): Promise<{ postgres: boolean; redis: boolean }> {
    const health = { postgres: false, redis: false };

    try {
      // Try to connect if not already connected
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      await this.query('SELECT 1');
      health.postgres = true;
    } catch (error) {
      logger.info('PostgreSQL health check failed (expected if not configured yet):', error);
    }

    try {
      if (!this.redis.isOpen) {
        await this.redis.connect();
      }
      await this.redis.ping();
      health.redis = true;
    } catch (error) {
      logger.info('Redis health check failed (expected if not configured yet):', error);
    }

    return health;
  }

  // Cleanup connections
  public async close(): Promise<void> {
    try {
      await this.pool.end();
      await this.redis.quit();
      logger.info('Database connections closed');
    } catch (error) {
      logger.error('Error closing database connections:', error);
    }
  }
}

export const db = Database.getInstance();