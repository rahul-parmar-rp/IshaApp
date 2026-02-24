import React, { useState, useEffect } from 'react';
import { Alert, BackHandler } from 'react-native';
import { usePersistedState, useSessionCombinations } from './src/hooks';
import { MainScreen } from './src/MainScreen';
import { TimeScreen } from './src/TimeScreen';
import { SuggestionsScreen } from './src/SuggestionsScreen';
import { SettingsScreen } from './src/SettingsScreen';

// Import refactored services and hooks
import { YogaPractice } from './src/types';
import { PracticeService } from './src/services/PracticeService';
import { useNavigation } from './src/hooks/navigationHooks';
import { usePracticeOperations, useLearnedOperations } from './src/hooks/practiceOperationsHooks';
import { useCsvTextImport, useCsvFileImport, useManualCsvImport } from './src/hooks/csvImportHooks';
import { useCSVExport, useTestDocumentPicker } from './src/hooks/fileOperationsHooks';

function App(): React.JSX.Element {
  // Navigation state
  const {
    currentScreen,
    goToSettings,
    goToTime,
    goToSuggestions,
    goToSelect,
  } = useNavigation();

  // Practice data state
  const [defaultPractices, setDefaultPractices] = usePersistedState<YogaPractice[]>(
    'defaultPractices',
    PracticeService.DEFAULT_PRACTICES
  );

  const [learned, setLearned] = usePersistedState<string[]>('learned', []);
  const [availableTime, setAvailableTime] = usePersistedState<string>('availableTime', '60');
  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);

  // Practice operations
  const practiceOps = usePracticeOperations(defaultPractices, setDefaultPractices);
  const learnedOps = useLearnedOperations(learned, setLearned);

  // CSV import hooks
  const { csvText, setCsvText, importCSV } = useCsvTextImport(practiceOps.addPractices);
  const { importCSVFile } = useCsvFileImport(practiceOps.addPractices);
  const { importFromDownloads } = useManualCsvImport(practiceOps.addPractices);

  // File operations
  const { downloadExampleCSV } = useCSVExport();
  const { testDocumentPicker } = useTestDocumentPicker();

  // Clear custom practices with confirmation
  const clearCustomPractices = () => {
    Alert.alert(
      'Clear Custom Practices',
      'Are you sure you want to remove all custom practices?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            practiceOps.clearCustomPractices();
            learnedOps.clearCustomLearned();
          },
        },
      ],
    );
  };

  // Derived data
  const customPractices = PracticeService.getCustomPractices(defaultPractices);
  const allPractices = PracticeService.getAllPracticesSorted(defaultPractices);
  const learnedPractices = PracticeService.getLearnedPractices(allPractices, learned);
  const availableTimeNum = parseInt(availableTime, 10) || 0;

  // Session combinations
  const getSessionCombinations = useSessionCombinations(learnedPractices, availableTimeNum);
  const sessionCombinations = currentScreen === 'suggestions' ? getSessionCombinations() : [];

  // Event handlers
  const handleEditName = (id: string, name: string) => {
    practiceOps.updatePractice(id, 'name', name);
    setEditingPracticeId(null);
  };

  const handleEditDuration = (id: string, duration: string) => {
    practiceOps.updatePractice(id, 'duration', duration);
  };

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (currentScreen === 'suggestions') {
        goToTime();
        return true;
      } else if (currentScreen === 'time') {
        goToSelect();
        return true;
      } else if (currentScreen === 'settings') {
        goToSelect();
        return true;
      }
      // Let default behavior happen (exit app) on main screen
      return false;
    });

    return () => backHandler.remove();
  }, [currentScreen, goToTime, goToSelect]);

  // Screen rendering
  if (currentScreen === 'time') {
    return (
      <TimeScreen
        availableTime={availableTime}
        onAvailableTimeChange={setAvailableTime}
        onBack={goToSelect}
        onNext={goToSuggestions}
      />
    );
  }

  if (currentScreen === 'suggestions') {
    return (
      <SuggestionsScreen
        sessionCombinations={sessionCombinations}
        availableTime={availableTime}
        onBack={goToTime}
      />
    );
  }

  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        csvText={csvText}
        onCsvTextChange={setCsvText}
        customPractices={customPractices}
        onBack={goToSelect}
        onImportCSV={importCSV}
        onImportCSVFile={importCSVFile}
        onImportFromDownloads={importFromDownloads}
        onTestDocumentPicker={testDocumentPicker}
        onDownloadExampleCSV={downloadExampleCSV}
        onClearCustomPractices={clearCustomPractices}
      />
    );
  }
  return (
    <MainScreen
      defaultPractices={defaultPractices}
      learned={learned}
      editingPracticeId={editingPracticeId}
      allPractices={allPractices}
      onToggleLearned={learnedOps.toggleLearned}
      onMoveOrder={practiceOps.movePracticeOrder}
      onEditName={handleEditName}
      onEditDuration={handleEditDuration}
      onEditStart={(id: string | null) => setEditingPracticeId(id)}
      onGoToSettings={goToSettings}
      onGoToTime={goToTime}
    />
  );
}

export default App;
