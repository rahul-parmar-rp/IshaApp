import React from 'react';
import { SafeAreaView, View, Text, ScrollView, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { YogaPractice } from './types';

interface SettingsScreenProps {
  csvText: string;
  onCsvTextChange: (text: string) => void;
  onImportCSV: () => void;
  onImportCSVFile: () => void;
  onImportFromDownloads: () => void;
  onTestDocumentPicker: () => void;
  onDownloadExampleCSV: () => void;
  customPractices: YogaPractice[];
  onClearCustomPractices: () => void;
  onBack: () => void;
}

export function SettingsScreen({
  csvText,
  onCsvTextChange,
  onImportCSV,
  onImportCSVFile,
  onImportFromDownloads,
  onTestDocumentPicker,
  onDownloadExampleCSV,
  customPractices,
  onClearCustomPractices,
  onBack,
}: SettingsScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.fullFlex}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your practice list</Text>
        </View>
        <ScrollView style={styles.settingsContainer}>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>CSV Format Helper</Text>
            <Text style={styles.sectionDescription}>
              Download an example CSV file with sample Isha Yoga practices to see the correct format for importing kriyas.
            </Text>
            
            <View style={styles.buttonRow}>
              <Button
                title="Download Example CSV File"
                onPress={onDownloadExampleCSV}
                color="#4caf50"
              />
            </View>
            
            <View style={styles.buttonRow}>
              <Button
                title="Test Debug Logs"
                onPress={() => {
                  console.log('=== DEBUG TEST ===');
                  console.log('This is a test log message');
                  console.log('If you can see this in your logs, the logging is working!');
                  Alert.alert('Debug Test', 'Check your logs for debug messages');
                }}
                color="#2196F3"
              />
            </View>
            
            <View style={styles.buttonRow}>
              <Button
                title="🔧 Test File Picker"
                onPress={onTestDocumentPicker}
                color="#FF9800"
              />
            </View>
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Import Practices from CSV</Text>
            <Text style={styles.sectionDescription}>
              You can import practices by either selecting a CSV file or pasting CSV text directly.
              Format: name, duration (minutes), order{'\n'}
              Example: "Pranayama, 20, 6"
            </Text>
            
            <View style={styles.buttonRow}>
              <Button
                title="📁 Import CSV File"
                onPress={onImportCSVFile}
                color="#4caf50"
              />
            </View>
            
            <View style={styles.buttonRow}>
              <Button
                title="📂 Browse Downloads"
                onPress={onImportFromDownloads}
                color="#607D8B"
              />
            </View>
            
            <Text style={styles.orDivider}>OR</Text>
            
            <TextInput
              style={styles.csvInput}
              multiline
              value={csvText}
              onChangeText={onCsvTextChange}
              placeholder="Paste CSV data here..."
              placeholderTextColor="#999"
            />
            <View style={styles.buttonRow}>
              <Button title="Import CSV Text" onPress={onImportCSV} />
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
                  <Button title="Clear All Custom" onPress={onClearCustomPractices} color="#ff6b6b" />
                </View>
              </View>
            )}
          </View>
        </ScrollView>
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
  orDivider: {
    textAlign: 'center',
    fontSize: 14,
    color: '#999',
    marginVertical: 12,
    fontWeight: '600',
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
  footerNav: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderTopWidth: 1,
    borderColor: '#e0e0e0',
  },
});
