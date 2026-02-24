import { useState } from 'react';
import { Alert } from 'react-native';
import { YogaPractice } from '../types';
import { CSVParser } from '../services/CSVParser';
import { FileService } from '../services/FileService';

export function useCsvTextImport(
  onPracticesImported: (practices: YogaPractice[]) => void
) {
  const [csvText, setCsvText] = useState('');

  const importCSV = () => {
    if (!csvText.trim()) {
      Alert.alert('Error', 'Please enter CSV data');
      return;
    }

    const result = CSVParser.parseCSVContent(csvText, 'custom');

    if (result.success) {
      onPracticesImported(result.practices);
      setCsvText('');
      Alert.alert('Success', result.message);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  return { csvText, setCsvText, importCSV };
}

export function useCsvFileImport(
  onPracticesImported: (practices: YogaPractice[]) => void
) {
  const importCSVFile = async () => {
    try {
      console.log('Starting CSV file import...');

      const file = await FileService.pickFile();
      console.log('Selected file:', file);

      if (!FileService.isCSVFile(file.name, file.type)) {
        Alert.alert(
          'Invalid File Type',
          'Please select a CSV file (.csv extension)',
          [{ text: 'OK' }]
        );
        return;
      }

      const fileContent = await FileService.readFile(file.uri);
      console.log('File content length:', fileContent.length);

      if (!fileContent.trim()) {
        Alert.alert('Error', 'The selected file is empty');
        return;
      }

      const result = CSVParser.parseCSVContent(fileContent, 'imported');

      if (result.success) {
        onPracticesImported(result.practices);
        Alert.alert('Import Successful', result.message, [{ text: 'OK' }]);
      } else {
        Alert.alert('Import Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      console.error('Error importing CSV file:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));

      // Check if user cancelled the picker
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('cancelled') || errorMessage.includes('canceled') || errorMessage.includes('cancel')) {
          console.log('User cancelled file picker');
          return;
        }
      }

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Import Error',
        `Failed to import CSV file: ${errorMessage}\n\nTry:\n1. Make sure file is a valid CSV\n2. Check file permissions\n3. Use text import instead`,
        [
          {
            text: 'Use Text Import',
            onPress: () => {
              Alert.alert(
                'Text Import',
                'Go back and use "Import CSV Text" instead. You can copy the CSV content and paste it directly.',
                [{ text: 'OK' }]
              );
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return { importCSVFile };
}

export function useManualCsvImport(
  onPracticesImported: (practices: YogaPractice[]) => void
) {
  const importFromDownloads = async () => {
    try {
      const csvFiles = await FileService.listCSVFiles();
      console.log('Found CSV files:', csvFiles);

      if (csvFiles.length === 0) {
        Alert.alert(
          'No CSV Files Found',
          'No CSV files found in Downloads folder. Please:\n1. Download example CSV first\n2. Or copy your CSV file to Downloads folder',
          [{ text: 'OK' }]
        );
        return;
      }

      // Show file picker alert
      const fileOptions = csvFiles.map(file => ({
        text: file,
        onPress: () => importSpecificFile(file),
      }));

      Alert.alert(
        'Select CSV File',
        'Choose a CSV file to import:',
        [
          ...fileOptions,
          { text: 'Cancel', style: 'cancel' },
        ]
      );

    } catch (error) {
      console.error('Error listing CSV files:', error);
      Alert.alert(
        'Error',
        'Could not access Downloads folder. Try using text import instead.',
        [{ text: 'OK' }]
      );
    }
  };

  const importSpecificFile = async (fileName: string) => {
    try {
      console.log('Importing file:', fileName);

      const fileContent = await FileService.readCSVFile(fileName);
      const result = CSVParser.parseCSVContent(fileContent, 'manual');

      if (result.success) {
        onPracticesImported(result.practices);
        Alert.alert('Import Successful', result.message, [{ text: 'OK' }]);
      } else {
        Alert.alert('Import Failed', result.message, [{ text: 'OK' }]);
      }

    } catch (error) {
      console.error('Error importing specific file:', error);
      Alert.alert(
        'Import Error',
        `Failed to import "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  return { importFromDownloads };
}
