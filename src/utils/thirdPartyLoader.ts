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
 * Finds matching third-party camera by cleaned model name with improved matching
 * @param cleanedModelName Cleaned camera model name (without manufacturer prefix and noise)
 * @param thirdPartyCameras Array of third-party cameras to search in
 * @returns Matching camera object or undefined if not found
 */
export const findThirdPartyMatch = (
  cleanedModelName: string,
  thirdPartyCameras: ThirdPartyCamera[]
): ThirdPartyCamera | undefined => {
  if (!cleanedModelName || !cleanedModelName.trim()) {
    return undefined;
  }

  const searchModel = cleanedModelName.toLowerCase().trim();

  return thirdPartyCameras.find(camera => {
    const dbModel = camera.model.toLowerCase().trim();
    
    // Check exact model match
    if (dbModel === searchModel) {
      return true;
    }
    
    // Check if the database model is contained in the search model
    if (searchModel.includes(dbModel)) {
      return true;
    }
    
    // Check if the search model is contained in the database model
    if (dbModel.includes(searchModel)) {
      return true;
    }

    // Check aliases
    if (camera.aliases && camera.aliases.length > 0) {
      return camera.aliases.some(alias => {
        const aliasLower = alias.toLowerCase().trim();
        return aliasLower === searchModel ||
               searchModel.includes(aliasLower) ||
               aliasLower.includes(searchModel);
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