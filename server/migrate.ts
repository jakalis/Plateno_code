import "dotenv/config";
import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

async function main() {
  console.log("Starting database migration...");
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  // Create schema
  try {
    // Create hotels table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        qr_code_url TEXT NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        contact JSONB DEFAULT '{}'::jsonb,
        service JSONB DEFAULT '{}'::jsonb
      );
    `);
    console.log("Created hotels table");
    
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('hotel_owner', 'super_admin')),
        hotel_id UUID REFERENCES hotels(id) ON DELETE SET NULL
      );
    `);
    console.log("Created users table");
    
    // Create menu_items table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        description TEXT NOT NULL,
        photo_url TEXT NOT NULL,
        category TEXT NOT NULL,
        meal_type TEXT NOT NULL,
        available_till TEXT NOT NULL,
        is_approved BOOLEAN NOT NULL DEFAULT false
      );
    `);
    console.log("Created menu_items table");
    
    // Create menu_update_requests table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS menu_update_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hotel_id UUID NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        item_id UUID REFERENCES menu_items(id) ON DELETE CASCADE,
        requested_changes JSONB NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        submitted_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("Created menu_update_requests table");
    
    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

main();