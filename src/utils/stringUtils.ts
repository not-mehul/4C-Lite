/**
 * String manipulation utilities for model matching and similarity calculations
 */

/**
 * Calculates the similarity between two strings using Levenshtein distance
 * @param str1 First string to compare
 * @param str2 Second string to compare
 * @returns Similarity score between 0 and 1 (1 being identical)
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(
    longer.toLowerCase(),
    shorter.toLowerCase()
  );
  return (longer.length - editDistance) / longer.length;
};

/**
 * Calculates the Levenshtein distance between two strings
 * @param str1 First string
 * @param str2 Second string
 * @returns Edit distance between the strings
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = [];

  // Initialize first row and column
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  // Fill the matrix
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};

/**
 * Checks if one string is a subset of another (case-insensitive)
 * @param str1 First string
 * @param str2 Second string
 * @returns True if either string contains the other
 */
export const isSubsetMatch = (str1: string, str2: string): boolean => {
  const lower1 = str1.toLowerCase();
  const lower2 = str2.toLowerCase();
  return lower1.includes(lower2) || lower2.includes(lower1);
};