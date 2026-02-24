import React from 'react';
import { SafeAreaView, View, Text, FlatList, Button, StyleSheet } from 'react-native';
import { PracticeCard } from './PracticeCard';
import { YogaPractice } from './types';

interface MainScreenProps {
  defaultPractices: YogaPractice[];
  learned: string[];
  editingPracticeId: string | null;
  allPractices: YogaPractice[];
  onToggleLearned: (id: string) => void;
  onMoveOrder: (id: string, direction: 'up' | 'down') => void;
  onEditName: (id: string, name: string) => void;
  onEditDuration: (id: string, duration: string) => void;
  onEditStart: (id: string | null) => void;
  onGoToSettings: () => void;
  onGoToTime: () => void;
}

export function MainScreen({
  defaultPractices,
  learned,
  editingPracticeId,
  allPractices,
  onToggleLearned,
  onMoveOrder,
  onEditName,
  onEditDuration,
  onEditStart,
  onGoToSettings,
  onGoToTime,
}: MainScreenProps) {
  const renderPractice = ({ item }: { item: YogaPractice }) => {
    const selected = learned.includes(item.id);
    const isEditing = editingPracticeId === item.id;
    return (
      <PracticeCard
        item={item}
        selected={selected}
        isEditing={isEditing}
        onToggleLearned={onToggleLearned}
        onMoveOrder={onMoveOrder}
        onEditName={onEditName}
        onEditDuration={onEditDuration}
        onEditStart={onEditStart}
      />
    );
  };

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
          <Text>
            {learned.length === 0
              ? 'None'
              : allPractices
                  .filter(p => learned.includes(p.id))
                  .map(p => p.name)
                  .join(', ')}
          </Text>
        </View>
      </View>
      <View style={styles.footerNav}>
        <View style={styles.buttonRow}>
          <Button title="Settings" onPress={onGoToSettings} />
          <Button title="Next" onPress={onGoToTime} />
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
});
