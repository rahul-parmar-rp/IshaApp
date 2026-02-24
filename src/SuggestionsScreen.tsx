import React from 'react';
import { SafeAreaView, View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { getCurrentTime, getEndTime } from './timeUtils';
import { YogaPractice } from './types';

interface SuggestionsScreenProps {
  availableTime: string;
  sessionCombinations: YogaPractice[][];
  onBack: () => void;
}

export function SuggestionsScreen({ availableTime, sessionCombinations, onBack }: SuggestionsScreenProps) {
  const currentTime = getCurrentTime();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullFlex}>
        <View style={styles.header}>
          <Text style={styles.title}>Session Suggestions</Text>
          <Text style={styles.subtitle}>Combinations that fit in {availableTime} min</Text>
          <Text style={styles.currentTimeText}>Current time: {currentTime}</Text>
        </View>
        <View style={styles.suggestionsContainer}>
          {sessionCombinations.length === 0 ? (
            <Text>No valid combinations found. Try increasing your time or selecting more practices.</Text>
          ) : (
            <FlatList
              data={sessionCombinations}
              keyExtractor={(_, idx) => idx.toString()}
              renderItem={({ item }) => {
                const totalDuration = item.reduce((sum, p) => sum + p.duration, 0);
                const endTime = getEndTime(totalDuration);

                return (
                  <View style={styles.suggestionCard}>
                    <Text style={styles.suggestionTitle}>
                      {item.map((p: YogaPractice) => p.name).join(' → ')}
                    </Text>
                    <Text style={styles.suggestionDuration}>
                      Duration: {totalDuration} min ({item.length} practice{item.length > 1 ? 's' : ''})
                    </Text>
                    <Text style={styles.timingInfo}>
                      Start: {currentTime} • End: {endTime}
                    </Text>
                    <View style={styles.practiceBreakdown}>
                      {item.map((practice, index) => (
                        <Text key={practice.id} style={styles.practiceBreakdownItem}>
                          {index + 1}. {practice.name} ({practice.duration} min)
                        </Text>
                      ))}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>
      </View>
      <View style={styles.footerNav}>
        <Button title="Back" onPress={onBack} />
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
  currentTimeText: {
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
    marginTop: 4,
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
  timingInfo: {
    fontSize: 12,
    color: '#2196f3',
    marginTop: 4,
    fontWeight: '500',
  },
  practiceBreakdown: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  practiceBreakdownItem: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
    paddingLeft: 8,
  },
  footerNav: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
});
