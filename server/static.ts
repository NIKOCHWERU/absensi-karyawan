import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  // Resolve the correct static files directory.
  // In production (running from dist/index.cjs), __dirname = dist/
  // so the public folder is at dist/public (same level as index.cjs).
  // We try multiple candidate paths in order.
  const candidatePaths = [
    path.resolve(__dirname, "public"),           // production: dist/public
    path.resolve(process.cwd(), "dist", "public"), // fallback via cwd
    path.resolve(__dirname, "..", "dist", "public"), // extra fallback
  ];

  let distPath: string | undefined;
  for (const candidate of candidatePaths) {
    if (fs.existsSync(candidate)) {
      distPath = candidate;
      break;
    }
  }

  if (!distPath) {
    console.error(
      `[static] Could not find build directory. Tried:\n${candidatePaths.join("\n")}\n` +
      `Make sure to run 'npm run build' before starting in production.`
    );
    // Don't throw – let the API still work even if static files are missing
    // (avoids crashing the whole server on a missing build)
    app.get("/{*path}", (req, res) => {
      if (!req.path.startsWith("/api")) {
        res.status(503).send("Application build not found. Please redeploy.");
      }
    });
    return;
  }

  console.log(`[static] Serving static files from: ${distPath}`);

  // No-cache headers for critical PWA files so users always get the latest version
  app.get(["/index.html", "/sw.js"], (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  app.use(
    express.static(distPath, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith("manifest.json")) {
          res.setHeader("Cache-Control", "no-cache");
        }
      },
    })
  );

  // SPA fallback: serve index.html for all navigation requests
  app.get("/{*path}", (req, res) => {
    // If the request looks like a static asset (has an extension other than .html),
    // return 404 instead of serving index.html to avoid confusing old cached bundles
    if (req.path.includes(".") && !req.path.endsWith(".html")) {
      return res.status(404).end();
    }
    res.sendFile(path.resolve(distPath!, "index.html"));
  });
}
