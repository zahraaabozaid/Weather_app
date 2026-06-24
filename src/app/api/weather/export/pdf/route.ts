import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export async function GET() {
  try {
    const { data: records, error } = await supabase
      .from('weather_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Create PDF document (landscape for better table layout)
    const doc = new jsPDF({ orientation: 'landscape' })
    
    // Add title
    doc.setFontSize(24)
    doc.setTextColor(37, 99, 235)
    doc.text('Weather Intelligence Dashboard', 14, 20)
    
    doc.setFontSize(12)
    doc.setTextColor(100, 100, 100)
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 14, 30)
    doc.text(`Total Records: ${records.length}`, 14, 38)

    // Prepare detailed table data
    const tableData = records.map((record: any) => [
      record.location,
      new Date(record.date).toLocaleDateString(),
      `${Math.round(record.temperature)}°C`,
      `${record.humidity}%`,
      record.description,
      `${record.wind_speed ? Math.round(record.wind_speed) : 'N/A'} m/s`,
      `${record.pressure ? record.pressure : 'N/A'} hPa`,
      `${record.feels_like ? Math.round(record.feels_like) : 'N/A'}°C`,
      new Date(record.created_at).toLocaleString(),
    ])

    // Add main table
    autoTable(doc, {
      head: [['Location', 'Date', 'Temp', 'Humidity', 'Condition', 'Wind', 'Pressure', 'Feels Like', 'Saved At']],
      body: tableData,
      startY: 50,
      theme: 'grid',
      headStyles: {
        fillColor: [37, 99, 235],
        textColor: 255,
        fontStyle: 'bold',
        fontSize: 10,
      },
      styles: {
        fontSize: 9,
        cellPadding: 4,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      columnStyles: {
        0: { cellWidth: 50 }, // Location
        1: { cellWidth: 30 }, // Date
        2: { cellWidth: 25 }, // Temp
        3: { cellWidth: 25 }, // Humidity
        4: { cellWidth: 50 }, // Condition
        5: { cellWidth: 25 }, // Wind
        6: { cellWidth: 25 }, // Pressure
        7: { cellWidth: 25 }, // Feels Like
        8: { cellWidth: 40 }, // Saved At
      },
    })

    // Add forecast summary if available
    const recordsWithForecast = records.filter((r: any) => r.forecast_json)
    if (recordsWithForecast.length > 0) {
      const finalY = (doc as any).lastAutoTable.finalY + 15
      
      doc.setFontSize(14)
      doc.setTextColor(37, 99, 235)
      doc.text('Forecast Summary', 14, finalY)
      
      const forecastData = recordsWithForecast.map((record: any) => {
        const forecast = record.forecast_json
        const forecastList = forecast.list || []
        const nextDay = forecastList.find((f: any) => f.dt_txt && f.dt_txt.includes('12:00:00'))
        return [
          record.location,
          nextDay ? `${Math.round(nextDay.main.temp)}°C` : 'N/A',
          nextDay ? `${nextDay.main.humidity}%` : 'N/A',
          nextDay ? nextDay.weather[0].description : 'N/A',
        ]
      })

      autoTable(doc, {
        head: [['Location', 'Next Day Temp', 'Next Day Humidity', 'Next Day Condition']],
        body: forecastData,
        startY: finalY + 10,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10,
        },
        styles: {
          fontSize: 9,
          cellPadding: 4,
        },
      })
    }

    // Add footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Page ${i} of ${pageCount} | Weather Intelligence Dashboard`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Generate PDF as buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="weather-dashboard-report.pdf"',
      },
    })
  } catch (error) {
    console.error('Error exporting PDF:', error)
    return NextResponse.json(
      { error: 'Failed to export PDF' },
      { status: 500 }
    )
  }
}
