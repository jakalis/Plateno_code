import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { z } from "zod";

// API route to get all menu items for super admin
export function addAllMenuItemsRoute(app: Express) {
  app.get("/api/menu-items", async (req, res) => {
    try {
      // Check if user is super admin
      if (!req.isAuthenticated() || req.user?.role !== "super_admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      // Get all menu items from all hotels
      const menuItems = await storage.getMenuItems();
      return res.json(menuItems);
    } catch (error) {
      console.error("Error fetching all menu items:", error);
      res.status(500).json({ message: "Failed to fetch all menu items" });
    }
  });
}

export function addHotelContactRoute(app: Express) {
  // Route to get hotel contact details
  app.get("/api/hotels/:id/contact", async (req, res) => {
    try {
      const hotelId = req.params.id;
      const contact = await storage.getHotelContact(hotelId);
      if (!contact) {
        return res.status(404).json({ message: "Contact details not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching hotel contact details:", error);
      res.status(500).json({ message: "Failed to fetch hotel contact details" });
    }
  });
}

export function addHotelServiceRoute(app: Express) {
  // Route to get hotel contact details
  app.get("/api/hotels/:id/service", async (req, res) => {
    try {
      const hotelId = req.params.id;
      const contact = await storage.getHotelService(hotelId);
      if (!contact) {
        return res.status(404).json({ message: "Contact details not found" });
      }
      res.json(contact);
    } catch (error) {
      console.error("Error fetching hotel contact details:", error);
      res.status(500).json({ message: "Failed to fetch hotel contact details" });
    }
  });
}


