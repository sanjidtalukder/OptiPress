import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface CliRunOptions {
  timeoutMs?: number;
  maxBuffer?: number;
}

export interface CliRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
}

export class BinManagerService {
  private qpdfPath: string | null = null;
  private gsPath: string | null = null;

  constructor() {
    this.resolveBinaries();
  }

  /**
   * Resolves binary paths for QPDF and Ghostscript from system PATH or local server/bin directory.
   */
  public resolveBinaries(): void {
    const cwd = process.cwd();
    const serverBinDir = path.resolve(cwd, 'bin');

    // 1. Resolve QPDF
    const candidateQpdfPaths = [
      path.join(serverBinDir, 'qpdf', 'bin', 'qpdf.exe'),
      path.join(serverBinDir, 'qpdf', 'qpdf.exe'),
      'qpdf.exe',
      'qpdf',
    ];

    for (const cand of candidateQpdfPaths) {
      if (path.isAbsolute(cand) && fs.existsSync(cand)) {
        this.qpdfPath = cand;
        break;
      }
    }
    if (!this.qpdfPath) {
      this.qpdfPath = 'qpdf'; // fallback to PATH resolution
    }

    // 2. Resolve Ghostscript (gswin64c / gswin32c / gs)
    const candidateGsPaths = [
      path.join(serverBinDir, 'ghostscript', 'bin', 'gswin64c.exe'),
      path.join(serverBinDir, 'ghostscript', 'bin', 'gswin32c.exe'),
      path.join(serverBinDir, 'ghostscript', 'bin', 'gs.exe'),
      'C:\\Program Files\\gs\\gs10.04.0\\bin\\gswin64c.exe',
      'C:\\Program Files\\gs\\gs10.03.1\\bin\\gswin64c.exe',
      'gswin64c.exe',
      'gswin32c.exe',
      'gs.exe',
      'gs',
    ];

    for (const cand of candidateGsPaths) {
      if (path.isAbsolute(cand) && fs.existsSync(cand)) {
        this.gsPath = cand;
        break;
      }
    }
    if (!this.gsPath) {
      this.gsPath = 'gswin64c'; // fallback to PATH resolution
    }
  }

  public getQpdfPath(): string {
    if (!this.qpdfPath) this.resolveBinaries();
    return this.qpdfPath || 'qpdf';
  }

  public getGhostscriptPath(): string {
    if (!this.gsPath) this.resolveBinaries();
    return this.gsPath || 'gswin64c';
  }

  public isQpdfAvailable(): boolean {
    const p = this.getQpdfPath();
    if (path.isAbsolute(p)) return fs.existsSync(p);
    return true; // assume PATH binary
  }

  public isGhostscriptAvailable(): boolean {
    const p = this.getGhostscriptPath();
    if (path.isAbsolute(p)) return fs.existsSync(p);
    return true;
  }

  /**
   * Safely executes QPDF CLI with argument vector and timeout safeguard.
   */
  public async runQpdf(args: string[], options: CliRunOptions = {}): Promise<CliRunResult> {
    const timeout = options.timeoutMs || 45000;
    const maxBuffer = options.maxBuffer || 20 * 1024 * 1024;
    const exe = this.getQpdfPath();
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execFileAsync(exe, args, {
        timeout,
        maxBuffer,
        windowsHide: true,
      });

      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        stdout: err.stdout ? err.stdout.toString() : '',
        stderr: err.stderr ? err.stderr.toString() : err.message || '',
        exitCode: err.code || 1,
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Safely executes Ghostscript CLI with argument vector and timeout safeguard.
   */
  public async runGhostscript(args: string[], options: CliRunOptions = {}): Promise<CliRunResult> {
    const timeout = options.timeoutMs || 60000;
    const maxBuffer = options.maxBuffer || 30 * 1024 * 1024;
    const exe = this.getGhostscriptPath();
    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execFileAsync(exe, args, {
        timeout,
        maxBuffer,
        windowsHide: true,
      });

      return {
        stdout: stdout.toString(),
        stderr: stderr.toString(),
        exitCode: 0,
        durationMs: Date.now() - startTime,
      };
    } catch (err: any) {
      return {
        stdout: err.stdout ? err.stdout.toString() : '',
        stderr: err.stderr ? err.stderr.toString() : err.message || '',
        exitCode: err.code || 1,
        durationMs: Date.now() - startTime,
      };
    }
  }
}

export const binManagerService = new BinManagerService();
