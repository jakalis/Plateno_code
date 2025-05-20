import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z, ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { hotels, menuUpdateRequests, paymentSchema } from "@shared/schema";
import { addAllMenuItemsRoute, addHotelContactRoute, addHotelServiceRoute } from "./api-routes";
import { createOrder, verifyPaymentSignature } from "./razorpay";
import { addDays, format } from "date-fns";
import { setupCronJob, updateSubscriptionStatuses } from "./cron";
import { v4 as uuidv4 } from 'uuid';

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

// Middleware to check if user is a hotel owner
const isHotelOwner = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user?.role === "hotel_owner") {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Hotel owner access required" });
};

// Middleware to check if user is a super admin
const isSuperAdmin = (req: Request, res: Response, next: Function) => {
  if (req.isAuthenticated() && req.user?.role === "super_admin") {
    return next();
  }
  res.status(403).json({ message: "Forbidden - Super admin access required" });
};

// Middleware to check if hotel subscription is active
const isHotelActive = async (req: Request, res: Response, next: Function) => {
  const hotelId = req.params.hotelId || req.user?.hotel_id;

  if (!hotelId) {
    return res.status(400).json({ message: "Hotel ID is required" });
  }

  const hotel = await storage.getHotel(hotelId);

  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  if (!hotel.is_active) {
    return res.status(403).json({ message: "Hotel subscription is inactive" });
  }

  next();
};

export async function registerRoutes(app: Express): Promise<Server> {

  const httpServer = createServer(app);
  
  // Setup authentication
  setupAuth(app);

  // Add custom API routes
  addAllMenuItemsRoute(app);

  addHotelContactRoute(app); 

  addHotelServiceRoute(app);

    // Set up cron job to check and update subscription statuses
    setupCronJob(httpServer);

  // API Routes
  // Hotel Routes
  app.get("/api/hotels", isAuthenticated, async (req, res) => {
    try {
      const hotels = await storage.getHotels();
      res.json(hotels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotels" });
    }
  });

  // Current hotel owner's hotel information
  app.get("/api/my-hotel", isHotelOwner, async (req, res) => {
    try {
      if (!req.user.hotel_id) {
        return res
          .status(404)
          .json({ message: "No hotel associated with this account" });
      }

      const hotel = await storage.getHotel(req.user.hotel_id);

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      res.json(hotel);
    } catch (error) {
      console.error("Error fetching hotel:", error);
      res.status(500).json({ message: "Failed to fetch hotel information" });
    }
  });

  app.get("/api/hotels/:id", async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.id);

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      res.json(hotel);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch hotel" });
    }
  });

  app.post("/api/hotels", isSuperAdmin, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        location: z.string().min(1),
        is_active: z.boolean().optional(),
      });

      const validatedData = schema.parse(req.body);

      const qr_code_url = `/hotel/${Date.now()}`;

      const hotel = await storage.createHotel({
        ...validatedData,
        qr_code_url,
        is_active: validatedData.is_active ?? true,
      });

      res.status(201).json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to create hotel" });
    }
  });

  app.patch("/api/hotels/:id", isSuperAdmin, async (req, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().min(1).optional(),
        location: z.string().min(1).optional(),
        is_active: z.boolean().optional(),
      });

      const validatedData = schema.parse(req.body);

      const hotel = await storage.updateHotel(req.params.id, validatedData);

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      res.json(hotel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update hotel" });
    }
  });

  app.delete("/api/menu-items/:id", isAuthenticated, async (req, res) => {
    try {
      const menuItem = await storage.getMenuItem(req.params.id);

      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      // Allow only super_admin or owner of the same hotel
      if (
        req.user?.role === "super_admin" ||
        (req.user?.role === "hotel_owner" &&
          req.user.hotel_id === menuItem.hotel_id)
      ) {
        await storage.deleteMenuItem(req.params.id);
        return res
          .status(200)
          .json({ message: "Menu item deleted successfully" });
      }

      return res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ message: "Failed to delete menu item" });
    }
  });

  // Menu Item Routes
  app.get("/api/hotels/:hotelId/menu-items", async (req, res) => {
    try {
      const hotel = await storage.getHotel(req.params.hotelId);

      if (!hotel) {
        return res.status(404).json({ message: "Hotel not found" });
      }

      // For public access, only return approved items if the hotel is active
      if (!req.isAuthenticated()) {
        if (!hotel.is_active) {
          return res
            .status(403)
            .json({ message: "This hotel's menu is currently unavailable" });
        }

        const menuItems = await storage.getMenuItems(req.params.hotelId);
        return res.json(menuItems.filter((item) => item.is_approved));
      }

      // For authenticated users, check role
      if (
        req.user?.role === "super_admin" ||
        (req.user?.role === "hotel_owner" &&
          req.user?.hotel_id === req.params.hotelId)
      ) {
        const menuItems = await storage.getMenuItems(req.params.hotelId);
        return res.json(menuItems);
      }

      // Unauthorized for other hotel owners
      return res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu items" });
    }
  });

  app.get("/api/menu-items/:id", isAuthenticated, async (req, res) => {
        const hotel_id = (req.user as { hotel_id: string }).hotel_id;
    const role = (req.user as { role: string }).role;
    try {
      const menuItem = await storage.getMenuItem(req.params.id);

      if (!menuItem) {
        return res.status(404).json({ message: "Menu item not found" });
      }

      // Check if user is allowed to access this menu item
      if (
        req.user?.role === "super_admin" ||
        (req.user?.role === "hotel_owner" &&
          req.user?.hotel_id === menuItem.hotel_id)
      ) {
        return res.json(menuItem);
      }

      // Unauthorized for other hotel owners
      return res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu item" });
    }
  });

  // Menu Update Request Routes
  app.post(
    "/api/menu-update-requests",
    isHotelOwner,
    isHotelActive,
    async (req, res) => {
      try {
        const schema = z.object({
          item_id: z.string().uuid().optional(),
          requested_changes: z.record(z.any()),
        });

        const validatedData = schema.parse(req.body);
        const hotel_id = (req.user as { hotel_id: string }).hotel_id;

        // If item_id is provided, check if it belongs to the hotel
        if (validatedData.item_id) {
          const menuItem = await storage.getMenuItem(validatedData.item_id);

          if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
          }

          if (menuItem.hotel_id !== hotel_id) {
            return res
              .status(403)
              .json({ message: "You cannot update this menu item" });
          }
        }

        // Ensure hotel_id is present in the requested_changes
        if (
          validatedData.requested_changes &&
          !validatedData.requested_changes.hotel_id
        ) {
          validatedData.requested_changes.hotel_id = hotel_id;
        }

        const menuUpdateRequest = await storage.createMenuUpdateRequest({
          hotel_id: hotel_id,
          item_id: validatedData.item_id || null,
          requested_changes: validatedData.requested_changes,
          status: "pending",
        });

        res.status(201).json(menuUpdateRequest);
      } catch (error) {
        console.error("Error creating menu update request:", error);
        if (error instanceof z.ZodError) {
          return res.status(400).json({ message: error.errors });
        }
        res
          .status(500)
          .json({ message: "Failed to create menu update request" });
      }
    },
  );

  app.get("/api/menu-update-requests", isAuthenticated, async (req, res) => {
    const hotel_id = (req.user as { hotel_id: string }).hotel_id;
    const role = (req.user as { role: string }).role;
    try {
      // Super admin can see all requests
      if (role === "super_admin") {
        const requests = await storage.getMenuUpdateRequests();
        return res.json(requests);
      }

      // Hotel owner can only see their own requests
      if (role === "hotel_owner") {
        const requests = await storage.getMenuUpdateRequests(
          hotel_id,
        );
        return res.json(requests);
      }

      return res.status(403).json({ message: "Forbidden" });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch menu update requests" });
    }
  });

  app.patch("/api/menu-update-requests/:id", isSuperAdmin, async (req, res) => {
    try {
      const schema = z.object({
        status: z.enum(["pending", "approved", "rejected"]),
      });

      const validatedData = schema.parse(req.body);

      // Fetch the request first
      const menuRequest = await storage.getMenuUpdateRequest(req.params.id);
      if (!menuRequest) {
        return res
          .status(404)
          .json({ message: "Menu update request not found" });
      }

      // Update the request status
      const request = await storage.updateMenuUpdateRequest(req.params.id, {
        status: validatedData.status,
      });

      // // If it's approved and not already approved, create or update a menu item
      // if (validatedData.status === "approved" && menuRequest.status !== "approved") {
      //   const changes = menuRequest.requested_changes as Record<string, any>;
      //   console.log("Menu update request found:", menuRequest.item_id)

      //   if (menuRequest.item_id) {
      //     // Update existing menu item
      //     await storage.updateMenuItem(menuRequest.item_id, {
      //       ...changes,
      //       is_approved: true
      //     });
      //   } else {
      //     // Create new menu item
      //     await storage.createMenuItem({
      //       ...changes,
      //       hotel_id: menuRequest.hotel_id,
      //       is_approved: true
      //     });
      //   }
      // }

      res.json(request);
    } catch (error) {
      console.error("Error updating menu request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: "Failed to update menu update request" });
    }
  });

    // Get active subscription for a hotel owner
    app.get("/api/subscription/active/:hotelOwnerId", async (req: Request, res: Response) => {
      try {
        const { hotelOwnerId } = req.params;
        const subscription = await storage.getActiveSubscription(hotelOwnerId);
        
        res.json({ subscription });
      } catch (error) {
        console.error("Error fetching active subscription:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  
    // Get all subscriptions for a hotel owner
    app.get("/api/subscriptions/:hotelOwnerId", async (req: Request, res: Response) => {
      try {
        const { hotelOwnerId } = req.params;
        const subscriptions = await storage.getAllSubscriptionsByHotelOwner(hotelOwnerId);
        
        res.json(subscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  
    // Create a payment order
    app.post("/api/create-payment", async (req: Request, res: Response) => {
      try {
        const { type, hotelOwnerId } = paymentSchema.parse(req.body);
        const subscriptionId = uuidv4();
        
        // Check if hotel owner exists
        const hotelOwner = await storage.getHotel(hotelOwnerId);
        if (!hotelOwner) {
          return res.status(404).json({ message: "Hotel owner not found" });
        }
        
        // Set amount based on plan type (in paise)
        const amount = type === "monthly" ? 10000 : 100000; // ₹100 or ₹1000
        const receipt = `receipt_${Date.now()}`;
        
        // Create order in Razorpay
        const order = await createOrder({
          amount,
          currency: "INR",
          receipt,
          notes: {
            hotelOwnerId,
            planType: type
          }
        });
        
        // Create subscription record with pending status
        const subscription_date = await storage.getSubscriptionEndDate(hotelOwnerId);

        const now = new Date();
        let startDate: Date;
        
        // If a previous subscription exists and is in the future, use that as the start
        if (subscription_date && subscription_date > now) {
          startDate = subscription_date;
        } else {
          startDate = now;
        }



        const endDate = type === "monthly" 
          ? addDays(startDate, 30) 
          : addDays(startDate, 365);
        
        const subscription = await storage.createSubscription({
          id: subscriptionId,
          hotel_owner_id: hotelOwnerId,
          plan_type: type,
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          razorpay_order_id: order.id,
          payment_status: "pending",
          amount: type === "monthly" ? "₹100" : "₹1000"
        });
        
        // Ensure amount is a number for proper JSON serialization and client parsing
        const responseAmount = typeof order.amount === 'string' ? parseInt(order.amount, 10) : order.amount;
        
        console.log("Sending payment response with amount:", responseAmount);
        
        res.json({
          orderId: order.id,
          amount: responseAmount,
          currency: order.currency,
          subscriptionId: subscription.id
        });
      } catch (error) {
        if (error instanceof ZodError) {
          const validationError = fromZodError(error);
          return res.status(400).json({ message: validationError.message });
        }
        
        console.error("Error creating payment:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });
  
    // Verify payment
    app.post("/api/verify-payment", async (req: Request, res: Response) => {
      try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, hotelOwnerId } = req.body;
        
        console.log("===== PAYMENT VERIFICATION REQUEST =====");
        console.log("Payment details:", {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          hotel_owner_id: hotelOwnerId,
          has_signature: razorpay_signature ? 'yes' : 'no'
        });
        
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
          console.error("Missing required payment parameters");
          return res.status(400).json({ 
            success: false,
            message: "Missing required payment information" 
          });
        }
        
        // First check if the subscription exists
        const existingSubscription = await storage.getSubscriptionByOrderId(razorpay_order_id);
        if (!existingSubscription) {
          console.error(`No subscription found with order ID: ${razorpay_order_id}`);
          return res.status(404).json({ 
            success: false,
            message: "Subscription not found" 
          });
        }
        
        console.log("Found subscription:", existingSubscription);
        
        let ownerIdToUse = hotelOwnerId;
        
        // If hotelOwnerId is missing in request, try to get it from the subscription
        if (!ownerIdToUse) {
          console.log("Hotel owner ID missing in request, using one from subscription");
          ownerIdToUse = existingSubscription.hotel_owner_id;
          console.log("Using hotel owner ID from subscription:", ownerIdToUse);
        }
        
        // Verify the payment signature
        const isSignatureValid = verifyPaymentSignature(
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        );
        
        if (!isSignatureValid) {
          console.error("Payment signature verification failed");
          return res.status(400).json({ 
            success: false,
            message: "Invalid payment signature" 
          });
        }
        
        console.log("Payment signature verified successfully");
        
        // Update subscription status
        console.log(`Updating subscription status to paid for order ID: ${razorpay_order_id}`);

        const updatedSubscription = await storage.updateSubscriptionStatus(razorpay_order_id, "paid");
        
        if (!updatedSubscription) {

          console.error("Failed to update subscription status");
          return res.status(500).json({ 
            success: false,
            message: "Failed to update subscription status" 
          });
        }
        
        console.log("Successfully updated subscription:", updatedSubscription);

        const subscription_updated_date = updatedSubscription.end_date

        console.log("subscription_updated_date:", subscription_updated_date)

        const dateObj = new Date(subscription_updated_date!);

        console.log("subscription_updated_date:", dateObj)
        
        // Update hotel owner status to active
        if (ownerIdToUse) {
          console.log(`Updating hotel owner (${ownerIdToUse}) status to active`);
          const updatedOwner = await storage.updateHotelOwnerStatus(ownerIdToUse, true, dateObj);
          console.log("Hotel owner update result:", updatedOwner);
        } else {
          console.error("Cannot update hotel owner status - missing ID");
        }


      console.log("Payment verification process completed successfully");
        
        res.json({
          success: true,
          message: "Payment verified successfully",
          subscription: updatedSubscription
        });
      } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ 
          success: false,
          message: "Internal server error",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  
    // Manual cron job trigger (for testing)
    app.get("/api/cron", async (req: Request, res: Response) => {
      try {
        await updateSubscriptionStatuses();
        res.json({ message: "Subscription statuses updated successfully" });
      } catch (error) {
        console.error("Error running cron job:", error);
        res.status(500).json({ message: "Internal server error" });
      }
    });


  //  Subscription routes
  
  // API routes defined above...

  return httpServer;
}
