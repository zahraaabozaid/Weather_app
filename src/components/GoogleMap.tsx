'use client'

import { motion } from 'framer-motion'
import { Map } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface MapboxMapProps {
  latitude: number
  longitude: number
  locationName: string
  shouldFlyTo?: boolean
}

export default function MapboxMap({ latitude, longitude, locationName, shouldFlyTo = true }: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSatelliteView, setIsSatelliteView] = useState(false)

  // Load Mapbox GL JS and CSS dynamically if not already available
  useEffect(() => {
    if (!accessToken) return

    // If mapboxgl is already available globally, set isLoaded to true directly
    // @ts-ignore
    if (window.mapboxgl) {
      setIsLoaded(true)
      return
    }

    // Load Mapbox GL JS Script
    const script = document.createElement('script')
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js'
    script.async = true
    script.onload = () => {
      setIsLoaded(true)
    }
    document.head.appendChild(script)

    // Load Mapbox GL CSS
    const link = document.createElement('link')
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

    return () => {
      // Clean up script/style links if needed, but typically safe to leave for session
    }
  }, [accessToken])

  // Initialize and update the map
  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !accessToken) return

    // @ts-ignore
    const mapboxgl = window.mapboxgl
    if (!mapboxgl) return

    mapboxgl.accessToken = accessToken

    // Initialize Map if it does not exist
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: isSatelliteView ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 12,
      })

      // Add navigation controls
      mapRef.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right')

      // Add fullscreen control
      mapRef.current.addControl(new mapboxgl.FullscreenControl(), 'top-right')

      // Trigger map resize on load to avoid grey screen rendering glitch
      mapRef.current.on('load', () => {
        mapRef.current.resize()
      })
    } else {
      // Update map style if satellite view changed
      const currentStyle = mapRef.current.getStyle()
      const targetStyle = isSatelliteView ? 'mapbox://styles/mapbox/satellite-v9' : 'mapbox://styles/mapbox/streets-v12'
      if (currentStyle.name !== (isSatelliteView ? 'Satellite' : 'Streets')) {
        mapRef.current.setStyle(targetStyle)
      }
    }

    // Resize map to fit container
    mapRef.current.resize()

    // Fly to new location if coordinates change
    if (shouldFlyTo && mapRef.current) {
      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 12,
        essential: true,
        duration: 1500,
      })
    }

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.remove()
    }

    // Add a beautiful custom/standard Mapbox Marker at the location
    markerRef.current = new mapboxgl.Marker({ 
      color: '#EF4444',
      scale: 1.2
    })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ 
          offset: 25,
          closeButton: true,
          closeOnClick: false
        })
          .setHTML(`<div class="p-3 text-gray-800" style="font-family: system-ui, sans-serif;"><strong class="block text-lg mb-1">${locationName}</strong><span class="text-xs text-gray-500 block">Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}</span></div>`)
      )
      .addTo(mapRef.current)

    // Automatically open the popup to highlight the pin marker
    setTimeout(() => {
      if (markerRef.current) {
        markerRef.current.togglePopup()
      }
    }, 500)

    return () => {
      // Clean up marker on unmount
      if (markerRef.current) {
        markerRef.current.remove()
      }
    }
  }, [latitude, longitude, locationName, shouldFlyTo, isLoaded, accessToken, isSatelliteView])

  if (!accessToken) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-red-50 border border-red-200 rounded-3xl p-8 text-center"
      >
        <Map className="h-12 w-12 mx-auto mb-4 text-red-400 animate-pulse" />
        <h3 className="text-lg font-semibold text-red-800 mb-2">Mapbox Configuration Error</h3>
        <p className="text-sm text-red-600 max-w-md mx-auto">
          Mapbox API token is not configured. Please define <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> in your <code>.env.local</code> file to enable interactive maps.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col h-full min-h-[400px]"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Map className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-800">Target Location Map</h3>
        </div>
        
        {/* Satellite View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setIsSatelliteView(false)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              !isSatelliteView 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Standard
          </button>
          <button
            onClick={() => setIsSatelliteView(true)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              isSatelliteView 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Satellite
          </button>
        </div>
      </div>
      <div
        ref={mapContainerRef}
        className="w-full flex-1 rounded-2xl min-h-[300px] border border-gray-150 overflow-hidden shadow-inner"
        style={{ borderRadius: '16px' }}
      />
    </motion.div>
  )
}
