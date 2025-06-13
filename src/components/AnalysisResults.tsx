import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Download,
  RotateCcw,
  TrendingUp,
  Search,
  CheckCircle,
  AlertTriangle,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  Info,
  Calendar,
  Database,
} from 'lucide-react';
import { CSVData, ColumnSelection, AnalysisResult } from '../types';
import { VerkadaModel } from '../utils/verkadaLoader';
import {
  preprocessModelForMatching,
  extractManufacturerNames,
  cleanModelData,
} from '../utils/dataCleaningUtils';

interface AnalysisResultsProps {
  data: CSVData;
  selection: ColumnSelection;
  verkadaModels: VerkadaModel[];
  onStartOver: () => void;
}

interface ModelMatch {
  model: string;
  cleanedModel: string;
  count: number;
  matchType: 'exact' | 'potential' | 'none';
  matchedWith?: string;
  similarity?: number;
  removedElements?: string[];
  verkadaDetails?: VerkadaModel;
  compatibilityType?: 'RTSP' | 'ONVIF-S';
}

interface VerkadaFileInfo {
  totalModels: number;
  lastModified: string;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  data,
  selection,
  verkadaModels,
  onStartOver,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [verkadaFileInfo, setVerkadaFileInfo] =
    useState<VerkadaFileInfo | null>(null);

  // Load Verkada file information
  useEffect(() => {
    const loadVerkadaFileInfo = async () => {
      try {
        const response = await fetch(
          'Verkada Command Connector Compatibility.csv',
          { method: 'HEAD' }
        );
        if (response.ok) {
          const lastModified = response.headers.get('last-modified');
          const date = lastModified ? new Date(lastModified) : new Date();

          setVerkadaFileInfo({
            totalModels: verkadaModels.length,
            lastModified: date.toLocaleDateString('en-US', {
              month: '2-digit',
              day: '2-digit',
              year: 'numeric',
            }),
          });
        }
      } catch (error) {
        // Fallback to current date if we can't get file info
        setVerkadaFileInfo({
          totalModels: verkadaModels.length,
          lastModified: new Date().toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
          }),
        });
      }
    };

    if (verkadaModels.length > 0) {
      loadVerkadaFileInfo();
    }
  }, [verkadaModels]);

  const toggleRowExpansion = (modelKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(modelKey)) {
      newExpanded.delete(modelKey);
    } else {
      newExpanded.add(modelKey);
    }
    setExpandedRows(newExpanded);
  };

  // Function to determine compatibility type based on notes
  const getCompatibilityType = (verkadaModel?: VerkadaModel): 'RTSP' | 'ONVIF-S' => {
    if (!verkadaModel || !verkadaModel.notes) {
      return 'ONVIF-S';
    }
    
    const notes = verkadaModel.notes.toLowerCase();
    return notes.includes('rtsp support only') ? 'RTSP' : 'ONVIF-S';
  };

  // Function to calculate string similarity
  const calculateSimilarity = (str1: string, str2: string): number => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = levenshteinDistance(
      longer.toLowerCase(),
      shorter.toLowerCase()
    );
    return (longer.length - editDistance) / longer.length;
  };

  // Levenshtein distance calculation
  const levenshteinDistance = (str1: string, str2: string): number => {
    const matrix = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  };

  // Function to find best match for a model
  const findBestMatch = (
    cleanedModel: string,
    manufacturerNames: string[]
  ): {
    matchType: 'exact' | 'potential' | 'none';
    matchedWith?: string;
    similarity?: number;
    verkadaDetails?: VerkadaModel;
    compatibilityType?: 'RTSP' | 'ONVIF-S';
  } => {
    if (!cleanedModel || cleanedModel.trim() === '') {
      return { matchType: 'none' };
    }

    const modelLower = cleanedModel.toLowerCase().trim();

    // Check for exact match with cleaned Verkada models
    for (const verkadaModel of verkadaModels) {
      const cleanedVerkadaModel = preprocessModelForMatching(
        verkadaModel.modelName,
        manufacturerNames
      );
      if (cleanedVerkadaModel.toLowerCase() === modelLower) {
        return {
          matchType: 'exact',
          matchedWith: verkadaModel.modelName,
          similarity: 1.0,
          verkadaDetails: verkadaModel,
          compatibilityType: getCompatibilityType(verkadaModel),
        };
      }
    }

    // Check for potential matches
    let bestMatch = '';
    let bestSimilarity = 0;
    let bestOriginalModel = '';
    let bestVerkadaModel: VerkadaModel | undefined;

    for (const verkadaModel of verkadaModels) {
      const cleanedVerkadaModel = preprocessModelForMatching(
        verkadaModel.modelName,
        manufacturerNames
      );
      const similarity = calculateSimilarity(
        modelLower,
        cleanedVerkadaModel.toLowerCase()
      );

      // Check if one is a subset of the other
      const isSubset =
        modelLower.includes(cleanedVerkadaModel.toLowerCase()) ||
        cleanedVerkadaModel.toLowerCase().includes(modelLower);

      if (similarity > bestSimilarity || (isSubset && similarity > 0.5)) {
        bestSimilarity = similarity;
        bestMatch = cleanedVerkadaModel;
        bestOriginalModel = verkadaModel.modelName;
        bestVerkadaModel = verkadaModel;
      }
    }

    // Consider it a potential match if similarity > 0.6 or if there's a significant substring match
    if (bestSimilarity > 0.6) {
      return {
        matchType: 'potential',
        matchedWith: bestOriginalModel,
        similarity: bestSimilarity,
        verkadaDetails: bestVerkadaModel,
        compatibilityType: getCompatibilityType(bestVerkadaModel),
      };
    }

    return { matchType: 'none' };
  };

  const results = useMemo(() => {
    const modelColumnIndex = data.headers.indexOf(selection.modelColumn!);
    const countColumnIndex = selection.countColumn
      ? data.headers.indexOf(selection.countColumn)
      : -1;

    const aggregatedData = new Map<string, number>();

    data.rows.forEach((row) => {
      const model = row[modelColumnIndex];
      if (!model) return;

      if (countColumnIndex >= 0) {
        const countValue = parseFloat(row[countColumnIndex]) || 0;
        aggregatedData.set(
          model,
          (aggregatedData.get(model) || 0) + countValue
        );
      } else {
        aggregatedData.set(model, (aggregatedData.get(model) || 0) + 1);
      }
    });

    // Extract manufacturer names for cleaning
    const manufacturerNames = extractManufacturerNames(verkadaModels);

    return Array.from(aggregatedData.entries())
      .map(([model, count]) => {
        const cleaningResult = cleanModelData(model, manufacturerNames);
        const cleanedModel = cleaningResult.cleaned;
        const matchInfo = findBestMatch(cleanedModel, manufacturerNames);

        return {
          model,
          cleanedModel,
          count,
          matchType: matchInfo.matchType,
          matchedWith: matchInfo.matchedWith,
          similarity: matchInfo.similarity,
          removedElements: cleaningResult.removedElements,
          verkadaDetails: matchInfo.verkadaDetails,
          compatibilityType: matchInfo.compatibilityType,
        } as ModelMatch;
      })
      .sort((a, b) => b.count - a.count);
  }, [data, selection, verkadaModels]);

  const totalCount = results.reduce((sum, result) => sum + result.count, 0);
  const maxCount = Math.max(...results.map((r) => r.count));

  // Statistics for match types
  const exactMatches = results.filter((r) => r.matchType === 'exact');
  const potentialMatches = results.filter((r) => r.matchType === 'potential');
  const noMatches = results.filter((r) => r.matchType === 'none');

  // Calculate device counts for each match type
  const exactMatchDeviceCount = exactMatches.reduce((sum, match) => sum + match.count, 0);
  const potentialMatchDeviceCount = potentialMatches.reduce((sum, match) => sum + match.count, 0);
  const noMatchDeviceCount = noMatches.reduce((sum, match) => sum + match.count, 0);

  const downloadResults = () => {
    const csvContent = [
      [
        'Original Model',
        selection.countColumn ? selection.countColumn : 'Count',
        'Match Type',
        'Verkada Compatible Model',
        'Compatibility Type',
        'Minimum Firmware',
        'Notes',
      ],
      ...results.map((result) => [
        result.model,
        result.count.toString(),
        result.matchType,
        result.matchedWith || '',
        result.compatibilityType || '',
        result.verkadaDetails?.minimumFirmware || '',
        result.verkadaDetails?.notes || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '4c-lite-verkada-compatibility-analysis.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getMatchIcon = (matchType: 'exact' | 'potential' | 'none') => {
    switch (matchType) {
      case 'exact':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'potential':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'none':
        return <X className="w-4 h-4 text-red-600 dark:text-red-400" />;
    }
  };

  const getMatchColor = (matchType: 'exact' | 'potential' | 'none') => {
    switch (matchType) {
      case 'exact':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'potential':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'none':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
    }
  };

  const getCompatibilityTypeColor = (compatibilityType: 'RTSP' | 'ONVIF-S') => {
    switch (compatibilityType) {
      case 'RTSP':
        return 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
      case 'ONVIF-S':
        return 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    }
  };

  // Show warning if no Verkada models were loaded
  if (verkadaModels.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Command Connector Compatibility Analysis
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comparison with the Command Connector Hardware Compatibility List
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6 shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">
                Unable to Load Verkada Compatibility Data
              </h3>
              <p className="text-red-700 dark:text-red-300 mt-1">
                The Verkada compatibility list could not be loaded. Please
                ensure the CSV file is available and try refreshing the page.
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onStartOver}
            className="flex items-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 font-medium shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-8xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mb-3">
          Command Connector Compatibility Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Comparison with the Command Connector Hardware Compatibility List
        </p>

        {/* Verkada Compatibility File Information */}
        {verkadaFileInfo && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 max-w-2xl mx-auto shadow-sm">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Compatible Models
                  </p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {verkadaFileInfo.totalModels.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="w-px h-8 bg-blue-200 dark:bg-blue-700"></div>

              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Last Updated
                  </p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {verkadaFileInfo.lastModified}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
          <Filter className="w-4 h-4" />
          <span>
            Camera Data has been cleaned to remove IP addresses, MAC addresses, dates, and common words.
          </span>
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Models</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {results.length.toLocaleString()}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total {selection.countColumn || 'Devices'}: {totalCount.toLocaleString()}
                </p>
              </div>
            </div>
            <BarChart className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">
                Exact Matches
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {exactMatches.length.toLocaleString()}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((exactMatches.length / results.length) * 100).toFixed(1)}% of models
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  {exactMatchDeviceCount.toLocaleString()} {selection.countColumn || 'devices'} ({((exactMatchDeviceCount / totalCount) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                Potential Matches
              </p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {potentialMatches.length.toLocaleString()}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((potentialMatches.length / results.length) * 100).toFixed(1)}% of models
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  {potentialMatchDeviceCount.toLocaleString()} {selection.countColumn || 'devices'} ({((potentialMatchDeviceCount / totalCount) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">No Matches</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {noMatches.length.toLocaleString()}
              </p>
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {((noMatches.length / results.length) * 100).toFixed(1)}% of models
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {noMatchDeviceCount.toLocaleString()} {selection.countColumn || 'devices'} ({((noMatchDeviceCount / totalCount) * 100).toFixed(1)}%)
                </p>
              </div>
            </div>
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 transition-colors duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Compatibility Results
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer Camera Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Verkada Compatible Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Match Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Integration Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {selection.countColumn || 'Count'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {results.map((result, index) => {
                const percentage = ((result.count / totalCount) * 100).toFixed(
                  1
                );
                const modelKey = `${result.model}-${index}`;
                const isExpanded = expandedRows.has(modelKey);
                const hasDetails =
                  result.verkadaDetails &&
                  (result.matchType === 'exact' ||
                    result.matchType === 'potential');

                return (
                  <React.Fragment key={modelKey}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 max-w-xs font-mono bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded"
                          title={result.cleanedModel}
                        >
                          {result.cleanedModel || (
                            <span className="text-gray-400 dark:text-gray-500 italic">
                              No data after cleaning
                            </span>
                          )}
                        </div>
                        {result.removedElements &&
                          result.removedElements.length > 0 && (
                            <div
                              className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                              title={result.removedElements.join(', ')}
                            >
                              Filtered: {result.removedElements.length} elements
                            </div>
                          )}
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-gray-900 dark:text-gray-100 max-w-xs"
                          title={result.matchedWith}
                        >
                          {result.matchedWith || (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div
                          className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getMatchColor(
                            result.matchType
                          )}`}
                        >
                          {getMatchIcon(result.matchType)}
                          <span className="capitalize">
                            {result.matchType === 'none'
                              ? 'No Match'
                              : result.matchType + ' Match'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result.compatibilityType ? (
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCompatibilityTypeColor(
                              result.compatibilityType
                            )}`}
                          >
                            {result.compatibilityType}
                          </div>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
                          {result.count.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {percentage}%
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasDetails ? (
                          <button
                            onClick={() => toggleRowExpansion(modelKey)}
                            className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors duration-200"
                            title="View compatibility details"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                            <Info className="w-4 h-4" />
                            <span className="text-xs font-medium">Details</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>

                    {/* Expanded Details Row */}
                    {isExpanded && hasDetails && result.verkadaDetails && (
                      <tr className="bg-blue-50 dark:bg-blue-900/20">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                              Verkada Compatibility Details
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                  Manufacturer
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                  {result.verkadaDetails.manufacturer ||
                                    'Not specified'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                  Minimum Firmware Required
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                  {result.verkadaDetails.minimumFirmware ||
                                    'Not specified'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                  Integration Protocol
                                </label>
                                <div className="mt-1">
                                  <div
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCompatibilityTypeColor(
                                      result.compatibilityType!
                                    )}`}
                                  >
                                    {result.compatibilityType}
                                  </div>
                                </div>
                              </div>
                              {result.verkadaDetails.notes && (
                                <div className="md:col-span-2">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Notes & Additional Information
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                                    {result.verkadaDetails.notes}
                                  </p>
                                </div>
                              )}
                              {result.similarity &&
                                result.matchType === 'potential' && (
                                  <div className="md:col-span-2">
                                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                      Match Confidence
                                    </label>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div
                                          className="bg-yellow-500 dark:bg-yellow-400 h-2 rounded-full transition-all duration-500"
                                          style={{
                                            width: `${
                                              result.similarity * 100
                                            }%`,
                                          }}
                                        ></div>
                                      </div>
                                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                        {(result.similarity * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={downloadResults}
          className="flex items-center justify-center space-x-2 bg-green-600 dark:bg-green-500 text-white px-8 py-3 rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <Download className="w-4 h-4" />
          <span>Download Compatibility Report</span>
        </button>

        <button
          onClick={onStartOver}
          className="flex items-center justify-center space-x-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 font-medium shadow-sm hover:shadow-md transform hover:scale-105"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Analyze Another File</span>
        </button>
      </div>
    </div>
  );
};