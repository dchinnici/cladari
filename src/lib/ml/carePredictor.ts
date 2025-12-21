/**
 * Care Predictor for PlantDB
 * Uses historical patterns and environmental data to predict optimal care
 * Integrates with F1sovria for advanced ML predictions
 */

interface PlantData {
  id: string;
  accessionNumber: string;
  healthStatus: string;
  vigor?: number;
  location?: {
    temperature?: number;
    humidity?: number;
    dli?: number;
    vpd?: number;
    co2?: number;
  };
  careHistory: CareLog[];
  measurements: Measurement[];
  traits?: string[];
  genetics?: string;
}

interface CareLog {
  date: Date;
  action: string;
  ecIn?: number;
  ecOut?: number;
  phIn?: number;
  phOut?: number;
  details?: any;
}

interface Measurement {
  date: Date;
  ecInput?: number;
  ecOutput?: number;
  phInput?: number;
  phOutput?: number;
}

interface PredictionResult {
  daysUntilWater: number;
  confidence: number;
  factors: Factor[];
  warnings: Warning[];
  recommendations: string[];
}

interface Factor {
  name: string;
  impact: 'increase' | 'decrease' | 'neutral';
  value: string;
  weight: number;
}

interface Warning {
  type: 'ec_buildup' | 'ph_drift' | 'overdue' | 'stress';
  message: string;
  severity: 'low' | 'medium' | 'high';
}

export class CarePredictor {
  private baseInterval = 7; // Default watering interval in days

  /**
   * Main prediction function combining multiple factors
   */
  async predictNextCare(plantData: PlantData): Promise<PredictionResult> {
    // Calculate base interval from historical data
    const historicalInterval = this.calculateHistoricalInterval(plantData.careHistory);

    // Get environmental adjustments
    const envAdjustment = this.calculateEnvironmentalAdjustment(plantData.location);

    // Get substrate health adjustments
    const substrateAdjustment = this.calculateSubstrateAdjustment(plantData.measurements);

    // Get plant health adjustments
    const healthAdjustment = this.calculateHealthAdjustment(
      plantData.healthStatus,
      plantData.vigor
    );

    // Combine all factors
    const factors = this.collectFactors(
      historicalInterval,
      envAdjustment,
      substrateAdjustment,
      healthAdjustment,
      plantData
    );

    // Calculate final prediction
    const daysUntilWater = this.calculateFinalInterval(factors);

    // Generate warnings
    const warnings = this.generateWarnings(plantData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(plantData, warnings);

    // Calculate confidence
    const confidence = this.calculateConfidence(plantData.careHistory.length, factors);

    return {
      daysUntilWater,
      confidence,
      factors,
      warnings,
      recommendations
    };
  }

  /**
   * Calculate average interval from recent care logs
   */
  private calculateHistoricalInterval(careLogs: CareLog[]): number {
    const wateringLogs = careLogs
      .filter(log => log.action === 'Watering' || log.action === 'Fertilizing')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10); // Last 10 waterings

    if (wateringLogs.length < 2) {
      return this.baseInterval;
    }

    const intervals: number[] = [];
    for (let i = 0; i < wateringLogs.length - 1; i++) {
      const days = this.daysBetween(
        new Date(wateringLogs[i].date),
        new Date(wateringLogs[i + 1].date)
      );
      if (days > 0 && days < 30) { // Sanity check
        intervals.push(days);
      }
    }

    return intervals.length > 0
      ? intervals.reduce((a, b) => a + b) / intervals.length
      : this.baseInterval;
  }

  /**
   * Adjust for environmental conditions
   */
  private calculateEnvironmentalAdjustment(location?: PlantData['location']): number {
    if (!location) return 0;

    let adjustment = 0;

    // Temperature effects
    if (location.temperature) {
      if (location.temperature > 26) {
        adjustment -= 0.5; // Water more frequently
      } else if (location.temperature < 20) {
        adjustment += 0.5; // Water less frequently
      }
    }

    // Humidity effects
    if (location.humidity) {
      if (location.humidity < 40) {
        adjustment -= 0.5; // Dry air, water more
      } else if (location.humidity > 70) {
        adjustment += 0.3; // Humid, water less
      }
    }

    // VPD effects (most accurate)
    if (location.vpd) {
      if (location.vpd > 1.4) {
        adjustment -= 0.7; // High transpiration
      } else if (location.vpd < 0.8) {
        adjustment += 0.4; // Low transpiration
      }
    }

    // Light intensity
    if (location.dli) {
      if (location.dli > 16) {
        adjustment -= 0.3; // High light, more water
      } else if (location.dli < 10) {
        adjustment += 0.3; // Low light, less water
      }
    }

    return adjustment;
  }

  /**
   * Adjust based on substrate health (EC/pH)
   */
  private calculateSubstrateAdjustment(measurements: Measurement[]): number {
    if (measurements.length === 0) return 0;

    const recent = measurements
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);

    let adjustment = 0;

    // Check EC buildup
    const avgEcOut = recent
      .map(m => m.ecOutput)
      .filter(Boolean)
      .reduce((a, b) => a! + b!, 0) / recent.length;

    if (avgEcOut && avgEcOut > 2.0) {
      adjustment -= 0.5; // Needs flushing, water sooner
    }

    // Check pH drift
    const avgPhOut = recent
      .map(m => m.phOutput)
      .filter(Boolean)
      .reduce((a, b) => a! + b!, 0) / recent.length;

    if (avgPhOut) {
      if (avgPhOut > 6.5 || avgPhOut < 5.5) {
        adjustment -= 0.3; // pH correction needed
      }
    }

    return adjustment;
  }

  /**
   * Adjust based on plant health status
   */
  private calculateHealthAdjustment(healthStatus: string, vigor?: number): number {
    let adjustment = 0;

    // Health status adjustment
    switch (healthStatus) {
      case 'Excellent':
        adjustment += 0.5; // Healthy plants can go longer
        break;
      case 'Good':
        adjustment += 0.2;
        break;
      case 'Fair':
        adjustment -= 0.2;
        break;
      case 'Poor':
        adjustment -= 0.5; // Stressed plants need attention
        break;
    }

    // Vigor adjustment
    if (vigor) {
      if (vigor >= 4) {
        adjustment += 0.3;
      } else if (vigor <= 2) {
        adjustment -= 0.3;
      }
    }

    return adjustment;
  }

  /**
   * Collect all factors for transparency
   */
  private collectFactors(
    historical: number,
    envAdj: number,
    subAdj: number,
    healthAdj: number,
    plantData: PlantData
  ): Factor[] {
    const factors: Factor[] = [
      {
        name: 'Historical Pattern',
        impact: 'neutral',
        value: `${historical.toFixed(1)} days average`,
        weight: 0.4
      }
    ];

    if (envAdj !== 0) {
      factors.push({
        name: 'Environmental Conditions',
        impact: envAdj < 0 ? 'decrease' : 'increase',
        value: `${Math.abs(envAdj).toFixed(1)} days`,
        weight: 0.2
      });
    }

    if (subAdj !== 0) {
      factors.push({
        name: 'Substrate Health',
        impact: subAdj < 0 ? 'decrease' : 'increase',
        value: `${Math.abs(subAdj).toFixed(1)} days`,
        weight: 0.2
      });
    }

    if (healthAdj !== 0) {
      factors.push({
        name: 'Plant Health',
        impact: healthAdj < 0 ? 'decrease' : 'increase',
        value: `${plantData.healthStatus} (${Math.abs(healthAdj).toFixed(1)} days)`,
        weight: 0.2
      });
    }

    // Add genetic factors if available
    if (plantData.genetics && plantData.genetics.includes('RA8')) {
      factors.push({
        name: 'Genetics',
        impact: 'decrease',
        value: 'RA8 (higher water needs)',
        weight: 0.1
      });
    }

    return factors;
  }

  /**
   * Calculate final watering interval
   */
  private calculateFinalInterval(factors: Factor[]): number {
    let interval = this.baseInterval;

    factors.forEach(factor => {
      const adjustment = parseFloat(factor.value) || 0;
      if (factor.impact === 'decrease') {
        interval -= adjustment * factor.weight;
      } else if (factor.impact === 'increase') {
        interval += adjustment * factor.weight;
      } else if (factor.name === 'Historical Pattern') {
        // Use historical as base
        interval = parseFloat(factor.value);
      }
    });

    // Ensure reasonable bounds
    return Math.max(3, Math.min(14, Math.round(interval)));
  }

  /**
   * Generate warnings based on current conditions
   */
  private generateWarnings(plantData: PlantData): Warning[] {
    const warnings: Warning[] = [];

    // Check for EC buildup
    const recentMeasurements = plantData.measurements.slice(-3);
    const avgEcOut = this.average(recentMeasurements.map(m => m.ecOutput).filter(Boolean));

    if (avgEcOut && avgEcOut > 2.5) {
      warnings.push({
        type: 'ec_buildup',
        message: `High EC output (${avgEcOut.toFixed(1)}). Substrate flush recommended.`,
        severity: 'high'
      });
    } else if (avgEcOut && avgEcOut > 2.0) {
      warnings.push({
        type: 'ec_buildup',
        message: `EC building up (${avgEcOut.toFixed(1)}). Monitor closely.`,
        severity: 'medium'
      });
    }

    // Check for pH drift
    const avgPhOut = this.average(recentMeasurements.map(m => m.phOutput).filter(Boolean));
    if (avgPhOut) {
      if (avgPhOut > 6.5) {
        warnings.push({
          type: 'ph_drift',
          message: `pH too high (${avgPhOut.toFixed(1)}). Micronutrient lockout risk.`,
          severity: 'high'
        });
      } else if (avgPhOut < 5.5) {
        warnings.push({
          type: 'ph_drift',
          message: `pH too low (${avgPhOut.toFixed(1)}). Macronutrient lockout risk.`,
          severity: 'high'
        });
      }
    }

    // Check if overdue
    const lastCare = plantData.careHistory[0];
    if (lastCare) {
      const daysSince = this.daysBetween(new Date(), new Date(lastCare.date));
      if (daysSince > 10) {
        warnings.push({
          type: 'overdue',
          message: `${daysSince} days since last care. Plant may be stressed.`,
          severity: daysSince > 14 ? 'high' : 'medium'
        });
      }
    }

    return warnings;
  }

  /**
   * Generate care recommendations
   */
  private generateRecommendations(plantData: PlantData, warnings: Warning[]): string[] {
    const recommendations: string[] = [];

    // Based on warnings
    warnings.forEach(warning => {
      if (warning.type === 'ec_buildup' && warning.severity === 'high') {
        recommendations.push('Flush with pH 5.9 water at 50% normal EC');
      }
      if (warning.type === 'ph_drift') {
        recommendations.push('Adjust pH gradually over next 2 waterings');
      }
    });

    // Based on health
    if (plantData.healthStatus === 'Poor') {
      recommendations.push('Consider foliar feeding for quick nutrient uptake');
      recommendations.push('Check for pest or disease issues');
    }

    // Based on environment
    if (plantData.location?.vpd && plantData.location.vpd > 1.4) {
      recommendations.push('Increase humidity or reduce temperature to lower VPD');
    }

    // Genetic recommendations
    if (plantData.genetics?.includes('RA8')) {
      recommendations.push('RA8 genetics benefit from consistent moisture');
    }

    return recommendations;
  }

  /**
   * Calculate prediction confidence
   */
  private calculateConfidence(dataPoints: number, factors: Factor[]): number {
    let confidence = 0.5; // Base confidence

    // More data = higher confidence
    if (dataPoints > 20) confidence += 0.3;
    else if (dataPoints > 10) confidence += 0.2;
    else if (dataPoints > 5) confidence += 0.1;

    // More factors = more nuanced prediction
    if (factors.length > 4) confidence += 0.1;
    if (factors.length > 3) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  /**
   * Helper: Calculate days between dates
   */
  private daysBetween(date1: Date, date2: Date): number {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Helper: Calculate average
   */
  private average(numbers: (number | undefined)[]): number | undefined {
    const valid = numbers.filter(n => n !== undefined) as number[];
    return valid.length > 0
      ? valid.reduce((a, b) => a + b) / valid.length
      : undefined;
  }
}

export const carePredictor = new CarePredictor();