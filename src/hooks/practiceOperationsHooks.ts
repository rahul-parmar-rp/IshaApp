import { YogaPractice } from '../types';
import { PracticeService } from '../services/PracticeService';

export function usePracticeOperations(
  practices: YogaPractice[],
  setPractices: (practices: YogaPractice[]) => void
) {
  const updatePractice = (id: string, field: 'name' | 'duration' | 'order', value: string | number) => {
    const updated = PracticeService.updatePractice(practices, id, field, value);
    setPractices(updated);
  };

  const movePracticeOrder = (id: string, direction: 'up' | 'down') => {
    const updated = PracticeService.movePracticeOrder(practices, id, direction);
    setPractices(updated);
  };

  const addPractices = (newPractices: YogaPractice[]) => {
    const updated = PracticeService.addPractices(practices, newPractices);
    setPractices(updated);
  };

  const clearCustomPractices = () => {
    const updated = PracticeService.removeCustomPractices(practices);
    setPractices(updated);
  };

  return {
    updatePractice,
    movePracticeOrder,
    addPractices,
    clearCustomPractices,
  };
}

export function useLearnedOperations(
  learnedIds: string[],
  setLearnedIds: (ids: string[]) => void
) {
  const toggleLearned = (practiceId: string) => {
    const updated = PracticeService.toggleLearned(learnedIds, practiceId);
    setLearnedIds(updated);
  };

  const clearCustomLearned = () => {
    const updated = PracticeService.removeCustomLearnedIds(learnedIds);
    setLearnedIds(updated);
  };

  return {
    toggleLearned,
    clearCustomLearned,
  };
}
