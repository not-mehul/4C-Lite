import React, { useMemo, useState, useEffect } from 'react';
import {
  BarChart,
  Download,
  RotateCcw,
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
  Edit,
  Save,
  Eye,
  FileDown,
} from 'lucide-react';
import { CSVData, ColumnSelection, VerkadaModel, ModelMatch, VerkadaFileInfo, CompatibilityType, CameraDetails, MatchType, ThirdPartyCamera } from '../types';
import { extractManufacturerNames } from '../utils/dataCleaningUtils';
import { processModelMatches, createDefaultCameraDetails, processPotentialMatchApproval, processPotentialMatchDecline } from '../utils/matchingUtils';
import { loadThirdPartyCameras } from '../utils/thirdPartyLoader';
import { getModifiedCameraEntries, generateYAMLExport, downloadYAMLFile, validateYAMLExportData } from '../utils/yamlExportUtils';
import { CameraEditForm } from './CameraEditForm';
import { MatchActionButtons } from './MatchActionButtons';

interface AnalysisResultsProps {
  data: CSVData;
  selection: ColumnSelection;
  verkadaModels: VerkadaModel[];
  onStartOver: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  data,
  selection,
  verkadaModels,
  onStartOver,
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [verkadaFileInfo, setVerkadaFileInfo] = useState<VerkadaFileInfo | null>(null);
  const [modelMatches, setModelMatches] = useState<ModelMatch[]>([]);
  const [thirdPartyCameras, setThirdPartyCameras] = useState<ThirdPartyCamera[]>([]);
  const [isLoadingThirdParty, setIsLoadingThirdParty] = useState(true);
  const [yamlExportError, setYamlExportError] = useState<string | null>(null);

  // Load third-party camera database
  useEffect(() => {
    const loadThirdPartyData = async () => {
      try {
        setIsLoadingThirdParty(true);
        const cameras = await loadThirdPartyCameras();
        setThirdPartyCameras(cameras);
        
        if (cameras.length === 0) {
          console.warn('No third-party cameras loaded - no enhancement will occur');
        } else {
          console.log(`Successfully loaded ${cameras.length} third-party cameras`);
        }
      } catch (error) {
        console.error('Failed to load third-party cameras:', error);
      } finally {
        setIsLoadingThirdParty(false);
      }
    };

    loadThirdPartyData();
  }, []);

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

  /**
   * Toggles the expansion state of a table row
   */
  const toggleRowExpansion = (modelKey: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(modelKey)) {
      newExpanded.delete(modelKey);
    } else {
      newExpanded.add(modelKey);
    }
    setExpandedRows(newExpanded);
  };

  /**
   * Processes the uploaded data and performs compatibility analysis
   */
  const results = useMemo(() => {
    const modelColumnIndex = data.headers.indexOf(selection.modelColumn!);
    const countColumnIndex = selection.countColumn
      ? data.headers.indexOf(selection.countColumn)
      : -1;

    // Aggregate data by model
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

    // Process matches using utility function with third-party enhancement
    const processedMatches = processModelMatches(
      aggregatedData, 
      manufacturerNames, 
      verkadaModels,
      thirdPartyCameras
    );
    setModelMatches(processedMatches);
    return processedMatches;
  }, [data, selection, verkadaModels, thirdPartyCameras]);

  /**
   * Handles approval of a potential match with enhanced third-party processing
   */
  const handleApproveMatch = (matchId: string) => {
    setModelMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        return processPotentialMatchApproval(match, thirdPartyCameras);
      }
      return match;
    }));
  };

  /**
   * Handles decline of a potential match with enhanced third-party processing
   */
  const handleDeclineMatch = (matchId: string) => {
    setModelMatches(prev => prev.map(match => {
      if (match.id === matchId) {
        return processPotentialMatchDecline(match, thirdPartyCameras);
      }
      return match;
    }));
  };

  /**
   * Starts editing mode for a camera
   */
  const handleStartEdit = (matchId: string) => {
    setModelMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, isEditing: true }
        : match
    ));
  };

  /**
   * Saves edited camera details and updates match type to "modified"
   */
  const handleSaveEdit = (matchId: string, details: CameraDetails) => {
    setModelMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { 
            ...match, 
            editedDetails: details, 
            isEditing: false,
            matchType: 'modified' as MatchType,
            compatibilityType: details.integrationType
          }
        : match
    ));
  };

  /**
   * Cancels editing mode
   */
  const handleCancelEdit = (matchId: string) => {
    setModelMatches(prev => prev.map(match => 
      match.id === matchId 
        ? { ...match, isEditing: false }
        : match
    ));
  };

  /**
   * Checks if editing is allowed for a match type
   */
  const isEditingAllowed = (matchType: MatchType): boolean => {
    return matchType !== 'potential';
  };

  /**
   * Checks if details expansion is allowed for a match
   */
  const isDetailsExpansionAllowed = (match: ModelMatch): boolean => {
    // Allow expansion if:
    // 1. Has Verkada details (exact, potential, identified matches)
    // 2. Is a 'none' match that has been enhanced with third-party data
    // 3. Has been modified (has editedDetails)
    return !!(
      match.verkadaDetails || 
      (match.matchType === 'none' && match.thirdPartyEnhanced) ||
      match.editedDetails
    );
  };

  /**
   * Handles YAML export of modified camera entries
   */
  const handleYAMLExport = () => {
    try {
      setYamlExportError(null);
      
      const modifiedEntries = getModifiedCameraEntries(modelMatches);
      const validation = validateYAMLExportData(modifiedEntries);
      
      if (!validation.isValid) {
        setYamlExportError(`Export validation failed: ${validation.errors.join(', ')}`);
        return;
      }
      
      if (validation.warnings.length > 0) {
        console.warn('YAML Export warnings:', validation.warnings);
      }
      
      const yamlContent = generateYAMLExport(modifiedEntries);
      downloadYAMLFile(yamlContent);
      
      console.log(`Successfully exported ${modifiedEntries.length} modified camera entries`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setYamlExportError(errorMessage);
      console.error('YAML export failed:', error);
    }
  };

  // Calculate statistics using current modelMatches state
  const totalCount = modelMatches.reduce((sum, result) => sum + result.count, 0);
  const exactMatches = modelMatches.filter((r) => r.matchType === 'exact');
  const potentialMatches = modelMatches.filter((r) => r.matchType === 'potential');
  const identifiedMatches = modelMatches.filter((r) => r.matchType === 'identified');
  const declinedMatches = modelMatches.filter((r) => r.matchType === 'declined');
  const modifiedMatches = modelMatches.filter((r) => r.matchType === 'modified');
  const noMatches = modelMatches.filter((r) => r.matchType === 'none');

  // Calculate enhanced matches (additional info, not a match type)
  const enhancedMatches = modelMatches.filter((r) => r.thirdPartyEnhanced);

  const exactMatchDeviceCount = exactMatches.reduce((sum, match) => sum + match.count, 0);
  const potentialMatchDeviceCount = potentialMatches.reduce((sum, match) => sum + match.count, 0);
  const identifiedMatchDeviceCount = identifiedMatches.reduce((sum, match) => sum + match.count, 0);
  const declinedMatchDeviceCount = declinedMatches.reduce((sum, match) => sum + match.count, 0);
  const modifiedMatchDeviceCount = modifiedMatches.reduce((sum, match) => sum + match.count, 0);
  const enhancedMatchDeviceCount = enhancedMatches.reduce((sum, match) => sum + match.count, 0);
  const noMatchDeviceCount = noMatches.reduce((sum, match) => sum + match.count, 0);

  // Get modified entries for export button state
  const modifiedCameraEntries = getModifiedCameraEntries(modelMatches);

  /**
   * Downloads the analysis results as a CSV file with updated format
   */
  const downloadResults = () => {
    const csvContent = [
      [
        'Customer Model',
        'Count',
        'Match Type',
        'Manufacturer Name',
        'Compatible Model',
        'Compatibility Type',
        'Minimum Firmware',
        'Resolution (MP)',
        'Channel Count',
        'Notes',
        'Third Party Enhanced',
      ],
      ...modelMatches.map((result) => {
        const details = result.editedDetails;
        return [
          result.model,
          result.count.toString(),
          result.matchType,
          details?.manufacturer || result.verkadaDetails?.manufacturer || '',
          details?.modelName || result.matchedWith || '',
          details?.integrationType || result.compatibilityType || '',
          details?.minimumFirmware || result.verkadaDetails?.minimumFirmware || '',
          details?.resolutionMp?.toString() || '',
          details?.channelCount?.toString() || '',
          details?.notes || result.verkadaDetails?.notes || '',
          result.thirdPartyEnhanced ? 'Yes' : 'No',
        ];
      }),
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

  /**
   * Returns appropriate icon for match type
   */
  const getMatchIcon = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'potential':
        return <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case 'identified':
        return <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      case 'declined':
        return <X className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
      case 'modified':
        return <Edit className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'none':
        return <X className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return null;
    }
  };

  /**
   * Returns CSS classes for match type styling
   */
  const getMatchColor = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'potential':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'identified':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'declined':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'modified':
        return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      case 'none':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return '';
    }
  };

  /**
   * Returns human-readable match type label
   */
  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return 'Exact';
      case 'potential':
        return 'Potential';
      case 'identified':
        return 'Identified';
      case 'declined':
        return 'Declined';
      case 'modified':
        return 'Modified';
      case 'none':
        return 'None';
      default:
        return matchType;
    }
  };

  /**
   * Returns CSS classes for compatibility type styling
   */
  const getCompatibilityTypeColor = (compatibilityType: CompatibilityType) => {
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

        <div className="flex items-center justify-center text-sm text-blue-600 dark:text-blue-400">
          <Filter className="w-4 h-4" /> Camera Data has been cleaned to remove IP addresses, MAC addresses, dates, and common words.
            {thirdPartyCameras.length > 0 && (
      <>            <Info className="w-4 h-4" /> The data has also been checked against observed third-party camera database containing {thirdPartyCameras.length} models. )}
                  
        </div>
      </div>

      {/* Enhanced Summary Cards */}
      <div className="grid md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Models</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">
                {modelMatches.length.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {totalCount.toLocaleString()} {selection.countColumn || 'devices'}
              </p>
            </div>
            <BarChart className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Modified</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {modifiedMatches.length.toLocaleString()}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                {modifiedMatchDeviceCount.toLocaleString()} devices
              </p>
            </div>
            <Edit className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 dark:text-green-400">Exact</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {(exactMatches.length + identifiedMatches.length).toLocaleString()}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                {(exactMatchDeviceCount + identifiedMatchDeviceCount).toLocaleString()} devices
              </p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Potential</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                {potentialMatches.length.toLocaleString()}
              </p>
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                {potentialMatchDeviceCount.toLocaleString()} devices
              </p>
            </div>
            <AlertTriangle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">No Matches</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {(noMatches.length + declinedMatches.length).toLocaleString()}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                {(noMatchDeviceCount + declinedMatchDeviceCount).toLocaleString()} devices
              </p>
            </div>
            <X className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-8 transition-colors duration-300">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Compatibility Results
          </h3>
          
          {/* Discrete YAML Export Button */}
          {modifiedCameraEntries.length > 0 && (
            <div className="flex items-center space-x-2">
              <button
                onClick={handleYAMLExport}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 text-sm"
                title={`Export ${modifiedCameraEntries.length} modified entries to YAML`}
              >
                <FileDown className="w-4 h-4" />
                <span>Export Modified ({modifiedCameraEntries.length})</span>
              </button>
            </div>
          )}
        </div>

        {/* YAML Export Error Display */}
        {yamlExportError && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-red-800 dark:text-red-200 text-sm">
                Export Error: {yamlExportError}
              </p>
              <button
                onClick={() => setYamlExportError(null)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

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
                  Integration Protocol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {selection.countColumn || 'Count'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {modelMatches.map((result, index) => {
                const percentage = ((result.count / totalCount) * 100).toFixed(1);
                const modelKey = `${result.model}-${index}`;
                const isExpanded = expandedRows.has(modelKey);
                const hasDetails = isDetailsExpansionAllowed(result);

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
                        {result.removedElements && result.removedElements.length > 0 && (
                          <div
                            className="text-xs text-gray-500 dark:text-gray-400 mt-1"
                            title={result.removedElements.join(', ')}
                          >
                            Filtered: {result.removedElements.length} elements
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100 max-w-xs">
                          {result.editedDetails?.modelName || result.matchedWith || (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div
                            className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-medium ${getMatchColor(
                              result.matchType
                            )}`}
                          >
                            {getMatchIcon(result.matchType)}
                            <span>{getMatchTypeLabel(result.matchType)}</span>
                          </div>
                          {result.thirdPartyEnhanced && (
                            <span
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200"
                              title="Enhanced with third-party database"
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              Observed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {(result.editedDetails?.integrationType || result.compatibilityType) ? (
                          <div
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCompatibilityTypeColor(
                              result.editedDetails?.integrationType || result.compatibilityType!
                            )}`}
                          >
                            {result.editedDetails?.integrationType || result.compatibilityType}
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
                        <div className="flex items-center space-x-2">
                          {result.matchType === 'potential' ? (
                            <MatchActionButtons
                              onApprove={() => handleApproveMatch(result.id)}
                              onDecline={() => handleDeclineMatch(result.id)}
                            />
                          ) : isEditingAllowed(result.matchType) ? (
                            <>
                              <button
                                onClick={() => handleStartEdit(result.id)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                                title="Edit camera details"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              
                              {hasDetails && (
                                <button
                                  onClick={() => toggleRowExpansion(modelKey)}
                                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/20 rounded-md transition-colors duration-200 shadow-sm hover:shadow-md"
                                  title="View compatibility details"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4" />
                                  )}
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">
                              Locked until action taken
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Edit Form Row */}
                    {result.isEditing && (
                      <tr className="bg-blue-50 dark:bg-blue-900/20">
                        <td colSpan={6} className="px-6 py-4">
                          <CameraEditForm
                            initialDetails={result.editedDetails || createDefaultCameraDetails(result)}
                            onSave={(details) => handleSaveEdit(result.id, details)}
                            onCancel={() => handleCancelEdit(result.id)}
                          />
                        </td>
                      </tr>
                    )}

                    {/* Expanded Details Row */}
                    {isExpanded && hasDetails && (
                      <tr className="bg-blue-50 dark:bg-blue-900/20">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-700 p-4">
                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                              Camera Configuration Details
                              {result.thirdPartyEnhanced && (
                                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200">
                                  <Eye className="w-3 h-3 mr-1" />
                                  Observed
                                </span>
                              )}
                            </h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                  Manufacturer
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                  {result.editedDetails?.manufacturer || result.verkadaDetails?.manufacturer || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                  Minimum Firmware Required
                                </label>
                                <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                  {result.editedDetails?.minimumFirmware || result.verkadaDetails?.minimumFirmware || 'Not specified'}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                  Integration Protocol
                                </label>
                                <div className="mt-1">
                                  <div
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getCompatibilityTypeColor(
                                      result.editedDetails?.integrationType || result.compatibilityType!
                                    )}`}
                                  >
                                    {result.editedDetails?.integrationType || result.compatibilityType}
                                  </div>
                                </div>
                              </div>
                              {/* Resolution (MP) Field */}
                              {(result.editedDetails?.resolutionMp || result.editedDetails?.resolutionMp === 0) && (
                                <div>
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Resolution (MP)
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                    {result.editedDetails.resolutionMp} MP
                                  </p>
                                </div>
                              )}
                              {/* Channel Count Field */}
                              {result.editedDetails?.channelCount && (
                                <div>
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Channel Count
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                    {result.editedDetails.channelCount} {result.editedDetails.channelCount === 1 ? 'channel' : 'channels'}
                                  </p>
                                </div>
                              )}
                              {(result.editedDetails?.notes || result.verkadaDetails?.notes) && (
                                <div className="md:col-span-2">
                                  <label className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                                    Notes & Additional Information
                                  </label>
                                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1 bg-gray-50 dark:bg-gray-700 p-3 rounded border border-gray-200 dark:border-gray-600">
                                    {result.editedDetails?.notes || result.verkadaDetails?.notes}
                                  </p>
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