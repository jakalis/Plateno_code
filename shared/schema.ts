import { pgTable, text, serial, integer, boolean, uuid, timestamp, json, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Hotels Table
export const hotels = pgTable("hotels", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  location: text("location").notNull(),
  qr_code_url: text("qr_code_url").notNull(),
  is_active: boolean("is_active").notNull().default(true),
  contact: jsonb("contact").default({}), // <-- added this line
  service: jsonb("service").default({}), // <-- added this line
});

// Users Table
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["hotel_owner", "super_admin"] }).notNull(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "set null" }),
});

// Menu Items Table
export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(),
  price: text("price").notNull(),
  description: text("description").notNull(),
  photo_url: text("photo_url").notNull(),
  category: text("category").notNull(),
  meal_type: text("meal_type").notNull(),
  available_till: text("available_till").notNull(),
  is_approved: boolean("is_approved").notNull().default(false),
});

// Menu Update Requests Table
export const menuUpdateRequests = pgTable("menu_update_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  hotel_id: uuid("hotel_id").references(() => hotels.id, { onDelete: "cascade" }).notNull(),
  item_id: uuid("item_id").references(() => menuItems.id, { onDelete: "cascade" }),
  requested_changes: json("requested_changes").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  submitted_at: timestamp("submitted_at").defaultNow().notNull(),
});

// Insert Schemas
export const insertHotelSchema = createInsertSchema(hotels).omit({ id: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertMenuItemSchema = createInsertSchema(menuItems).omit({ id: true });
export const insertMenuUpdateRequestSchema = createInsertSchema(menuUpdateRequests).omit({ id: true, submitted_at: true });

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Types
export type Hotel = typeof hotels.$inferSelect;
export type InsertHotel = z.infer<typeof insertHotelSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type MenuItem = typeof menuItems.$inferSelect;
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;

export type MenuUpdateRequest = typeof menuUpdateRequests.$inferSelect;
export type InsertMenuUpdateRequest = z.infer<typeof insertMenuUpdateRequestSchema>;

export type LoginCredentials = z.infer<typeof loginSchema>;
