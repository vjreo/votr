/**
 * Async Route Handler Wrapper
 * Catches unhandled promise rejections in async route handlers and forwards
 * them to Express's error handling middleware. Without this, async errors
 * cause silent hangs or unhandled rejection crashes.
 *
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
