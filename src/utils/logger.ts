/**
 * Application logger utility
 *
 * Current implementation: Environment-aware console logging
 * Future migration: Replace with Sentry integration
 *
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.error('Failed to fetch data', error, { context: 'fetchLeaderboard' });
 *
 * Migration notes:
 *   When migrating to Sentry, replace the production branches with:
 *   Sentry.captureException(error, { tags, extra: context });
 */

interface LogContext {
  [key: string]: any;
}

export const logger = {
  /**
   * Log error messages
   * In development: Outputs to console
   * In production: Silent (TODO: Send to Sentry)
   */
  error: (message: string, error?: Error | unknown, context?: LogContext): void => {
    if (import.meta.env.DEV) {
      console.error(`[Error] ${message}`, error, context);
    }
    // TODO: Replace with Sentry integration
    // Sentry.captureException(error, {
    //   tags: { context: context?.functionName || 'unknown' },
    //   extra: context
    // });
  },

  /**
   * Log warning messages
   * In development: Outputs to console
   * In production: Silent
   */
  warn: (message: string, data?: any): void => {
    if (import.meta.env.DEV) {
      console.warn(`[Warning] ${message}`, data);
    }
  },

  /**
   * Log info messages (for debugging)
   * In development: Outputs to console
   * In production: Silent
   */
  info: (message: string, data?: any): void => {
    if (import.meta.env.DEV) {
      console.info(`[Info] ${message}`, data);
    }
  },

  /**
   * Log debug messages (verbose logging)
   * In development: Outputs to console
   * In production: Silent
   */
  debug: (message: string, data?: any): void => {
    if (import.meta.env.DEV) {
      console.debug(`[Debug] ${message}`, data);
    }
  }
};
