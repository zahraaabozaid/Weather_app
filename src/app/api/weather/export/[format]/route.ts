import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ─── Next.js 15+ requires params to be awaited as a Promise ──────────────────
type RouteContext = { params: Promise<{ format: string }> }

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { format: rawFormat } = await context.params
    const fmt = rawFormat?.toLowerCase()

    if (!fmt || (fmt !== 'json' && fmt !== 'csv')) {
      return NextResponse.json(
        { error: 'Invalid format. Use "json" or "csv"' },
        { status: 400 }
      )
    }

    const { data: records, error } = await supabase
      .from('weather_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    if (fmt === 'json') {
      return NextResponse.json(records, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="weather-data-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    // ── CSV export ────────────────────────────────────────────────────────────
    const csvHeaders = [
      'ID',
      'Location',
      'Latitude',
      'Longitude',
      'Date',
      'Temperature (°C)',
      'Humidity (%)',
      'Description',
      'Wind Speed (m/s)',
      'Pressure (hPa)',
      'Feels Like (°C)',
      'Icon',
      'Created At',
      'Updated At',
    ]

    const escapeCSV = (value: unknown): string => {
      const str = value === null || value === undefined ? '' : String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const dataRows = (records ?? []).map((r: any) => [
      r.id ?? '',
      r.location ?? '',
      r.latitude ?? '',
      r.longitude ?? '',
      r.date ?? '',
      r.temperature !== undefined ? Math.round(r.temperature * 100) / 100 : '',
      r.humidity ?? '',
      r.description ?? '',
      r.wind_speed !== undefined && r.wind_speed !== null ? r.wind_speed : '',
      r.pressure !== undefined && r.pressure !== null ? r.pressure : '',
      r.feels_like !== undefined && r.feels_like !== null ? Math.round(r.feels_like * 100) / 100 : '',
      r.icon ?? '',
      r.created_at ?? '',
      r.updated_at ?? '',
    ])

    const csvLines = [
      csvHeaders.map(escapeCSV).join(','),
      ...dataRows.map((row: unknown[]) => row.map(escapeCSV).join(',')),
    ].join('\r\n')

    // UTF-8 BOM for Excel compatibility
    const csvWithBOM = '\uFEFF' + csvLines

    return new NextResponse(csvWithBOM, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="weather-data-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting weather data:', error)
    return NextResponse.json(
      { error: 'Failed to export weather data' },
      { status: 500 }
    )
  }
}
