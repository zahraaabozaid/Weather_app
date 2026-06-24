'use client'

import { 
  Sun, 
  Moon, 
  Cloud, 
  CloudSun, 
  CloudMoon, 
  CloudDrizzle, 
  CloudRain, 
  CloudLightning, 
  CloudSnow, 
  Wind,
  CloudFog,
  LucideProps
} from 'lucide-react'

interface WeatherIconProps extends Omit<LucideProps, 'ref'> {
  iconCode: string
}

export default function WeatherIcon({ iconCode, ...props }: WeatherIconProps) {
  const code = iconCode ? iconCode.trim().toLowerCase() : ''

  // OpenWeatherMap 2x/4x Icon Codes:
  // https://openweathermap.org/weather-conditions
  switch (code) {
    // Clear Sky
    case '01d':
      return <Sun {...props} />
    case '01n':
      return <Moon {...props} />

    // Few Clouds
    case '02d':
      return <CloudSun {...props} />
    case '02n':
      return <CloudMoon {...props} />

    // Scattered / Broken / Overcast Clouds
    case '03d':
    case '03n':
    case '04d':
    case '04n':
      return <Cloud {...props} />

    // Shower Rain / Drizzle
    case '09d':
    case '09n':
      return <CloudDrizzle {...props} />

    // Rain
    case '10d':
    case '10n':
      return <CloudRain {...props} />

    // Thunderstorm
    case '11d':
    case '11n':
      return <CloudLightning {...props} />

    // Snow
    case '13d':
    case '13n':
      return <CloudSnow {...props} />

    // Mist / Fog / Haze
    case '50d':
    case '50n':
      return <CloudFog {...props} />

    // Fallback default
    default:
      return <Cloud {...props} />
  }
}
