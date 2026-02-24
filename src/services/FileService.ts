import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { pick, types } from '@react-native-documents/picker';
import { FilePickerResult } from '../types';

export class FileService {
  static async pickFile(): Promise<FilePickerResult> {
    if (!pick) {
      throw new Error('Document picker is not available. The library may not be properly linked.');
    }

    const result = await pick({
      type: [types.allFiles],
      allowMultiSelection: false,
    });

    if (!result || result.length === 0) {
      throw new Error('No file was selected');
    }

    const file = result[0];
    return {
      uri: file.uri,
      name: file.name || 'unknown',
      type: file.type || 'unknown',
      size: file.size || 0,
    };
  }

  static async readFile(uri: string): Promise<string> {
    try {
      // Try reading directly from the URI first
      return await RNFS.readFile(uri, 'utf8');
    } catch (readError) {
      console.log('Direct read failed, trying alternative approach:', readError);

      // If direct read fails, try copying to temp location first
      const tempPath = `${RNFS.CachesDirectoryPath}/temp_import.csv`;
      await RNFS.copyFile(uri, tempPath);
      const content = await RNFS.readFile(tempPath, 'utf8');

      // Clean up temp file
      await RNFS.unlink(tempPath);
      return content;
    }
  }

  static async listCSVFiles(): Promise<string[]> {
    const downloadsPath = Platform.OS === 'android'
      ? '/storage/emulated/0/Download'
      : RNFS.DocumentDirectoryPath;

    try {
      const files = await RNFS.readdir(downloadsPath);
      return files.filter(file => file.toLowerCase().endsWith('.csv'));
    } catch (error) {
      console.error('Error listing CSV files:', error);
      return [];
    }
  }

  static async readCSVFile(fileName: string): Promise<string> {
    const downloadsPath = Platform.OS === 'android'
      ? '/storage/emulated/0/Download'
      : RNFS.DocumentDirectoryPath;

    const filePath = `${downloadsPath}/${fileName}`;
    return await RNFS.readFile(filePath, 'utf8');
  }

  static async writeFile(content: string, fileName: string): Promise<string> {
    let filePath: string;

    if (Platform.OS === 'ios') {
      filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    } else {
      try {
        // Try Downloads directory first
        const downloadsPath = `${RNFS.DownloadDirectoryPath}/${fileName}`;
        const downloadsDir = RNFS.DownloadDirectoryPath;
        const dirExists = await RNFS.exists(downloadsDir);
        
        if (!dirExists) {
          await RNFS.mkdir(downloadsDir);
        }
        
        filePath = downloadsPath;
      } catch (downloadsError) {
        try {
          // Fall back to external storage
          const externalDownloadsPath = `${RNFS.ExternalStorageDirectoryPath}/Download`;
          const externalPath = `${externalDownloadsPath}/${fileName}`;
          const extDirExists = await RNFS.exists(externalDownloadsPath);
          
          if (!extDirExists) {
            await RNFS.mkdir(externalDownloadsPath);
          }
          
          filePath = externalPath;
        } catch (externalError) {
          // Final fallback to app documents
          filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        }
      }
    }

    await RNFS.writeFile(filePath, content, 'utf8');

    // Verify the file was created
    const fileExists = await RNFS.exists(filePath);
    if (!fileExists) {
      throw new Error('File was not created successfully');
    }

    return filePath;
  }

  static async getFileStats(filePath: string) {
    return await RNFS.stat(filePath);
  }

  static isCSVFile(fileName: string, mimeType?: string): boolean {
    return fileName.toLowerCase().endsWith('.csv') ||
           (mimeType?.includes('csv') ?? false) ||
           (mimeType?.includes('text') ?? false);
  }
}
