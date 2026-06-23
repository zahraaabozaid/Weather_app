import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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
    return NextResponse.json(
      { error: 'Failed to fetch weather record' },
      { status: 500 }
    )
  }
}

// PUT - Update a weather record
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { location, date, temperature, humidity, description } = body

    // Validate required fields
    if (!location || !date || temperature === undefined || !humidity || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate temperature and humidity
    if (typeof temperature !== 'number' || typeof humidity !== 'number') {
      return NextResponse.json(
        { error: 'Temperature and humidity must be numbers' },
        { status: 400 }
      )
    }

    if (humidity < 0 || humidity > 100) {
      return NextResponse.json(
        { error: 'Humidity must be between 0 and 100' },
        { status: 400 }
      )
    }

    const { data: record, error } = await supabase
      .from('weather_records')
      .update({
        location,
        date: searchDate.toISOString(),
        temperature,
        humidity,
        description,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error || !record) {
      return NextResponse.json(
        { error: 'Failed to update weather record' },
        { status: 500 }
      )
    }

    return NextResponse.json(record)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update weather record' },
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
    return NextResponse.json(
      { error: 'Failed to delete weather record' },
      { status: 500 }
    )
  }
}
