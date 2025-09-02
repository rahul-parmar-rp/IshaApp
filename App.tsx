import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  Button,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';

type YogaPractice = {
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

  const [defaultPractices, setDefaultPractices] = useState<YogaPractice[]>(DEFAULT_PRACTICES);

  const [editingPracticeId, setEditingPracticeId] = useState<string | null>(null);

  const updatePractice = (id: string, field: 'name' | 'duration', value: string | number) => {
    setDefaultPractices(prev => prev.map(practice =>
      practice.id === id
        ? { ...practice, [field]: field === 'duration' ? parseInt(value.toString(), 10) || 0 : value }
        : practice
    ));
  };

  const movePracticeOrder = (id: string, direction: 'up' | 'down') => {
    setDefaultPractices(prev => {
      const practices = [...prev].sort((a, b) => a.order - b.order);
      const index = practices.findIndex(p => p.id === id);
      
      if ((direction === 'up' && index === 0) || (direction === 'down' && index === practices.length - 1)) {
        return prev;
      }
      
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      const temp = practices[index].order;
      practices[index].order = practices[newIndex].order;
      practices[newIndex].order = temp;
      
      return practices;
    });
  };

  const [learned, setLearned] = useState<string[]>([]);

  const [customPractices, setCustomPractices] = useState<YogaPractice[]>([]);

  const [csvText, setCsvText] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('learnedKriyas');
        if (stored) {
          setLearned(JSON.parse(stored));
        }
        const storedCustom = await AsyncStorage.getItem('customPractices');
        if (storedCustom) {
          setCustomPractices(JSON.parse(storedCustom));
        }
        const storedDefault = await AsyncStorage.getItem('defaultPractices');
        if (storedDefault) {
          setDefaultPractices(JSON.parse(storedDefault));
        }
      } catch (e) {
      }
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('learnedKriyas', JSON.stringify(learned)).catch(() => {});
  }, [learned]);

  useEffect(() => {
    AsyncStorage.setItem('customPractices', JSON.stringify(customPractices)).catch(() => {});
  }, [customPractices]);

  useEffect(() => {
    AsyncStorage.setItem('defaultPractices', JSON.stringify(defaultPractices)).catch(() => {});
  }, [defaultPractices]);
  
  const [availableTime, setAvailableTime] = useState('30');

  const allPractices = [...defaultPractices, ...customPractices].sort((a, b) => a.order - b.order);

  const learnedPractices = allPractices.filter(p => learned.includes(p.id)).sort((a, b) => a.order - b.order);

  const availableTimeNum = parseInt(availableTime, 10) || 0;

  function getSessionCombinations(): Array<YogaPractice[]> {
    const practices = learnedPractices;
    const results: Array<YogaPractice[]> = [];
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
      if (tb !== ta) { return tb - ta; }
      return b.length - a.length;
    });
    
    // Filter out single practices if there are multi-practice combinations available
    const multiPracticeCombinations = results.filter(combo => combo.length > 1);
    const singlePracticeCombinations = results.filter(combo => combo.length === 1);
    
    // If we have multi-practice combinations, only include single practices
    // that are not already part of any multi-practice combination
    if (multiPracticeCombinations.length > 0) {
      const practicesInCombos = new Set();
      multiPracticeCombinations.forEach(combo => {
        combo.forEach(practice => practicesInCombos.add(practice.id));
      });
      
      const uniqueSingles = singlePracticeCombinations.filter(combo =>
        !practicesInCombos.has(combo[0].id)
      );
      
      return [...multiPracticeCombinations, ...uniqueSingles];
    }
    
    return results;
  }

  const sessionCombinations = currentScreen === 'suggestions' ? getSessionCombinations() : [];

  const toggleLearned = (id: string) => {
    setLearned((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Parse CSV and import practices
  const importCSV = () => {
    if (!csvText.trim()) {
      Alert.alert('Error', 'Please enter CSV data');
      return;
    }

    try {
      const lines = csvText.trim().split('\n');
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      
      const requiredHeaders = ['name', 'duration', 'order'];
      const hasAllHeaders = requiredHeaders.every(header => headers.includes(header));
      
      if (!hasAllHeaders) {
        Alert.alert('Error', 'CSV must have columns: name, duration, order');
        return;
      }

      const nameIndex = headers.indexOf('name');
      const durationIndex = headers.indexOf('duration');
      const orderIndex = headers.indexOf('order');

      const newPractices: YogaPractice[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length >= 3 && values[nameIndex] && values[durationIndex] && values[orderIndex]) {
          const practice: YogaPractice = {
            id: `custom_${Date.now()}_${i}`,
            name: values[nameIndex],
            duration: parseInt(values[durationIndex], 10) || 0,
            order: parseInt(values[orderIndex], 10) || 0,
          };
          
          if (practice.duration > 0 && practice.order > 0) {
            newPractices.push(practice);
          }
        }
      }

      if (newPractices.length > 0) {
        setCustomPractices(prev => [...prev, ...newPractices]);
        setCsvText('');
        Alert.alert('Success', `Imported ${newPractices.length} practices`);
      } else {
        Alert.alert('Error', 'No valid practices found in CSV data');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to parse CSV data');
    }
  };

  // Clear all custom practices
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
            setCustomPractices([]);
            // Also clear any learned custom practices
            setLearned(prev => prev.filter(id => !id.startsWith('custom_')));
          },
        },
      ],
    );
  };

  const renderPractice = ({item}: {item: YogaPractice}) => {
    const selected = learned.includes(item.id);
    const isEditing = editingPracticeId === item.id;
    
    return (
      <View style={[styles.practiceCard, selected && styles.practiceCardSelected]}>
        <View style={styles.practiceRow}>
          <Pressable
            style={[styles.checkbox, selected && styles.checkboxChecked]}
            onPress={() => toggleLearned(item.id)}
          >
            {selected && <Text style={styles.checkboxTick}>✓</Text>}
          </Pressable>
          
          <View style={styles.dragControls}>
            <Pressable
              style={styles.dragButton}
              onPress={() => movePracticeOrder(item.id, 'up')}
            >
              <Text style={styles.dragButtonText}>↑</Text>
            </Pressable>
            <Pressable
              style={styles.dragButton}
              onPress={() => movePracticeOrder(item.id, 'down')}
            >
              <Text style={styles.dragButtonText}>↓</Text>
            </Pressable>
          </View>
          
          <View style={styles.practiceInfo}>
            {isEditing ? (
              <TextInput
                style={styles.editInput}
                value={item.name}
                onChangeText={(text) => updatePractice(item.id, 'name', text)}
                onBlur={() => setEditingPracticeId(null)}
                autoFocus
              />
            ) : (
              <Pressable onPress={() => setEditingPracticeId(item.id)}>
                <Text style={styles.practiceName}>{item.name}</Text>
              </Pressable>
            )}
            
            <View style={styles.durationRow}>
              <Text style={styles.durationLabel}>Duration: </Text>
              <TextInput
                style={styles.durationInput}
                value={item.duration.toString()}
                onChangeText={(text) => updatePractice(item.id, 'duration', text)}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.durationLabel}> min</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderTimeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullFlex}>
        <View style={styles.header}>
          <Text style={styles.title}>How much time do you have?</Text>
          <Text style={styles.subtitle}>Enter your available minutes for yoga session</Text>
        </View>
        <View style={styles.timeInputContainer}>
          <Text style={styles.timeInputLabel}>{availableTime} min</Text>
          <TextInput
            style={styles.timeInput}
            keyboardType="numeric"
            value={availableTime}
            onChangeText={setAvailableTime}
            placeholder="Minutes"
            maxLength={3}
          />
        </View>
      </View>
      <View style={styles.footerNav}>
        <Button title="Back" onPress={() => setCurrentScreen('select')} />
        <View style={styles.spacer} />
        <Button title="See Suggestions" onPress={() => setCurrentScreen('suggestions')} />
      </View>
    </SafeAreaView>
  );

  const renderSuggestionsScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullFlex}>
        <View style={styles.header}>
          <Text style={styles.title}>Session Suggestions</Text>
          <Text style={styles.subtitle}>Combinations that fit in {availableTime} min</Text>
        </View>
        <View style={styles.suggestionsContainer}>
          {sessionCombinations.length === 0 ? (
            <Text>No valid combinations found. Try increasing your time or selecting more practices.</Text>
          ) : (
            <FlatList
              data={sessionCombinations}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({item}) => (
                <View style={styles.suggestionCard}>
                  <Text style={styles.suggestionTitle}>
                    {item.map(p => p.name).join(' → ')}
                  </Text>
                  <Text style={styles.suggestionDuration}>
                    Total: {item.reduce((sum, p) => sum + p.duration, 0)} min
                  </Text>
                </View>
              )}
            />
          )}
        </View>
      </View>
      <View style={styles.footerNav}>
        <Button title="Back" onPress={() => setCurrentScreen('time')} />
      </View>
    </SafeAreaView>
  );

  // Screen 4: Settings
  const renderSettingsScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullFlex}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your practice list</Text>
        </View>
        <ScrollView style={styles.settingsContainer}>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Import Practices from CSV</Text>
            <Text style={styles.sectionDescription}>
              Format: name, duration (minutes), order{'\n'}
              Example: "Pranayama, 20, 6"
            </Text>
            <TextInput
              style={styles.csvInput}
              multiline
              value={csvText}
              onChangeText={setCsvText}
              placeholder="Paste CSV data here..."
              placeholderTextColor="#999"
            />
            <View style={styles.buttonRow}>
              <Button title="Import CSV" onPress={importCSV} />
            </View>
          </View>
          
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Current Custom Practices</Text>
            {customPractices.length === 0 ? (
              <Text style={styles.emptyText}>No custom practices added yet</Text>
            ) : (
              <View>
                {customPractices.map(practice => (
                  <View key={practice.id} style={styles.customPracticeItem}>
                    <Text style={styles.customPracticeName}>{practice.name}</Text>
                    <Text style={styles.customPracticeDetails}>
                      {practice.duration}min, Order: {practice.order}
                    </Text>
                  </View>
                ))}
                <View style={styles.buttonRow}>
                  <Button title="Clear All Custom" onPress={clearCustomPractices} color="#ff6b6b" />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
      <View style={styles.footerNav}>
        <Button title="Back" onPress={() => setCurrentScreen('select')} />
      </View>
    </SafeAreaView>
  );

  if (currentScreen === 'time') {
    return renderTimeScreen();
  }
  if (currentScreen === 'suggestions') {
    return renderSuggestionsScreen();
  }
  if (currentScreen === 'settings') {
    return renderSettingsScreen();
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullFlex}>
        <View style={styles.header}>
          <Text style={styles.title}>Hello World! 🙏</Text>
          <Text style={styles.subtitle}>Select your learned Isha Yoga Practices</Text>
        </View>
        <FlatList
          data={[...defaultPractices].sort((a, b) => a.order - b.order)}
          keyExtractor={(item) => item.id}
          renderItem={renderPractice}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
        <View style={styles.learnedSummary}>
          <Text style={styles.learnedSummaryLabel}>Learned Practices:</Text>
          <Text>{learned.length === 0 ? 'None' : allPractices.filter(p => learned.includes(p.id)).map(p => p.name).join(', ')}</Text>
        </View>
      </View>
      <View style={styles.footerNav}>
        <View style={styles.buttonRow}>
          <Button title="Settings" onPress={() => setCurrentScreen('settings')} />
          <Button title="Next" onPress={() => setCurrentScreen('time')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  fullFlex: {
    flex: 1,
  },
  spacer: {
    height: 8,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 20,
  },
  practiceCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  practiceCardSelected: {
    borderColor: '#4caf50',
    backgroundColor: '#f1f8e9',
  },
  practiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dragControls: {
    flexDirection: 'column',
    marginRight: 12,
  },
  dragButton: {
    width: 24,
    height: 20,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginBottom: 2,
  },
  dragButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#666',
  },
  practiceInfo: {
    flex: 1,
    marginLeft: 8,
  },
  editInput: {
    fontSize: 16,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: '#4caf50',
    paddingBottom: 2,
    marginBottom: 8,
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 12,
    color: '#666',
  },
  durationInput: {
    fontSize: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    minWidth: 30,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#4caf50',
    borderColor: '#4caf50',
  },
  checkboxTick: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  practiceOrder: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    width: 24,
  },
  practiceName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  practiceDuration: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  learnedSummary: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f9f9f9',
  },
  learnedSummaryLabel: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  footerNav: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
  timeInputContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  timeInputLabel: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timeInput: {
    width: 100,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  suggestionCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  suggestionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  suggestionDuration: {
    fontSize: 12,
    color: '#666',
  },
  settingsContainer: {
    flex: 1,
    padding: 16,
  },
  settingsSection: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  csvInput: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    backgroundColor: '#fff',
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  customPracticeItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  customPracticeName: {
    fontSize: 16,
    fontWeight: '600',
  },
  customPracticeDetails: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default App;
