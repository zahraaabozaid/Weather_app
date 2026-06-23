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

  const handleSearch = async (location: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/weather/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch weather data')
      }

      setWeatherData(data.current)
      setForecastData(data.forecast)
      setLocationInfo(data.location)

      // Fetch YouTube videos
      try {
        const youtubeResponse = await fetch('/api/youtube', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ location: data.location.name }),
        })
        const youtubeData = await youtubeResponse.json()
        if (youtubeResponse.ok) {
          setYoutubeVideos(youtubeData.videos)
        }
      } catch (error) {
        console.error('Failed to fetch YouTube videos:', error)
      }

      toast.success('Weather data loaded successfully')
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
          const response = await fetch('/api/weather/current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ latitude, longitude }),
          })

          const data = await response.json()

          if (!response.ok) {
            throw new Error(data.error || 'Failed to fetch weather data')
          }

          setWeatherData(data.current)
          setForecastData(data.forecast)
          setLocationInfo({
            name: data.current.name,
            country: data.current.sys.country,
            latitude: data.current.coord.lat,
            longitude: data.current.coord.lon,
          })

          toast.success('Weather data loaded successfully')
        } catch (error: any) {
          toast.error(error.message || 'Failed to fetch weather data')
        } finally {
          setIsLoading(false)
        }
      },
      (error) => {
        toast.error('Failed to get your location')
        setIsLoading(false)
      }
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-800 mb-4">Weather App</h1>
          <p className="text-xl text-gray-600">Get real-time weather information for any location</p>
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
          <div className="space-y-8 mt-12">
            <WeatherCard
              data={weatherData}
              locationName={`${locationInfo.name}, ${locationInfo.country}`}
            />
            <ForecastCard data={forecastData} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <MapboxMap
                latitude={locationInfo.latitude}
                longitude={locationInfo.longitude}
                locationName={locationInfo.name}
              />
              {youtubeVideos && <YouTubeVideos videos={youtubeVideos} />}
            </div>
          </div>
        )}

        <HistoryPanel />
      </div>
    </main>
  )
}
