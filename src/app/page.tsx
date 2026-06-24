'use client'

import { useState } from 'react'
import WeatherSearch from '@/components/WeatherSearch'
import WeatherCard from '@/components/WeatherCard'
import ForecastCard from '@/components/ForecastCard'
import MapboxMap from '@/components/GoogleMap'
import YouTubeVideos from '@/components/YouTubeVideos'
import HistoryPanel from '@/components/HistoryPanel'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

export default function Home() {
  const [weatherData, setWeatherData] = useState<any>(null)
  const [forecastData, setForecastData] = useState<any>(null)
  const [locationInfo, setLocationInfo] = useState<any>(null)
  const [youtubeVideos, setYoutubeVideos] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mapLocation, setMapLocation] = useState<{ latitude: number; longitude: number; locationName: string } | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleSearch = async (location: string, date: string, coordinates?: { latitude: number; longitude: number }) => {
    setIsLoading(true)
    try {
      let latitude: number
      let longitude: number
      let placeName = location

      if (coordinates?.latitude !== undefined && coordinates?.longitude !== undefined) {
        latitude = coordinates.latitude
        longitude = coordinates.longitude
      } else {
        // 1. Step 1: Mapbox Geocoding & Live Location Marker Pin
        const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
        if (!mapboxToken || mapboxToken.trim() === '' || mapboxToken === 'your_mapbox_access_token_here') {
          throw new Error('Mapbox API token (NEXT_PUBLIC_MAPBOX_TOKEN) is not configured. Please set it in .env.local.')
        }

        const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&limit=1`
        const geocodingResponse = await fetch(geocodingUrl)
        const geocodingData = await geocodingResponse.json()

        if (!geocodingData.features || geocodingData.features.length === 0) {
          throw new Error('Location not found. Please check the spelling and try again.')
        }

        const feature = geocodingData.features[0]
        longitude = feature.center[0]
        latitude = feature.center[1]
        placeName = feature.place_name || location
      }

      // Map Update: Update state to trigger map flyTo and render Marker Pin immediately
      setMapLocation({
        latitude,
        longitude,
        locationName: placeName,
      })
      setLocationInfo({
        name: placeName,
        country: '',
        latitude,
        longitude,
      })

      // 2. Step 2: Fetch Current Weather & 5-Day Forecast Simultaneously
      const response = await fetch('/api/weather', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          latitude,
          longitude,
          location: placeName, 
          date 
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data')
      }

      // Set weather data and forecast data
      setWeatherData(data)
      if (data.forecast_json) {
        setForecastData(data.forecast_json)
      }

      // Fetch YouTube videos in the background
      try {
        const youtubeResponse = await fetch('/api/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: placeName }),
        })
        const youtubeData = await youtubeResponse.json()
        if (youtubeResponse.ok) {
          setYoutubeVideos(youtubeData.videos)
        }
      } catch (error) {
        console.error('Failed to fetch YouTube videos:', error)
      }

      // Refresh Saved Dashboard history list
      setRefreshTrigger(prev => prev + 1)
      toast.success(`Weather details loaded and saved for ${placeName}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch weather data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setIsLoading(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // 1. Step 1: Mapbox Reverse Geocoding & Live Location Marker Pin
          const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
          if (!mapboxToken || mapboxToken.trim() === '' || mapboxToken === 'your_mapbox_access_token_here') {
            throw new Error('Mapbox API token (NEXT_PUBLIC_MAPBOX_TOKEN) is not configured. Please set it in .env.local.')
          }

          const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${mapboxToken}&limit=1`
          const geocodingResponse = await fetch(geocodingUrl)
          const geocodingData = await geocodingResponse.json()

          let placeName = 'Current Location'
          if (geocodingData.features && geocodingData.features.length > 0) {
            placeName = geocodingData.features[0].place_name
          }

          // Map Update: Update state to trigger map flyTo and render Marker Pin immediately
          setMapLocation({
            latitude,
            longitude,
            locationName: placeName,
          })
          setLocationInfo({
            name: placeName,
            country: '',
            latitude,
            longitude,
          })

          // 2. Step 2: Fetch Current Weather & 5-Day Forecast Simultaneously
          const dateToday = new Date().toISOString().split('T')[0]
          const response = await fetch('/api/weather', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              latitude,
              longitude,
              location: placeName, 
              date: dateToday 
            }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch weather data')
          }

          setWeatherData(data)
          if (data.forecast_json) {
            setForecastData(data.forecast_json)
          }

          // Fetch YouTube videos
          try {
            const youtubeResponse = await fetch('/api/youtube', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ location: placeName }),
            })
            const youtubeData = await youtubeResponse.json()
            if (youtubeResponse.ok) {
              setYoutubeVideos(youtubeData.videos)
            }
          } catch (error) {
            console.error('Failed to fetch YouTube videos:', error)
          }

          // Refresh Saved Dashboard history list
          setRefreshTrigger(prev => prev + 1)
          toast.success(`Weather details loaded and saved for ${placeName}`)
        } catch (error: any) {
          toast.error(error.message || 'Failed to fetch weather data')
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        toast.error('Failed to access your location. Please check browser permissions.')
        setIsLoading(false)
      }
    )
  }

  const handleHistoryRecordClick = (record: any) => {
    setWeatherData(record)
    setForecastData(record.forecast_json)
    setLocationInfo({
      name: record.location,
      country: '',
      latitude: record.latitude,
      longitude: record.longitude,
    })
    setMapLocation({
      latitude: record.latitude,
      longitude: record.longitude,
      locationName: record.location,
    })
    toast.success(`Loaded saved dashboard for ${record.location}`)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-800 mb-4 tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Weather Intelligence Dashboard
          </h1>
          <p className="text-xl text-gray-600">Get real-time weather analytics and 5-day forecasts worldwide</p>
        </div>

        <WeatherSearch
          onSearch={handleSearch}
          onUseCurrentLocation={handleCurrentLocation}
          isLoading={isLoading}
        />

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        )}

        {weatherData && locationInfo && !isLoading && (
          <div className="space-y-8 animate-fadeIn">
            <div className="grid grid-cols-1 gap-8">
              <WeatherCard
                data={weatherData}
                locationName={locationInfo.name}
              />
              <ForecastCard data={forecastData} selectedDate={weatherData?.date} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MapboxMap
                latitude={mapLocation?.latitude || locationInfo.latitude}
                longitude={mapLocation?.longitude || locationInfo.longitude}
                locationName={mapLocation?.locationName || locationInfo.name}
                shouldFlyTo={true}
              />
              {youtubeVideos && <YouTubeVideos videos={youtubeVideos} />}
            </div>
          </div>
        )}

        <div className="pt-8 border-t border-gray-150">
          <HistoryPanel 
            onRecordClick={handleHistoryRecordClick} 
            refreshTrigger={refreshTrigger}
          />
        </div>
      </div>
    </main>
  )
}
