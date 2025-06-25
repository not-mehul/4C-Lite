/**
 * Application constants and configuration values
 */

/** Maximum file size allowed for upload (25MB) */
export const MAX_FILE_SIZE = 25 * 1024 * 1024;

/** Supported file types for upload */
export const SUPPORTED_FILE_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.oasis.opendocument.spreadsheet',
  'application/vnd.apple.numbers'
];

/** Supported file extensions */
export const SUPPORTED_FILE_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.ods', '.numbers'];

/** Default number of rows to display in preview */
export const DEFAULT_PREVIEW_ROWS = 10;

/** Minimum similarity threshold for potential matches */
export const MIN_SIMILARITY_THRESHOLD = 0.6;

/** Progress update interval for file upload simulation */
export const UPLOAD_PROGRESS_INTERVAL = 100;

/** Progress increment for upload simulation */
export const UPLOAD_PROGRESS_INCREMENT = 10;

/** Common English dictionary words to filter out during data cleaning */
export const COMMON_WORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use',
  'camera', 'security', 'surveillance', 'system', 'device', 'equipment', 'network', 'wireless', 'indoor', 'outdoor', 'dome', 'bullet', 'ptz', 'fixed', 'varifocal', 'lens', 'megapixel', 'resolution', 'night', 'vision', 'infrared', 'audio', 'video', 'digital', 'analog', 'hybrid', 'nvr', 'dvr', 'recorder', 'channel', 'port', 'power', 'supply', 'adapter', 'cable', 'mount', 'bracket', 'housing', 'enclosure'
]);

/** Regular expression patterns for data filtering */
export const REGEX_PATTERNS = {
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  IPV6: /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/,
  MAC_ADDRESS: /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^([0-9A-Fa-f]{4}\.){2}[0-9A-Fa-f]{4}$/,
  DATE_PATTERNS: [
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // MM/DD/YYYY or M/D/YY
    /^\d{1,2}-\d{1,2}-\d{2,4}$/, // MM-DD-YYYY or M-D-YY
    /^\d{4}-\d{1,2}-\d{1,2}$/, // YYYY-MM-DD
    /^\d{1,2}\.\d{1,2}\.\d{2,4}$/, // MM.DD.YYYY
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{2,4}$/i, // Month DD, YYYY
  ]
};