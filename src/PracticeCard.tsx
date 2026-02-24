import React from 'react';
import { View, Pressable, Text, TextInput, StyleSheet } from 'react-native';
import { YogaPractice } from './types';

export function PracticeCard({
  item,
  selected,
  isEditing,
  onToggleLearned,
  onMoveOrder,
  onEditName,
  onEditDuration,
  onEditStart,
}: {
  item: YogaPractice;
  selected: boolean;
  isEditing: boolean;
  onToggleLearned: (id: string) => void;
  onMoveOrder: (id: string, dir: 'up' | 'down') => void;
  onEditName: (id: string, name: string) => void;
  onEditDuration: (id: string, duration: string) => void;
  onEditStart: (id: string | null) => void;
}) {
  return (
    <View style={[styles.practiceCard, selected && styles.practiceCardSelected]}>
      <View style={styles.practiceRow}>
        <Pressable
          style={[styles.checkbox, selected && styles.checkboxChecked]}
          onPress={() => onToggleLearned(item.id)}
        >
          {selected && <Text style={styles.checkboxTick}>✓</Text>}
        </Pressable>
        <View style={styles.dragControls}>
          <Pressable style={styles.dragButton} onPress={() => onMoveOrder(item.id, 'up')}>
            <Text style={styles.dragButtonText}>↑</Text>
          </Pressable>
          <Pressable style={styles.dragButton} onPress={() => onMoveOrder(item.id, 'down')}>
            <Text style={styles.dragButtonText}>↓</Text>
          </Pressable>
        </View>
        <View style={styles.practiceInfo}>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={item.name}
              onChangeText={text => onEditName(item.id, text)}
              onBlur={() => onEditStart(null)}
              autoFocus
            />
          ) : (
            <Pressable onPress={() => onEditStart(item.id)}>
              <Text style={styles.practiceName}>{item.name}</Text>
            </Pressable>
          )}
          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>Duration: </Text>
            <TextInput
              style={styles.durationInput}
              value={item.duration.toString()}
              onChangeText={text => onEditDuration(item.id, text)}
              keyboardType="numeric"
              maxLength={3}
            />
            <Text style={styles.durationLabel}> min</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  practiceName: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});
