/**
 * Configuration settings for the application
 * Values are loaded from environment variables with sensible defaults
 */
export default () => ({
  // Application settings
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3000,
  DATABASE_ENABLED: process.env.DATABASE_ENABLED === 'true',

  // JWT settings
  JWT_SECRET:
    process.env.JWT_SECRET || 'replace_this_with_strong_secret_in_production',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1d',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET ||
    'replace_this_with_strong_refresh_secret_in_production',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '7d',

  // Database settings
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: parseInt(process.env.DB_PORT, 10) || 5432,
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'nest_starter',

  // Throttling settings
  THROTTLE_TTL: parseInt(process.env.THROTTLE_TTL, 10) || 60,
  THROTTLE_LIMIT: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,

  // Swagger settings
  SWAGGER_ENABLED:
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV === 'development',

  // SMTP / Email settings
  SMTP_HOST: process.env.SMTP_HOST || '',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  APP_URL: process.env.APP_URL || 'http://localhost:3000',
  ENGINEER_PORTAL_URL: process.env.ENGINEER_PORTAL_URL || 'http://localhost:4000',
  ADMIN_PORTAL_URL: process.env.ADMIN_PORTAL_URL || 'http://localhost:4100',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@iet.or.tz',
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || 'IET Tanzania',

  // DigitalOcean Spaces (S3-compatible) settings
  DO_SPACES_KEY: process.env.DO_SPACES_KEY || '',
  DO_SPACES_SECRET: process.env.DO_SPACES_SECRET || '',
  DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT || '',
  DO_SPACES_REGION: process.env.DO_SPACES_REGION || 'us-east-1',
  DO_SPACES_BUCKET: process.env.DO_SPACES_BUCKET || '',
  DO_SPACES_CDN_URL: process.env.DO_SPACES_CDN_URL || '',

  // ClickPesa payment settings
  CLICKPESA_BASE_URL:
    process.env.CLICKPESA_BASE_URL ||
    'https://api.clickpesa.com/third-parties',
  CLICKPESA_CLIENT_ID: process.env.CLICKPESA_CLIENT_ID || '',
  CLICKPESA_API_KEY: process.env.CLICKPESA_API_KEY || '',
  CLICKPESA_USE_CHECKSUM: process.env.CLICKPESA_USE_CHECKSUM === 'true',
  CLICKPESA_CALLBACK_URL: process.env.CLICKPESA_CALLBACK_URL || '',

  // Beem Africa SMS settings
  BEEM_API_KEY: process.env.BEEM_API_KEY || '',
  BEEM_SECRET_KEY: process.env.BEEM_SECRET_KEY || '',
  BEEM_SENDER_ID: process.env.BEEM_SOURCE_ADDR || 'IET',

  // Application fee configuration
  APPLICATION_FEE_GRADUATE:
    parseInt(process.env.APPLICATION_FEE_GRADUATE, 10) || 5000,
  APPLICATION_FEE_STANDARD:
    parseInt(process.env.APPLICATION_FEE_STANDARD, 10) || 10000,
});
