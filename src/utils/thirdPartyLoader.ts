/**
 * Third-party camera database loader and parser
 */

import yaml from 'js-yaml';
import { ThirdPartyCamera } from '../types';

/**
 * Loads and parses third-party camera database from YAML file
 * @returns Promise resolving to array of third-party camera objects
 */
export const loadThirdPartyCameras = async (): Promise<ThirdPartyCamera[]> => {
  try {
    const response = await fetch('/third_party_cameras_db.yml');
    if (!response.ok) {
      throw new Error(
        `Failed to load third-party camera database: ${response.statusText}`
      );
    }

    const yamlText = await response.text();
    const cameras = parseThirdPartyYAML(yamlText);

    // Filter out cameras without valid model names
    return cameras.filter(
      (camera) => camera.model && camera.model.trim() !== ''
    );
  } catch (error) {
    console.error('Error loading third-party cameras:', error);
    // Return empty array as fallback - no third-party enhancement will occur
    return [];
  }
};

/**
 * Parses YAML content into structured camera objects
 * @param yamlText Raw YAML text content
 * @returns Array of parsed third-party camera objects
 */
const parseThirdPartyYAML = (yamlText: string): ThirdPartyCamera[] => {
  try {
    const data = yaml.load(yamlText) as any[];
    
    if (!Array.isArray(data)) {
      throw new Error('YAML file must contain an array of camera objects');
    }

    return data.map((item, index) => {
      // Validate required fields
      if (!item.model || !item.manufacturer) {
        throw new Error(`Camera at index ${index} missing required fields (model, manufacturer)`);
      }

      // Handle aliases field (can be array or undefined)
      let aliases: string[] = [];
      if (item.aliases) {
        if (Array.isArray(item.aliases)) {
          aliases = item.aliases.filter(alias => typeof alias === 'string');
        } else if (typeof item.aliases === 'string') {
          aliases = [item.aliases];
        }
      }

      // Ensure protocols object exists with defaults
      const protocols = {
        'onvif-s': item.protocols?.['onvif-s'] === true,
        rtsp: item.protocols?.rtsp === true
      };

      return {
        model: String(item.model).trim(),
        manufacturer: String(item.manufacturer).trim(),
        resolution_mp: Number(item.resolution_mp) || 0,
        channel_count: Number(item.channel_count) || 1,
        aliases,
        protocols
      } as ThirdPartyCamera;
    });
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Extracts model name from a full camera string that may include manufacturer
 * @param fullModelName Full camera model string (e.g., "Advidia M-46-V" or "Panasonic / i-PRO WV-X8570N")
 * @returns Extracted model name without manufacturer prefix
 */
const extractModelName = (fullModelName: string): string => {
  if (!fullModelName || !fullModelName.trim()) {
    return '';
  }

  const trimmed = fullModelName.trim();
  
  // Common manufacturer prefixes to remove
  const manufacturerPrefixes = [
    'Advidia',
    'Panasonic',
    'i-PRO',
    'Panasonic / i-PRO',
    'Panasonic/i-PRO',
    'Axis Communications',
    'Axis',
    'Hanwa',
    'Hikvision',
    'ACTi',
    'Ubiquity',
    'Alibi'
  ];

  // Try to remove manufacturer prefixes
  for (const prefix of manufacturerPrefixes) {
    const prefixPattern = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[\\/-]?\\s*`, 'i');
    if (prefixPattern.test(trimmed)) {
      const extracted = trimmed.replace(prefixPattern, '').trim();
      if (extracted.length > 0) {
        return extracted;
      }
    }
  }

  // If no manufacturer prefix found, return the original string
  return trimmed;
};

/**
 * Finds matching third-party camera by model name or aliases with improved matching
 * @param modelName Camera model name to search for (may include manufacturer)
 * @param thirdPartyCameras Array of third-party cameras to search in
 * @returns Matching camera object or undefined if not found
 */
export const findThirdPartyMatch = (
  modelName: string,
  thirdPartyCameras: ThirdPartyCamera[]
): ThirdPartyCamera | undefined => {
  if (!modelName || !modelName.trim()) {
    return undefined;
  }

  // Extract the model name without manufacturer prefix
  const extractedModel = extractModelName(modelName);
  const searchModel = extractedModel.toLowerCase().trim();
  
  // Also try the original model name in case extraction failed
  const originalModel = modelName.toLowerCase().trim();

  return thirdPartyCameras.find(camera => {
    const dbModel = camera.model.toLowerCase().trim();
    
    // Check exact model match with extracted name
    if (dbModel === searchModel) {
      return true;
    }
    
    // Check exact model match with original name
    if (dbModel === originalModel) {
      return true;
    }
    
    // Check if the database model is contained in the search model
    if (searchModel.includes(dbModel) || originalModel.includes(dbModel)) {
      return true;
    }
    
    // Check if the search model is contained in the database model
    if (dbModel.includes(searchModel) || dbModel.includes(originalModel)) {
      return true;
    }

    // Check aliases with both extracted and original model names
    if (camera.aliases && camera.aliases.length > 0) {
      return camera.aliases.some(alias => {
        const aliasLower = alias.toLowerCase().trim();
        return aliasLower === searchModel || 
               aliasLower === originalModel ||
               searchModel.includes(aliasLower) ||
               originalModel.includes(aliasLower) ||
               aliasLower.includes(searchModel) ||
               aliasLower.includes(originalModel);
      });
    }

    return false;
  });
};

/**
 * Determines the preferred integration type based on protocol support
 * @param protocols Protocol support object
 * @returns Preferred integration type
 */
export const getPreferredIntegrationType = (protocols: { 'onvif-s': boolean; rtsp: boolean }): 'ONVIF-S' | 'RTSP' => {
  // Prefer ONVIF-S if available, otherwise use RTSP
  return protocols['onvif-s'] ? 'ONVIF-S' : 'RTSP';
};