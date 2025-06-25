/**
 * Data cleaning utilities for processing camera model information
 */

import { COMMON_WORDS, REGEX_PATTERNS } from './constants';
import { CleaningResult, VerkadaModel } from '../types';

/**
 * Cleans and preprocesses camera model data by removing common noise
 * @param input Raw model string to clean
 * @param manufacturerNames Array of known manufacturer names to filter out
 * @returns Cleaning result with original, cleaned string, and removed elements
 */
export const cleanModelData = (input: string, manufacturerNames: string[]): CleaningResult => {
  if (!input || typeof input !== 'string') {
    return {
      original: input || '',
      cleaned: '',
      removedElements: []
    };
  }

  const original = input.trim();
  const removedElements: string[] = [];
  
  // Split input into tokens (words, numbers, and special character sequences)
  const tokens = original.split(/\s+/).filter(token => token.length > 0);
  
  const cleanedTokens = tokens.filter(token => {
    const trimmedToken = token.trim();
    
    // Skip empty tokens
    if (!trimmedToken) return false;
    
    // Check for IP addresses
    if (REGEX_PATTERNS.IP_ADDRESS.test(trimmedToken) || REGEX_PATTERNS.IPV6.test(trimmedToken)) {
      removedElements.push(`IP: ${trimmedToken}`);
      return false;
    }
    
    // Check for MAC addresses
    if (REGEX_PATTERNS.MAC_ADDRESS.test(trimmedToken)) {
      removedElements.push(`MAC: ${trimmedToken}`);
      return false;
    }
    
    // Check for date patterns
    if (REGEX_PATTERNS.DATE_PATTERNS.some(pattern => pattern.test(trimmedToken))) {
      removedElements.push(`Date: ${trimmedToken}`);
      return false;
    }
    
    // Check for manufacturer names (case-insensitive)
    const tokenLower = trimmedToken.toLowerCase();
    if (manufacturerNames.some(manufacturer => 
      manufacturer.toLowerCase() === tokenLower || 
      tokenLower.includes(manufacturer.toLowerCase()) ||
      manufacturer.toLowerCase().includes(tokenLower)
    )) {
      removedElements.push(`Manufacturer: ${trimmedToken}`);
      return false;
    }
    
    // Check for common English words (only if token is purely alphabetic and longer than 2 chars)
    if (/^[a-zA-Z]+$/.test(trimmedToken) && trimmedToken.length > 2) {
      if (COMMON_WORDS.has(tokenLower)) {
        removedElements.push(`Common word: ${trimmedToken}`);
        return false;
      }
    }
    
    // Keep tokens that contain alphanumeric sequences (potential model numbers)
    // or special characters that might be part of model designations
    if (/[a-zA-Z0-9]/.test(trimmedToken)) {
      return true;
    }
    
    // Remove purely punctuation tokens unless they're common model separators
    if (/^[^\w\s-_\.]+$/.test(trimmedToken)) {
      removedElements.push(`Punctuation: ${trimmedToken}`);
      return false;
    }
    
    return true;
  });
  
  const cleaned = cleanedTokens.join(' ').trim();
  
  return {
    original,
    cleaned,
    removedElements
  };
};

/**
 * Extracts unique manufacturer names from Verkada models for filtering
 * @param verkadaModels Array of Verkada model objects
 * @returns Array of unique manufacturer names and their variations
 */
export const extractManufacturerNames = (verkadaModels: VerkadaModel[]): string[] => {
  const manufacturers = new Set<string>();
  
  verkadaModels.forEach(model => {
    if (model.manufacturer && model.manufacturer.trim()) {
      const manufacturer = model.manufacturer.trim();
      manufacturers.add(manufacturer);
      
      // Also add common variations (individual words)
      const words = manufacturer.split(/\s+/);
      words.forEach(word => {
        if (word.length > 2) {
          manufacturers.add(word);
        }
      });
    }
  });
  
  return Array.from(manufacturers);
};

/**
 * Preprocesses a model string for matching by cleaning it
 * @param model Model string to preprocess
 * @param manufacturerNames Array of manufacturer names to filter out
 * @returns Cleaned model string ready for matching
 */
export const preprocessModelForMatching = (model: string, manufacturerNames: string[]): string => {
  const cleaningResult = cleanModelData(model, manufacturerNames);
  return cleaningResult.cleaned;
};