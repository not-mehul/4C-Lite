export interface VerkadaModel {
  manufacturer: string;
  modelName: string;
  minimumFirmware: string;
  notes: string;
}

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

    return models.filter(
      (model) => model.modelName && model.modelName.trim() !== ''
    );
  } catch (error) {
    console.error('Error loading Verkada models:', error);
    // Return empty array as fallback - analysis will show no matches
    return [];
  }
};

const parseVerkadaCSV = (csvText: string): VerkadaModel[] => {
  const lines = csvText.split('\n').filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error('CSV file is empty');
  }

  // Skip header lines until we find the actual data header
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
  const manufacturerIndex = headers.findIndex((h) =>
    h.toLowerCase().includes('manufacturer')
  );
  const modelNameIndex = headers.findIndex((h) =>
    h.toLowerCase().includes('model name')
  );
  const firmwareIndex = headers.findIndex((h) =>
    h.toLowerCase().includes('firmware')
  );
  const notesIndex = headers.findIndex((h) =>
    h.toLowerCase().includes('notes')
  );

  if (manufacturerIndex === -1 || modelNameIndex === -1) {
    throw new Error(
      'Required columns (Manufacturer, Model Name) not found in CSV'
    );
  }

  const models: VerkadaModel[] = [];

  // Parse data rows
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);

    if (row.length > Math.max(manufacturerIndex, modelNameIndex)) {
      const manufacturer = row[manufacturerIndex]?.trim() || '';
      const modelName = row[modelNameIndex]?.trim() || '';
      const minimumFirmware = row[firmwareIndex]?.trim() || '';
      const notes = row[notesIndex]?.trim() || '';

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
