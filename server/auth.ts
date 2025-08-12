import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User, InsertUser, loginSchema } from "@shared/schema";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);
const resetTokens: Record<string, { userId: string; expiresAt: Date }> = {};

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "my-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  const oneWeekLater = new Date();
  oneWeekLater.setDate(oneWeekLater.getDate() + 7);

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          if (!(await comparePasswords(password, user.password))) {
            return done(null, false, { message: "Invalid email or password" });
          }
          
          return done(null, user);
        } catch (error) {
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint - Only hotel owners can register
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate request body - only allowing hotel_owner role
      const schema = z.object({
        email: z.string().email(),
        password: z.string().min(6),
        role: z.literal("hotel_owner"),
        hotel_name: z.string(),
        hotel_description: z.string(),
        hotel_location: z.string(),
        contact: z.record(z.string(), z.string()),
        service: z.record(z.string(), z.string()),
        subscription_end_date:  z.date(),// ✅ set default 7 days later
      });

        // Step 2: Manually construct a clean object
        const fullBody = {
          ...req.body,
          subscription_end_date: oneWeekLater, // ← converts it to string (safe for logging)
        };

        const validatedData = schema.parse(fullBody);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already in use" });
      }
      
      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);
      
      // Create hotel first since all regular users must be hotel owners
      const hotel = await storage.createHotel({
        name: validatedData.hotel_name,
        description: validatedData.hotel_description,
        location: validatedData.hotel_location,
        qr_code_url: `/hotel/${Date.now()}`,
        is_active: true,
        contact: validatedData.contact ?? {},
        service: validatedData.service ?? {},
        subscription_end_date:  validatedData.subscription_end_date,
      });
      
      // Create user
      const user = await storage.createUser({
        email: validatedData.email,
        password: hashedPassword,
        role: "hotel_owner",
        hotel_id: hotel.id
      });
      
      // Login the user
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Remove password from response
        const userResponse = { ...user };
        delete userResponse.password;
        
        res.status(201).json(userResponse);
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    try {
      // Validate request body
      loginSchema.parse(req.body);
      
      passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);
        if (!user) {
          return res.status(401).json({ message: info?.message || "Invalid email or password" });
        }
        
        req.login(user, (err) => {
          if (err) return next(err);
          
          // Remove password from response
          const userResponse = { ...user };
          delete userResponse.password;
          
          res.status(200).json(userResponse);
        });
      })(req, res, next);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      next(error);
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Remove password from response
    const userResponse = { ...req.user };
    delete userResponse.password;
    
    res.status(200).json(userResponse);
  });

  app.post("/api/forgot-password", async (req, res) => {
    const { email } = req.body;
  
    if (!email || typeof email !== "string") {
      return res.status(400).json({ message: "Email is required" });
    }
  
    const user = await storage.getUserByEmail(email);
    if (!user) {
      // Avoid leaking info
      return res.status(200).json({ message: "If this email is registered, a reset link has been sent" });
    }
  
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour validity
    resetTokens[token] = { userId: user.id, expiresAt };
  
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
    // Send email (replace with actual SMTP config)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  
    await transporter.sendMail({
      to: email,
      subject: "Password Reset Link",
      html: `<p>You requested a password reset. Click the link below to reset your password:</p>
             <a href="${resetLink}">${resetLink}</a>
             <p>This link is valid for 1 hour.</p>`,
    });
  
    res.status(200).json({ message: "If this email is registered, a reset link has been sent" });
  });

  app.post("/api/reset-password/:token", async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
  
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }
  
    const record = resetTokens[token];
    if (!record || record.expiresAt < new Date()) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }
  
    const user = await storage.getUser(record.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
  
    const hashed = await hashPassword(password);
    await storage.updateUserPassword(user.id, hashed);
  
    // Invalidate token
    delete resetTokens[token];
  
    res.status(200).json({ message: "Password updated successfully" });
  });
  
}
