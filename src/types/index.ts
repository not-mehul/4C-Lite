export interface CSVData {
  headers: string[];
  rows: string[][];
}

export interface AnalysisResult {
  model: string;
  count: number;
}

export interface ColumnSelection {
  modelColumn: string | null;
  countColumn: string | null;
}

export type UploadStep = 'upload' | 'preview' | 'analysis';