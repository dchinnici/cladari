'use client'

import { useEffect, useState } from 'react'
import { Settings, MapPin, Clock, Save, Loader2, Droplets } from 'lucide-react'
import { showToast } from '@/components/toast'

const TIMEZONE_OPTIONS = [
  { value: 'America/New_York', label: 'Eastern (ET)' },
  { value: 'America/Chicago', label: 'Central (CT)' },
  { value: 'America/Denver', label: 'Mountain (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific (PT)' },
  { value: 'America/Anchorage', label: 'Alaska (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii (HT)' },
  { value: 'America/Phoenix', label: 'Arizona (no DST)' },
  { value: 'America/Puerto_Rico', label: 'Atlantic (AST)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Central Europe (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan (JST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
]

interface ProfileSettings {
  displayName: string | null
  email: string
  timezone: string | null
  latitude: number | null
  longitude: number | null
  city: string | null
  tier: string
  maxPlants: number
  baselineEC: number | null
  baselinePH: number | null
  baselineNotes: string | null
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ProfileSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    displayName: '',
    timezone: '',
    city: '',
    latitude: '',
    longitude: '',
    baselineEC: '',
    baselinePH: '',
    baselineNotes: '',
  })
  const [geocoding, setGeocoding] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data)
        setForm({
          displayName: data.displayName || '',
          timezone: data.timezone || '',
          city: data.city || '',
          latitude: data.latitude?.toString() || '',
          longitude: data.longitude?.toString() || '',
          baselineEC: data.baselineEC?.toString() || '',
          baselinePH: data.baselinePH?.toString() || '',
          baselineNotes: data.baselineNotes || '',
        })
      })
      .catch(() => showToast({ type: 'error', title: 'Failed to load settings' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: form.displayName || null,
          timezone: form.timezone || null,
          city: form.city || null,
          latitude: form.latitude ? parseFloat(form.latitude) : null,
          longitude: form.longitude ? parseFloat(form.longitude) : null,
          baselineEC: form.baselineEC ? parseFloat(form.baselineEC) : null,
          baselinePH: form.baselinePH ? parseFloat(form.baselinePH) : null,
          baselineNotes: form.baselineNotes || null,
        }),
      })

      if (response.ok) {
        const updated = await response.json()
        setSettings(prev => prev ? { ...prev, ...updated } : prev)
        showToast({ type: 'success', title: 'Settings saved' })
      } else {
        const err = await response.json().catch(() => ({}))
        showToast({ type: 'error', title: err.error || 'Failed to save settings' })
      }
    } catch {
      showToast({ type: 'error', title: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleLookupCity = async () => {
    if (!form.city.trim()) return
    setGeocoding(true)
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(form.city)}&count=1&language=en&format=json`
      )
      const data = await response.json()
      if (data.results?.[0]) {
        const result = data.results[0]
        const cityLabel = [result.name, result.admin1, result.country_code?.toUpperCase()]
          .filter(Boolean)
          .join(', ')
        setForm(prev => ({
          ...prev,
          city: cityLabel,
          latitude: result.latitude.toFixed(4),
          longitude: result.longitude.toFixed(4),
        }))
        // Auto-detect timezone from geocoding result
        if (result.timezone) {
          setForm(prev => ({ ...prev, timezone: result.timezone }))
        }
        showToast({ type: 'success', title: `Found: ${cityLabel}` })
      } else {
        showToast({ type: 'error', title: 'City not found — try a more specific name' })
      }
    } catch {
      showToast({ type: 'error', title: 'Geocoding failed' })
    } finally {
      setGeocoding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[var(--clay)]">Loading settings...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[var(--forest)]">Settings</h1>
          <p className="text-sm text-[var(--clay)]">Configure your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Profile Section */}
          <section className="bg-white border border-black/[0.08] rounded-lg p-5">
            <h2 className="text-sm font-semibold text-[var(--bark)] uppercase tracking-wider mb-4">Profile</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                  className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm text-[var(--clay)] mb-1">Email</label>
                <p className="text-sm text-[var(--bark)] p-2 bg-gray-50 rounded border border-black/[0.04]">
                  {settings?.email}
                </p>
                <p className="text-xs text-[var(--clay)] mt-1">Email is managed through your login provider</p>
              </div>

              <div>
                <label className="block text-sm text-[var(--clay)] mb-1">Plan</label>
                <p className="text-sm text-[var(--bark)] p-2 bg-gray-50 rounded border border-black/[0.04] capitalize">
                  {settings?.tier} — {settings?.maxPlants} plant limit
                </p>
              </div>
            </div>
          </section>

          {/* Location Section */}
          <section className="bg-white border border-black/[0.08] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-[var(--forest)]" />
              <h2 className="text-sm font-semibold text-[var(--bark)] uppercase tracking-wider">Location</h2>
            </div>
            <p className="text-xs text-[var(--clay)] mb-4">
              Used for weather data, outdoor watering predictions, and AI environmental context.
              {!form.latitude && ' Not configured — weather features are disabled.'}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">City</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookupCity()}
                    className="flex-1 p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
                    placeholder="e.g., Boca Raton"
                  />
                  <button
                    onClick={handleLookupCity}
                    disabled={geocoding || !form.city.trim()}
                    className="px-3 py-2 bg-[var(--forest)] text-white text-sm rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-1"
                  >
                    {geocoding ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
                    Lookup
                  </button>
                </div>
                <p className="text-xs text-[var(--clay)] mt-1">Type a city name and click Lookup to auto-fill coordinates and timezone</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[var(--clay)] mb-1">Latitude</label>
                  <input
                    type="text"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] text-sm text-[var(--clay)] focus:outline-none focus:border-[var(--moss)]"
                    placeholder="26.3683"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--clay)] mb-1">Longitude</label>
                  <input
                    type="text"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] text-sm text-[var(--clay)] focus:outline-none focus:border-[var(--moss)]"
                    placeholder="-80.1289"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Timezone Section */}
          <section className="bg-white border border-black/[0.08] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-[var(--forest)]" />
              <h2 className="text-sm font-semibold text-[var(--bark)] uppercase tracking-wider">Timezone</h2>
            </div>
            <p className="text-xs text-[var(--clay)] mb-4">
              Affects care queue timing, notification scheduling, and date display.
            </p>

            <select
              value={form.timezone}
              onChange={(e) => setForm({ ...form, timezone: e.target.value })}
              className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
            >
              <option value="">Select timezone...</option>
              {TIMEZONE_OPTIONS.map(tz => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </section>

          {/* Baseline Feed Section */}
          <section className="bg-white border border-black/[0.08] rounded-lg p-5">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-[var(--forest)]" />
              <h2 className="text-sm font-semibold text-[var(--bark)] uppercase tracking-wider">Baseline Feed</h2>
            </div>
            <p className="text-xs text-[var(--clay)] mb-4">
              Your default fertigation values. When you toggle &quot;baseline feed&quot; during care logging,
              these values auto-fill the pH, EC, and notes fields.
              {!form.baselineEC && !form.baselinePH && ' Not configured — using app defaults.'}
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-[var(--bark)] mb-1">Input pH</label>
                  <input
                    type="number"
                    step="0.1"
                    value={form.baselinePH}
                    onChange={(e) => setForm({ ...form, baselinePH: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
                    placeholder="e.g., 5.8"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--bark)] mb-1">Input EC</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.baselineEC}
                    onChange={(e) => setForm({ ...form, baselineEC: e.target.value })}
                    className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
                    placeholder="e.g., 1.3"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-[var(--bark)] mb-1">Feed Description</label>
                <input
                  type="text"
                  value={form.baselineNotes}
                  onChange={(e) => setForm({ ...form, baselineNotes: e.target.value })}
                  className="w-full p-2 rounded border border-black/[0.08] text-sm focus:outline-none focus:border-[var(--moss)]"
                  placeholder="e.g., MSU 13-3-15 + CalMag"
                />
                <p className="text-xs text-[var(--clay)] mt-1">Describes what&apos;s in your standard mix — auto-fills the notes field</p>
              </div>
            </div>
          </section>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-4 py-3 bg-[var(--forest)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  )
}
