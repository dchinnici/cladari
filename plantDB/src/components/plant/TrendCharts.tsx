'use client'

import { useState, useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  Bar,
  BarChart
} from 'recharts'
import {
  Beaker,
  Droplet,
  Ruler,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface CareLog {
  id: string
  date: string
  action: string
  inputEC?: number | null
  outputEC?: number | null
  inputPH?: number | null
  outputPH?: number | null
}

interface Measurement {
  id: string
  measurementDate: string
  leafLength?: number | null
  leafWidth?: number | null
  petioleLength?: number | null
  height?: number | null
  leafCount?: number | null
}

interface TrendChartsProps {
  careLogs: CareLog[]
  measurements?: Measurement[]
  className?: string
}

// Optimal ranges for reference lines
const OPTIMAL_RANGES = {
  ecIn: { min: 0.8, max: 1.5, optimal: 1.15 },
  ecOut: { min: 0.8, max: 2.0, optimal: 1.3 },
  phIn: { min: 5.5, max: 6.0, optimal: 5.7 },
  phOut: { min: 5.5, max: 6.5, optimal: 6.0 }
}

export function TrendCharts({ careLogs, measurements = [], className = '' }: TrendChartsProps) {
  const [expandedChart, setExpandedChart] = useState<string | null>(null)

  // Process EC/pH data
  const ecPhData = useMemo(() => {
    return careLogs
      .filter(log =>
        log.inputEC != null || log.outputEC != null ||
        log.inputPH != null || log.outputPH != null
      )
      .map(log => ({
        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: new Date(log.date),
        ecIn: log.inputEC ?? undefined,
        ecOut: log.outputEC ?? undefined,
        ecDelta: (log.inputEC != null && log.outputEC != null)
          ? Number((log.outputEC - log.inputEC).toFixed(2))
          : undefined,
        phIn: log.inputPH ?? undefined,
        phOut: log.outputPH ?? undefined,
        phDelta: (log.inputPH != null && log.outputPH != null)
          ? Number((log.outputPH - log.inputPH).toFixed(2))
          : undefined
      }))
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
      .slice(-30) // Last 30 readings
  }, [careLogs])

  // Process watering interval data
  const wateringData = useMemo(() => {
    const waterEvents = careLogs
      .filter(log =>
        log.action?.toLowerCase().includes('water') ||
        log.action?.toLowerCase().includes('feed')
      )
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    const intervals: { date: string; rawDate: Date; interval: number }[] = []

    for (let i = 1; i < waterEvents.length; i++) {
      const prevDate = new Date(waterEvents[i - 1].date)
      const currDate = new Date(waterEvents[i].date)
      const daysDiff = Math.round((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

      intervals.push({
        date: currDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: currDate,
        interval: daysDiff
      })
    }

    return intervals.slice(-20) // Last 20 intervals
  }, [careLogs])

  // Process growth measurement data
  const growthData = useMemo(() => {
    return measurements
      .map(m => ({
        date: new Date(m.measurementDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rawDate: new Date(m.measurementDate),
        leafLength: m.leafLength ?? undefined,
        leafWidth: m.leafWidth ?? undefined,
        petioleLength: m.petioleLength ?? undefined,
        height: m.height ?? undefined,
        leafCount: m.leafCount ?? undefined
      }))
      .sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime())
  }, [measurements])

  // Calculate stats for display
  const ecPhStats = useMemo(() => {
    if (ecPhData.length === 0) return null

    const ecOuts = ecPhData.filter(d => d.ecOut !== undefined).map(d => d.ecOut!)
    const phOuts = ecPhData.filter(d => d.phOut !== undefined).map(d => d.phOut!)
    const deltas = ecPhData.filter(d => d.ecDelta !== undefined).map(d => d.ecDelta!)

    return {
      avgEcOut: ecOuts.length > 0 ? (ecOuts.reduce((a, b) => a + b, 0) / ecOuts.length).toFixed(2) : null,
      avgPhOut: phOuts.length > 0 ? (phOuts.reduce((a, b) => a + b, 0) / phOuts.length).toFixed(2) : null,
      avgDelta: deltas.length > 0 ? (deltas.reduce((a, b) => a + b, 0) / deltas.length).toFixed(2) : null,
      dataPoints: ecPhData.length
    }
  }, [ecPhData])

  const wateringStats = useMemo(() => {
    if (wateringData.length === 0) return null

    const intervals = wateringData.map(d => d.interval)
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const recent = intervals.slice(-5)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length

    return {
      avgInterval: avg.toFixed(1),
      recentAvg: recentAvg.toFixed(1),
      trend: recentAvg < avg - 0.5 ? 'shortening' : recentAvg > avg + 0.5 ? 'lengthening' : 'stable',
      dataPoints: wateringData.length
    }
  }, [wateringData])

  const toggleChart = (chartId: string) => {
    setExpandedChart(expandedChart === chartId ? null : chartId)
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    return (
      <div className="bg-white/95 border border-[var(--clay)]/20 rounded-lg p-3 shadow-lg">
        <p className="text-xs font-medium text-[var(--bark)] mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    )
  }

  const hasEcPhData = ecPhData.length > 0
  const hasWateringData = wateringData.length > 2
  const hasGrowthData = growthData.length > 0

  if (!hasEcPhData && !hasWateringData && !hasGrowthData) {
    return (
      <div className={`bg-[var(--parchment)] rounded-lg p-6 ${className}`}>
        <p className="text-[var(--clay)] text-sm text-center">
          No trend data available yet. Add care logs with EC/pH readings to see trends.
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* EC/pH Trends */}
      {hasEcPhData && (
        <div className="bg-[var(--parchment)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleChart('ecph')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--clay)]/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--water-blue)]/10 rounded-lg">
                <Beaker className="w-4 h-4 text-[var(--water-blue)]" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-[var(--bark)]">EC/pH Trends</h3>
                <p className="text-xs text-[var(--clay)]">
                  {ecPhStats?.dataPoints} readings • Avg EC out: {ecPhStats?.avgEcOut || '—'} • Avg pH out: {ecPhStats?.avgPhOut || '—'}
                </p>
              </div>
            </div>
            {expandedChart === 'ecph' ? (
              <ChevronUp className="w-4 h-4 text-[var(--clay)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--clay)]" />
            )}
          </button>

          {expandedChart === 'ecph' && (
            <div className="px-4 pb-4 space-y-4">
              {/* EC Chart */}
              <div>
                <h4 className="text-xs font-medium text-[var(--clay)] mb-2">EC Readings (mS/cm)</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={ecPhData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--clay)" opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--clay)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--clay)' }}
                        tickLine={false}
                        domain={[0, 'auto']}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: '11px' }}
                        iconSize={8}
                      />
                      <ReferenceLine
                        y={OPTIMAL_RANGES.ecOut.max}
                        stroke="var(--alert-red)"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="ecIn"
                        name="EC In"
                        stroke="var(--water-blue)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--water-blue)' }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="ecOut"
                        name="EC Out"
                        stroke="var(--moss)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--moss)' }}
                        connectNulls
                      />
                      <Bar
                        dataKey="ecDelta"
                        name="Delta"
                        fill="var(--spadix-yellow)"
                        opacity={0.5}
                        barSize={8}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* pH Chart */}
              <div>
                <h4 className="text-xs font-medium text-[var(--clay)] mb-2">pH Readings</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ecPhData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--clay)" opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: 'var(--clay)' }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: 'var(--clay)' }}
                        tickLine={false}
                        domain={[4.5, 7.5]}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend
                        wrapperStyle={{ fontSize: '11px' }}
                        iconSize={8}
                      />
                      {/* Optimal pH range band */}
                      <ReferenceLine
                        y={OPTIMAL_RANGES.phOut.min}
                        stroke="var(--moss)"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                      />
                      <ReferenceLine
                        y={OPTIMAL_RANGES.phOut.max}
                        stroke="var(--moss)"
                        strokeDasharray="5 5"
                        strokeOpacity={0.5}
                      />
                      <Line
                        type="monotone"
                        dataKey="phIn"
                        name="pH In"
                        stroke="var(--water-blue)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--water-blue)' }}
                        connectNulls
                      />
                      <Line
                        type="monotone"
                        dataKey="phOut"
                        name="pH Out"
                        stroke="var(--spadix-yellow)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'var(--spadix-yellow)' }}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-[var(--clay)] mt-1">
                  Dashed lines show optimal pH range (5.5-6.5)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Watering Interval Trends */}
      {hasWateringData && (
        <div className="bg-[var(--parchment)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleChart('watering')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--clay)]/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--water-blue)]/10 rounded-lg">
                <Droplet className="w-4 h-4 text-[var(--water-blue)]" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-[var(--bark)]">Watering Intervals</h3>
                <p className="text-xs text-[var(--clay)]">
                  Avg: {wateringStats?.avgInterval}d • Recent: {wateringStats?.recentAvg}d •
                  <span className={
                    wateringStats?.trend === 'shortening' ? ' text-[var(--spadix-yellow)]' :
                    wateringStats?.trend === 'lengthening' ? ' text-[var(--water-blue)]' :
                    ' text-[var(--moss)]'
                  }>
                    {' '}{wateringStats?.trend}
                  </span>
                </p>
              </div>
            </div>
            {expandedChart === 'watering' ? (
              <ChevronUp className="w-4 h-4 text-[var(--clay)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--clay)]" />
            )}
          </button>

          {expandedChart === 'watering' && (
            <div className="px-4 pb-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={wateringData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--clay)" opacity={0.2} />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'var(--clay)' }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: 'var(--clay)' }}
                      tickLine={false}
                      label={{
                        value: 'Days',
                        angle: -90,
                        position: 'insideLeft',
                        style: { fontSize: '10px', fill: 'var(--clay)' }
                      }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Average line */}
                    <ReferenceLine
                      y={parseFloat(wateringStats?.avgInterval || '0')}
                      stroke="var(--moss)"
                      strokeDasharray="5 5"
                      label={{
                        value: 'avg',
                        position: 'right',
                        style: { fontSize: '10px', fill: 'var(--moss)' }
                      }}
                    />
                    <Bar
                      dataKey="interval"
                      name="Days between waterings"
                      fill="var(--water-blue)"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-[var(--clay)] mt-2">
                {wateringStats?.trend === 'shortening'
                  ? '📉 Intervals shortening — plant may be drinking faster (growth, heat, or root bound)'
                  : wateringStats?.trend === 'lengthening'
                  ? '📈 Intervals lengthening — plant may be drinking slower (cooler temps, dormancy, or root issues)'
                  : '✓ Intervals stable'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Growth Measurements */}
      {hasGrowthData && (
        <div className="bg-[var(--parchment)] rounded-lg overflow-hidden">
          <button
            onClick={() => toggleChart('growth')}
            className="w-full flex items-center justify-between p-4 hover:bg-[var(--clay)]/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--moss)]/10 rounded-lg">
                <Ruler className="w-4 h-4 text-[var(--moss)]" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-medium text-[var(--bark)]">Growth Measurements</h3>
                <p className="text-xs text-[var(--clay)]">
                  {growthData.length} measurements recorded
                </p>
              </div>
            </div>
            {expandedChart === 'growth' ? (
              <ChevronUp className="w-4 h-4 text-[var(--clay)]" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[var(--clay)]" />
            )}
          </button>

          {expandedChart === 'growth' && (
            <div className="px-4 pb-4 space-y-4">
              {/* Leaf Dimensions */}
              {growthData.some(d => d.leafLength || d.leafWidth) && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--clay)] mb-2">Leaf Dimensions (cm)</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growthData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--clay)" opacity={0.2} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'var(--clay)' }}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'var(--clay)' }}
                          tickLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: '11px' }}
                          iconSize={8}
                        />
                        <Line
                          type="monotone"
                          dataKey="leafLength"
                          name="Leaf Length"
                          stroke="var(--moss)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--moss)' }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="leafWidth"
                          name="Leaf Width"
                          stroke="var(--water-blue)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--water-blue)' }}
                          connectNulls
                        />
                        <Line
                          type="monotone"
                          dataKey="petioleLength"
                          name="Petiole"
                          stroke="var(--bark)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--bark)' }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Height & Leaf Count */}
              {growthData.some(d => d.height || d.leafCount) && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--clay)] mb-2">Height & Leaf Count</h4>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={growthData} margin={{ top: 5, right: 30, left: -20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--clay)" opacity={0.2} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: 'var(--clay)' }}
                          tickLine={false}
                        />
                        <YAxis
                          yAxisId="left"
                          tick={{ fontSize: 10, fill: 'var(--clay)' }}
                          tickLine={false}
                          label={{
                            value: 'Height (cm)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { fontSize: '10px', fill: 'var(--clay)' }
                          }}
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          tick={{ fontSize: 10, fill: 'var(--clay)' }}
                          tickLine={false}
                          label={{
                            value: 'Leaves',
                            angle: 90,
                            position: 'insideRight',
                            style: { fontSize: '10px', fill: 'var(--clay)' }
                          }}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          wrapperStyle={{ fontSize: '11px' }}
                          iconSize={8}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="height"
                          name="Height"
                          stroke="var(--moss)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--moss)' }}
                          connectNulls
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="leafCount"
                          name="Leaf Count"
                          fill="var(--spadix-yellow)"
                          opacity={0.6}
                          barSize={12}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
