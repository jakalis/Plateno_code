import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { menuUpdateRequests } from "@shared/schema";
import { addAllMenuItemsRoute, addHotelContactRoute, addHotelServiceRoute } from "./api-routes";

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
  // Setup authentication
  setupAuth(app);

  // Add custom API routes
  addAllMenuItemsRoute(app);

  addHotelContactRoute(app); 

  addHotelServiceRoute(app);

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

        // If item_id is provided, check if it belongs to the hotel
        if (validatedData.item_id) {
          const menuItem = await storage.getMenuItem(validatedData.item_id);

          if (!menuItem) {
            return res.status(404).json({ message: "Menu item not found" });
          }

          if (menuItem.hotel_id !== req.user?.hotel_id) {
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
          validatedData.requested_changes.hotel_id = req.user?.hotel_id!;
        }

        const menuUpdateRequest = await storage.createMenuUpdateRequest({
          hotel_id: req.user?.hotel_id!,
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
    try {
      // Super admin can see all requests
      if (req.user?.role === "super_admin") {
        const requests = await storage.getMenuUpdateRequests();
        return res.json(requests);
      }

      // Hotel owner can only see their own requests
      if (req.user?.role === "hotel_owner") {
        const requests = await storage.getMenuUpdateRequests(
          req.user.hotel_id!,
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

  // API routes defined above...

  const httpServer = createServer(app);
  return httpServer;
}
