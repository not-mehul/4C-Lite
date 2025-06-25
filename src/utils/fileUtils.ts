/**
 * File handling utilities for parsing various file formats
 */

import * as XLSX from 'xlsx';
import { SUPPORTED_FILE_TYPES, SUPPORTED_FILE_EXTENSIONS, MAX_FILE_SIZE } from './constants';
import { CSVData } from '../types';

/**
 * Validates uploaded file type and size
 * @param file File object to validate
 * @returns Error message if invalid, null if valid
 */
export const validateFile = (file: File): string | null => {
  const hasValidType = SUPPORTED_FILE_TYPES.some(type => file.type.includes(type)) || 
                      file.type === '' || // Some browsers don't set MIME type
                      SUPPORTED_FILE_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType) {
    return 'Please upload a CSV, Excel (.xlsx, .xls), OpenDocument (.ods), or Numbers (.numbers) file only.';
  }
  
  if (file.size > MAX_FILE_SIZE) {
    return 'File size must be less than 25MB.';
  }
  
  if (file.size === 0) {
    return 'File appears to be empty.';
  }
  
  return null;
};

/**
 * Parses uploaded file based on its format
 * @param file File object to parse
 * @returns Promise resolving to parsed file data
 */
export const parseFile = async (file: File): Promise<CSVData> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(await file.text());
  } else if (SUPPORTED_FILE_EXTENSIONS.slice(1).some(ext => fileName.endsWith(ext))) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format');
  }
};

/**
 * Parses CSV text content
 * @param text CSV text content
 * @returns Parsed CSV data structure
 */
const parseCSV = (text: string): CSVData => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1)
    .map(line => parseCSVLine(line))
    .filter(row => row.some(cell => cell.length > 0));

  if (headers.length === 0) {
    throw new Error('No headers found in CSV file');
  }

  return { headers, rows };
};

/**
 * Parses a single CSV line handling quoted values
 * @param line CSV line to parse
 * @returns Array of cell values
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
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map(cell => cell.replace(/^"|"$/g, ''));
};

/**
 * Parses Excel/spreadsheet files using XLSX library
 * @param file File object to parse
 * @returns Promise resolving to parsed file data
 */
const parseExcel = async (file: File): Promise<CSVData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first worksheet
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          throw new Error('No worksheets found in the file');
        }
        
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          raw: false
        }) as string[][];
        
        if (jsonData.length === 0) {
          throw new Error('Worksheet is empty');
        }
        
        const headers = jsonData[0].map(header => String(header).trim());
        const rows = jsonData.slice(1)
          .filter(row => row.some(cell => String(cell).trim().length > 0))
          .map(row => row.map(cell => String(cell).trim()));
        
        if (headers.length === 0) {
          throw new Error('No headers found in the file');
        }
        
        resolve({ headers, rows });
      } catch (error) {
        reject(new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Returns array of supported file extensions
 */
export const getSupportedFileTypes = (): string[] => {
  return [...SUPPORTED_FILE_EXTENSIONS];
};

/**
 * Returns human-readable description of supported file types
 */
export const getFileTypeDescription = (): string => {
  return 'CSV, Excel, OpenDocument, or Numbers files';
};