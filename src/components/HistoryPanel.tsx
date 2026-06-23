'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Trash2, Edit, Download, X, Save } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface WeatherRecord {
  id: string
  location: string
  date: string
  temperature: number
  humidity: number
  description: string
  createdAt: string
}

export default function HistoryPanel() {
  const [isOpen, setIsOpen] = useState(false)
  const [records, setRecords] = useState<WeatherRecord[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    location: '',
    date: '',
    temperature: 0,
    humidity: 0,
    description: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchRecords()
    }
  }, [isOpen])

  const fetchRecords = async () => {
    try {
      const response = await fetch('/api/weather')
      const data = await response.json()
      setRecords(data)
    } catch (error) {
      toast.error('Failed to fetch history')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/weather/${id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        toast.success('Record deleted successfully')
        fetchRecords()
      } else {
        toast.error('Failed to delete record')
      }
    } catch (error) {
      toast.error('Failed to delete record')
    }
  }

  const handleEdit = (record: WeatherRecord) => {
    setEditingId(record.id)
    setEditForm({
      location: record.location,
      date: record.date.split('T')[0],
      temperature: record.temperature,
      humidity: record.humidity,
      description: record.description,
    })
  }

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`/api/weather/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      if (response.ok) {
        toast.success('Record updated successfully')
        setEditingId(null)
        fetchRecords()
      } else {
        toast.error('Failed to update record')
      }
    } catch (error) {
      toast.error('Failed to update record')
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/weather/export/${format}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `weather-data.${format}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success(`Exported as ${format.toUpperCase()}`)
      } else {
        toast.error('Failed to export data')
      }
    } catch (error) {
      toast.error('Failed to export data')
    }
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl z-50"
        title="View History"
      >
        <History className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="h-6 w-6 text-blue-600" />
                  <h2 className="text-2xl font-bold text-gray-800">Search History</h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 border-b border-gray-200 flex gap-3">
                <button
                  onClick={() => handleExport('json')}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export JSON
                </button>
                <button
                  onClick={() => handleExport('csv')}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Export CSV
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {records.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No search history yet</p>
                ) : (
                  <div className="space-y-4">
                    {records.map((record) => (
                      <motion.div
                        key={record.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-50 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        {editingId === record.id ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editForm.location}
                              onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Location"
                            />
                            <input
                              type="date"
                              value={editForm.date}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <input
                              type="number"
                              value={editForm.temperature}
                              onChange={(e) => setEditForm({ ...editForm, temperature: parseFloat(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Temperature"
                            />
                            <input
                              type="number"
                              value={editForm.humidity}
                              onChange={(e) => setEditForm({ ...editForm, humidity: parseInt(e.target.value) })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Humidity"
                            />
                            <input
                              type="text"
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                              placeholder="Description"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(record.id)}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                              >
                                <Save className="h-4 w-4" />
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-800">{record.location}</h4>
                              <p className="text-sm text-gray-600">
                                {format(new Date(record.date), 'PPP')} • {Math.round(record.temperature)}°C • {record.humidity}% humidity
                              </p>
                              <p className="text-sm text-gray-500 capitalize">{record.description}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                Saved: {format(new Date(record.created_at), 'PPP p')}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEdit(record)}
                                className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(record.id)}
                                className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
