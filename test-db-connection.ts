import { Client } from "pg";
import "dotenv/config";

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    await client.connect();
    console.log("✅ Connected to PostgreSQL via TCP");

    const res = await client.query("SELECT NOW()");
    console.log("🕒 Current DB time:", res.rows[0]);

  } catch (err) {
    console.error("❌ Connection failed:", err);
  } finally {
    await client.end();
  }
}

testConnection();
