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
    console.error('Error fetching weather records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather records' },
      { status: 500 }
    )
  }
}

// POST - Create or Update a weather record (upsert by location name)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { latitude, longitude, location, date } = body

    // Validate required fields
    if (latitude === undefined || longitude === undefined || !location || !date) {
      return NextResponse.json(
        { error: 'Latitude, longitude, location name, and date are required' },
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

    // Fetch weather data using OpenWeatherMap Current Weather & Forecast APIs
    const openWeatherToken =
      process.env.NEXT_PUBLIC_WEATHER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
      process.env.OPENWEATHER_API_KEY

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
      axios.get(forecastUrl),
    ])

    const weatherData = weatherResponse.data
    const forecastData = forecastResponse.data

    // Build the record payload with all refreshed fields
    const recordPayload = {
      location: location,
      latitude: latitude,
      longitude: longitude,
      date: searchDate.toISOString(),
      temperature: weatherData.main.temp,
      humidity: weatherData.main.humidity,
      description: weatherData.weather[0].description,
      wind_speed: weatherData.wind?.speed ?? null,
      pressure: weatherData.main.pressure,
      feels_like: weatherData.main.feels_like,
      icon: weatherData.weather[0].icon,
      forecast_json: forecastData,
    }

    // ─── UPSERT LOGIC ────────────────────────────────────────────────────────
    // Check whether a record already exists for this location (case-insensitive).
    // If it does → UPDATE it so the date + fresh weather data are persisted.
    // If it doesn't → INSERT a brand-new row.
    const { data: existing } = await supabase
      .from('weather_records')
      .select('id')
      .ilike('location', location.trim())
      .maybeSingle()

    let record: any = null
    let dbError: any = null

    if (existing?.id) {
      // ── UPDATE existing record ──────────────────────────────────────────────
      const updateResult = await supabase
        .from('weather_records')
        .update(recordPayload)
        .eq('id', existing.id)
        .select()
        .single()

      record = updateResult.data
      dbError = updateResult.error

      // Fallback: if forecast_json column is missing, retry without it
      if (dbError && (dbError.message?.includes('forecast_json') || dbError.code === 'PGRST204' || dbError.code === '42703')) {
        console.warn('forecast_json column not found. Updating without forecast data.')
        const { forecast_json: _ignored, ...payloadWithoutForecast } = recordPayload
        const fallback = await supabase
          .from('weather_records')
          .update(payloadWithoutForecast)
          .eq('id', existing.id)
          .select()
          .single()
        record = fallback.data
        dbError = fallback.error
      }
    } else {
      // ── INSERT new record ───────────────────────────────────────────────────
      const insertResult = await supabase
        .from('weather_records')
        .insert(recordPayload)
        .select()
        .single()

      record = insertResult.data
      dbError = insertResult.error

      // Fallback: if forecast_json column is missing, retry without it
      if (dbError && (dbError.message?.includes('forecast_json') || dbError.code === 'PGRST204' || dbError.code === '42703')) {
        console.warn('forecast_json column not found in DB. Saving without forecast data. Run: ALTER TABLE weather_records ADD COLUMN IF NOT EXISTS forecast_json JSONB;')
        const { forecast_json: _ignored, ...payloadWithoutForecast } = recordPayload
        const fallback = await supabase
          .from('weather_records')
          .insert(payloadWithoutForecast)
          .select()
          .single()
        record = fallback.data
        dbError = fallback.error
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (dbError) throw dbError

    // Always return forecast data in the response even if it couldn't be persisted in DB
    const status = existing?.id ? 200 : 201
    return NextResponse.json({ ...record, forecast_json: forecastData }, { status })
  } catch (error: any) {
    console.error('Error creating/updating weather record:', error)

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
      { error: error.message || 'Failed to create/update weather record. Please try again.' },
      { status: 500 }
    )
  }
}
