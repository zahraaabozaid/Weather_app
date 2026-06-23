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

    const apiKey = process.env.YOUTUBE_API_KEY
    if (!apiKey || apiKey === 'your_youtube_api_key_here') {
      // Return empty videos array if API key is not configured
      return NextResponse.json({ videos: [] })
    }

    // Search for travel videos about the location
    const searchQuery = `${location} travel guide`
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=3&key=${apiKey}`
    
    const response = await axios.get(url)
    const videos = response.data.items.map((item: any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
    }))

    return NextResponse.json({ videos })
  } catch (error) {
    console.error('Error fetching YouTube videos:', error)
    // Return empty videos array on error instead of throwing error
    return NextResponse.json({ videos: [] })
  }
}
