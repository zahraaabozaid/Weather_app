'use client'

import { motion } from 'framer-motion'
import { Cloud, MapPin, Calendar, Database } from 'lucide-react'

export default function Branding() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.8 }}
      className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 shadow-xl mt-8"
    >
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Weather Application Features</h2>
        <p className="text-xl font-semibold text-blue-600">Real-time Weather Data & Forecast</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-md">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Cloud className="h-6 w-6 text-blue-600" />
          Key Features
        </h3>
        <p className="text-gray-700 leading-relaxed mb-6">
          This comprehensive weather application provides real-time weather information, 5-day forecasts, 
          and historical data management. Built with Next.js, Supabase, and integrated with OpenWeatherMap 
          and Mapbox APIs for accurate location-based weather data.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-blue-50 rounded-xl p-4 text-center"
          >
            <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h4 className="font-semibold text-gray-800">Location Search</h4>
            <p className="text-sm text-gray-600">Search any location worldwide</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-purple-50 rounded-xl p-4 text-center"
          >
            <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h4 className="font-semibold text-gray-800">5-Day Forecast</h4>
            <p className="text-sm text-gray-600">Extended weather predictions</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-green-50 rounded-xl p-4 text-center"
          >
            <Database className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h4 className="font-semibold text-gray-800">Data Export</h4>
            <p className="text-sm text-gray-600">Export to JSON, CSV, PDF</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
