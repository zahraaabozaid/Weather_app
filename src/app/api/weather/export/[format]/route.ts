import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { format: string } }
) {
  try {
    const { data: records, error } = await supabase
      .from('weather_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    const format = params.format.toLowerCase()

    if (format === 'json') {
      return NextResponse.json(records, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': 'attachment; filename="weather-data.json"',
        },
      })
    }

    if (format === 'csv') {
      const headers = ['ID', 'Location', 'Latitude', 'Longitude', 'Date', 'Temperature (°C)', 'Humidity (%)', 'Description', 'Wind Speed (m/s)', 'Pressure (hPa)', 'Feels Like (°C)', 'Created At']
      const rows = records.map((record: any) => [
        record.id,
        record.location,
        record.latitude || '',
        record.longitude || '',
        record.date,
        record.temperature,
        record.humidity,
        record.description,
        record.wind_speed || '',
        record.pressure || '',
        record.feels_like || '',
        record.created_at,
      ])

      const csvContent = [
        headers.join(','),
        ...rows.map((row: any) => row.map((cell: any) => `"${cell}"`).join(',')),
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="weather-data.csv"',
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid format. Use "json" or "csv"' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to export weather data' },
      { status: 500 }
    )
  }
}
