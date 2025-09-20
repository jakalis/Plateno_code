import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import https from "https";
import fs from "fs";
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


import path from "path";




// Allow your Vercel frontend domain and local development
const allowedOrigins = [
  "https://plateno-code.vercel.app", // replace with your actual Vercel URL
  "https://localhost:5000" // Vite dev server (optional, for local dev)
];

const app = express();
app.use(express.json());

app.set("trust proxy", 1);
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// ✅ configure the session cookie for cross-site usage
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,        // only over https
    sameSite: "none"     // **critical** for cross-origin
  }
}));

// ✅ Add passport middleware
app.use(passport.initialize());
app.use(passport.session());

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // HTTPS options - load your self-signed certs here

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
};


  const port = process.env.PORT ? Number(process.env.PORT) : 5000;

  log('About to start HTTPS server...');
  https.createServer(httpsOptions, app).listen(port, "0.0.0.0", () => {
    log(`HTTPS server serving on port ${port}`);
  });
})();
