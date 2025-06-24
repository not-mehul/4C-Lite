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
export type MatchType = 'exact' | 'potential' | 'none';

/** Compatibility integration types */
export type CompatibilityType = 'RTSP' | 'ONVIF-S';

/** Model matching result with compatibility details */
export interface ModelMatch {
  model: string;
  cleanedModel: string;
  count: number;
  matchType: MatchType;
  matchedWith?: string;
  similarity?: number;
  removedElements?: string[];
  verkadaDetails?: VerkadaModel;
  compatibilityType?: CompatibilityType;
}

/** Verkada model compatibility information */
export interface VerkadaModel {
  manufacturer: string;
  modelName: string;
  minimumFirmware: string;
  notes: string;
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