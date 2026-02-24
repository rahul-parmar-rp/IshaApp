import React, { useState } from 'react';
import { usePersistedState, useSessionCombinations } from './src/hooks';
import { useCsvImport, useClearCustomPractices } from './src/practiceHooks';
import { MainScreen } from './src/MainScreen';
import { TimeScreen } from './src/TimeScreen';
import { SuggestionsScreen } from './src/SuggestionsScreen';
import { SettingsScreen } from './src/SettingsScreen';

export type YogaPractice = {
  id: string;
  name: string;
  duration: number;
  order: number;
};

type ScreenType = 'select' | 'time' | 'suggestions' | 'settings';

const DEFAULT_PRACTICES: YogaPractice[] = [
  { id: '1', name: 'Isha Kriya', duration: 15, order: 1 },
  { id: '5', name: 'Bhuta Shuddhi', duration: 35, order: 2 },
  { id: '2', name: 'Surya Kriya', duration: 50, order: 3 },
  { id: '3', name: 'Angamardana', duration: 50, order: 4 },
  { id: '4', name: 'Yogasanas', duration: 75, order: 5 },
];

function App(): React.JSX.Element {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('select');

  const [defaultPractices, setDefaultPractices] = usePersistedState<YogaPractice[]>(
    'defaultPractices',
    DEFAULT_PRACTICES
  );

  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);

  const updatePractice = (id: string, field: 'name' | 'duration' | 'order', value: string | number) => {
    const updated = defaultPractices.map((practice: YogaPractice) =>
      practice.id === id
        ? { ...practice, [field]: field === 'duration' || field === 'order' ? parseInt(value.toString(), 10) || 0 : value }
        : practice
    );
    setDefaultPractices(updated);
  };

  const movePracticeOrder = (id: string, direction: 'up' | 'down') => {
    const currentPractice = defaultPractices.find(p => p.id === id);
    if (!currentPractice) {
      return;
    }

    const sortedPractices = [...defaultPractices].sort((a, b) => a.order - b.order);
    const currentIndex = sortedPractices.findIndex(p => p.id === id);
    
    if (direction === 'up' && currentIndex > 0) {
      const targetPractice = sortedPractices[currentIndex - 1];
      const tempOrder = currentPractice.order;
      updatePractice(currentPractice.id, 'order', targetPractice.order);
      updatePractice(targetPractice.id, 'order', tempOrder);
    } else if (direction === 'down' && currentIndex < sortedPractices.length - 1) {
      const targetPractice = sortedPractices[currentIndex + 1];
      const tempOrder = currentPractice.order;
      updatePractice(currentPractice.id, 'order', targetPractice.order);
      updatePractice(targetPractice.id, 'order', tempOrder);
    }
  };

  const handleEditName = (id: string, name: string) => {
    updatePractice(id, 'name', name);
    setEditingPracticeId(null);
  };

  const handleEditDuration = (id: string, duration: string) => {
    updatePractice(id, 'duration', duration);
  };

  const [learned, setLearned] = usePersistedState<string[]>('learned', []);
  const [availableTime, setAvailableTime] = usePersistedState<string>('availableTime', '60');

  const { csvText, setCsvText, importCSV } = useCsvImport((updater: (prev: YogaPractice[]) => YogaPractice[]) => {
    const result = updater(defaultPractices);
    setDefaultPractices(result);
  });

  const clearCustomPractices = useClearCustomPractices(
    (updater: (prev: YogaPractice[]) => YogaPractice[]) => {
      const result = updater(defaultPractices);
      setDefaultPractices(result);
    },
    (updater: (prev: string[]) => string[]) => {
      const result = updater(learned);
      setLearned(result);
    }
  );

  const customPractices = defaultPractices.filter(p => p.id.startsWith('custom_'));

  const allPractices = [...defaultPractices, ...customPractices].sort((a, b) => a.order - b.order);

  const learnedPractices = allPractices.filter(p => learned.includes(p.id)).sort((a, b) => a.order - b.order);

  const availableTimeNum = parseInt(availableTime, 10) || 0;

  const getSessionCombinations = useSessionCombinations(learnedPractices, availableTimeNum);
  const sessionCombinations = currentScreen === 'suggestions' ? getSessionCombinations() : [];

  const toggleLearned = (id: string) => {
    if (learned.includes(id)) {
      setLearned(learned.filter(x => x !== id));
    } else {
      setLearned([...learned, id]);
    }
  };

  if (currentScreen === 'time') {
    return (
      <TimeScreen
        availableTime={availableTime}
        onAvailableTimeChange={setAvailableTime}
        onBack={() => setCurrentScreen('select')}
        onNext={() => setCurrentScreen('suggestions')}
      />
    );
  }
  if (currentScreen === 'suggestions') {
    return (
      <SuggestionsScreen
        sessionCombinations={sessionCombinations}
        availableTime={availableTime}
        onBack={() => setCurrentScreen('time')}
      />
    );
  }
  if (currentScreen === 'settings') {
    return (
      <SettingsScreen
        csvText={csvText}
        onCsvTextChange={setCsvText}
        customPractices={customPractices}
        onBack={() => setCurrentScreen('select')}
        onImportCSV={importCSV}
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
      onToggleLearned={toggleLearned}
      onMoveOrder={movePracticeOrder}
      onEditName={handleEditName}
      onEditDuration={handleEditDuration}
      onEditStart={(id: string | null) => setEditingPracticeId(id)}
      onGoToSettings={() => setCurrentScreen('settings')}
      onGoToTime={() => setCurrentScreen('time')}
    />
  );
}

export default App;
