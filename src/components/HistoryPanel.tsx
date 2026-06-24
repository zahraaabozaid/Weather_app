'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Trash2, Edit, Download, Save, Calendar, Cloud, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import WeatherIcon from './WeatherIcon'
import { format } from 'date-fns'

interface WeatherRecord {
  id: string
  location: string
  latitude: number
  longitude: number
  date: string
  temperature: number
  humidity: number
  description: string
  wind_speed: number
  pressure: number
  feels_like: number
  icon: string
  forecast_json: any
  created_at: string
  updated_at: string
}

interface HistoryPanelProps {
  onRecordClick?: (record: WeatherRecord) => void
  refreshTrigger?: number
}

export default function HistoryPanel({ onRecordClick, refreshTrigger = 0 }: HistoryPanelProps) {
  const [records, setRecords] = useState<WeatherRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)

  useEffect(() => {
    fetchRecords()
  }, [refreshTrigger])

  const fetchRecords = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/weather')
      if (response.ok) {
        const data = await response.json()
        setRecords(data)
      } else {
        toast.error('Failed to load saved weather records')
      }
    } catch (error) {
      toast.error('Failed to fetch history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent loading the record when deleting

    // ── Optimistic UI update: remove the row from state immediately ──────────
    // This gives instant visual feedback without waiting for the server round-trip.
    setRecords((prev) => prev.filter((item) => item.id !== id))

    try {
      const response = await fetch(`/api/weather/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Weather record deleted successfully')
      } else {
        // Server rejected the delete — restore state by re-fetching
        toast.error('Failed to delete record. Restoring list...')
        fetchRecords()
      }
    } catch (error) {
      // Network error — restore state by re-fetching
      toast.error('Failed to delete record. Please check your connection.')
      fetchRecords()
    }
  }

  // ── Trigger a file download from a pre-built Blob ─────────────────────────
  const triggerDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    // Clean up after the browser has had a tick to register the click
    setTimeout(() => {
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    }, 100)
  }

  const handleExport = (formatType: 'json' | 'csv') => {
    if (records.length === 0) {
      toast.error('No records to export. Search for a location first.')
      return
    }

    try {
      if (formatType === 'json') {
        // ── JSON: stringify the entire records state array ─────────────────
        const jsonString = JSON.stringify(records, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        triggerDownload(blob, `weather-data-${new Date().toISOString().split('T')[0]}.json`)
        toast.success('Successfully exported as JSON')
      } else if (formatType === 'csv') {
        // ── CSV: flatten each record row into a compliant CSV string ────────
        const escapeCell = (value: unknown): string => {
          const str = value === null || value === undefined ? '' : String(value)
          // Wrap in quotes if the cell contains a comma, double-quote, or newline
          if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
            return `"${str.replace(/"/g, '""')}"`
          }
          return str
        }

        const CSV_HEADERS = [
          'ID',
          'Location',
          'Latitude',
          'Longitude',
          'Date',
          'Temperature (°C)',
          'Humidity (%)',
          'Description',
          'Wind Speed (m/s)',
          'Pressure (hPa)',
          'Feels Like (°C)',
          'Icon',
          'Created At',
          'Updated At',
        ]

        const dataRows = records.map((r) => [
          r.id,
          r.location,
          r.latitude,
          r.longitude,
          r.date,
          r.temperature !== undefined ? Math.round(r.temperature * 100) / 100 : '',
          r.humidity,
          r.description,
          r.wind_speed !== undefined && r.wind_speed !== null ? r.wind_speed : '',
          r.pressure !== undefined && r.pressure !== null ? r.pressure : '',
          r.feels_like !== undefined && r.feels_like !== null ? Math.round(r.feels_like * 100) / 100 : '',
          r.icon,
          r.created_at,
          r.updated_at,
        ])

        const csvLines = [
          CSV_HEADERS.map(escapeCell).join(','),
          ...dataRows.map((row) => row.map(escapeCell).join(',')),
        ].join('\r\n')

        // UTF-8 BOM prefix ensures Excel opens the file with correct encoding
        const bom = '\uFEFF'
        const blob = new Blob([bom + csvLines], { type: 'text/csv;charset=utf-8;' })
        triggerDownload(blob, `weather-data-${new Date().toISOString().split('T')[0]}.csv`)
        toast.success('Successfully exported as CSV')
      }
    } catch (err) {
      console.error('Export error:', err)
      toast.error(`Failed to export as ${formatType.toUpperCase()}. Please try again.`)
    }
  }

  const handleLocationClick = (record: WeatherRecord) => {
    if (onRecordClick) {
      onRecordClick(record)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
    >
      {/* Collapsible Header */}
      <div 
        className="flex items-center justify-between p-6 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Saved Dashboards & Searches</h2>
          <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
            {records.length} records
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={(e) => { e.stopPropagation(); fetchRecords(); }}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            title="Refresh history"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.3 }}
          >
            <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Collapsible Content */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6 pt-0 border-t border-gray-100">
              {/* Export Buttons */}
              <div className="flex flex-wrap gap-2 mt-4 mb-6">
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all font-semibold text-xs border border-blue-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-all font-semibold text-xs border border-green-100"
                >
                  <Download className="h-3.5 w-3.5" />
                  CSV
                </button>
              </div>

              {/* Weather Records List */}
              <div className="overflow-x-auto">
                {records.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                    <Cloud className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">No saved searches or dashboards found.</p>
                    <p className="text-sm text-gray-400 mt-1">Search for a location or click 'Current Location' to save data.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                    {records.map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50/80 hover:bg-blue-50/40 rounded-2xl p-4 border border-gray-100 transition-all cursor-pointer shadow-sm hover:shadow"
                        onClick={() => handleLocationClick(record)}
                      >
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="font-bold text-gray-800 text-lg">{record.location}</span>
                              {record.icon && (
                                <WeatherIcon
                                  iconCode={record.icon}
                                  className="w-8 h-8 text-blue-500 drop-shadow-sm"
                                />
                              )}
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-medium text-gray-550">
                              <span className="flex items-center gap-1 bg-gray-100/80 px-2 py-0.5 rounded-full">
                                <Calendar className="h-3.5 w-3.5 text-blue-500" />
                                {format(new Date(record.date), 'PPP')}
                              </span>
                              <span>Temp: <strong className="text-gray-800 font-semibold">{Math.round(record.temperature)}°C</strong></span>
                              <span>Humidity: <strong className="text-gray-800 font-semibold">{record.humidity}%</strong></span>
                              <span className="capitalize">Condition: <strong className="text-gray-800 font-semibold">{record.description}</strong></span>
                            </div>

                            <div className="flex gap-2 mt-2 text-[10px] text-gray-400">
                              <span>Saved: {format(new Date(record.created_at), 'MMM d, p')}</span>
                              {record.updated_at !== record.created_at && (
                                <span>• Updated: {format(new Date(record.updated_at), 'MMM d, p')}</span>
                              )}
                            </div>
                          </div>

                          {/* Delete button only */}
                          <div className="flex gap-2 w-full md:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => handleDelete(record.id, e)}
                              className="flex-1 md:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 hover:bg-red-50 text-red-500 rounded-xl transition-all border border-red-50 hover:border-red-100 font-bold text-xs"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
