import React from 'react';
import { SafeAreaView, View, Text, TextInput, Button, StyleSheet } from 'react-native';

interface TimeScreenProps {
  availableTime: string;
  onAvailableTimeChange: (time: string) => void;
  onBack: () => void;
  onNext: () => void;
}

export function TimeScreen({ availableTime, onAvailableTimeChange, onBack, onNext }: TimeScreenProps) {
  return (
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
            onChangeText={onAvailableTimeChange}
            placeholder="Minutes"
            maxLength={3}
          />
        </View>
      </View>
      <View style={styles.footerNav}>
        <Button title="Back" onPress={onBack} />
        <View style={styles.spacer} />
        <Button title="See Suggestions" onPress={onNext} />
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
  footerNav: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
});
