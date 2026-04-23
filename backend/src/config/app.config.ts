/**
 * Application Configuration
 * Centralizes all environment variables and config
 */
export const AppConfig = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : true,
  
  // Rate limiting
  rateLimitPerMin: Number(process.env.RATE_LIMIT_PER_MIN) || 120,
  
  // Pagination
  maxPerPage: 1000,
  defaultPerPage: 20,
  
  // Validation
  maxKeywordLength: 255,
  
  // Database
  dbPath: process.env.DB_PATH,
  
  isProduction(): boolean {
    return this.nodeEnv === 'production';
  },
  
  isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  },
  
  isTest(): boolean {
    return this.nodeEnv === 'test';
  }
} as const;
