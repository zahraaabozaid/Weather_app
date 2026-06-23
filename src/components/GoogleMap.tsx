'use client'

import { motion } from 'framer-motion'
import { Map } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface MapboxMapProps {
  latitude: number
  longitude: number
  locationName: string
}

export default function MapboxMap({ latitude, longitude, locationName }: MapboxMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || ''
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainerRef.current || !accessToken) return

    // Load Mapbox GL JS dynamically only once
    if (!isLoaded) {
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
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
        if (document.head.contains(link)) {
          document.head.removeChild(link)
        }
      }
    }
  }, [accessToken, isLoaded])

  useEffect(() => {
    if (!isLoaded || !mapContainerRef.current || !accessToken) return

    // Clean up existing map
    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    // Clear the container
    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = ''
    }

    // @ts-ignore
    if (window.mapboxgl) {
      // @ts-ignore
      window.mapboxgl.accessToken = accessToken
      // @ts-ignore
      mapRef.current = new window.mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 12,
      })
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [latitude, longitude, isLoaded, accessToken])

  if (!accessToken) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-gray-100 rounded-2xl p-8 text-center"
      >
        <Map className="h-12 w-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600">Mapbox API key not configured</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-white rounded-3xl p-4 shadow-xl overflow-hidden"
    >
      <h3 className="text-lg font-semibold text-gray-800 mb-4 px-2">Location Map</h3>
      <div
        ref={mapContainerRef}
        className="w-full h-[300px] rounded-2xl"
        style={{ borderRadius: '16px' }}
      />
    </motion.div>
  )
}
