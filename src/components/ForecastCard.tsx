'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'

interface ForecastCardProps {
  data: any
}

export default function ForecastCard({ data }: ForecastCardProps) {
  // Handle both OpenWeatherMap and Open-Meteo data structures
  let dailyForecasts: any[] = []

  if (data.list && data.list.length > 0) {
    // OpenWeatherMap format
    dailyForecasts = data.list
      .filter((item: any) => item.dt_txt && item.dt_txt.includes('12:00:00'))
      .slice(0, 5)
  } else if (data.list && data.list.length > 0) {
    // Open-Meteo format (already mapped in API)
    dailyForecasts = data.list.slice(0, 5)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="bg-white rounded-3xl p-6 shadow-xl"
    >
      <h3 className="text-xl font-semibold text-gray-800 mb-6">5-Day Forecast</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {dailyForecasts.map((forecast: any, index: number) => (
          <motion.div
            key={forecast.dt || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center hover:shadow-lg transition-all"
          >
            <div className="text-sm font-medium text-gray-600 mb-2">
              {format(new Date(forecast.dt * 1000), 'EEE')}
            </div>
            <img
              src={`https://openweathermap.org/img/wn/${forecast.weather[0].icon}@2x.png`}
              alt={forecast.weather[0].description}
              className="w-16 h-16 mx-auto mb-2"
            />
            <div className="text-lg font-bold text-gray-800">
              {Math.round(forecast.main.temp_max)}°C
            </div>
            <div className="text-xs text-gray-500 capitalize">
              {forecast.weather[0].description}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
