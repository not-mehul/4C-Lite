/**
 * Model matching utilities for compatibility analysis
 */

import { VerkadaModel, MatchType, CompatibilityType, ModelMatch, CameraDetails, ThirdPartyCamera } from '../types';
import { calculateSimilarity, isSubsetMatch } from './stringUtils';
import { preprocessModelForMatching } from './dataCleaningUtils';
import { findThirdPartyMatch, getPreferredIntegrationType } from './thirdPartyLoader';
import { MIN_SIMILARITY_THRESHOLD } from './constants';

/**
 * Determines compatibility type based on Verkada model notes
 * @param verkadaModel Verkada model object
 * @returns Compatibility type (RTSP or ONVIF-S)
 */
export const getCompatibilityType = (verkadaModel?: VerkadaModel): CompatibilityType => {
  if (!verkadaModel || !verkadaModel.notes) {
    return 'ONVIF-S';
  }
  
  const notes = verkadaModel.notes.toLowerCase();
  return notes.includes('rtsp support only') ? 'RTSP' : 'ONVIF-S';
};

/**
 * Finds the best match for a cleaned model string against Verkada models
 * @param cleanedModel Cleaned model string to match
 * @param manufacturerNames Array of manufacturer names for filtering
 * @param verkadaModels Array of Verkada models to match against
 * @returns Match result with type, similarity, and details
 */
export const findBestMatch = (
  cleanedModel: string,
  manufacturerNames: string[],
  verkadaModels: VerkadaModel[]
): {
  matchType: MatchType;
  matchedWith?: string;
  similarity?: number;
  verkadaDetails?: VerkadaModel;
  compatibilityType?: CompatibilityType;
} => {
  if (!cleanedModel || cleanedModel.trim() === '') {
    return { matchType: 'none' };
  }

  const modelLower = cleanedModel.toLowerCase().trim();

  // Check for exact match with cleaned Verkada models
  for (const verkadaModel of verkadaModels) {
    const cleanedVerkadaModel = preprocessModelForMatching(
      verkadaModel.modelName,
      manufacturerNames
    );
    if (cleanedVerkadaModel.toLowerCase() === modelLower) {
      return {
        matchType: 'exact',
        matchedWith: verkadaModel.modelName,
        similarity: 1.0,
        verkadaDetails: verkadaModel,
        compatibilityType: getCompatibilityType(verkadaModel),
      };
    }
  }

  // Find potential matches using similarity scoring
  const potentialMatch = findPotentialMatch(modelLower, manufacturerNames, verkadaModels);
  
  if (potentialMatch.similarity && potentialMatch.similarity > MIN_SIMILARITY_THRESHOLD) {
    return {
      matchType: 'potential',
      matchedWith: potentialMatch.originalModel,
      similarity: potentialMatch.similarity,
      verkadaDetails: potentialMatch.verkadaModel,
      compatibilityType: getCompatibilityType(potentialMatch.verkadaModel),
    };
  }

  return { matchType: 'none' };
};

/**
 * Finds potential matches using similarity algorithms
 * @param modelLower Lowercase model string to match
 * @param manufacturerNames Array of manufacturer names
 * @param verkadaModels Array of Verkada models
 * @returns Best potential match with similarity score
 */
const findPotentialMatch = (
  modelLower: string,
  manufacturerNames: string[],
  verkadaModels: VerkadaModel[]
) => {
  let bestSimilarity = 0;
  let bestOriginalModel = '';
  let bestVerkadaModel: VerkadaModel | undefined;

  for (const verkadaModel of verkadaModels) {
    const cleanedVerkadaModel = preprocessModelForMatching(
      verkadaModel.modelName,
      manufacturerNames
    );
    const similarity = calculateSimilarity(
      modelLower,
      cleanedVerkadaModel.toLowerCase()
    );

    // Check if one is a subset of the other for additional scoring
    const isSubset = isSubsetMatch(modelLower, cleanedVerkadaModel.toLowerCase());

    if (similarity > bestSimilarity || (isSubset && similarity > 0.5)) {
      bestSimilarity = similarity;
      bestOriginalModel = verkadaModel.modelName;
      bestVerkadaModel = verkadaModel;
    }
  }

  return {
    similarity: bestSimilarity,
    originalModel: bestOriginalModel,
    verkadaModel: bestVerkadaModel,
  };
};

/**
 * Enhances camera details with third-party database information
 * @param match Model match to enhance
 * @param thirdPartyCameras Array of third-party cameras
 * @returns Enhanced model match with third-party data
 */
export const enhanceWithThirdPartyData = (
  match: ModelMatch,
  thirdPartyCameras: ThirdPartyCamera[]
): ModelMatch => {
  // Skip potential matches - they need user action first
  if (match.matchType === 'potential') {
    return match;
  }

  // Try to find third-party match using the original model name
  const thirdPartyMatch = findThirdPartyMatch(match.model, thirdPartyCameras);
  
  if (!thirdPartyMatch) {
    return match;
  }

  // Create or update camera details with third-party data
  const enhancedDetails: CameraDetails = {
    modelName: match.editedDetails?.modelName || match.matchedWith || match.model,
    manufacturer: thirdPartyMatch.manufacturer,
    minimumFirmware: match.editedDetails?.minimumFirmware || match.verkadaDetails?.minimumFirmware || '',
    notes: match.editedDetails?.notes || match.verkadaDetails?.notes || '',
    resolutionMp: thirdPartyMatch.resolution_mp,
    channelCount: thirdPartyMatch.channel_count,
    integrationType: getPreferredIntegrationType(thirdPartyMatch.protocols),
  };

  return {
    ...match,
    editedDetails: enhancedDetails,
    compatibilityType: enhancedDetails.integrationType,
    thirdPartyEnhanced: true,
    thirdPartyMatch: thirdPartyMatch,
  };
};

/**
 * Processes potential match approval with third-party enhancement
 * @param match Model match to process
 * @param thirdPartyCameras Array of third-party cameras
 * @returns Enhanced model match with appropriate status
 */
export const processPotentialMatchApproval = (
  match: ModelMatch,
  thirdPartyCameras: ThirdPartyCamera[]
): ModelMatch => {
  // First, set to identified status
  let updatedMatch = { ...match, matchType: 'identified' as MatchType };
  
  // Try to find third-party match
  const thirdPartyMatch = findThirdPartyMatch(match.model, thirdPartyCameras);
  
  if (thirdPartyMatch) {
    // Create enhanced details with third-party data
    const enhancedDetails: CameraDetails = {
      modelName: match.matchedWith || match.model,
      manufacturer: thirdPartyMatch.manufacturer,
      minimumFirmware: match.verkadaDetails?.minimumFirmware || '',
      notes: match.verkadaDetails?.notes || '',
      resolutionMp: thirdPartyMatch.resolution_mp,
      channelCount: thirdPartyMatch.channel_count,
      integrationType: getPreferredIntegrationType(thirdPartyMatch.protocols),
    };

    // Update to enhanced status with third-party data
    updatedMatch = {
      ...updatedMatch,
      matchType: 'enhanced' as MatchType,
      editedDetails: enhancedDetails,
      compatibilityType: enhancedDetails.integrationType,
      thirdPartyEnhanced: true,
      thirdPartyMatch: thirdPartyMatch,
    };
  }
  
  return updatedMatch;
};

/**
 * Processes potential match decline with third-party enhancement
 * @param match Model match to process
 * @param thirdPartyCameras Array of third-party cameras
 * @returns Enhanced model match with appropriate status
 */
export const processPotentialMatchDecline = (
  match: ModelMatch,
  thirdPartyCameras: ThirdPartyCamera[]
): ModelMatch => {
  // First, set to declined status and clear Verkada data
  let updatedMatch = { 
    ...match, 
    matchType: 'declined' as MatchType,
    matchedWith: undefined,
    verkadaDetails: undefined,
    compatibilityType: undefined,
    similarity: undefined
  };
  
  // Try to find third-party match
  const thirdPartyMatch = findThirdPartyMatch(match.model, thirdPartyCameras);
  
  if (thirdPartyMatch) {
    // Create enhanced details with third-party data only
    const enhancedDetails: CameraDetails = {
      modelName: match.model,
      manufacturer: thirdPartyMatch.manufacturer,
      minimumFirmware: '',
      notes: '',
      resolutionMp: thirdPartyMatch.resolution_mp,
      channelCount: thirdPartyMatch.channel_count,
      integrationType: getPreferredIntegrationType(thirdPartyMatch.protocols),
    };

    // Update to enhanced status with third-party data
    updatedMatch = {
      ...updatedMatch,
      matchType: 'enhanced' as MatchType,
      editedDetails: enhancedDetails,
      compatibilityType: enhancedDetails.integrationType,
      thirdPartyEnhanced: true,
      thirdPartyMatch: thirdPartyMatch,
    };
  }
  
  return updatedMatch;
};

/**
 * Processes analysis results to create model matches with compatibility info
 * @param aggregatedData Map of model names to counts
 * @param manufacturerNames Array of manufacturer names
 * @param verkadaModels Array of Verkada models
 * @param thirdPartyCameras Array of third-party cameras for enhancement
 * @returns Array of processed model matches
 */
export const processModelMatches = (
  aggregatedData: Map<string, number>,
  manufacturerNames: string[],
  verkadaModels: VerkadaModel[],
  thirdPartyCameras: ThirdPartyCamera[] = []
): ModelMatch[] => {
  return Array.from(aggregatedData.entries())
    .map(([model, count], index) => {
      const cleaningResult = cleanModelData(model, manufacturerNames);
      const cleanedModel = cleaningResult.cleaned;
      const matchInfo = findBestMatch(cleanedModel, manufacturerNames, verkadaModels);

      let baseMatch: ModelMatch = {
        id: `model-${index}-${Date.now()}`, // Unique identifier
        model,
        cleanedModel,
        count,
        matchType: matchInfo.matchType,
        matchedWith: matchInfo.matchedWith,
        similarity: matchInfo.similarity,
        removedElements: cleaningResult.removedElements,
        verkadaDetails: matchInfo.verkadaDetails,
        compatibilityType: matchInfo.compatibilityType,
        isEditing: false,
        thirdPartyEnhanced: false,
      };

      // Enhance with third-party data if available
      if (thirdPartyCameras.length > 0) {
        baseMatch = enhanceWithThirdPartyData(baseMatch, thirdPartyCameras);
      }

      return baseMatch;
    })
    .sort((a, b) => b.count - a.count);
};

/**
 * Creates default camera details from a model match
 * @param match Model match to extract details from
 * @returns Default camera details object
 */
export const createDefaultCameraDetails = (match: ModelMatch): CameraDetails => {
  return {
    modelName: match.matchedWith || match.cleanedModel || match.model,
    manufacturer: match.verkadaDetails?.manufacturer || '',
    minimumFirmware: match.verkadaDetails?.minimumFirmware || '',
    notes: match.verkadaDetails?.notes || '',
    resolutionMp: 2.0, // Default resolution
    channelCount: 1, // Default channel count
    integrationType: match.compatibilityType || 'ONVIF-S', // Default integration type
  };
};

// Import cleanModelData to avoid circular dependency
import { cleanModelData } from './dataCleaningUtils';