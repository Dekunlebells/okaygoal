import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const nodeEnv = process.env.NODE_ENV || 'development';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}] ${message} ${metaStr}`;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: { 
    service: 'okaygoal-backend',
    environment: nodeEnv 
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: nodeEnv === 'development' ? consoleFormat : logFormat,
      handleExceptions: true,
      handleRejections: true
    }),

    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),

    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ],
  exitOnError: false
});

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}

// Performance logging helper
export const performanceLogger = {
  start: (operation: string) => {
    const start = process.hrtime.bigint();
    return {
      end: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        logger.info(`Performance: ${operation} completed in ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
};

// Structured logging helpers
export const loggerHelpers = {
  // HTTP request logging
  httpRequest: (method: string, url: string, statusCode: number, duration: number) => {
    logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration,
      type: 'http_request'
    });
  },

  // Database query logging
  dbQuery: (query: string, duration: number, rowCount?: number) => {
    logger.debug('Database Query', {
      query: query.substring(0, 200) + (query.length > 200 ? '...' : ''),
      duration,
      rowCount,
      type: 'db_query'
    });
  },

  // API integration logging
  apiCall: (service: string, endpoint: string, statusCode: number, duration: number) => {
    logger.info('External API Call', {
      service,
      endpoint,
      statusCode,
      duration,
      type: 'api_call'
    });
  },

  // WebSocket logging
  websocket: (event: string, clientId?: string, data?: any) => {
    logger.info('WebSocket Event', {
      event,
      clientId,
      data: data ? JSON.stringify(data).substring(0, 100) : undefined,
      type: 'websocket'
    });
  },

  // User action logging
  userAction: (userId: string, action: string, metadata?: any) => {
    logger.info('User Action', {
      userId,
      action,
      metadata,
      type: 'user_action'
    });
  },

  // Security event logging
  security: (event: string, severity: 'low' | 'medium' | 'high', details: any) => {
    logger.warn('Security Event', {
      event,
      severity,
      details,
      type: 'security'
    });
  }
};