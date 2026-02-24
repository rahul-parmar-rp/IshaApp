export type YogaPractice = {
  id: string;
  name: string;
  duration: number;
  order: number;
};

export type ScreenType = 'select' | 'time' | 'suggestions' | 'settings';

export type CSVImportResult = {
  success: boolean;
  practices: YogaPractice[];
  errors: string[];
  message: string;
};

export type FilePickerResult = {
  uri: string;
  name: string;
  type: string;
  size: number;
};
