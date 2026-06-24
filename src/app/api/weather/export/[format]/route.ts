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
      const headers = ['ID', 'Location', 'Latitude', 'Longitude', 'Date', 'Temperature (°C)', 'Humidity (%)', 'Description', 'Wind Speed (m/s)', 'Pressure (hPa)', 'Feels Like (°C)', 'Icon', 'Created At', 'Updated At']
      const rows = records.map((record: any) => [
        record.id || '',
        record.location || '',
        record.latitude || '',
        record.longitude || '',
        record.date || '',
        record.temperature || '',
        record.humidity || '',
        record.description || '',
        record.wind_speed || '',
        record.pressure || '',
        record.feels_like || '',
        record.icon || '',
        record.created_at || '',
        record.updated_at || '',
      ])

      // Proper CSV escaping with BOM for Excel compatibility
      const escapeCSV = (value: any) => {
        const stringValue = String(value || '')
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      }

      const csvContent = [
        headers.map(escapeCSV).join(','),
        ...rows.map((row: any) => row.map(escapeCSV).join(',')),
      ].join('\n')

      const csvWithBOM = '\uFEFF' + csvContent

      return new NextResponse(csvWithBOM, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="weather-data.csv"',
        },
      })
    }

    return NextResponse.json(
      { error: 'Invalid format. Use "json" or "csv"' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error exporting weather data:', error)
    return NextResponse.json(
      { error: 'Failed to export weather data' },
      { status: 500 }
    )
  }
}
