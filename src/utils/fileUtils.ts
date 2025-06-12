import * as XLSX from 'xlsx';

export interface FileData {
  headers: string[];
  rows: string[][];
}

export const validateFile = (file: File): string | null => {
  const allowedTypes = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/vnd.apple.numbers'
  ];
  
  const allowedExtensions = ['.csv', '.xlsx', '.xls', '.ods', '.numbers'];
  
  const hasValidType = allowedTypes.some(type => file.type.includes(type)) || 
                      file.type === '' || // Some browsers don't set MIME type
                      allowedExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  
  if (!hasValidType) {
    return 'Please upload a CSV, Excel (.xlsx, .xls), OpenDocument (.ods), or Numbers (.numbers) file only.';
  }
  
  if (file.size > 25 * 1024 * 1024) {
    return 'File size must be less than 25MB.';
  }
  
  if (file.size === 0) {
    return 'File appears to be empty.';
  }
  
  return null;
};

export const parseFile = async (file: File): Promise<FileData> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.csv')) {
    return parseCSV(await file.text());
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.ods') || fileName.endsWith('.numbers')) {
    return parseExcel(file);
  } else {
    throw new Error('Unsupported file format');
  }
};

const parseCSV = (text: string): FileData => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => 
    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
  );

  if (headers.length === 0) {
    throw new Error('No headers found in CSV file');
  }

  return { 
    headers, 
    rows: rows.filter(row => row.some(cell => cell.length > 0)) 
  };
};

const parseExcel = async (file: File): Promise<FileData> => {
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

export const getSupportedFileTypes = (): string[] => {
  return ['.csv', '.xlsx', '.xls', '.ods', '.numbers'];
};

export const getFileTypeDescription = (): string => {
  return 'CSV, Excel, OpenDocument, or Numbers files';
};