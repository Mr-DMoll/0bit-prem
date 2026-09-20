import { Request, Response, NextFunction } from "express";

// Lets browsers reuse a public, non-user-specific GET response instead of
// re-hitting the API on every navigation. stale-while-revalidate serves the
// cached copy instantly while the browser refreshes it in the background, so
// admin edits still show up within a minute without the visitor waiting.
// Only apply this to endpoints whose body is identical for every visitor.
export function publicCache(maxAgeSeconds = 30, staleSeconds = 300) {
  return (_req: Request, res: Response, next: NextFunction) => {
    res.setHeader(
      "Cache-Control",
      `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${staleSeconds}`
    );
    next();
  };
}
