import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { location } = body

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      )
    }

    // Geocoding to get coordinates using Open-Meteo
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    const geoResponse = await axios.get(geoUrl)
    
    if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      )
    }

    const { latitude, longitude, name, country } = geoResponse.data.results[0]

    // Fetch current weather and forecast using Open-Meteo
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,surface_pressure,apparent_temperature&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=5`
    const weatherResponse = await axios.get(weatherUrl)
    const weatherData = weatherResponse.data

    // Map Open-Meteo data to match the expected format
    const mappedCurrent = {
      name: name,
      sys: { country: country },
      coord: { lat: latitude, lon: longitude },
      main: {
        temp: weatherData.current.temperature_2m,
        humidity: weatherData.current.relative_humidity_2m,
        feels_like: weatherData.current.apparent_temperature,
        pressure: weatherData.current.surface_pressure,
      },
      weather: [
        {
          main: getWeatherDescription(weatherData.current.weather_code),
          description: getWeatherDescription(weatherData.current.weather_code),
          icon: getWeatherIcon(weatherData.current.weather_code),
        }
      ],
      wind: {
        speed: weatherData.current.wind_speed_10m,
      },
    }

    const mappedForecast = {
      list: weatherData.daily.time.map((time: string, index: number) => ({
        dt: new Date(time).getTime() / 1000,
        main: {
          temp_max: weatherData.daily.temperature_2m_max[index],
          temp_min: weatherData.daily.temperature_2m_min[index],
        },
        weather: [
          {
            main: getWeatherDescription(weatherData.daily.weather_code[index]),
            description: getWeatherDescription(weatherData.daily.weather_code[index]),
            icon: getWeatherIcon(weatherData.daily.weather_code[index]),
          }
        ],
      })),
    }

    return NextResponse.json({
      location: {
        name,
        country,
        latitude,
        longitude,
      },
      current: mappedCurrent,
      forecast: mappedForecast,
    })
  } catch (error: any) {
    console.error('Error searching weather:', error)
    const errorMessage = error.response?.data?.message || error.message || 'Failed to search weather data'
    return NextResponse.json(
      { error: errorMessage },
      { status: error.response?.status || 500 }
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
