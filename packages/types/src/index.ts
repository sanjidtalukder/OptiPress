/**
 * Shared domain types across OptiPress monorepo
 */

export type SupportedFileType =
  | 'pdf'
  | 'jpg'
  | 'jpeg'
  | 'png'
  | 'webp'
  | 'avif';

export interface User {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  plan: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  updatedAt: string;
}

export interface AppSessionData {
  id: string;
  userId: string;
  createdAt: string;
  lastActivityAt: string;
  expiresAt: string;
}

export interface Session {
  id: string;
  userId?: string;
  expiresAt: string;
  createdAt: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  type: SupportedFileType;
  mimeType: string;
  lastModified: number;
}

export interface SessionFileMetadata {
  id: string;
  sessionId: string;
  userId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  extension: string;
  fileSize: number;
  size?: number;
  status: 'uploaded' | 'processing' | 'completed' | 'failed' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface TargetSizeConfig {
  value: number; // in KB
  unit: 'KB' | 'MB';
  preset?: 99 | 200 | 500 | 1000 | 'custom';
}

export interface OptimizationOptions {
  targetSize?: TargetSizeConfig;
  qualityPreset?: 'lossless' | 'balanced' | 'max_compression';
  outputFormat?: SupportedFileType;
  stripMetadata?: boolean;
  preservePdfLinks?: boolean;
}

export interface OptimizationResult {
  jobId: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  savingsPercentage: number;
  processingTimeMs: number;
  downloadUrl: string;
  expiresAt: string;
}

export type ImageOptimizationMode = 'smart' | 'quality' | 'maximum';

export interface ImageOptimizationResult {
  fileId: string;
  outputFileId?: string;
  outputFileName?: string;
  originalSize: number;
  optimizedSize: number;
  reductionBytes: number;
  reductionPercentage: number;
  originalFormat: string;
  outputFormat: string;
  width: number;
  height: number;
  mode: ImageOptimizationMode;
  processingTimeMs: number;
}

export type JobStatus =
  | 'idle'
  | 'queued'
  | 'processing'
  | 'completed'
  | 'failed';

export interface ProcessingJob {
  id: string;
  file: FileMetadata;
  options: OptimizationOptions;
  status: JobStatus;
  progress: number;
  result?: OptimizationResult;
  error?: string;
  createdAt: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type TargetSizeResultState =
  | 'success'
  | 'target_unreachable'
  | 'already_below_target'
  | 'failed';

export interface TargetSizeOptimizationRequest {
  targetSize: number;
  unit: 'KB' | 'MB';
  forceTarget?: boolean;
}

export interface TargetSizeOptimizationResult {
  fileId: string;
  outputFileId?: string;
  outputFileName?: string;
  status: TargetSizeResultState;
  originalSize: number;
  targetSizeBytes: number;
  outputSize: number;
  reductionBytes: number;
  reductionPercentage: number;
  qualityProtected: boolean;
  targetReached: boolean;
  forced: boolean;
  bestSafeSize?: number;
  qualityScore?: number;
  iterationsCount?: number;
  message?: string;
  processingTimeMs: number;
}

export type PdfOptimizationMode = 'smart' | 'quality' | 'maximum';
export type PdfType = 'text' | 'image' | 'mixed';

export interface PdfAnalysisResult {
  pageCount: number;
  pdfVersion: string;
  isEncrypted: boolean;
  isSigned: boolean;
  hasForms: boolean;
  hasAnnotations: boolean;
  hasBookmarks: boolean;
  embeddedImageCount: number;
  pdfType: PdfType;
}

export interface PdfOptimizationResult {
  fileId: string;
  outputFileId?: string;
  outputFileName?: string;
  status: 'success' | 'already_optimized' | 'unsupported_feature' | 'failed';
  originalSize: number;
  optimizedSize: number;
  reductionBytes: number;
  reductionPercentage: number;
  pageCount: number;
  pdfType: PdfType;
  mode: PdfOptimizationMode;
  isEncrypted: boolean;
  isSigned: boolean;
  warnings: string[];
  message?: string;
  processingTimeMs: number;
}

export type QualityStatus = 'PASS' | 'FAIL' | 'UNABLE_TO_EVALUATE';
export type QualityProfile = 'quality_first' | 'balanced' | 'maximum_compression';

export interface QualityMetrics {
  ssim?: number;
  psnr?: number;
  score: number;
  dimensionsMatch: boolean;
  decodable: boolean;
  pageCountMatch?: boolean;
  textExtractable?: boolean;
}

export interface QualityEvaluationResult {
  status: QualityStatus;
  passed: boolean;
  score: number;
  metrics: QualityMetrics;
  issues: string[];
  confidence: 'high' | 'medium' | 'low';
  evaluatedAt: string;
}

export interface SessionHistoryItem {
  id: string;
  sessionId: string;
  userId: string;
  fileId?: string;
  originalName: string;
  extension: string;
  originalSize: number;
  outputSize: number;
  operation: string;
  mode: string;
  status: 'completed' | 'failed';
  reductionPercentage: number;
  resultStorageKey?: string;
  createdAt: string;
}

export interface CleanupConfig {
  sessionTtlMinutes: number;
  tempFileTtlMinutes: number;
  cleanupIntervalMinutes: number;
  cleanupBatchSize: number;
}

export interface CleanupStats {
  sessionsCleaned: number;
  filesDeleted: number;
  historyRecordsDeleted: number;
  orphanDirsDeleted: number;
  durationMs: number;
  errorsCount: number;
}



