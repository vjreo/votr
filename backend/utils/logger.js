/**
 * Shared Logging Utility
 * Provides structured logging with log levels and environment-based configuration
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const LOG_LEVEL_NAMES = {
  0: 'DEBUG',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR'
};

// Get log level from environment variable or default to INFO
const getLogLevel = () => {
  const envLevel = process.env.LOG_LEVEL?.toUpperCase();
  if (envLevel && LOG_LEVELS[envLevel] !== undefined) {
    return LOG_LEVELS[envLevel];
  }
  // Default to INFO in production, DEBUG in development
  return process.env.NODE_ENV === 'production' ? LOG_LEVELS.INFO : LOG_LEVELS.DEBUG;
};

const currentLogLevel = getLogLevel();

/**
 * Format log message with timestamp and level
 */
const formatMessage = (level, ...args) => {
  const timestamp = new Date().toISOString();
  const levelName = LOG_LEVEL_NAMES[level] || 'LOG';
  return `[${timestamp}] [${levelName}] ${args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ')}`;
};

/**
 * Check if a log level should be output
 */
const shouldLog = (level) => {
  return level >= currentLogLevel;
};

/**
 * Logger object with methods for each log level
 */
const logger = {
  /**
   * Debug level logging - detailed information for debugging
   */
  debug: (...args) => {
    if (shouldLog(LOG_LEVELS.DEBUG)) {
      console.log(formatMessage(LOG_LEVELS.DEBUG, ...args));
    }
  },

  /**
   * Info level logging - general informational messages
   */
  info: (...args) => {
    if (shouldLog(LOG_LEVELS.INFO)) {
      console.log(formatMessage(LOG_LEVELS.INFO, ...args));
    }
  },

  /**
   * Warn level logging - warning messages
   */
  warn: (...args) => {
    if (shouldLog(LOG_LEVELS.WARN)) {
      console.warn(formatMessage(LOG_LEVELS.WARN, ...args));
    }
  },

  /**
   * Error level logging - error messages
   */
  error: (...args) => {
    if (shouldLog(LOG_LEVELS.ERROR)) {
      console.error(formatMessage(LOG_LEVELS.ERROR, ...args));
    }
  }
};

export default logger;
