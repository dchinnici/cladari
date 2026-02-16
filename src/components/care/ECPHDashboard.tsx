'use client'

import { Activity, TrendingDown, TrendingUp, AlertCircle, CheckCircle2, Zap } from 'lucide-react'

interface ECPHDashboardProps {
  ecPhContext: {
    avgInputEC: number | null
    avgInputPH: number | null
    avgOutputEC: number | null
    avgOutputPH: number | null
    trend: string
    variance: {
      ecVariance: number | null
      phDrift: number | null
    }
    substrateHealthScore: number | null
  }
}

export function ECPHDashboard({ ecPhContext }: ECPHDashboardProps) {
  const getTrendIcon = () => {
    switch (ecPhContext.trend) {
      case 'healthy':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />
      case 'ec_buildup':
        return <TrendingUp className="w-6 h-6 text-red-500" />
      case 'ec_depleted':
        return <TrendingDown className="w-6 h-6 text-yellow-500" />
      case 'ph_drift_low':
      case 'ph_drift_high':
        return <Activity className="w-6 h-6 text-orange-500" />
      case 'substrate_degrading':
        return <AlertCircle className="w-6 h-6 text-red-500" />
      default:
        return <Zap className="w-6 h-6 text-gray-500" />
    }
  }

  const getTrendLabel = () => {
    switch (ecPhContext.trend) {
      case 'healthy':
        return 'Substrate Healthy'
      case 'ec_buildup':
        return 'EC Buildup Detected'
      case 'ec_depleted':
        return 'EC Depleted'
      case 'ph_drift_low':
        return 'pH Drifting Low'
      case 'ph_drift_high':
        return 'pH Drifting High'
      case 'substrate_degrading':
        return 'Substrate Degrading'
      default:
        return 'Unknown Status'
    }
  }

  const getTrendColor = () => {
    switch (ecPhContext.trend) {
      case 'healthy':
        return 'from-green-500 to-emerald-600'
      case 'ec_buildup':
        return 'from-red-500 to-red-600'
      case 'ec_depleted':
        return 'from-yellow-500 to-yellow-600'
      case 'ph_drift_low':
      case 'ph_drift_high':
        return 'from-orange-500 to-orange-600'
      case 'substrate_degrading':
        return 'from-red-600 to-red-700'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'from-green-500 to-emerald-600'
    if (score >= 40) return 'from-yellow-500 to-orange-500'
    return 'from-red-500 to-red-600'
  }

  const getHealthLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Critical'
  }

  if (!ecPhContext.avgInputEC && !ecPhContext.avgInputPH) {
    return (
      <div className="bg-gray-50 rounded-xl p-8 text-center">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No EC/pH data available yet.</p>
        <p className="text-sm text-gray-500 mt-2">Log watering events with EC/pH measurements to see analytics.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className={`bg-gradient-to-r ${getTrendColor()} rounded-xl p-6 text-white shadow-lg`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {getTrendIcon()}
            <div>
              <h3 className="text-2xl font-bold">{getTrendLabel()}</h3>
              <p className="text-sm opacity-90">Based on last 10 care log entries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Substrate Health Score */}
      {ecPhContext.substrateHealthScore !== null && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Substrate Health Score</h3>
            <span className={`px-4 py-2 bg-gradient-to-r ${getHealthColor(ecPhContext.substrateHealthScore)} text-white font-bold rounded-lg text-lg`}>
              {ecPhContext.substrateHealthScore}/100
            </span>
          </div>

          <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full bg-gradient-to-r ${getHealthColor(ecPhContext.substrateHealthScore)} transition-all duration-500`}
              style={{ width: `${ecPhContext.substrateHealthScore}%` }}
            />
          </div>

          <p className="text-sm text-gray-600 text-center">
            {getHealthLabel(ecPhContext.substrateHealthScore)} condition
          </p>
        </div>
      )}

      {/* pH/EC Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Input pH */}
        {ecPhContext.avgInputPH && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-600">Input pH</h4>
              <Activity className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{ecPhContext.avgInputPH.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Target: 5.5-6.5</p>
            {ecPhContext.avgInputPH >= 5.5 && ecPhContext.avgInputPH <= 6.5 ? (
              <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Within target range</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1 text-orange-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Outside target range</span>
              </div>
            )}
          </div>
        )}

        {/* Input EC */}
        {ecPhContext.avgInputEC && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-600">Input EC</h4>
              <Zap className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{ecPhContext.avgInputEC.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Target: 0.8-1.2</p>
            {ecPhContext.avgInputEC >= 0.8 && ecPhContext.avgInputEC <= 1.2 ? (
              <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Within target range</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1 text-orange-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Outside target range</span>
              </div>
            )}
          </div>
        )}

        {/* Output pH */}
        {ecPhContext.avgOutputPH && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-600">Output pH</h4>
              <Activity className="w-4 h-4 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{ecPhContext.avgOutputPH.toFixed(2)}</p>
            <p className="text-xs text-gray-500 mt-1">Safe range: 5.0-6.5</p>
            {ecPhContext.avgOutputPH < 5.0 ? (
              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Critical - Too acidic</span>
              </div>
            ) : ecPhContext.avgOutputPH > 7.0 ? (
              <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Critical - Too alkaline</span>
              </div>
            ) : (
              <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Within safe range</span>
              </div>
            )}
          </div>
        )}

        {/* Output EC */}
        {ecPhContext.avgOutputEC && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-600">Output EC</h4>
              <Zap className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{ecPhContext.avgOutputEC.toFixed(2)}</p>
            {ecPhContext.avgInputEC && (
              <>
                <p className="text-xs text-gray-500 mt-1">
                  Variance: {Math.abs(ecPhContext.avgOutputEC - ecPhContext.avgInputEC).toFixed(2)}
                </p>
                {ecPhContext.variance?.ecVariance && ecPhContext.variance.ecVariance > 0.3 ? (
                  <div className="mt-2 flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>High variance detected</span>
                  </div>
                ) : (
                  <div className="mt-2 flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Normal variance</span>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Variance Analysis */}
      {(ecPhContext.variance?.ecVariance !== null || ecPhContext.variance?.phDrift !== null) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Variance Analysis</h3>
          <div className="space-y-3">
            {ecPhContext.variance?.ecVariance !== null && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">EC Variance</p>
                  <p className="text-xs text-gray-500">Input vs Output difference</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{ecPhContext.variance.ecVariance.toFixed(3)}</p>
                  {ecPhContext.variance.ecVariance > 0.5 ? (
                    <p className="text-xs text-red-600 font-medium">Critical</p>
                  ) : ecPhContext.variance.ecVariance > 0.3 ? (
                    <p className="text-xs text-yellow-600 font-medium">Warning</p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">Normal</p>
                  )}
                </div>
              </div>
            )}

            {ecPhContext.variance?.phDrift !== null && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-700">pH Drift Rate</p>
                  <p className="text-xs text-gray-500">Change per week</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{ecPhContext.variance.phDrift.toFixed(2)}/week</p>
                  {ecPhContext.variance.phDrift > 0.2 ? (
                    <p className="text-xs text-orange-600 font-medium">High drift</p>
                  ) : (
                    <p className="text-xs text-green-600 font-medium">Stable</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-600" />
          What This Means
        </h3>
        <div className="space-y-2 text-sm text-gray-700">
          {ecPhContext.trend === 'healthy' && (
            <>
              <p>✓ Your substrate is functioning optimally with balanced EC and stable pH.</p>
              <p>✓ Continue your current care routine to maintain substrate health.</p>
            </>
          )}
          {ecPhContext.trend === 'ec_buildup' && (
            <>
              <p>⚠️ Salt buildup detected in substrate - output EC significantly higher than input.</p>
              <p>→ Flush substrate with pH-balanced water to remove excess salts.</p>
              <p>→ Consider reducing fertilizer strength on next feeding.</p>
            </>
          )}
          {ecPhContext.trend === 'ec_depleted' && (
            <>
              <p>⚠️ Substrate is depleting nutrients faster than input.</p>
              <p>→ Consider increasing fertilizer strength or frequency.</p>
              <p>→ Monitor plant growth for nutrient deficiency signs.</p>
            </>
          )}
          {(ecPhContext.trend === 'ph_drift_low' || ecPhContext.trend === 'ph_drift_high') && (
            <>
              <p>⚠️ pH drifting outside optimal range - substrate buffering capacity declining.</p>
              <p>→ Add CalMag to buffer pH and stabilize substrate.</p>
              <p>→ Monitor closely and consider repotting if drift continues.</p>
            </>
          )}
          {ecPhContext.trend === 'substrate_degrading' && (
            <>
              <p>🔴 Substrate showing signs of degradation and reduced buffering capacity.</p>
              <p>→ Plan for repotting with fresh substrate soon.</p>
              <p>→ Use CalMag to temporarily stabilize pH.</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
