import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Persisted state hook for AsyncStorage
export function usePersistedState<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [state, setStateRaw] = useState<T>(initialValue);

  // Allow setState to accept a value or an updater function
  const setState = useCallback<typeof setStateRaw>((valueOrUpdater: any) => {
    setStateRaw((prev: T) =>
      typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater
    );
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(key).then(stored => {
      if (stored) {
        setState(JSON.parse(stored));
      }
    });
  }, [key, setState]);

  useEffect(() => {
    AsyncStorage.setItem(key, JSON.stringify(state)).catch(() => {});
  }, [key, state]);

  return [state, setState];
}

// Session combinations hook
export function useSessionCombinations(
  learnedPractices: Array<{ id: string; name: string; duration: number; order: number }>,
  availableTimeNum: number
) {
  return () => {
    const practices = learnedPractices;
    const results: Array<typeof practices> = [];
    for (let start = 0; start < practices.length; start++) {
      let total = 0;
      for (let end = start; end < practices.length; end++) {
        total += practices[end].duration;
        if (total > availableTimeNum) {
          break;
        }
        results.push(practices.slice(start, end + 1));
      }
    }
    results.sort((a, b) => {
      const ta = a.reduce((sum: number, p) => sum + p.duration, 0);
      const tb = b.reduce((sum: number, p) => sum + p.duration, 0);
      if (tb !== ta) {
        return tb - ta;
      }
      return b.length - a.length;
    });
    const multi = results.filter(combo => combo.length > 1);
    const single = results.filter(combo => combo.length === 1);
    if (multi.length > 0) {
      const inCombos = new Set();
      multi.forEach(combo => combo.forEach(p => inCombos.add(p.id)));
      const uniqueSingles = single.filter(combo => !inCombos.has(combo[0].id));
      return [...multi, ...uniqueSingles];
    }
    return results;
  };
}
