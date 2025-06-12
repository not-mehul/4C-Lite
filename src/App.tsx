import React, { useState, useEffect } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataPreviewSelect } from './components/DataPreviewSelect';
import { AnalysisResults } from './components/AnalysisResults';
import { ErrorMessage } from './components/ErrorMessage';
import { Navigation } from './components/Navigation';
import { ThemeProvider } from './contexts/ThemeContext';
import { CSVData, ColumnSelection as ColumnSelectionType, UploadStep } from './types';
import { loadVerkadaModels, VerkadaModel } from './utils/verkadaLoader';

function AppContent() {
  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [csvData, setCsvData] = useState<CSVData | null>(null);
  const [columnSelection, setColumnSelection] = useState<ColumnSelectionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verkadaModels, setVerkadaModels] = useState<VerkadaModel[]>([]);
  const [isLoadingVerkada, setIsLoadingVerkada] = useState(true);

  // Load Verkada models on app initialization
  useEffect(() => {
    const initializeVerkadaModels = async () => {
      try {
        setIsLoadingVerkada(true);
        const models = await loadVerkadaModels();
        setVerkadaModels(models);
        
        if (models.length === 0) {
          console.warn('No Verkada models loaded - analysis will show no matches');
        } else {
          console.log(`Successfully loaded ${models.length} Verkada compatible models`);
        }
      } catch (error) {
        console.error('Failed to load Verkada models:', error);
        setError('Failed to load Verkada compatibility data. Analysis may not be accurate.');
      } finally {
        setIsLoadingVerkada(false);
      }
    };

    initializeVerkadaModels();
  }, []);

  const handleFileUpload = (data: CSVData) => {
    setCsvData(data);
    setCurrentStep('preview');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleSelectionNext = (selection: ColumnSelectionType) => {
    setColumnSelection(selection);
    setCurrentStep('analysis');
  };

  const handleStartOver = () => {
    setCsvData(null);
    setColumnSelection(null);
    setCurrentStep('upload');
    setError(null);
  };

  const closeError = () => {
    setError(null);
  };

  // Show loading state while Verkada models are being loaded
  if (isLoadingVerkada) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Loading Verkada Compatibility Data
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please wait while we load the latest compatibility information...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Navigation />
      
      <div className="py-8 px-4">
        <div className="container mx-auto max-w-8xl">
          {/* Progress Indicator */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-between">
              {[
                { key: 'upload', label: 'Upload', step: 1 },
                { key: 'preview', label: 'Preview & Select', step: 2 },
                { key: 'analysis', label: 'Analysis', step: 3 }
              ].map(({ key, label, step }) => {
                const isActive = currentStep === key;
                const isCompleted = ['upload', 'preview', 'analysis'].indexOf(currentStep) > 
                  ['upload', 'preview', 'analysis'].indexOf(key);
                
                return (
                  <div key={key} className="flex items-center">
                    <div className={`
                      flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 shadow-sm
                      ${isActive ? 'bg-blue-600 dark:bg-blue-500 text-white shadow-blue-200 dark:shadow-blue-800' : 
                        isCompleted ? 'bg-green-600 dark:bg-green-500 text-white shadow-green-200 dark:shadow-green-800' : 
                        'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}
                    `}>
                      {step}
                    </div>
                    <span className={`ml-2 text-sm font-medium transition-colors duration-300 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 
                      isCompleted ? 'text-green-600 dark:text-green-400' : 
                      'text-gray-500 dark:text-gray-400'
                    }`}>
                      {label}
                    </span>
                    {step < 3 && (
                      <div className={`ml-4 w-8 h-0.5 transition-all duration-300 ${
                        isCompleted ? 'bg-green-600 dark:bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Main Content */}
          <div className="transition-all duration-300 animate-scale-in">
            {currentStep === 'upload' && (
              <FileUpload onFileUpload={handleFileUpload} onError={handleError} />
            )}
            
            {currentStep === 'preview' && csvData && (
              <DataPreviewSelect 
                data={csvData} 
                onNext={handleSelectionNext}
              />
            )}
            
            {currentStep === 'analysis' && csvData && columnSelection && (
              <AnalysisResults 
                data={csvData} 
                selection={columnSelection}
                verkadaModels={verkadaModels}
                onStartOver={handleStartOver}
              />
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <ErrorMessage message={error} onClose={closeError} />
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;