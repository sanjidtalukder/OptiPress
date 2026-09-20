import fs from 'fs';
import { binManagerService } from './bin-manager.service.js';

export interface QpdfOptimizeOptions {
  inputPath: string;
  outputPath: string;
  linearize?: boolean;
  recompressFlate?: boolean;
  timeoutMs?: number;
}

export interface QpdfOptimizeResult {
  success: boolean;
  inputSize: number;
  outputSize: number;
  reductionBytes: number;
  durationMs: number;
  error?: string;
}

export class QpdfService {
  /**
   * Executes QPDF for PDF structural stream compression, object stream generation,
   * unreferenced object cleanup, and xref table compaction.
   */
  async optimizeStructure(options: QpdfOptimizeOptions): Promise<QpdfOptimizeResult> {
    const { inputPath, outputPath, linearize = false, recompressFlate = true, timeoutMs = 30000 } = options;
    const startTime = Date.now();

    if (!fs.existsSync(inputPath)) {
      return {
        success: false,
        inputSize: 0,
        outputSize: 0,
        reductionBytes: 0,
        durationMs: 0,
        error: 'Input PDF file does not exist.',
      };
    }

    const inStats = await fs.promises.stat(inputPath);
    const inputSize = inStats.size;

    const args: string[] = [
      '--object-streams=generate',
      '--stream-data=compress',
      '--remove-unreferenced-resources=yes',
    ];

    if (recompressFlate) {
      args.push('--recompress-flate');
    }

    if (linearize) {
      args.push('--linearize');
    }

    args.push(inputPath, outputPath);

    const runResult = await binManagerService.runQpdf(args, { timeoutMs });

    if (runResult.exitCode !== 0 || !fs.existsSync(outputPath)) {
      // Fallback: If QPDF failed or exitCode != 0, return input file intact
      await fs.promises.copyFile(inputPath, outputPath).catch(() => {});
      return {
        success: false,
        inputSize,
        outputSize: inputSize,
        reductionBytes: 0,
        durationMs: Date.now() - startTime,
        error: runResult.stderr || 'QPDF execution failed.',
      };
    }

    const outStats = await fs.promises.stat(outputPath);
    const outputSize = outStats.size;

    // Safeguard: If QPDF output is larger than input, preserve smaller input file
    if (outputSize >= inputSize) {
      await fs.promises.copyFile(inputPath, outputPath).catch(() => {});
      return {
        success: true,
        inputSize,
        outputSize: inputSize,
        reductionBytes: 0,
        durationMs: Date.now() - startTime,
      };
    }

    return {
      success: true,
      inputSize,
      outputSize,
      reductionBytes: inputSize - outputSize,
      durationMs: Date.now() - startTime,
    };
  }
}

export const qpdfService = new QpdfService();
