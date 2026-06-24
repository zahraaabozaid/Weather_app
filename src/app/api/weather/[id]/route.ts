import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

// GET - Read a single weather record
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: record, error } = await supabase
      .from('weather_records')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error || !record) {
      return NextResponse.json(
        { error: 'Weather record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching weather record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather record' },
      { status: 500 }
    )
  }
}

// PUT - Update a weather record with validation
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { location, date } = body

    // Validate required fields
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
        { error: 'Invalid date format. Use YYYY-MM-DD format.' },
        { status: 400 }
      )
    }

    // Validate location using Mapbox Geocoding API
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!mapboxToken) {
      return NextResponse.json(
        { error: 'Mapbox API token is not configured' },
        { status: 500 }
      )
    }

    const geocodingUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(location)}.json?access_token=${mapboxToken}&limit=1`
    const geocodingResponse = await axios.get(geocodingUrl)

    if (!geocodingResponse.data.features || geocodingResponse.data.features.length === 0) {
      return NextResponse.json(
        { error: 'Location not found. Please check the location name and try again.' },
        { status: 404 }
      )
    }

    const feature = geocodingResponse.data.features[0]
    const [longitude, latitude] = feature.center
    const placeName = feature.place_name || location

    // Fetch updated weather data using OpenWeatherMap API
    const openWeatherToken = process.env.NEXT_PUBLIC_WEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || process.env.OPENWEATHER_API_KEY
    if (!openWeatherToken || openWeatherToken.trim() === '' || openWeatherToken === 'your_openweathermap_api_key_here') {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key (NEXT_PUBLIC_WEATHER_API_KEY) is not configured or is undefined. Please set it in .env.local.' },
        { status: 500 }
      )
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherToken}&units=metric`
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${openWeatherToken}&units=metric`

    // Fetch both Current Weather and 5-Day / 3-Hour Forecast simultaneously
    const [weatherResponse, forecastResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl)
    ])

    const weatherData = weatherResponse.data
    const forecastData = forecastResponse.data

    // Base update fields (always supported)
    const baseUpdate = {
      location: placeName,
      latitude: latitude,
      longitude: longitude,
      date: searchDate.toISOString(),
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      wind_speed: weatherData.wind?.speed,
      pressure: weatherData.main.pressure,
      feels_like: weatherData.main.feels_like,
      icon: weatherData.weather[0].icon,
    }

    // Try to update with forecast_json first
    let { data: record, error } = await supabase
      .from('weather_records')
      .update({ ...baseUpdate, forecast_json: forecastData })
      .eq('id', params.id)
      .select()
      .single()

    // If forecast_json column doesn't exist, fallback without it
    if (error && (error.message?.includes('forecast_json') || error.code === 'PGRST204' || error.code === '42703')) {
      console.warn('forecast_json column not found. Updating without forecast data.')
      const fallback = await supabase
        .from('weather_records')
        .update(baseUpdate)
        .eq('id', params.id)
        .select()
        .single()
      record = fallback.data
      error = fallback.error
    }

    if (error || !record) {
      return NextResponse.json(
        { error: 'Failed to update weather record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ...record, forecast_json: forecastData })
  } catch (error: any) {
    console.error('Error updating weather record:', error)
    
    if (error.response?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API credentials. OpenWeatherMap returned 401 Unauthorized. Check your NEXT_PUBLIC_WEATHER_API_KEY.' },
        { status: 401 }
      )
    }
    
    if (error.response?.status === 429) {
      return NextResponse.json(
        { error: 'API rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update weather record. Please try again.' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a weather record
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('weather_records')
      .delete()
      .eq('id', params.id)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete weather record' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Weather record deleted successfully' })
  } catch (error) {
    console.error('Error deleting weather record:', error)
    return NextResponse.json(
      { error: 'Failed to delete weather record' },
      { status: 500 }
    )
  }
}
