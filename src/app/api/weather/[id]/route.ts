import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import axios from 'axios'

// ─── Next.js 15+ requires params to be awaited as a Promise ──────────────────
type RouteContext = { params: Promise<{ id: string }> }

// GET - Read a single weather record
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    const { data: record, error } = await supabase
      .from('weather_records')
      .select('*')
      .eq('id', id)
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

// PUT - Update a weather record: re-fetch fresh weather + forecast for the location
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

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

    // Geocode the location to get fresh coordinates
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

    // Fetch refreshed weather + 5-day forecast simultaneously
    const openWeatherToken =
      process.env.NEXT_PUBLIC_WEATHER_API_KEY ||
      process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ||
      process.env.OPENWEATHER_API_KEY

    if (!openWeatherToken || openWeatherToken.trim() === '' || openWeatherToken === 'your_openweathermap_api_key_here') {
      return NextResponse.json(
        { error: 'OpenWeatherMap API key is not configured. Please set it in .env.local.' },
        { status: 500 }
      )
    }

    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${openWeatherToken}&units=metric`
    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${openWeatherToken}&units=metric`

    const [weatherResponse, forecastResponse] = await Promise.all([
      axios.get(weatherUrl),
      axios.get(forecastUrl),
    ])

    const weatherData = weatherResponse.data
    const forecastData = forecastResponse.data

    // Determine the active weather parameters (use forecast if date matches forecast hours)
    let activeTemp = weatherData.main.temp
    let activeHumidity = weatherData.main.humidity
    let activeDescription = weatherData.weather[0].description
    let activeWindSpeed = weatherData.wind?.speed ?? null
    let activePressure = weatherData.main.pressure
    let activeFeelsLike = weatherData.main.feels_like
    let activeIcon = weatherData.weather[0].icon

    if (forecastData.list && forecastData.list.length > 0) {
      const targetTime = searchDate.getTime()
      let closestItem = forecastData.list[0]
      let minDiff = Math.abs(new Date(closestItem.dt * 1000).getTime() - targetTime)

      for (const item of forecastData.list) {
        const itemTime = new Date(item.dt * 1000).getTime()
        const diff = Math.abs(itemTime - targetTime)
        if (diff < minDiff) {
          minDiff = diff
          closestItem = item
        }
      }

      // If the closest forecast is within 24 hours of the target date, use the forecast data
      if (minDiff < 24 * 60 * 60 * 1000) {
        activeTemp = closestItem.main.temp
        activeHumidity = closestItem.main.humidity
        activeDescription = closestItem.weather[0].description
        activeWindSpeed = closestItem.wind?.speed ?? null
        activePressure = closestItem.main.pressure
        activeFeelsLike = closestItem.main.feels_like
        activeIcon = closestItem.weather[0].icon
      }
    }

    // Full update payload including refreshed weather + new date
    const updatePayload = {
      location: placeName,
      latitude,
      longitude,
      date: searchDate.toISOString(),
      temperature: activeTemp,
      humidity: activeHumidity,
      description: activeDescription,
      wind_speed: activeWindSpeed,
      pressure: activePressure,
      feels_like: activeFeelsLike,
      icon: activeIcon,
      forecast_json: forecastData,
    }

    let { data: record, error } = await supabase
      .from('weather_records')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    // Fallback if forecast_json column doesn't exist
    if (error && (error.message?.includes('forecast_json') || error.code === 'PGRST204' || error.code === '42703')) {
      console.warn('forecast_json column not found. Updating without forecast data.')
      const { forecast_json: _ignored, ...payloadWithoutForecast } = updatePayload
      const fallback = await supabase
        .from('weather_records')
        .update(payloadWithoutForecast)
        .eq('id', id)
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
        { error: 'Invalid API credentials. Check your NEXT_PUBLIC_WEATHER_API_KEY.' },
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

// DELETE - Delete a weather record by UUID
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // ── CRITICAL: await params (Next.js 15+ async params) ──────────────────
    const { id } = await context.params

    if (!id) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('weather_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Supabase delete error:', error)
      return NextResponse.json(
        { error: 'Failed to delete weather record', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Weather record deleted successfully', id },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('Error deleting weather record:', error)
    return NextResponse.json(
      { error: 'Failed to delete weather record' },
      { status: 500 }
    )
  }
}
