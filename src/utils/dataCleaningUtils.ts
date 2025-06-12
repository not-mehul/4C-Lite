// Common English dictionary words to filter out
const COMMON_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
  'camera', 'security', 'surveillance', 'system', 'device', 'equipment', 'network', 'wireless', 'indoor', 'outdoor', 'dome', 'bullet', 'ptz', 'fixed', 'varifocal', 'lens', 'megapixel', 'resolution', 'night', 'vision', 'infrared', 'audio', 'video', 'digital', 'analog', 'hybrid', 'nvr', 'dvr', 'recorder', 'channel', 'port', 'power', 'supply', 'adapter', 'cable', 'mount', 'bracket', 'housing', 'enclosure'
]);

// Regex patterns for filtering
const IP_ADDRESS_PATTERN = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_PATTERN = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
const MAC_ADDRESS_PATTERN = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}$/;
const DATE_PATTERNS = [
  /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // MM/DD/YYYY or M/D/YY
  /^\d{1,2}-\d{1,2}-\d{2,4}$/, // MM-DD-YYYY or M-D-YY
  /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
  /^\d{1,2}\.\d{1,2}\.\d{2,4}$/, // MM.DD.YYYY
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{2,4}$/i, // Month DD, YYYY
];

export interface CleaningResult {
  original: string;
  cleaned: string;
  removedElements: string[];
}

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
    if (IP_ADDRESS_PATTERN.test(trimmedToken) || IPV6_PATTERN.test(trimmedToken)) {
      removedElements.push(`IP: ${trimmedToken}`);
      return false;
    }
    
    // Check for MAC addresses
    if (MAC_ADDRESS_PATTERN.test(trimmedToken)) {
      removedElements.push(`MAC: ${trimmedToken}`);
      return false;
    }
    
    // Check for date patterns
    if (DATE_PATTERNS.some(pattern => pattern.test(trimmedToken))) {
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

export const extractManufacturerNames = (verkadaModels: Array<{manufacturer: string}>): string[] => {
  const manufacturers = new Set<string>();
  
  verkadaModels.forEach(model => {
    if (model.manufacturer && model.manufacturer.trim()) {
      const manufacturer = model.manufacturer.trim();
      manufacturers.add(manufacturer);
      
      // Also add common variations
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

export const preprocessModelForMatching = (model: string, manufacturerNames: string[]): string => {
  const cleaningResult = cleanModelData(model, manufacturerNames);
  return cleaningResult.cleaned;
};