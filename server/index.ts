import 'dotenv/config';
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from 'url';
import cors from "cors";
import session from "express-session";
import passport from "passport";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// __dirname workaround for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS config
const allowedOrigins = [
  "https://plateno-code.vercel.app",
  "https://localhost:5000", // only for local dev
];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Session config
const isProd = process.env.NODE_ENV === "production";

app.set("trust proxy", 1);
app.use(session({
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProd,               // only true in production
    sameSite: isProd ? "none" : "lax",
  }
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware, etc (your existing code)
app.use((req, res, next) => {
  // ... logging logic ...
  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err, _req, res, _next) => {
    const status = err.status || 500;
    res.status(status).json({ message: err.message || "Internal Server Error" });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT ? Number(process.env.PORT) : 5000;

  if (isProd) {
    // 🚀 Render or other production: HTTP only (Render handles HTTPS)
    app.listen(port, "0.0.0.0", () => {
      log(`HTTP server running on http://localhost:${port}`);
    });
  } else {
    // 💻 Local dev: Run with HTTPS using self-signed certs
    const httpsOptions = {
      key: fs.readFileSync(path.join(__dirname, "key.pem")),
      cert: fs.readFileSync(path.join(__dirname, "cert.pem")),
    };

    https.createServer(httpsOptions, app).listen(port, "0.0.0.0", () => {
      log(`HTTPS server running on https://localhost:${port}`);
    });
  }
})();
