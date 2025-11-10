/**
 * Diagnosis Engine for PlantDB
 * Distinguishes complex plant issues through multi-factor analysis
 * Example: Thrip damage vs Manganese lockout based on visual + environmental patterns
 */

interface Symptoms {
  photo?: string;
  visualPattern?: 'stippling' | 'yellowing' | 'browning' | 'wilting' | 'spots';
  affectedArea?: 'new_growth' | 'old_leaves' | 'all_leaves' | 'veins' | 'edges';
  environment: {
    ec?: number;
    ph?: number;
    vpd?: number;
    dli?: number;
    temperature?: number;
    humidity?: number;
  };
  recentCare?: {
    lastFertilized?: Date;
    lastWatered?: Date;
    fertilizerType?: string;
  };
  pestEvidence?: boolean;
}

interface Diagnosis {
  primary: DiagnosisResult;
  alternatives: DiagnosisResult[];
  confidence: number;
  recommendations: string[];
  reasoning: string;
}

interface DiagnosisResult {
  issue: string;
  probability: number;
  evidence: string[];
}

export class DiagnosisEngine {
  /**
   * Main analysis function that combines multiple diagnostic approaches
   */
  async analyze(symptoms: Symptoms): Promise<Diagnosis> {
    const patterns = await this.analyzeVisualPatterns(symptoms);
    const environmental = this.correlateEnvironment(symptoms.environment);
    const historical = await this.findSimilarCases(symptoms);

    const diagnosis = this.combineProbabilities({
      visual: patterns,
      environmental: environmental,
      historical: historical
    });

    return {
      primary: diagnosis[0],
      alternatives: diagnosis.slice(1, 3),
      confidence: this.calculateConfidence(diagnosis),
      recommendations: this.generateTreatmentPlan(diagnosis[0], symptoms),
      reasoning: this.explainDiagnosis(diagnosis[0], symptoms)
    };
  }

  /**
   * Analyze visual patterns to identify issues
   */
  async analyzeVisualPatterns(symptoms: Symptoms): Promise<DiagnosisResult[]> {
    const results: DiagnosisResult[] = [];

    if (symptoms.visualPattern === 'stippling') {
      // Stippling can indicate thrips or nutrient issues
      if (!symptoms.pestEvidence) {
        results.push({
          issue: 'Manganese Lockout',
          probability: 0.7,
          evidence: ['Stippling without pest evidence', 'Common with high pH/EC']
        });
        results.push({
          issue: 'Thrip Damage',
          probability: 0.2,
          evidence: ['Stippling pattern', 'But no visual pests']
        });
      } else {
        results.push({
          issue: 'Thrip Damage',
          probability: 0.85,
          evidence: ['Stippling pattern', 'Pest evidence present']
        });
      }
    }

    if (symptoms.visualPattern === 'yellowing') {
      if (symptoms.affectedArea === 'old_leaves') {
        results.push({
          issue: 'Nitrogen Deficiency',
          probability: 0.75,
          evidence: ['Yellowing on older leaves first', 'Mobile nutrient pattern']
        });
      } else if (symptoms.affectedArea === 'new_growth') {
        results.push({
          issue: 'Iron Deficiency',
          probability: 0.70,
          evidence: ['Yellowing on new growth', 'Immobile nutrient pattern']
        });
      }
    }

    return results;
  }

  /**
   * Correlate environmental conditions with common issues
   */
  correlateEnvironment(env: Symptoms['environment']): DiagnosisResult[] {
    const results: DiagnosisResult[] = [];

    // High EC can cause lockout
    if (env.ec && env.ec > 2.0) {
      results.push({
        issue: 'Nutrient Lockout',
        probability: 0.65,
        evidence: [`High EC (${env.ec})`, 'Salt buildup likely']
      });
    }

    // pH out of range
    if (env.ph) {
      if (env.ph > 6.5) {
        results.push({
          issue: 'Manganese/Iron Lockout',
          probability: 0.60,
          evidence: [`High pH (${env.ph})`, 'Micronutrient unavailability']
        });
      } else if (env.ph < 5.5) {
        results.push({
          issue: 'Calcium/Magnesium Lockout',
          probability: 0.55,
          evidence: [`Low pH (${env.ph})`, 'Macronutrient unavailability']
        });
      }
    }

    // High VPD stress
    if (env.vpd && env.vpd > 1.6) {
      results.push({
        issue: 'Transpiration Stress',
        probability: 0.50,
        evidence: [`High VPD (${env.vpd} kPa)`, 'Excessive water loss']
      });
    }

    return results;
  }

  /**
   * Find similar historical cases (placeholder for ML model)
   */
  async findSimilarCases(symptoms: Symptoms): Promise<DiagnosisResult[]> {
    // In production, this would query the vector database
    // and ML models on F2 server
    return [
      {
        issue: 'Historical Pattern Match',
        probability: 0.45,
        evidence: ['Similar cases in database']
      }
    ];
  }

  /**
   * Combine probabilities from different diagnostic methods
   */
  combineProbabilities(inputs: {
    visual: DiagnosisResult[],
    environmental: DiagnosisResult[],
    historical: DiagnosisResult[]
  }): DiagnosisResult[] {
    const combined = new Map<string, DiagnosisResult>();

    // Weight factors
    const weights = {
      visual: 0.5,
      environmental: 0.3,
      historical: 0.2
    };

    // Combine visual patterns
    inputs.visual.forEach(result => {
      const existing = combined.get(result.issue);
      if (existing) {
        existing.probability += result.probability * weights.visual;
        existing.evidence.push(...result.evidence);
      } else {
        combined.set(result.issue, {
          ...result,
          probability: result.probability * weights.visual
        });
      }
    });

    // Combine environmental factors
    inputs.environmental.forEach(result => {
      const existing = combined.get(result.issue);
      if (existing) {
        existing.probability += result.probability * weights.environmental;
        existing.evidence.push(...result.evidence);
      } else {
        combined.set(result.issue, {
          ...result,
          probability: result.probability * weights.environmental
        });
      }
    });

    // Sort by probability
    return Array.from(combined.values())
      .sort((a, b) => b.probability - a.probability);
  }

  /**
   * Calculate overall confidence in diagnosis
   */
  calculateConfidence(diagnosis: DiagnosisResult[]): number {
    if (diagnosis.length === 0) return 0;

    const topProbability = diagnosis[0].probability;
    const secondProbability = diagnosis[1]?.probability || 0;

    // Higher confidence when there's clear separation
    const separation = topProbability - secondProbability;
    return Math.min(0.95, topProbability + (separation * 0.2));
  }

  /**
   * Generate treatment recommendations
   */
  generateTreatmentPlan(diagnosis: DiagnosisResult, symptoms: Symptoms): string[] {
    const recommendations: string[] = [];

    switch (diagnosis.issue) {
      case 'Manganese Lockout':
        recommendations.push(
          'Flush with pH 5.8 water to reduce EC',
          'Apply foliar Mn spray at 0.5% concentration',
          'Monitor pH and keep between 5.8-6.2',
          'Reduce fertilizer concentration temporarily'
        );
        if (symptoms.environment.vpd && symptoms.environment.vpd > 1.4) {
          recommendations.push('Increase humidity to lower VPD to 1.0 kPa');
        }
        break;

      case 'Thrip Damage':
        recommendations.push(
          'Apply spinosad or insecticidal soap',
          'Increase air circulation',
          'Inspect neighboring plants',
          'Consider systemic treatment if severe'
        );
        break;

      case 'Nutrient Lockout':
        if (symptoms.environment.ec && symptoms.environment.ec > 2.0) {
          recommendations.push(
            `Flush substrate to reduce EC from ${symptoms.environment.ec} to 1.5`,
            'Use plain water for next 2 waterings',
            'Resume feeding at 75% strength'
          );
        }
        break;

      default:
        recommendations.push(
          'Monitor closely for changes',
          'Maintain stable environmental conditions',
          'Document symptoms with photos'
        );
    }

    return recommendations;
  }

  /**
   * Explain the diagnosis reasoning
   */
  explainDiagnosis(diagnosis: DiagnosisResult, symptoms: Symptoms): string {
    const parts: string[] = [];

    if (diagnosis.issue === 'Manganese Lockout' && symptoms.visualPattern === 'stippling') {
      parts.push('Stippling pattern resembles thrip damage but without pest evidence.');
      if (symptoms.environment.ec && symptoms.environment.ec > 2.0) {
        parts.push(`High EC (${symptoms.environment.ec}) creates nutrient antagonism.`);
      }
      if (symptoms.environment.ph && symptoms.environment.ph > 6.3) {
        parts.push(`Elevated pH (${symptoms.environment.ph}) reduces Mn availability.`);
      }
      parts.push('Manganese lockout causes interveinal chlorosis that appears as stippling.');
    }

    return parts.join(' ') || 'Diagnosis based on combined visual and environmental factors.';
  }
}

export const diagnosisEngine = new DiagnosisEngine();