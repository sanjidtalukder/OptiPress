import {
  QualityEvaluationResult,
  QualityProfile,
} from '@optipress/types';
import { imageQualityEvaluator, EvaluateImageOptions } from './quality-evaluator.service';

export interface CandidateEvaluationItem {
  qualityParam: number;
  filePath: string;
  fileSize: number;
  evaluation?: QualityEvaluationResult;
}

export interface RankedCandidateResult {
  winningCandidate: CandidateEvaluationItem | null;
  bestSafeCandidate: CandidateEvaluationItem | null;
  allCandidates: CandidateEvaluationItem[];
  reason: string;
}

export class QualityGateService {
  /**
   * Evaluates a single candidate file against visual quality thresholds
   */
  async evaluateCandidate(
    originalPath: string,
    candidatePath: string,
    options: EvaluateImageOptions = {}
  ): Promise<QualityEvaluationResult> {
    return imageQualityEvaluator.evaluateQuality(originalPath, candidatePath, options);
  }

  /**
   * Ranks multiple optimization candidates based on:
   * 1. Target size compliance (fileSize <= targetSizeBytes)
   * 2. Quality Gate pass status (status === 'PASS')
   * 3. Smaller file size
   * 4. Better visual quality score when sizes are equivalent
   */
  rankCandidates(
    candidates: CandidateEvaluationItem[],
    targetSizeBytes: number,
    forceTarget = false,
    profileKey: QualityProfile = 'balanced'
  ): RankedCandidateResult {
    if (candidates.length === 0) {
      return {
        winningCandidate: null,
        bestSafeCandidate: null,
        allCandidates: [],
        reason: 'No candidates provided for ranking.',
      };
    }

    // Filter valid target-compliant candidates
    const targetCompliant = candidates.filter((c) => c.fileSize <= targetSizeBytes);
    const safeTargetCompliant = targetCompliant.filter(
      (c) => c.evaluation && c.evaluation.status === 'PASS'
    );

    // Find best safe candidate overall (regardless of target compliance)
    const safeCandidates = candidates.filter(
      (c) => c.evaluation && c.evaluation.status === 'PASS'
    );
    safeCandidates.sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0));
    const bestSafeCandidate = safeCandidates[0] || candidates[0] || null;

    if (safeTargetCompliant.length > 0) {
      // Sort safe target-compliant candidates: highest quality score first
      safeTargetCompliant.sort((a, b) => {
        const scoreDiff = (b.evaluation?.score || 0) - (a.evaluation?.score || 0);
        if (scoreDiff !== 0) return scoreDiff;
        return a.fileSize - b.fileSize;
      });

      return {
        winningCandidate: safeTargetCompliant[0],
        bestSafeCandidate,
        allCandidates: candidates,
        reason: `Selected candidate meeting target <= ${targetSizeBytes} bytes with quality pass (${safeTargetCompliant[0].evaluation?.score}/100).`,
      };
    }

    if (targetCompliant.length > 0 && forceTarget) {
      // Sort target-compliant candidates by closest to target size / highest quality
      targetCompliant.sort((a, b) => (b.evaluation?.score || 0) - (a.evaluation?.score || 0));

      return {
        winningCandidate: targetCompliant[0],
        bestSafeCandidate,
        allCandidates: candidates,
        reason: `Forced target mode selected candidate meeting size <= ${targetSizeBytes} bytes despite quality gate warning.`,
      };
    }

    return {
      winningCandidate: null,
      bestSafeCandidate,
      allCandidates: candidates,
      reason: `Target size ${targetSizeBytes} bytes cannot be reached under quality profile '${profileKey}' without unacceptable visual quality degradation.`,
    };
  }
}

export const qualityGateService = new QualityGateService();
