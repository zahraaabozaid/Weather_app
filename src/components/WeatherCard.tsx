'use client'

import { motion } from 'framer-motion'
import { Cloud, Droplets, Wind, Thermometer, MapPin } from 'lucide-react'

interface WeatherCardProps {
  data: any
  locationName: string
}

export default function WeatherCard({ data, locationName }: WeatherCardProps) {
  const { main, weather, wind } = data
  const iconCode = weather[0].icon
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@4x.png`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-3xl p-8 text-white shadow-2xl"
    >
      <div className="flex items-center gap-2 mb-6">
        <MapPin className="h-5 w-5" />
        <h2 className="text-2xl font-semibold">{locationName}</h2>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-7xl font-bold mb-2">
            {Math.round(main.temp)}°C
          </div>
          <div className="text-xl capitalize opacity-90">
            {weather[0].description}
          </div>
        </div>
        <img
          src={iconUrl}
          alt={weather[0].description}
          className="w-32 h-32 object-contain"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="h-5 w-5" />
            <span className="text-sm opacity-80">Feels Like</span>
          </div>
          <div className="text-2xl font-semibold">{Math.round(main.feels_like)}°C</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-5 w-5" />
            <span className="text-sm opacity-80">Humidity</span>
          </div>
          <div className="text-2xl font-semibold">{main.humidity}%</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wind className="h-5 w-5" />
            <span className="text-sm opacity-80">Wind</span>
          </div>
          <div className="text-2xl font-semibold">{wind.speed} m/s</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.05 }}
          className="bg-white/20 backdrop-blur-sm rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Cloud className="h-5 w-5" />
            <span className="text-sm opacity-80">Pressure</span>
          </div>
          <div className="text-2xl font-semibold">{main.pressure} hPa</div>
        </motion.div>
      </div>
    </motion.div>
  )
}
