import { useState } from 'react';
import { Alert, Share, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { pick, types } from '@react-native-documents/picker';
import { YogaPractice } from './types';

export function useCsvImport(
  setCustomPractices: (updater: (prev: YogaPractice[]) => YogaPractice[]) => void
) {
  const [csvText, setCsvText] = useState('');

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

  return { csvText, setCsvText, importCSV };
}

export function useCsvFileImport(
  setCustomPractices: (updater: (prev: YogaPractice[]) => YogaPractice[]) => void
) {
  const importCSVFile = async () => {
    try {
      console.log('Starting CSV file import...');
      
      // Check if pick function is available
      if (!pick) {
        throw new Error('Document picker is not available. The library may not be properly linked.');
      }
      
      // Open document picker to select CSV file
      const result = await pick({
        type: [types.allFiles], // Allow all files since CSV might be detected differently
        allowMultiSelection: false,
      });

      console.log('DocumentPicker result:', result);

      if (result && result.length > 0) {
        const file = result[0];
        console.log('Selected file:', file);
        
        // Check if it's a CSV file by extension or mime type
        const isCSV = file.name?.toLowerCase().endsWith('.csv') ||
                     file.type?.includes('csv') ||
                     file.type?.includes('text');

        if (!isCSV) {
          Alert.alert(
            'Invalid File Type',
            'Please select a CSV file (.csv extension)',
            [{ text: 'OK' }]
          );
          return;
        }

        // Read the file content
        console.log('Reading CSV file from URI:', file.uri);
        console.log('File details:', { name: file.name, type: file.type, size: file.size });
        
        let fileContent: string;
        
        try {
          // Try reading directly from the URI first
          fileContent = await RNFS.readFile(file.uri, 'utf8');
        } catch (readError) {
          console.log('Direct read failed, trying alternative approach:', readError);
          
          // If direct read fails, try copying to temp location first
          const tempPath = `${RNFS.CachesDirectoryPath}/temp_import.csv`;
          await RNFS.copyFile(file.uri, tempPath);
          fileContent = await RNFS.readFile(tempPath, 'utf8');
          
          // Clean up temp file
          await RNFS.unlink(tempPath);
        }
        
        if (!fileContent.trim()) {
          Alert.alert('Error', 'The selected file is empty');
          return;
        }

        // Parse CSV content
        const lines = fileContent.trim().split('\n');
        if (lines.length < 2) {
          Alert.alert('Error', 'CSV file must have at least a header row and one data row');
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        const requiredHeaders = ['name', 'duration', 'order'];
        const hasAllHeaders = requiredHeaders.every(header => headers.includes(header));

        if (!hasAllHeaders) {
          Alert.alert(
            'Invalid CSV Format',
            `CSV must have columns: ${requiredHeaders.join(', ')}\n\nFound columns: ${headers.join(', ')}`,
            [{ text: 'OK' }]
          );
          return;
        }

        const nameIndex = headers.indexOf('name');
        const durationIndex = headers.indexOf('duration');
        const orderIndex = headers.indexOf('order');
        const newPractices: YogaPractice[] = [];
        const errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) {
            continue; // Skip empty lines
          }

          const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, '')); // Remove quotes
          
          if (values.length < Math.max(nameIndex, durationIndex, orderIndex) + 1) {
            errors.push(`Row ${i + 1}: Not enough columns`);
            continue;
          }

          const name = values[nameIndex];
          const durationStr = values[durationIndex];
          const orderStr = values[orderIndex];

          if (!name) {
            errors.push(`Row ${i + 1}: Missing name`);
            continue;
          }

          const duration = parseInt(durationStr, 10);
          const order = parseInt(orderStr, 10);

          if (isNaN(duration) || duration <= 0) {
            errors.push(`Row ${i + 1}: Invalid duration "${durationStr}"`);
            continue;
          }

          if (isNaN(order) || order <= 0) {
            errors.push(`Row ${i + 1}: Invalid order "${orderStr}"`);
            continue;
          }

          const practice: YogaPractice = {
            id: `imported_${Date.now()}_${i}`,
            name: name,
            duration: duration,
            order: order,
          };

          newPractices.push(practice);
        }

        // Show results
        if (newPractices.length > 0) {
          setCustomPractices(prev => [...prev, ...newPractices]);
          
          let message = `Successfully imported ${newPractices.length} practices from "${file.name}"`;
          if (errors.length > 0) {
            message += `\n\nSkipped ${errors.length} invalid rows:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
              message += `\n... and ${errors.length - 5} more`;
            }
          }
          
          Alert.alert('Import Successful', message, [{ text: 'OK' }]);
        } else {
          Alert.alert(
            'Import Failed',
            `No valid practices found in "${file.name}"\n\nErrors:\n${errors.slice(0, 10).join('\n')}`,
            [{ text: 'OK' }]
          );
        }
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

export function useTestDocumentPicker() {
  const testDocumentPicker = async () => {
    try {
      console.log('Testing document picker...');
      
      // Check if pick function is available
      if (!pick) {
        throw new Error('Document picker is not available. The library may not be properly linked.');
      }
      
      const result = await pick({
        type: [types.allFiles],
        allowMultiSelection: false,
      });

      console.log('Document picker result:', result);
      
      if (result && result.length > 0) {
        const file = result[0];
        Alert.alert(
          'File Selected Successfully!',
          `Name: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes\nURI: ${file.uri}`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Document picker error:', error);
      Alert.alert(
        'Document Picker Error',
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        [{ text: 'OK' }]
      );
    }
  };

  return { testDocumentPicker };
}

export function useManualCSVImport(
  setCustomPractices: (updater: (prev: YogaPractice[]) => YogaPractice[]) => void
) {
  const importFromDownloads = async () => {
    try {
      // List CSV files in Downloads directory
      const downloadsPath = Platform.OS === 'android'
        ? '/storage/emulated/0/Download'
        : RNFS.DocumentDirectoryPath;
      
      console.log('Checking downloads directory:', downloadsPath);
      
      const files = await RNFS.readdir(downloadsPath);
      const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
      
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
        onPress: () => importSpecificFile(`${downloadsPath}/${file}`, file),
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
  
  const importSpecificFile = async (filePath: string, fileName: string) => {
    try {
      console.log('Importing file:', filePath);
      
      const fileContent = await RNFS.readFile(filePath, 'utf8');
      
      if (!fileContent.trim()) {
        Alert.alert('Error', 'The selected file is empty');
        return;
      }

      // Parse CSV content (same logic as before)
      const lines = fileContent.trim().split('\n');
      if (lines.length < 2) {
        Alert.alert('Error', 'CSV file must have at least a header row and one data row');
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const requiredHeaders = ['name', 'duration', 'order'];
      const hasAllHeaders = requiredHeaders.every(header => headers.includes(header));

      if (!hasAllHeaders) {
        Alert.alert(
          'Invalid CSV Format',
          `CSV must have columns: ${requiredHeaders.join(', ')}\n\nFound columns: ${headers.join(', ')}`,
          [{ text: 'OK' }]
        );
        return;
      }

      const nameIndex = headers.indexOf('name');
      const durationIndex = headers.indexOf('duration');
      const orderIndex = headers.indexOf('order');
      const newPractices: YogaPractice[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) {
          continue;
        }

        const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
        
        if (values.length < Math.max(nameIndex, durationIndex, orderIndex) + 1) {
          errors.push(`Row ${i + 1}: Not enough columns`);
          continue;
        }

        const name = values[nameIndex];
        const durationStr = values[durationIndex];
        const orderStr = values[orderIndex];

        if (!name) {
          errors.push(`Row ${i + 1}: Missing name`);
          continue;
        }

        const duration = parseInt(durationStr, 10);
        const order = parseInt(orderStr, 10);

        if (isNaN(duration) || duration <= 0) {
          errors.push(`Row ${i + 1}: Invalid duration "${durationStr}"`);
          continue;
        }

        if (isNaN(order) || order <= 0) {
          errors.push(`Row ${i + 1}: Invalid order "${orderStr}"`);
          continue;
        }

        const practice: YogaPractice = {
          id: `manual_${Date.now()}_${i}`,
          name: name,
          duration: duration,
          order: order,
        };

        newPractices.push(practice);
      }

      // Show results
      if (newPractices.length > 0) {
        setCustomPractices(prev => [...prev, ...newPractices]);
        
        let message = `Successfully imported ${newPractices.length} practices from "${fileName}"`;
        if (errors.length > 0) {
          message += `\n\nSkipped ${errors.length} invalid rows:\n${errors.slice(0, 3).join('\n')}`;
          if (errors.length > 3) {
            message += `\n... and ${errors.length - 3} more`;
          }
        }
        
        Alert.alert('Import Successful', message, [{ text: 'OK' }]);
      } else {
        Alert.alert(
          'Import Failed',
          `No valid practices found in "${fileName}"\n\nErrors:\n${errors.slice(0, 5).join('\n')}`,
          [{ text: 'OK' }]
        );
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

export function useClearCustomPractices(
  setCustomPractices: (updater: (prev: YogaPractice[]) => YogaPractice[]) => void,
  setLearned: (updater: (prev: string[]) => string[]) => void
) {
  return () => {
    Alert.alert(
      'Clear Custom Practices',
      'Are you sure you want to remove all custom practices?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setCustomPractices(() => []);
            setLearned(prev => prev.filter(id => !id.startsWith('custom_')));
          },
        },
      ],
    );
  };
}

export function useDownloadExampleCSV() {
  const downloadExampleCSV = async () => {
    try {
      // Debug: Check available directories
      console.log('=== Directory Information ===');
      console.log('DocumentDirectoryPath:', RNFS.DocumentDirectoryPath);
      console.log('ExternalDirectoryPath:', RNFS.ExternalDirectoryPath);
      console.log('CachesDirectoryPath:', RNFS.CachesDirectoryPath);
      
      if (Platform.OS === 'android') {
        console.log('DownloadDirectoryPath:', RNFS.DownloadDirectoryPath);
        console.log('ExternalStorageDirectoryPath:', RNFS.ExternalStorageDirectoryPath);
      }

      // Create example CSV content with sample Isha Yoga kriyas
      const exampleCSVContent = `name,duration,order
Simha Kriya,25,6
Upa Yoga,30,7
Pranayama,20,8
Shambhavi Mahamudra,21,9
Jal Neti,10,10
Bhuta Shuddhi (Advanced),45,11
Trataka,15,12
Chandra Namaskara,35,13`;

      // Create file path
      const fileName = `isha_yoga_practices_example_${Date.now()}.csv`;
      let filePath: string;
      let locationMessage: string;

      if (Platform.OS === 'ios') {
        // iOS: Save to Documents directory
        filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        locationMessage = 'Files app > Documents';
      } else {
        // Android: Try to save to Downloads directory first
        try {
          // Try Downloads directory first (most accessible for users)
          const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
          
          // Ensure Downloads directory exists
          const downloadsDir = RNFS.DownloadDirectoryPath;
          const dirExists = await RNFS.exists(downloadsDir);
          if (!dirExists) {
            console.log('Creating Downloads directory');
            await RNFS.mkdir(downloadsDir);
          }
          
          filePath = downloadsPath;
          locationMessage = 'Downloads folder';
          console.log(`Android: Attempting to save to Downloads: ${filePath}`);
        } catch (downloadsError) {
          console.log('Downloads directory not available, trying external storage');
          try {
            // Fall back to external storage
            const externalDownloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download`;
            const externalPath = `${externalDownloadsPath}/${fileName}`;
            
            // Ensure external Downloads directory exists
            const extDirExists = await RNFS.exists(externalDownloadsPath);
            if (!extDirExists) {
              console.log('Creating External Downloads directory');
              await RNFS.mkdir(externalDownloadsPath);
            }
            
            filePath = externalPath;
            locationMessage = 'External Downloads folder';
            console.log(`Android: Attempting to save to External Downloads: ${filePath}`);
          } catch (externalError) {
            // Final fallback to app documents (what we were using before)
            filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
            locationMessage = 'App Documents folder (internal)';
            console.log(`Android: Falling back to internal storage: ${filePath}`);
          }
        }
      }

      // Write CSV content to file
      console.log(`Attempting to write file to: ${filePath}`);
      await RNFS.writeFile(filePath, exampleCSVContent, 'utf8');
      
      // Verify the file was created
      const fileExists = await RNFS.exists(filePath);
      console.log(`File exists after write: ${fileExists}`);
      
      if (!fileExists) {
        throw new Error('File was not created successfully');
      }

      // Get file stats to confirm
      const fileStats = await RNFS.stat(filePath);
      console.log('File stats:', fileStats);

      // Show success message with file location and share option
      Alert.alert(
        'CSV File Downloaded Successfully!',
        `File saved as: ${fileName}\nLocation: ${locationMessage}\nSize: ${fileStats.size} bytes`,
        [
          {
            text: 'Open File Location',
            onPress: async () => {
              try {
                // For Android, we can use an intent to open the file manager
                if (Platform.OS === 'android') {
                  await Share.share({
                    url: `file://${filePath}`,
                    title: 'Isha Yoga Practices Example CSV',
                  });
                } else {
                  // For iOS, share the file
                  await Share.share({
                    url: `file://${filePath}`,
                    title: 'Isha Yoga Practices Example CSV',
                  });
                }
              } catch (shareError) {
                console.error('Error sharing file:', shareError);
                Alert.alert('Info', `File saved at: ${filePath}`);
              }
            },
          },
          {
            text: 'Share Content',
            onPress: async () => {
              try {
                await Share.share({
                  message: exampleCSVContent,
                  title: 'Isha Yoga Practices Example CSV',
                });
              } catch (shareError) {
                Alert.alert('Error', 'Failed to share content');
              }
            },
          },
          { text: 'OK', style: 'default' },
        ]
      );

    } catch (error) {
      console.error('Error downloading CSV:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert(
        'Download Error',
        `Failed to save CSV file: ${errorMessage}. Would you like to share the content instead?`,
        [
          {
            text: 'Share Content',
            onPress: async () => {
              try {
                const exampleCSVContent = `name,duration,order
Simha Kriya,25,6
Upa Yoga,30,7
Pranayama,20,8
Shambhavi Mahamudra,21,9
Jal Neti,10,10
Bhuta Shuddhi (Advanced),45,11
Trataka,15,12
Chandra Namaskara,35,13`;
                await Share.share({
                  message: exampleCSVContent,
                  title: 'Isha Yoga Practices Example CSV',
                });
              } catch (shareError) {
                Alert.alert('Error', 'Failed to share CSV content');
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  return { downloadExampleCSV };
}
