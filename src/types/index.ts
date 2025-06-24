/**
 * Core data types for the Command Connector Compatibility Calculator
 */

/** Represents parsed CSV/Excel data structure */
export interface CSVData {
  headers: string[];
  rows: string[][];
}

/** Analysis result for individual camera models */
export interface AnalysisResult {
  model: string;
  count: number;
}

/** User's column selection for analysis */
export interface ColumnSelection {
  modelColumn: string | null;
  countColumn: string | null;
}

/** Application workflow steps */
export type UploadStep = 'upload' | 'preview' | 'analysis';

/** Match types for compatibility analysis */
export type MatchType = 'exact' | 'potential' | 'none' | 'identified' | 'declined' | 'modified' | 'enhanced';

/** Compatibility integration types */
export type CompatibilityType = 'RTSP' | 'ONVIF-S';

/** Camera details for editing */
export interface CameraDetails {
  modelName: string;
  manufacturer: string;
  minimumFirmware: string;
  notes: string;
  resolutionMp: number;
  channelCount: number;
  integrationType: CompatibilityType;
}

/** Model matching result with compatibility details */
export interface ModelMatch {
  id: string; // Unique identifier for tracking edits
  model: string;
  cleanedModel: string;
  count: number;
  matchType: MatchType;
  matchedWith?: string;
  similarity?: number;
  removedElements?: string[];
  verkadaDetails?: VerkadaModel;
  compatibilityType?: CompatibilityType;
  editedDetails?: CameraDetails; // User-edited camera details
  isEditing?: boolean; // Whether currently in edit mode
  thirdPartyEnhanced?: boolean; // Whether enhanced with third-party data
  thirdPartyMatch?: ThirdPartyCamera; // Original third-party match for export
}

/** Verkada model compatibility information */
export interface VerkadaModel {
  manufacturer: string;
  modelName: string;
  minimumFirmware: string;
  notes: string;
}

/** Third-party camera database entry */
export interface ThirdPartyCamera {
  model: string;
  manufacturer: string;
  resolution_mp: number;
  channel_count: number;
  aliases?: string[];
  protocols: {
    'onvif-s': boolean;
    rtsp: boolean;
  };
}

/** File information for Verkada compatibility data */
export interface VerkadaFileInfo {
  totalModels: number;
  lastModified: string;
}

/** Data cleaning result with removed elements tracking */
export interface CleaningResult {
  original: string;
  cleaned: string;
  removedElements: string[];
}

/** Form validation errors */
export interface ValidationErrors {
  modelName?: string;
  manufacturer?: string;
  minimumFirmware?: string;
  notes?: string;
  resolutionMp?: string;
  channelCount?: string;
  integrationType?: string;
}

/** Export format for YAML camera database */
export interface YAMLExportCamera {
  model: string;
  manufacturer: string;
  resolution_mp: number;
  channel_count: number;
  aliases?: string[];
  protocols: {
    'onvif-s': boolean;
    rtsp: boolean;
  };
}