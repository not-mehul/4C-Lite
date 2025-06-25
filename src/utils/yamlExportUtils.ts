/**
 * YAML export utilities for modified camera entries
 */

import yaml from 'js-yaml';
import { ModelMatch, YAMLExportCamera, CompatibilityType } from '../types';

/**
 * Converts integration type to protocol object
 * @param integrationType Integration type (ONVIF-S or RTSP)
 * @returns Protocol object for YAML export
 */
const convertIntegrationTypeToProtocols = (integrationType: CompatibilityType) => {
  return {
    'onvif-s': integrationType === 'ONVIF-S',
    rtsp: integrationType === 'RTSP' || integrationType === 'ONVIF-S', // ONVIF-S cameras typically support both
  };
};

/**
 * Converts a model match to YAML export format
 * @param match Model match to convert
 * @returns YAML export camera object
 */
const convertMatchToYAMLCamera = (match: ModelMatch): YAMLExportCamera => {
  const details = match.editedDetails;
  if (!details) {
    throw new Error(`No edited details found for match: ${match.model}`);
  }

  const yamlCamera: YAMLExportCamera = {
    model: details.modelName,
    manufacturer: details.manufacturer,
    resolution_mp: details.resolutionMp,
    channel_count: details.channelCount,
    protocols: convertIntegrationTypeToProtocols(details.integrationType),
  };

  // Add aliases if the original model name differs from the edited model name
  if (match.model !== details.modelName && match.model.trim() !== '') {
    yamlCamera.aliases = [match.model];
  }

  return yamlCamera;
};

/**
 * Filters model matches to find only 'modified' entries suitable for export
 * @param modelMatches Array of all model matches
 * @returns Array of modified model matches only
 */
export const getModifiedCameraEntries = (modelMatches: ModelMatch[]): ModelMatch[] => {
  return modelMatches.filter(match => {
    // Only include matches that have been explicitly modified by the user
    return match.matchType === 'modified';
  });
};

/**
 * Generates YAML content from modified camera entries
 * @param modifiedMatches Array of modified model matches
 * @returns YAML string content
 */
export const generateYAMLExport = (modifiedMatches: ModelMatch[]): string => {
  try {
    const yamlCameras: YAMLExportCamera[] = modifiedMatches
      .filter(match => match.editedDetails) // Ensure we have edited details
      .map(match => convertMatchToYAMLCamera(match));

    if (yamlCameras.length === 0) {
      throw new Error('No modified camera entries found for export');
    }

    // Generate YAML with proper formatting
    const yamlContent = yaml.dump(yamlCameras, {
      indent: 2,
      lineWidth: 120,
      noRefs: true,
      sortKeys: false,
    });

    return yamlContent;
  } catch (error) {
    throw new Error(`Failed to generate YAML export: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Downloads YAML content as a file
 * @param yamlContent YAML string content to download
 * @param filename Optional filename (defaults to timestamp-based name)
 */
export const downloadYAMLFile = (yamlContent: string, filename?: string): void => {
  try {
    const defaultFilename = `modified_cameras_${new Date().toISOString().split('T')[0]}.yml`;
    const finalFilename = filename || defaultFilename;

    const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    throw new Error(`Failed to download YAML file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Validates YAML export data before generation
 * @param modifiedMatches Array of modified model matches
 * @returns Validation result with any errors
 */
export const validateYAMLExportData = (modifiedMatches: ModelMatch[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (modifiedMatches.length === 0) {
    errors.push('No modified camera entries available for export');
    return { isValid: false, errors, warnings };
  }

  modifiedMatches.forEach((match, index) => {
    if (!match.editedDetails) {
      errors.push(`Match at index ${index} (${match.model}) has no edited details`);
      return;
    }

    const details = match.editedDetails;

    // Required field validation
    if (!details.modelName || details.modelName.trim() === '') {
      errors.push(`Match at index ${index}: Model name is required`);
    }

    if (!details.manufacturer || details.manufacturer.trim() === '') {
      errors.push(`Match at index ${index}: Manufacturer is required`);
    }

    if (!details.integrationType) {
      errors.push(`Match at index ${index}: Integration type is required`);
    }

    // Data quality warnings
    if (details.resolutionMp <= 0) {
      warnings.push(`Match at index ${index}: Resolution should be greater than 0`);
    }

    if (details.channelCount <= 0) {
      warnings.push(`Match at index ${index}: Channel count should be greater than 0`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};