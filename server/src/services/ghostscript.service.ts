import fs from 'fs';
import { binManagerService } from './bin-manager.service.js';

export type GhostscriptProfileName = 'preserve' | 'academic' | 'balanced' | 'strong' | 'extreme';

export interface GhostscriptProfileSettings {
  pdfSettings: string; // /printer, /ebook, /screen, etc.
  colorDpi: number;
  grayDpi: number;
  monoDpi: number;
  jpegQuality: number; // 40..95
  downsample: boolean;
  embedAllFonts: boolean;
  subsetFonts: boolean;
}

export const GHOSTSCRIPT_PROFILES: Record<GhostscriptProfileName, GhostscriptProfileSettings> = {
  preserve: {
    pdfSettings: '/printer',
    colorDpi: 300,
    grayDpi: 300,
    monoDpi: 300,
    jpegQuality: 88,
    downsample: false,
    embedAllFonts: true,
    subsetFonts: true,
  },
  academic: {
    pdfSettings: '/ebook',
    colorDpi: 180,
    grayDpi: 180,
    monoDpi: 200,
    jpegQuality: 78,
    downsample: true,
    embedAllFonts: true,
    subsetFonts: true,
  },
  balanced: {
    pdfSettings: '/ebook',
    colorDpi: 150,
    grayDpi: 150,
    monoDpi: 150,
    jpegQuality: 70,
    downsample: true,
    embedAllFonts: true,
    subsetFonts: true,
  },
  strong: {
    pdfSettings: '/screen',
    colorDpi: 120,
    grayDpi: 120,
    monoDpi: 120,
    jpegQuality: 58,
    downsample: true,
    embedAllFonts: true,
    subsetFonts: true,
  },
  extreme: {
    pdfSettings: '/screen',
    colorDpi: 90,
    grayDpi: 90,
    monoDpi: 100,
    jpegQuality: 45,
    downsample: true,
    embedAllFonts: true,
    subsetFonts: true,
  },
};

export interface GhostscriptOptimizeOptions {
  inputPath: string;
  outputPath: string;
  profileName?: GhostscriptProfileName;
  customSettings?: Partial<GhostscriptProfileSettings>;
  timeoutMs?: number;
}

export interface GhostscriptOptimizeResult {
  success: boolean;
  inputSize: number;
  outputSize: number;
  reductionBytes: number;
  durationMs: number;
  usedProfile: GhostscriptProfileName;
  error?: string;
}

export class GhostscriptService {
  /**
   * Executes Ghostscript pdfwrite engine with controlled image resolution, JPEG quality,
   * font subsetting, and stream compression.
   */
  async optimizePdf(options: GhostscriptOptimizeOptions): Promise<GhostscriptOptimizeResult> {
    const { inputPath, outputPath, profileName = 'balanced', customSettings, timeoutMs = 60000 } = options;
    const startTime = Date.now();

    if (!fs.existsSync(inputPath)) {
      return {
        success: false,
        inputSize: 0,
        outputSize: 0,
        reductionBytes: 0,
        durationMs: 0,
        usedProfile: profileName,
        error: 'Input PDF file does not exist.',
      };
    }

    const inStats = await fs.promises.stat(inputPath);
    const inputSize = inStats.size;

    const profile = { ...GHOSTSCRIPT_PROFILES[profileName], ...customSettings };

    const args: string[] = [
      '-sDEVICE=pdfwrite',
      '-dCompatibilityLevel=1.7',
      '-dNOPAUSE',
      '-dBATCH',
      '-dQUIET',
      `-dPDFSETTINGS=${profile.pdfSettings}`,
      `-dEmbedAllFonts=${profile.embedAllFonts ? 'true' : 'false'}`,
      `-dSubsetFonts=${profile.subsetFonts ? 'true' : 'false'}`,
      '-dCompressFonts=true',
      `-dAutoFilterColorImages=false`,
      `-dAutoFilterGrayImages=false`,
      `-dEncodeColorImages=true`,
      `-dEncodeGrayImages=true`,
      `-dColorImageFilter=/DCTEncode`,
      `-dGrayImageFilter=/DCTEncode`,
      `-dJPEGQ=${profile.jpegQuality}`,
    ];

    if (profile.downsample) {
      args.push(
        '-dDownsampleColorImages=true',
        `-dColorImageResolution=${profile.colorDpi}`,
        '-dDownsampleGrayImages=true',
        `-dGrayImageResolution=${profile.grayDpi}`,
        '-dDownsampleMonoImages=true',
        `-dMonoImageResolution=${profile.monoDpi}`
      );
    }

    args.push(`-sOutputFile=${outputPath}`, inputPath);

    const runResult = await binManagerService.runGhostscript(args, { timeoutMs });

    if (runResult.exitCode !== 0 || !fs.existsSync(outputPath)) {
      // Fallback: copy input path to output path
      await fs.promises.copyFile(inputPath, outputPath).catch(() => {});
      return {
        success: false,
        inputSize,
        outputSize: inputSize,
        reductionBytes: 0,
        durationMs: Date.now() - startTime,
        usedProfile: profileName,
        error: runResult.stderr || 'Ghostscript execution failed or not available on host.',
      };
    }

    const outStats = await fs.promises.stat(outputPath);
    const outputSize = outStats.size;

    // Safeguard: If output size expanded, preserve smaller input file
    if (outputSize >= inputSize) {
      await fs.promises.copyFile(inputPath, outputPath).catch(() => {});
      return {
        success: true,
        inputSize,
        outputSize: inputSize,
        reductionBytes: 0,
        durationMs: Date.now() - startTime,
        usedProfile: profileName,
      };
    }

    return {
      success: true,
      inputSize,
      outputSize,
      reductionBytes: inputSize - outputSize,
      durationMs: Date.now() - startTime,
      usedProfile: profileName,
    };
  }
}

export const ghostscriptService = new GhostscriptService();
