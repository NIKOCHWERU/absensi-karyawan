import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // No-cache headers for critical PWA files
  app.get(["/index.html", "/sw.js"], (req, res, next) => {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
  });

  app.use(express.static(distPath, {
    setHeaders: (res, path) => {
      // Also ensure manifest.json is not cached too long
      if (path.endsWith('manifest.json')) {
        res.setHeader('Cache-Control', 'no-cache');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist, but ONLY for navigation requests
  app.get("/{*path}", (req, res) => {
    // If the request looks like a file (has an extension), don't serve index.html
    // This prevents syntax errors when old JS bundles are missing
    if (req.path.includes(".") && !req.path.endsWith(".html")) {
      return res.status(404).end();
    }
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
