# Weather Application Implementation Guide

This guide provides comprehensive instructions for setting up and using the updated Weather Application with full CRUD operations, Mapbox Geocoding, OpenWeatherMap integration, and Supabase persistence.

## 📋 Table of Contents

1. [Database Setup](#database-setup)
2. [Environment Configuration](#environment-configuration)
3. [API Integration Setup](#api-integration-setup)
4. [Running the Application](#running-the-application)
5. [API Endpoints Documentation](#api-endpoints-documentation)
6. [Frontend Features](#frontend-features)
7. [Error Handling](#error-handling)

## 🗄️ Database Setup

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized
3. Navigate to the SQL Editor in your Supabase dashboard

### Step 2: Run the Database Schema

Copy the entire contents of `supabase-schema.sql` and paste it into the Supabase SQL Editor, then run it.

**File location:** `c:\Users\elmohandes\Desktop\Weather_App\supabase-schema.sql`

The schema creates:
- `weather_records` table with UUID primary key
- Indexes for performance optimization
- Data integrity constraints (humidity 0-100, temperature -100 to 100)
- Automatic timestamp triggers
- Row Level Security (RLS) policies

### Step 3: Get Supabase Credentials

From your Supabase project settings:
1. Go to Settings → API
2. Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
3. Copy the **anon/public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 🔧 Environment Configuration

### Step 1: Create Environment File

Create a `.env.local` file in the root directory (if it doesn't exist):

```bash
# Copy the example file
cp .env.example .env.local
```

### Step 2: Configure Environment Variables

Update `.env.local` with your actual API keys:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_public_key_here"

# Mapbox Geocoding API (for location validation)
NEXT_PUBLIC_MAPBOX_TOKEN="your_mapbox_access_token_here"

# OpenWeatherMap API (for 5-day/3-hour forecast data)
NEXT_PUBLIC_OPENWEATHER_API_KEY="your_openweathermap_api_key_here"

# YouTube API (Server-side only)
YOUTUBE_API_KEY="your_youtube_api_key_here"

# Mapbox Access Token (for maps)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your_mapbox_access_token_here"
```

## 🔑 API Integration Setup

### Mapbox Geocoding API

1. Go to [mapbox.com](https://www.mapbox.com/)
2. Sign up for a free account
3. Navigate to Account → Access tokens
4. Copy your default public token
5. Add to both `NEXT_PUBLIC_MAPBOX_TOKEN` and `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

**Free Tier:** 100,000 requests per month

### OpenWeatherMap API

1. Go to [openweathermap.org](https://openweathermap.org/api)
2. Sign up for a free account
3. Navigate to API keys tab
4. Copy your API key
5. Add to `NEXT_PUBLIC_OPENWEATHER_API_KEY`

**Free Tier:** 1,000 calls/day, 60 calls/minute

### YouTube Data API

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable YouTube Data API v3
4. Create credentials (API Key)
5. Add to `YOUTUBE_API_KEY`

**Free Tier:** 10,000 units per day

## 🚀 Running the Application

### Install Dependencies

```bash
npm install
```

### Development Mode

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

## 📡 API Endpoints Documentation

### 1. GET /api/weather
**Description:** Fetch all weather search records

**Response:**
```json
[
  {
    "id": "uuid",
    "location_name": "New York, NY, USA",
    "start_date": "2024-01-01",
    "end_date": "2024-01-05",
    "weather_data": { ... },
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-01T00:00:00Z"
  }
]
```

### 2. POST /api/weather
**Description:** Create a new weather search record

**Request Body:**
```json
{
  "location_name": "New York",
  "start_date": "2024-01-01",
  "end_date": "2024-01-05"
}
```

**Validation:**
- All fields required
- Date format: YYYY-MM-DD
- Start date must be ≤ end date
- Location validated via Mapbox Geocoding

**Response:** Created record with weather data

### 3. GET /api/weather/[id]
**Description:** Fetch a single weather search record

**Response:** Single weather record object

### 4. PUT /api/weather/[id]
**Description:** Update an existing weather search record

**Request Body:**
```json
{
  "location_name": "Los Angeles",
  "start_date": "2024-02-01",
  "end_date": "2024-02-05"
}
```

**Features:**
- Re-validates location via Mapbox
- Re-fetches weather data from OpenWeatherMap
- Updates all fields including weather_data

### 5. DELETE /api/weather/[id]
**Description:** Delete a weather search record

**Response:** Success message

### 6. GET /api/weather/export/[format]
**Description:** Export weather data

**Formats:** `json` or `csv`

**Response:** Downloadable file

## 🎨 Frontend Features

### 1. Dynamic Search with Date Range

- **Location Input:** Supports city names, zip codes, landmarks, and GPS coordinates
- **Date Range Selection:** Start and end date pickers
- **Real-time Validation:** Client-side validation before API calls
- **Smart Search:** Mapbox Geocoding validates location existence

### 2. 5-Day Forecast Display

- **Grid Layout:** Beautiful card-based display
- **Detailed Information:** Temperature, conditions, wind speed, humidity
- **Visual Icons:** Weather condition icons from OpenWeatherMap
- **Responsive Design:** Adapts to all screen sizes

### 3. Saved Queries History

- **Dashboard View:** Modal overlay with all saved searches
- **CRUD Operations:** View, Edit, Delete each record
- **Edit Functionality:** Inline editing with validation
- **Timestamps:** Shows created and updated dates

### 4. Data Export

- **JSON Export:** Full data structure preservation
- **CSV Export:** Tabular format for spreadsheet applications
- **One-Click Download:** Automatic file generation and download

### 5. Error Handling UI

- **Toast Notifications:** Non-intrusive error messages
- **Visual Distinction:** Color-coded error states
- **Specific Messages:** Clear error descriptions for:
  - Location not found (404)
  - API failures/timeouts
  - Invalid date ranges
  - Missing required fields

## ⚠️ Error Handling

### Client-Side Validation

1. **Location Validation:**
   - Required field check
   - Empty string validation
   - Toast error messages

2. **Date Range Validation:**
   - Required field check
   - Date format validation (YYYY-MM-DD)
   - Logical validation (start ≤ end)
   - Toast error messages

### Server-Side Validation

1. **API Key Validation:**
   - Checks for missing environment variables
   - Returns 500 error with clear message

2. **Location Validation:**
   - Mapbox Geocoding API validation
   - Returns 404 if location not found
   - Handles API rate limits (429)

3. **Date Range Validation:**
   - Server-side date parsing
   - Logical validation
   - Returns 400 with specific error message

4. **API Error Handling:**
   - Try-catch blocks for all async operations
   - Specific status codes (401, 429, 404, 500)
   - Detailed error messages
   - Console logging for debugging

### Error Messages

- **Missing Fields:** "Location name, start date, and end date are required"
- **Invalid Date Format:** "Invalid date format. Use YYYY-MM-DD format."
- **Invalid Date Range:** "Start date must be before or equal to end date"
- **Location Not Found:** "Location not found. Please check the location name and try again."
- **API Credentials:** "Invalid API credentials"
- **Rate Limit:** "API rate limit exceeded. Please try again later."
- **General Error:** "Failed to create weather record. Please try again."

## 📝 File Structure

```
Weather_App/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── weather/
│   │   │       ├── route.ts              # GET all, POST create
│   │   │       ├── [id]/
│   │   │       │   └── route.ts          # GET one, PUT update, DELETE
│   │   │       └── export/
│   │   │           └── [format]/
│   │   │               └── route.ts      # Export JSON/CSV
│   │   ├── page.tsx                       # Main page component
│   │   ├── layout.tsx                     # Root layout
│   │   └── globals.css                    # Global styles
│   ├── components/
│   │   ├── WeatherSearch.tsx              # Search with date range
│   │   ├── HistoryPanel.tsx               # CRUD history management
│   │   ├── WeatherCard.tsx                # Current weather display
│   │   ├── ForecastCard.tsx               # 5-day forecast
│   │   └── GoogleMap.tsx                  # Map display
│   └── lib/
│       ├── supabase.ts                    # Supabase client
│       └── utils.ts                       # Utility functions
├── supabase-schema.sql                    # Database schema
├── .env.example                           # Environment variables template
├── .env.local                             # Your actual environment variables
└── package.json                           # Dependencies
```

## 🔍 Testing the Application

### Test Location Validation

1. Enter an invalid location (e.g., "NonExistentCity123")
2. Should see error: "Location not found"

### Test Date Range Validation

1. Set start date after end date
2. Should see error: "Start date must be before or equal to end date"

### Test CRUD Operations

1. **Create:** Search for a location with valid date range
2. **Read:** Open history panel to view saved records
3. **Update:** Edit a record and save changes
4. **Delete:** Remove a record from history

### Test Export

1. Click "Export JSON" or "Export CSV"
2. File should download automatically
3. Verify file contents match displayed data

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error:**
   - Verify NEXT_PUBLIC_SUPABASE_URL is correct
   - Check NEXT_PUBLIC_SUPABASE_ANON_KEY is valid
   - Ensure database schema is created

2. **Mapbox Geocoding Error:**
   - Verify NEXT_PUBLIC_MAPBOX_TOKEN is valid
   - Check API key hasn't expired
   - Ensure you haven't exceeded rate limits

3. **OpenWeatherMap Error:**
   - Verify NEXT_PUBLIC_OPENWEATHER_API_KEY is valid
   - Check API key is activated
   - Ensure you haven't exceeded daily limits

4. **Build Errors:**
   - Run `npm install` to ensure dependencies
   - Clear Next.js cache: `rm -rf .next`
   - Check Node.js version (should be 18+)

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- [OpenWeatherMap API](https://openweathermap.org/api)
- [Tailwind CSS](https://tailwindcss.com/docs)

## 🎯 Next Steps

1. Set up all API keys in `.env.local`
2. Run the database schema in Supabase
3. Install dependencies with `npm install`
4. Start development server with `npm run dev`
5. Test all features thoroughly
6. Deploy to production when ready

---

**Note:** This implementation uses Next.js API routes instead of a separate Express backend, which provides better performance and simpler deployment while maintaining all requested functionality.
