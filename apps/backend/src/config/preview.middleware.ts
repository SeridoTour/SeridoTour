import type { NextFunction, Request, Response } from 'express';

export function previewMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
) {
  if (process.env.DEPLOYMENT_ENV !== 'preview') return next();

  response.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.setHeader('Cache-Control', 'no-store');

  const isHealthCheck =
    ['GET', 'HEAD'].includes(request.method) &&
    /^\/health\/?$/.test(request.path);
  if (process.env.PREVIEW_DATA_REVIEWED !== 'true' && !isHealthCheck) {
    response.status(503).json({
      statusCode: 503,
      code: 'PREVIEW_NOT_READY',
      message: 'Preview em preparação. A revisão dos dados ainda não foi concluída.',
    });
    return;
  }
  next();
}
