import { SupportedFileType, FileMetadata, TargetSizeConfig } from '@optipress/types';

export type { SupportedFileType, FileMetadata, TargetSizeConfig };

export interface LocalSelectedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: SupportedFileType;
  previewUrl?: string;
  error?: string;
}

export interface TargetPresetOption {
  label: string;
  value: number;
  description: string;
}
