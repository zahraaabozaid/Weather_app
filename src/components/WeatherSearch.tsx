'use client'

import { useState } from 'react'
import { Search, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

interface WeatherSearchProps {
  onSearch: (location: string, date: string) => void
  onUseCurrentLocation: () => void
  isLoading: boolean
}

export default function WeatherSearch({ onSearch, onUseCurrentLocation, isLoading }: WeatherSearchProps) {
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!location.trim()) {
      toast.error('Please enter a location')
      return
    }
    if (!date) {
      toast.error('Please select a date')
      return
    }
    onSearch(location, date)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Search city, zip code, landmark, or coordinates..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg shadow-sm"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Searching...' : 'Search & Save'}
          </button>
          <button
            type="button"
            onClick={onUseCurrentLocation}
            disabled={isLoading}
            className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Use current location"
          >
            <MapPin className="h-5 w-5" />
            <span className="hidden sm:inline">Current</span>
          </button>
        </div>
      </form>
    </motion.div>
  )
}
