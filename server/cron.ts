import { storage } from "./storage";
import { log } from "./vite";
import { addDays, format, parseISO } from "date-fns";

export async function updateSubscriptionStatuses() {
  try {
    log("Running subscription status check cron job", "cron");
    
    // Get all expired subscriptions
    const expiredSubscriptions = await storage.getExpiredSubscriptions();
    
    for (const { hotelOwnerId } of expiredSubscriptions) {
      // Check if the hotel owner has any active subscription
      const activeSubscription = await storage.getActiveSubscription(hotelOwnerId);
      
      // If no active subscription, update hotel owner status to inactive
      if (!activeSubscription) {
        log(`Deactivating hotel owner ${hotelOwnerId} - subscription expired`, "cron");
        await storage.updateHotelOwnerStatus(hotelOwnerId, false);
      }
    }
    
    log("Subscription status check completed", "cron");
  } catch (error) {
    log(`Error updating subscription statuses: ${error}`, "cron");
  }
}

export function setupCronJob(server) {
  // Run the job immediately on server start
  updateSubscriptionStatuses();
  
  // Run the job every day at midnight
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  setInterval(updateSubscriptionStatuses, TWENTY_FOUR_HOURS);
  
  // Also expose a manual endpoint for testing
  return server;
}
