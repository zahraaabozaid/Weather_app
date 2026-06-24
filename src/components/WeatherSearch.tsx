'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface WeatherSearchProps {
  onSearch: (location: string, date: string, coordinates?: { latitude: number; longitude: number }) => void
  onUseCurrentLocation: () => void
  isLoading: boolean
}

export default function WeatherSearch({ onSearch, onUseCurrentLocation, isLoading }: WeatherSearchProps) {
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle outside clicks to close the suggestions dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced geocoding search for autocomplete suggestions
  useEffect(() => {
    if (!location.trim() || location.length < 3) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!mapboxToken || mapboxToken.trim() === '' || mapboxToken === 'your_mapbox_access_token_here') {
      return
    }

    const timer = setTimeout(async () => {
      try {
        const query = encodeURIComponent(location.trim())
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`
        const response = await fetch(url)
        if (response.ok) {
          const data = await response.json()
          if (data.features) {
            setSuggestions(data.features)
            setShowSuggestions(data.features.length > 0)
          }
        }
      } catch (error) {
        console.error('Error fetching Mapbox autocomplete suggestions:', error)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [location])

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
    setShowSuggestions(false)
    onSearch(location, date)
  }

  const handleSuggestionClick = (feature: any) => {
    const placeName = feature.place_name
    setLocation(placeName)
    setSuggestions([])
    setShowSuggestions(false)

    const [longitude, latitude] = feature.center
    if (date) {
      onSearch(placeName, date, { latitude, longitude })
    } else {
      toast.info('Please select a date to complete the weather search')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative flex-1" ref={dropdownRef}>
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            placeholder="Search city, zip code, landmark, or coordinates..."
            className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all text-lg shadow-sm"
            disabled={isLoading}
          />
          
          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 mt-2 bg-white rounded-xl border border-gray-150 shadow-2xl z-50 overflow-hidden max-h-60 overflow-y-auto divide-y divide-gray-100"
              >
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    type="button"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-5 py-3.5 hover:bg-blue-50/50 hover:text-blue-600 transition-colors flex items-start gap-3 text-sm text-gray-700 font-medium"
                  >
                    <MapPin className="h-4.5 w-4.5 text-gray-400 mt-0.5 shrink-0" />
                    <span>{suggestion.place_name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
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
