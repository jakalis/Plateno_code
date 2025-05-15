import { relations } from "drizzle-orm";
import { pgTable, text, serial, integer, boolean, uuid, timestamp, json, jsonb, date, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
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
  subscription_end_date: timestamp("subscription_end_date").defaultNow().notNull(),
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


export const hotelOwnersRelations = relations(hotels, ({ many }) => ({
  subscriptions: many(subscriptions),
}));

// Subscription
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  hotel_owner_id: uuid("hotel_owner_id").notNull().references(() => hotels.id),
  plan_type: text("plan_type", { enum: ["monthly", "yearly"] }).notNull(),
  start_date: date("start_date").notNull(),
  end_date: date("end_date").notNull(),
  razorpay_order_id: varchar("razorpay_order_id", { length: 255 }).notNull(),
  payment_status: text("payment_status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  amount: text("amount").notNull(),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  hotelOwner: one(hotels, {
    fields: [subscriptions.hotel_owner_id],
    references: [hotels.id],
  }),
}));

export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({ 
  // id: true, 
  created_at: true 
});
export const selectSubscriptionSchema = createSelectSchema(subscriptions);

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

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;

// Payment types
export const paymentSchema = z.object({
  type: z.enum(["monthly", "yearly"]),
  hotelOwnerId: z.string().uuid(),
});

export type PaymentData = z.infer<typeof paymentSchema>;
