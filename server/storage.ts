import {
  Hotel,
  InsertHotel,
  User,
  InsertUser,
  MenuItem,
  InsertMenuItem,
  MenuUpdateRequest,
  InsertMenuUpdateRequest,
  hotels,
  users,
  menuItems,
  menuUpdateRequests,
  subscriptions, 
  type Subscription,
  type InsertSubscription
} from "@shared/schema";
import { eq, and, lt, asc, desc, sql, isNull, gte } from "drizzle-orm";
import { db, pool } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { hashPassword } from "./auth";
import { format } from "date-fns";
import { PgColumn } from "drizzle-orm/pg-core";

export interface IStorage {
  // Hotel Methods
  getHotels(): Promise<Hotel[]>;
  getHotel(id: string): Promise<Hotel | undefined>;
  createHotel(hotel: InsertHotel): Promise<Hotel>;
  updateHotel(id: string, hotel: Partial<Hotel>): Promise<Hotel | undefined>;
  deleteHotel(id: string): Promise<boolean>;
  getHotelContact(id: string): Promise<JSON | null>;
  getHotelService(id: string): Promise<JSON | null>;

  updateHotelOwnerStatus(
    id: string,
    isActive: boolean,
    subscription_updated_date: Date
  ): Promise<Hotel | undefined> ;

  updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined>;

  // User Methods
  getUsers(): Promise<User[]>;
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<User>): Promise<User | undefined>;

  // MenuItem Methods
  getMenuItems(hotelId?: string): Promise<MenuItem[]>;
  getMenuItem(id: string): Promise<MenuItem | undefined>;
  createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem>;
  updateMenuItem(
    id: string,
    menuItem: Partial<MenuItem>,
  ): Promise<MenuItem | undefined>;
  deleteMenuItem(id: string): Promise<boolean>;

  // MenuUpdateRequest Methods
  getMenuUpdateRequests(hotelId?: string): Promise<MenuUpdateRequest[]>;
  getMenuUpdateRequest(id: string): Promise<MenuUpdateRequest | undefined>;
  createMenuUpdateRequest(
    request: InsertMenuUpdateRequest,
  ): Promise<MenuUpdateRequest>;
  updateMenuUpdateRequest(
    id: string,
    request: Partial<MenuUpdateRequest>,
  ): Promise<MenuUpdateRequest | undefined>;

  // Subscriptions
  getSubscription(id: string): Promise<Subscription | undefined>;
  getActiveSubscription(hotelOwnerId: string): Promise<Subscription | undefined>;
  getAllSubscriptionsByHotelOwner(hotelOwnerId: string): Promise<Subscription[]>;
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  updateSubscriptionStatus(orderId: string, status: string): Promise<Subscription | undefined>;
  getExpiredSubscriptions(): Promise<{hotelOwnerId: string}[]>;
  getSubscriptionByOrderId(orderId: string): Promise<Subscription | undefined>;
  getSubscriptionEndDate(hotelId: string): Promise<Date | null>;

  // Session Store
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const PostgresStore = connectPg(session);
    this.sessionStore = new PostgresStore({
      pool,
      createTableIfMissing: true,
    });

    // Create the super admin user (only if it doesn't exist)
    this.initSuperAdmin();
  }
  async getSubscription(id: string): Promise<Subscription | undefined> {
    const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, id));
    return subscription;
  }
  async getActiveSubscription(hotelOwnerId: string): Promise<Subscription | undefined> {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.hotel_owner_id, hotelOwnerId),
          eq(subscriptions.payment_status, "paid"),
          gte(subscriptions.end_date, today)
        )
      )
      .orderBy(subscriptions.end_date);
    
    return subscription;
  }
  async getAllSubscriptionsByHotelOwner(hotelOwnerId: string): Promise<Subscription[]> {
    return await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.hotel_owner_id, hotelOwnerId))
    .orderBy(desc(subscriptions.created_at));
  }
  async createSubscription(subscription: InsertSubscription): Promise<Subscription> {
    const [newSubscription] = await db
    .insert(subscriptions)
    .values(subscription)
    .returning();
  
  return newSubscription;
  }
  async updateSubscriptionStatus(orderId: string, status: string): Promise<Subscription | undefined> {
        // Ensure status is a valid payment_status type
        if (status !== "pending" && status !== "paid" && status !== "failed") {
          console.error(`Invalid payment status: ${status}`);
          return undefined;
        }
        
        const [updatedSubscription] = await db
          .update(subscriptions)
          .set({ payment_status: status as "pending" | "paid" | "failed" })
          .where(eq(subscriptions.razorpay_order_id, orderId))
          .returning();
        
        return updatedSubscription;
  }

  async getExpiredSubscriptions(): Promise<{ hotelOwnerId: string }[]> {
    const today = new Date();
  
    // Get all hotels whose subscription has expired
    const expiredSubscriptions = await db
      .select({ id: hotels.id }) // only select the required field
      .from(hotels)
      .where(lt(hotels.subscription_end_date, today));
  
    return expiredSubscriptions.map((hotel) => ({
      hotelOwnerId: hotel.id,
    }));
  }


  async getSubscriptionByOrderId(orderId: string): Promise<Subscription | undefined> {
        console.log("Looking for subscription with order ID:", orderId);
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.razorpay_order_id, orderId));
      
    if (subscription) {
      console.log("Found subscription:", subscription.id);
    } else {
      console.log("No subscription found with order ID:", orderId);
    }
    
    return subscription;
  }

  private async initSuperAdmin() {
    try {
      const existingAdmin = await this.getUserByEmail("admin@example.com");
      if (!existingAdmin) {
        const hashedPassword = await hashPassword("password123");
        await this.createUser({
          email: "admin@example.com",
          password: hashedPassword,
          role: "super_admin",
          hotel_id: null,
        });
        console.log("Created super admin user");
      }
    } catch (error) {
      console.error("Error creating super admin:", error);
    }
  }

  async getHotelContact(hotelId: string):Promise<JSON | null> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId));
    
    return hotel?.contact as JSON || null;
  }

  async getHotelService(hotelId: string):Promise<JSON | null> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, hotelId));
    
    return hotel?.service as JSON || null;
  }
  

  // Hotel Methods
  async getHotels(): Promise<Hotel[]> {
    return await db.select().from(hotels);
  }

  async getHotel(id: string): Promise<Hotel | undefined> {
    const [hotel] = await db.select().from(hotels).where(eq(hotels.id, id));
    return hotel;
  }

  async createHotel(hotel: InsertHotel): Promise<Hotel> {
    const [newHotel] = await db.insert(hotels).values(hotel).returning();
    return newHotel;
  }

  async updateHotel(
    id: string,
    hotel: Partial<Hotel>,
  ): Promise<Hotel | undefined> {
    const [updatedHotel] = await db
      .update(hotels)
      .set(hotel)
      .where(eq(hotels.id, id))
      .returning();
    return updatedHotel;
  }

  async deleteHotel(id: string): Promise<boolean> {
    const deleted = await db
      .delete(hotels)
      .where(eq(hotels.id, id))
      .returning();
    return deleted.length > 0;
  }

  // User Methods
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    // Ensure email is lowercase for consistency
    const userData = { ...user, email: user.email.toLowerCase() };
    const [newUser] = await db.insert(users).values(userData).returning();
    return newUser;
  }

  async updateUser(id: string, user: Partial<User>): Promise<User | undefined> {
    // If updating email, ensure it's lowercase
    const userData = { ...user };
    if (userData.email) {
      userData.email = userData.email.toLowerCase();
    }

    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // MenuItem Methods
  async getMenuItems(hotelId?: string): Promise<MenuItem[]> {
    if (hotelId) {
      return await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.hotel_id, hotelId));
    }
    return await db.select().from(menuItems);
  }

  async getMenuItem(id: string): Promise<MenuItem | undefined> {
    const [item] = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, id));
    return item;
  }

  async createMenuItem(menuItem: InsertMenuItem): Promise<MenuItem> {
    console.log("create menu item is getting called twice");
    const [newMenuItem] = await db
      .insert(menuItems)
      .values(menuItem)
      .returning();
    return newMenuItem;
  }

  async updateMenuItem(
    id: string,
    menuItem: Partial<MenuItem>,
  ): Promise<MenuItem | undefined> {
    const [updatedMenuItem] = await db
      .update(menuItems)
      .set(menuItem)
      .where(eq(menuItems.id, id))
      .returning();
    return updatedMenuItem;
  }

  async deleteMenuItem(id: string): Promise<boolean> {
    const deleted = await db
      .delete(menuItems)
      .where(eq(menuItems.id, id))
      .returning();
    return deleted.length > 0;
  }

  // MenuUpdateRequest Methods
  async getMenuUpdateRequests(hotelId?: string): Promise<MenuUpdateRequest[]> {
    if (hotelId) {
      return await db
        .select()
        .from(menuUpdateRequests)
        .where(eq(menuUpdateRequests.hotel_id, hotelId));
    }
    return await db.select().from(menuUpdateRequests);
  }

  async getMenuUpdateRequest(
    id: string,
  ): Promise<MenuUpdateRequest | undefined> {
    const [request] = await db
      .select()
      .from(menuUpdateRequests)
      .where(eq(menuUpdateRequests.id, id));
    return request;
  }

  async createMenuUpdateRequest(
    request: InsertMenuUpdateRequest,
  ): Promise<MenuUpdateRequest> {
    const [newRequest] = await db
      .insert(menuUpdateRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateMenuUpdateRequest(
    id: string,
    request: Partial<MenuUpdateRequest>,
  ): Promise<MenuUpdateRequest | undefined> {
    const [updatedRequest] = await db
      .update(menuUpdateRequests)
      .set(request)
      .where(eq(menuUpdateRequests.id, id))
      .returning();

    // If the request is approved, update or create the menu item
    if (
      updatedRequest.status === "approved" &&
      updatedRequest.requested_changes
    ) {
      const changes = updatedRequest.requested_changes as any;

      if (updatedRequest.item_id) {
        // Update existing menu item
        await this.updateMenuItem(updatedRequest.item_id, {
          ...changes,
          is_approved: true,
        });
      } else {
        // Create new menu item
        await this.createMenuItem({
          ...changes,
          hotel_id: updatedRequest.hotel_id,
          is_approved: true,
        });
      }
    }

    return updatedRequest;
  }

  async updateHotelOwnerStatus(
    id: string,
    isActive: boolean,
    subscription_updated_date: Date
  ): Promise<Hotel | undefined> {
  
    const [updatedOwner] = await db
      .update(hotels)
      .set({
        is_active: isActive,
        subscription_end_date: subscription_updated_date,
      })
      .where(eq(hotels.id, id))
      .returning();
  
    return updatedOwner;
  }

  async getSubscriptionEndDate(hotelId: string): Promise<Date | null> {
    const result = await db
      .select({ subscriptionEndDate: hotels.subscription_end_date })
      .from(hotels)
      .where(eq(hotels.id, hotelId))
      .limit(1);
  
    if (result.length === 0) {
      return null; // hotel not found
    }
  
    return result[0].subscriptionEndDate;
  }

  async updateUserPassword(userId: string, hashedPassword: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId))
      .returning();
  
    return updatedUser;
  }
  
  
}

export const storage = new DatabaseStorage();

