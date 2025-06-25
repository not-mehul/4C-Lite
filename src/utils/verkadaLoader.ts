/**
 * Verkada compatibility data loader and parser
 */

import { VerkadaModel } from '../types';

/**
 * Loads and parses Verkada compatibility models from CSV file
 * @returns Promise resolving to array of Verkada model objects
 */
export const loadVerkadaModels = async (): Promise<VerkadaModel[]> => {
  try {
    const response = await fetch('Verkada Command Connector Compatibility.csv');
    if (!response.ok) {
      throw new Error(
        `Failed to load Verkada compatibility list: ${response.statusText}`
      );
    }

    const csvText = await response.text();
    const models = parseVerkadaCSV(csvText);

    // Filter out models without valid model names
    return models.filter(
      (model) => model.modelName && model.modelName.trim() !== ''
    );
  } catch (error) {
    console.error('Error loading Verkada models:', error);
    // Return empty array as fallback - analysis will show no matches
    return [];
  }
};

/**
 * Parses Verkada CSV content into structured model objects
 * @param csvText Raw CSV text content
 * @returns Array of parsed Verkada model objects
 */
const parseVerkadaCSV = (csvText: string): VerkadaModel[] => {
  const lines = csvText.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Find the header row containing required columns
  let headerIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('manufacturer') && line.includes('model name')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find CSV header row');
  }

  const headers = parseCSVLine(lines[headerIndex]);
  const columnIndices = getColumnIndices(headers);

  if (columnIndices.manufacturerIndex === -1 || columnIndices.modelNameIndex === -1) {
    throw new Error(
      'Required columns (Manufacturer, Model Name) not found in CSV'
    );
  }

  const models: VerkadaModel[] = [];

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);

    if (row.length > Math.max(columnIndices.manufacturerIndex, columnIndices.modelNameIndex)) {
      const manufacturer = row[columnIndices.manufacturerIndex]?.trim() || '';
      const modelName = row[columnIndices.modelNameIndex]?.trim() || '';
      const minimumFirmware = row[columnIndices.firmwareIndex]?.trim() || '';
      const notes = row[columnIndices.notesIndex]?.trim() || '';

      // Only include rows with valid manufacturer and model name
      if (manufacturer && modelName) {
        models.push({
          manufacturer,
          modelName,
          minimumFirmware,
          notes,
        });
      }
    }
  }

  return models;
};

/**
 * Finds column indices for required fields in CSV headers
 * @param headers Array of header strings
 * @returns Object containing column indices
 */
const getColumnIndices = (headers: string[]) => {
  return {
    manufacturerIndex: headers.findIndex((h) =>
      h.toLowerCase().includes('manufacturer')
    ),
    modelNameIndex: headers.findIndex((h) =>
      h.toLowerCase().includes('model name')
    ),
    firmwareIndex: headers.findIndex((h) =>
      h.toLowerCase().includes('firmware')
    ),
    notesIndex: headers.findIndex((h) =>
      h.toLowerCase().includes('notes')
    ),
  };
};

/**
 * Parses a single CSV line handling quoted values and commas
 * @param line CSV line to parse
 * @returns Array of parsed cell values
 */
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current);
  return result.map((cell) => cell.trim().replace(/^"|"$/g, ''));
};