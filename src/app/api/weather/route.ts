import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

// GET - Read all weather records
export async function GET() {
  try {
    const { data: records, error } = await supabase
      .from('weather_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(records)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch weather records' },
      { status: 500 }
    )
  }
}

// POST - Create a new weather record
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location, date } = body

    if (!location || !date) {
      return NextResponse.json(
        { error: 'Location and date are required' },
        { status: 400 }
      )
    }

    // Validate date
    const searchDate = new Date(date)
    if (isNaN(searchDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Geocoding to get coordinates using Open-Meteo (no API key required)
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    const geoResponse = await axios.get(geoUrl)
    
    if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const { latitude, longitude, name, country } = geoResponse.data.results[0]

    // Fetch current weather using Open-Meteo (no API key required)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,apparent_temperature&timezone=auto`
    const weatherResponse = await axios.get(weatherUrl)
    const weatherData = weatherResponse.data

    // Save to database
    const { data: record, error } = await supabase
      .from('weather_records')
      .insert({
        location: `${name}, ${country}`,
        latitude: latitude,
        longitude: longitude,
        date: searchDate.toISOString(),
        temperature: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        description: getWeatherDescription(weatherData.current.weather_code),
        wind_speed: weatherData.current.wind_speed_10m,
        pressure: weatherData.current.surface_pressure,
        feels_like: weatherData.current.apparent_temperature,
        icon: getWeatherIcon(weatherData.current.weather_code),
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error creating weather record:', error)
    return NextResponse.json(
      { error: 'Failed to create weather record' },
      { status: 500 }
    )
  }
}

// Helper function to map WMO weather codes to descriptions
function getWeatherDescription(code: number): string {
  const codes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  }
  return codes[code] || 'Unknown'
}

// Helper function to map WMO weather codes to icon names
function getWeatherIcon(code: number): string {
  if (code === 0) return '01d'
  if (code === 1) return '02d'
  if (code === 2) return '03d'
  if (code === 3) return '04d'
  if (code >= 45 && code <= 48) return '50d'
  if (code >= 51 && code <= 55) return '09d'
  if (code >= 61 && code <= 65) return '10d'
  if (code >= 71 && code <= 77) return '13d'
  if (code >= 80 && code <= 82) return '09d'
  if (code >= 85 && code <= 86) return '13d'
  if (code >= 95) return '11d'
  return '01d'
}
