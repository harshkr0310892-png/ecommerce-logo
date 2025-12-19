import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enhanced validation for Indian mobile numbers
// Returns a 10-digit normalized number (no country code) or null if invalid.
export function normalizeIndianMobile(input: string): string | null {
  if (!input) return null;
  
  try {
    // Clean the phone number (remove spaces, hyphens, parentheses, etc.)
    const cleanedPhone = input.replace(/[\s\-()\u202c]/g, '');
    
    // Check for mixed characters (anything other than digits and + at the start)
    if (/[^0-9+]/.test(cleanedPhone) || (cleanedPhone.includes('+') && !cleanedPhone.startsWith('+'))) {
      return null;
    }
    
    // Handle international format
    let phoneToValidate = cleanedPhone;
    if (cleanedPhone.startsWith('+91')) {
      phoneToValidate = cleanedPhone.substring(3); // Remove +91 prefix
    } else if (cleanedPhone.startsWith('91') && cleanedPhone.length === 12) {
      phoneToValidate = cleanedPhone.substring(2); // Remove 91 prefix
    } else if (cleanedPhone.startsWith('+')) {
      // Invalid international format
      return null;
    }
    
    // Check length (must be exactly 10 digits after cleaning)
    if (phoneToValidate.length !== 10) {
      return null;
    }
    
    // Check starting digit (must be 6, 7, 8, or 9)
    const firstDigit = phoneToValidate.charAt(0);
    if (!['6', '7', '8', '9'].includes(firstDigit)) {
      return null;
    }
    
    // Check for repeating digits pattern (e.g., 1111111111)
    const repeatedDigitsPattern = /^(\d)\1{9}$/;
    if (repeatedDigitsPattern.test(phoneToValidate)) {
      return null;
    }
    
    // Check for sequential patterns
    const sequentialPatterns = [
      '0123456789',
      '1234567890',
      '2345678901',
      '3456789012',
      '4567890123',
      '5678901234',
      '6789012345',
      '7890123456',
      '8901234567',
      '9012345678',
      '9876543210'
    ];
    if (sequentialPatterns.includes(phoneToValidate)) {
      return null;
    }
    
    // Check for same prefix patterns (first 5 digits are same)
    const firstFiveSamePattern = /^(\d)\1{4}\d{5}$/;
    if (firstFiveSamePattern.test(phoneToValidate)) {
      return null;
    }
    
    // Final validation using libphonenumber-js
    const fullPhoneNumber = `+91${phoneToValidate}`;
    if (!isValidPhoneNumber(fullPhoneNumber, 'IN')) {
      return null;
    }
    
    // Parse the phone number to double-check
    const phoneNumber = parsePhoneNumber(fullPhoneNumber, 'IN');
    if (!phoneNumber.isValid()) {
      return null;
    }
    
    return phoneToValidate;
  } catch (error) {
    return null;
  }
}

export function isValidIndianMobile(input: string): boolean {
  return normalizeIndianMobile(input) !== null;
}