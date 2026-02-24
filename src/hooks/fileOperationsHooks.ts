import { Alert, Share, Platform } from 'react-native';
import { FileService } from '../services/FileService';
import { PracticeService } from '../services/PracticeService';

export function useCSVExport() {
  const downloadExampleCSV = async () => {
    try {
      console.log('=== Starting CSV download ===');

      const exampleCSVContent = PracticeService.generateExampleCSV();
      const fileName = `isha_yoga_practices_example_${Date.now()}.csv`;

      console.log(`Attempting to write file: ${fileName}`);
      const filePath = await FileService.writeFile(exampleCSVContent, fileName);

      // Verify file creation
      const fileStats = await FileService.getFileStats(filePath);
      console.log('File stats:', fileStats);

      const locationMessage = Platform.OS === 'ios' ? 'Files app > Documents' : 'Downloads folder';

      Alert.alert(
        'CSV File Downloaded Successfully!',
        `File saved as: ${fileName}\nLocation: ${locationMessage}\nSize: ${fileStats.size} bytes`,
        [
          {
            text: 'Open File Location',
            onPress: async () => {
              try {
                await Share.share({
                  url: `file://${filePath}`,
                  title: 'Isha Yoga Practices Example CSV',
                });
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
                const exampleCSVContent = PracticeService.generateExampleCSV();
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

export function useTestDocumentPicker() {
  const testDocumentPicker = async () => {
    try {
      console.log('Testing document picker...');

      const file = await FileService.pickFile();
      console.log('Document picker result:', file);

      Alert.alert(
        'File Selected Successfully!',
        `Name: ${file.name}\nType: ${file.type}\nSize: ${file.size} bytes\nURI: ${file.uri}`,
        [{ text: 'OK' }]
      );

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
