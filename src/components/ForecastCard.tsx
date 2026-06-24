'use client'

import { motion } from 'framer-motion'
import { format } from 'date-fns'
import { CloudRain, Compass, Thermometer } from 'lucide-react'

interface ForecastCardProps {
  data: any
}

interface GroupedForecast {
  date: Date
  tempMax: number
  tempMin: number
  humidity: number
  description: string
  icon: string
}

export default function ForecastCard({ data }: ForecastCardProps) {
  // Helper to group 3-hour forecast intervals by day
  const getGroupedForecasts = (list: any[]): GroupedForecast[] => {
    const groups: { [key: string]: any[] } = {}
    
    list.forEach((item: any) => {
      const date = new Date(item.dt * 1000)
      const dateStr = date.toDateString() // e.g., "Wed Jun 24 2026"
      if (!groups[dateStr]) {
        groups[dateStr] = []
      }
      groups[dateStr].push(item)
    })

    const days = Object.keys(groups).map((dateStr) => {
      const items = groups[dateStr]
      const temps = items.map((i: any) => i.main.temp)
      const tempMax = Math.max(...temps)
      const tempMin = Math.min(...temps)
      const avgHumidity = items.reduce((sum: number, i: any) => sum + (i.main.humidity || 0), 0) / items.length

      // Try to find a midday forecast point (12:00:00) to represent daytime conditions
      const midDayItem = items.find((i: any) => i.dt_txt && i.dt_txt.includes('12:00:00')) || items[Math.floor(items.length / 2)]

      return {
        date: new Date(items[0].dt * 1000),
        tempMax,
        tempMin,
        humidity: Math.round(avgHumidity),
        description: midDayItem.weather[0].description,
        icon: midDayItem.weather[0].icon,
      }
    })

    return days.slice(0, 5)
  }

  let dailyForecasts: GroupedForecast[] = []

  if (data && data.list && data.list.length > 0) {
    if (data.list.length > 10) {
      dailyForecasts = getGroupedForecasts(data.list)
    } else {
      dailyForecasts = data.list.map((item: any) => ({
        date: new Date(item.dt * 1000),
        tempMax: item.main.temp_max || item.main.temp,
        tempMin: item.main.temp_min || item.main.temp,
        humidity: item.main.humidity || 0,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
      }))
    }
  }

  if (!dailyForecasts || dailyForecasts.length === 0) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100"
    >
      <div className="flex items-center gap-2 mb-6">
        <Compass className="h-6 w-6 text-blue-600 animate-spin-slow" />
        <h3 className="text-xl font-bold text-gray-850">5-Day Extended Weather Forecast</h3>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {dailyForecasts.map((forecast: GroupedForecast, index: number) => (
          <motion.div
            key={forecast.date.getTime() || index}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 + index * 0.08 }}
            whileHover={{ scale: 1.03, y: -4 }}
            className="bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 rounded-2xl p-4 text-center border border-gray-100 hover:shadow-lg transition-all"
          >
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
              {format(forecast.date, 'EEEE')}
            </div>
            <div className="text-sm font-bold text-gray-700 mb-2">
              {format(forecast.date, 'MMM d')}
            </div>
            
            <img
              src={`https://openweathermap.org/img/wn/${forecast.icon}@2x.png`}
              alt={forecast.description}
              className="w-16 h-16 mx-auto mb-2 drop-shadow-md object-contain"
            />
            
            <div className="text-base font-extrabold text-gray-800 flex items-center justify-center gap-1">
              <span>{Math.round(forecast.tempMax)}°</span>
              <span className="text-gray-450 font-normal text-sm">/ {Math.round(forecast.tempMin)}°C</span>
            </div>
            
            <div className="text-xs text-gray-550 capitalize mt-2 truncate font-medium max-w-full" title={forecast.description}>
              {forecast.description}
            </div>
            
            <div className="text-[10px] text-gray-400 mt-2 flex items-center justify-center gap-1 bg-gray-50 rounded-full py-1 px-2 border border-gray-100">
              <CloudRain className="h-3 w-3 text-blue-400" />
              <span>{forecast.humidity}% Hum</span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
