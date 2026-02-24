import { useState } from 'react';
import { ScreenType } from '../types';

export function useNavigation() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('select');

  const navigateToScreen = (screen: ScreenType) => {
    setCurrentScreen(screen);
  };

  const goToSettings = () => navigateToScreen('settings');
  const goToTime = () => navigateToScreen('time');
  const goToSuggestions = () => navigateToScreen('suggestions');
  const goToSelect = () => navigateToScreen('select');

  return {
    currentScreen,
    navigateToScreen,
    goToSettings,
    goToTime,
    goToSuggestions,
    goToSelect,
  };
}
