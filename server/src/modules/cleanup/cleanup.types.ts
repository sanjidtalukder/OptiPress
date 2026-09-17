export interface CleanupOptions {
  batchSize?: number;
  sessionTtlMinutes?: number;
  tempFileTtlMinutes?: number;
}

export interface CleanupResultStats {
  sessionsCleaned: number;
  filesDeleted: number;
  historyRecordsDeleted: number;
  orphanDirsDeleted: number;
  durationMs: number;
  errorsCount: number;
}
