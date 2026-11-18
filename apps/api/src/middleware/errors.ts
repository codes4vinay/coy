import type { ErrorRequestHandler } from 'express';
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}
// Express identifies error middleware by its four arguments, including the unused next callback.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ApiError) {
    res
      .status(error.status)
      .json({ success: false, error: { code: error.code, message: error.message } });
    return;
  }
  const code =
    typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  if (code === 11000) {
    // The unique index is authoritative for both repeated and simultaneous swipe requests.
    res.status(409).json({
      success: false,
      error: { code: 'ALREADY_SWIPED', message: 'This profile has already been swiped.' },
    });
    return;
  }
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Request body must be valid JSON.' },
    });
    return;
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    error.type === 'entity.too.large'
  ) {
    res.status(413).json({
      success: false,
      error: { code: 'BODY_TOO_LARGE', message: 'Request body is too large.' },
    });
    return;
  }
  // Never return driver errors: they can contain database hosts, credentials, or stack traces.
  res.status(503).json({
    success: false,
    error: {
      code: 'SERVICE_UNAVAILABLE',
      message: 'We couldn’t save or load your data. Please try again.',
    },
  });
};
