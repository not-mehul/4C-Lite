import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, Eye, ArrowRight, CheckCircle, AlertCircle, Info, X, Keyboard } from 'lucide-react';
import { CSVData, ColumnSelection } from '../types';

interface DataPreviewSelectProps {
  data: CSVData;
  onNext: (selection: ColumnSelection) => void;
}

export const DataPreviewSelect: React.FC<DataPreviewSelectProps> = ({ data, onNext }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showAll, setShowAll] = useState(false);
  const [modelColumn, setModelColumn] = useState<string | null>(null);
  const [countColumn, setCountColumn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [focusedColumn, setFocusedColumn] = useState<number>(-1);

  const sortedData = useMemo(() => {
    if (!sortColumn) return data.rows;

    const columnIndex = data.headers.indexOf(sortColumn);
    if (columnIndex === -1) return data.rows;

    return [...data.rows].sort((a, b) => {
      const aVal = a[columnIndex] || '';
      const bVal = b[columnIndex] || '';
      
      const comparison = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [data.rows, data.headers, sortColumn, sortDirection]);

  const displayedRows = showAll ? sortedData : sortedData.slice(0, 10);

  const handleSort = (header: string) => {
    if (sortColumn === header) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(header);
      setSortDirection('asc');
    }
  };

  const handleColumnSelect = (header: string, type: 'model' | 'count') => {
    if (type === 'model') {
      setModelColumn(header === modelColumn ? null : header);
      // If selecting the same column as count, clear count
      if (header === countColumn) {
        setCountColumn(null);
      }
    } else {
      setCountColumn(header === countColumn ? null : header);
      // If selecting the same column as model, clear model
      if (header === modelColumn) {
        setModelColumn(null);
      }
    }
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, columnIndex: number) => {
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedColumn(Math.max(0, columnIndex - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedColumn(Math.min(data.headers.length - 1, columnIndex + 1));
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        handleColumnSelect(data.headers[columnIndex], 'model');
        break;
      case 'c':
      case 'C':
        e.preventDefault();
        handleColumnSelect(data.headers[columnIndex], 'count');
        break;
      case 'Escape':
        setFocusedColumn(-1);
        break;
    }
  };

  const clearSelections = () => {
    setModelColumn(null);
    setCountColumn(null);
    setError(null);
  };

  const handleNext = () => {
    if (!modelColumn) {
      setError('Please select a Model column to continue.');
      return;
    }

    onNext({
      modelColumn,
      countColumn
    });
  };

  const getSortIcon = (header: string) => {
    if (sortColumn !== header) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4" /> : 
      <ChevronDown className="w-4 h-4" />;
  };

  const getColumnHeaderClass = (header: string, index: number) => {
    const isModelColumn = header === modelColumn;
    const isCountColumn = header === countColumn;
    const isFocused = focusedColumn === index;
    
    let baseClass = "px-6 py-4 text-left text-xs font-medium uppercase tracking-wider cursor-pointer transition-all duration-300 select-none relative group";
    
    if (isModelColumn) {
      return `${baseClass} bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-b-2 border-green-500 dark:border-green-400`;
    } else if (isCountColumn) {
      return `${baseClass} bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-b-2 border-blue-500 dark:border-blue-400`;
    } else {
      return `${baseClass} text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        isFocused ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
      }`;
    }
  };

  const getCellClass = (header: string, rowIndex: number) => {
    const isModelColumn = header === modelColumn;
    const isCountColumn = header === countColumn;
    
    let baseClass = "px-6 py-4 whitespace-nowrap text-sm transition-all duration-300 cursor-pointer";
    
    if (isModelColumn) {
      return `${baseClass} bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-100 border-l-2 border-green-500 dark:border-green-400`;
    } else if (isCountColumn) {
      return `${baseClass} bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100 border-l-2 border-blue-500 dark:border-blue-400`;
    } else {
      return `${baseClass} text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700/30`;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">
          Select Camera Data Columns
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review your camera data ({data.rows.length.toLocaleString()} rows, {data.headers.length} columns) and select analysis columns.
        </p>
      </div>

      {/* Column Selection Instructions */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-4 h-4 bg-green-500 dark:bg-green-400 rounded-full"></div>
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Model Column</h3>
            <span className="text-red-500 dark:text-red-400 text-sm font-medium">Required</span>
          </div>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            Click on any column to select it as the Model column.
          </p>
          {modelColumn && (
            <div className="flex items-center space-x-2 bg-green-100 dark:bg-green-900/40 rounded-md p-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Selected: {modelColumn}
              </span>
            </div>
          )}
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-4 h-4 bg-blue-500 dark:bg-blue-400 rounded-full"></div>
            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Count Column</h3>
            <span className="text-gray-400 dark:text-gray-500 text-sm">Optional</span>
          </div>
          <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
            Click on a column header while holding <kbd className="px-1 py-0.5 bg-blue-200 dark:bg-blue-800 rounded text-xs">Cmd</kbd> to select it as the Count column.
          </p>
          {countColumn && (
            <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/40 rounded-md p-2">
              <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Selected: {countColumn}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Selection Controls */}
      {(modelColumn || countColumn) && (
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Columns selected: {[modelColumn, countColumn].filter(Boolean).length}
            </span>
            {modelColumn && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200">
                Model: {modelColumn}
              </span>
            )}
            {countColumn && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">
                Count: {countColumn}
              </span>
            )}
          </div>
          <button
            onClick={clearSelections}
            className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-200"
          >
            <X className="w-4 h-4" />
            <span className="text-sm">Clear</span>
          </button>
        </div>
      )}

      {/* Data Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                {data.headers.map((header, index) => (
                  <th
                    key={index}
                    className={getColumnHeaderClass(header, index)}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        handleColumnSelect(header, 'count');
                      } else {
                        handleColumnSelect(header, 'model');
                      }
                    }}
                    onDoubleClick={() => handleSort(header)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    tabIndex={0}
                    role="columnheader"
                    aria-label={`Column ${header}. Click to select as model column, Cmd+click for count column, double-click to sort`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="truncate max-w-32">{header}</span>
                        {getSortIcon(header)}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {displayedRows.length === 0 ? (
                <tr>
                  <td 
                    colSpan={data.headers.length} 
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    No data to display
                  </td>
                </tr>
              ) : (
                displayedRows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                    {row.map((cell, cellIndex) => (
                      <td 
                        key={cellIndex} 
                        className={getCellClass(data.headers[cellIndex], rowIndex)}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            handleColumnSelect(data.headers[cellIndex], 'count');
                          } else {
                            handleColumnSelect(data.headers[cellIndex], 'model');
                          }
                        }}
                      >
                        <div className="max-w-xs truncate" title={cell}>
                          {cell || '-'}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {data.rows.length > 10 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors duration-200"
            >
              <Eye className="w-4 h-4" />
              <span>{showAll ? 'Show less' : `Show all ${data.rows.length.toLocaleString()} rows`}</span>
            </button>
          </div>
        )}
      </div>

      {/* Keyboard shortcuts info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 shadow-sm">
        <div className="flex items-start space-x-3">
          <Keyboard className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="text-blue-800 dark:text-blue-200 font-semibold mb-2">Usage:</p>
            <div className="grid md:grid-cols-2 gap-2 text-blue-700 dark:text-blue-300">
              <div>• <strong>Click</strong> column headers to select as Model column</div>
              <div>• <strong>Cmd+Click</strong> column headers to select as Count column</div>
              <div>• <strong>Double-click</strong> column headers to sort data</div>
              <div>• <strong>With Count</strong>: Groups by Model and sums Count values</div>
              <div>• <strong>Without Count</strong>: Counts unique Model occurrences</div>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8 shadow-sm">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-200 font-medium">{error}</p>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <button
          onClick={handleNext}
          className="flex items-center space-x-2 bg-blue-600 dark:bg-blue-500 text-white px-8 py-3 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md transform hover:scale-105"
          disabled={!modelColumn}
        >
          <span>Analyze Data</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};