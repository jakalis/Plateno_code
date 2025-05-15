import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, parseISO } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string): string {
  try {
    return format(parseISO(dateString), 'MMMM d, yyyy');
  } catch (error) {
    console.error("Error formatting date:", error);
    return dateString;
  }
}

export function formatCurrency(amount: string | number): string {
  if (typeof amount === 'string' && amount.startsWith('₹')) {
    return amount;
  }
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return '₹0';
  }
  
  return `₹${numericAmount.toLocaleString('en-IN')}`;
}

export const planDetails = {
  monthly: {
    name: "Monthly",
    amount: "₹100",
    amountInPaise: 10000,
    duration: "30 days",
    features: [
      "30 days of service",
      "All features included",
      "Email support"
    ]
  },
  yearly: {
    name: "Yearly",
    amount: "₹1000",
    amountInPaise: 100000,
    duration: "365 days",
    features: [
      "365 days of service",
      "All features included",
      "Priority email & phone support"
    ]
  }
};



