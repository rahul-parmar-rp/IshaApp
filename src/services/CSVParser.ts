import { YogaPractice, CSVImportResult } from '../types';

export class CSVParser {
  private static readonly REQUIRED_HEADERS = ['name', 'duration', 'order'];

  static parseCSVContent(csvContent: string, idPrefix: string = 'imported'): CSVImportResult {
    try {
      if (!csvContent.trim()) {
        return {
          success: false,
          practices: [],
          errors: ['CSV content is empty'],
          message: 'The CSV content is empty',
        };
      }

      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        return {
          success: false,
          practices: [],
          errors: ['CSV must have at least a header row and one data row'],
          message: 'CSV file must have at least a header row and one data row',
        };
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const headerValidation = this.validateHeaders(headers);
      
      if (!headerValidation.isValid) {
        return {
          success: false,
          practices: [],
          errors: [headerValidation.error!],
          message: headerValidation.error!,
        };
      }

      const { nameIndex, durationIndex, orderIndex } = this.getHeaderIndices(headers);
      const { practices, errors } = this.parseDataRows(lines.slice(1), nameIndex, durationIndex, orderIndex, idPrefix);

      return {
        success: practices.length > 0,
        practices,
        errors,
        message: practices.length > 0
          ? `Successfully parsed ${practices.length} practices${errors.length > 0 ? `, skipped ${errors.length} invalid rows` : ''}`
          : `No valid practices found. ${errors.join(', ')}`,
      };

    } catch (error) {
      return {
        success: false,
        practices: [],
        errors: [error instanceof Error ? error.message : 'Unknown parsing error'],
        message: 'Failed to parse CSV data',
      };
    }
  }

  private static validateHeaders(headers: string[]): { isValid: boolean; error?: string } {
    const hasAllHeaders = this.REQUIRED_HEADERS.every(header => headers.includes(header));
    
    if (!hasAllHeaders) {
      return {
        isValid: false,
        error: `CSV must have columns: ${this.REQUIRED_HEADERS.join(', ')}\n\nFound columns: ${headers.join(', ')}`,
      };
    }

    return { isValid: true };
  }

  private static getHeaderIndices(headers: string[]) {
    return {
      nameIndex: headers.indexOf('name'),
      durationIndex: headers.indexOf('duration'),
      orderIndex: headers.indexOf('order'),
    };
  }

  private static parseDataRows(
    dataLines: string[],
    nameIndex: number,
    durationIndex: number,
    orderIndex: number,
    idPrefix: string
  ): { practices: YogaPractice[]; errors: string[] } {
    const practices: YogaPractice[] = [];
    const errors: string[] = [];

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i].trim();
      if (!line) {
        continue; // Skip empty lines
      }

      const values = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const rowNumber = i + 2; // +2 because we skip header and array is 0-indexed

      if (values.length < Math.max(nameIndex, durationIndex, orderIndex) + 1) {
        errors.push(`Row ${rowNumber}: Not enough columns`);
        continue;
      }

      const parseResult = this.parseRow(values, nameIndex, durationIndex, orderIndex, rowNumber, idPrefix);
      
      if (parseResult.success) {
        practices.push(parseResult.practice!);
      } else {
        errors.push(...parseResult.errors);
      }
    }

    return { practices, errors };
  }

  private static parseRow(
    values: string[],
    nameIndex: number,
    durationIndex: number,
    orderIndex: number,
    rowNumber: number,
    idPrefix: string
  ): { success: boolean; practice?: YogaPractice; errors: string[] } {
    const errors: string[] = [];

    const name = values[nameIndex];
    const durationStr = values[durationIndex];
    const orderStr = values[orderIndex];

    if (!name) {
      errors.push(`Row ${rowNumber}: Missing name`);
    }

    const duration = parseInt(durationStr, 10);
    if (isNaN(duration) || duration <= 0) {
      errors.push(`Row ${rowNumber}: Invalid duration "${durationStr}"`);
    }

    const order = parseInt(orderStr, 10);
    if (isNaN(order) || order <= 0) {
      errors.push(`Row ${rowNumber}: Invalid order "${orderStr}"`);
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    const practice: YogaPractice = {
      id: `${idPrefix}_${Date.now()}_${rowNumber}`,
      name,
      duration,
      order,
    };

    return { success: true, practice, errors: [] };
  }
}
