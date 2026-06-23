# Weather Application

A complete, production-ready Weather Application built with Next.js, TypeScript, Tailwind CSS, and PostgreSQL. Features real-time weather data, 5-day forecasts, geolocation, Google Maps integration, YouTube video suggestions, and full CRUD operations for search history.

## Features

### Frontend & UI/UX
- **Modern Design**: Clean, professional UI with Tailwind CSS
- **Smooth Animations**: Subtle fade-in and transition effects using Framer Motion
- **Flexible Search**: Search by city name, town, zip/postal code, GPS coordinates, or landmarks
- **Current Location**: "Use Current Location" button using browser Geolocation API
- **Weather Display**: Dynamic weather icons and clean typography
- **5-Day Forecast**: Beautifully organized horizontal grid display
- **Error Handling**: Graceful toast notifications for errors

### Backend & Database
- **PostgreSQL Database**: Full persistence with Prisma ORM
- **CRUD Operations**: Create, Read, Update, Delete weather records
- **Data Export**: Export history to JSON or CSV formats
- **Input Validation**: Comprehensive validation for all operations

### API Integrations
- **OpenWeatherMap API**: Real-time weather data and forecasts
- **Google Maps API**: Embedded location maps
- **YouTube API**: Travel/informational videos about locations

### Branding
- Developer name prominently displayed
- PM Accelerator informational section

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner (toast library)
- **HTTP Client**: Axios
- **Date Formatting**: date-fns

## Prerequisites

- Node.js 18+ installed
- PostgreSQL database running locally or accessible via connection string
- API keys for external services (see below)

## Installation

1. **Clone or navigate to the project directory**:
   ```bash
   cd Weather_App
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   - Copy `.env.example` to `.env.local`
   - Fill in all required API keys (see API Keys section below)

4. **Set up the database**:
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run database migrations
   npx prisma migrate dev --name init
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to `http://localhost:3000`

## API Keys Required

### 1. OpenWeatherMap API Key
- **Purpose**: Fetch weather data and forecasts
- **How to get**: Sign up at https://openweathermap.org/api
- **Free tier**: 1,000 calls/day (sufficient for development)
- **Required**: Yes

### 2. Google Maps API Key
- **Purpose**: Display embedded maps for searched locations
- **How to get**: 
  1. Go to Google Cloud Console
  2. Create a project or select existing
  3. Enable Maps JavaScript API
  4. Create API key with appropriate restrictions
- **Free tier**: $200 free credit/month (generous for development)
- **Required**: Optional (app works without it, maps won't display)

### 3. YouTube Data API Key
- **Purpose**: Fetch travel/informational videos about locations
- **How to get**:
  1. Go to Google Cloud Console
  2. Create a project or select existing
  3. Enable YouTube Data API v3
  4. Create API key
- **Free tier**: 10,000 units/day (sufficient for development)
- **Required**: Optional (app works without it, videos won't display)

### 4. PostgreSQL Database URL
- **Purpose**: Database connection string
- **Format**: `postgresql://username:password@localhost:5432/database_name`
- **Required**: Yes

## Environment Variables Template

Create a `.env.local` file in the project root with the following content:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/weather_app?schema=public"

# OpenWeatherMap API
OPENWEATHER_API_KEY="your_openweather_api_key_here"

# Google Maps API
GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# YouTube API
YOUTUBE_API_KEY="your_youtube_api_key_here"
```

### Where to place the `.env.local` file:
- **Location**: Project root directory (same level as `package.json`)
- **Example path**: `c:\Users\elmohandes\Desktop\Weather_App\.env.local`
- **Important**: This file is git-ignored by default and should never be committed

### How to reference keys in code:

**Backend (API Routes)**:
```typescript
const apiKey = process.env.OPENWEATHER_API_KEY
```

**Frontend (Client Components)**:
For client-side access, prefix with `NEXT_PUBLIC_`:
```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_key_here"
```

```typescript
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

**Note**: Only the Google Maps key needs `NEXT_PUBLIC_` prefix since it's used in client components. Other keys are used server-side only.

## Project Structure

```
Weather_App/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── weather/
│   │   │   │   ├── route.ts           # GET/POST weather records
│   │   │   │   ├── [id]/route.ts      # PUT/DELETE specific record
│   │   │   │   ├── current/route.ts   # POST for current location
│   │   │   │   ├── search/route.ts    # POST for location search
│   │   │   │   └── export/[format]/   # GET for JSON/CSV export
│   │   │   └── youtube/
│   │   │       └── route.ts           # POST for YouTube videos
│   │   ├── globals.css               # Global styles
│   │   ├── layout.tsx                # Root layout
│   │   └── page.tsx                  # Main page
│   ├── components/
│   │   ├── Branding.tsx              # Developer & PM Accelerator info
│   │   ├── ForecastCard.tsx          # 5-day forecast display
│   │   ├── GoogleMap.tsx             # Google Maps integration
│   │   ├── HistoryPanel.tsx          # CRUD history management
│   │   ├── WeatherCard.tsx           # Current weather display
│   │   ├── WeatherSearch.tsx         # Search component
│   │   └── YouTubeVideos.tsx         # YouTube video integration
│   └── lib/
│       ├── prisma.ts                 # Prisma client singleton
│       └── utils.ts                  # Utility functions
├── .env.example                      # Environment variables template
├── .env.local                        # Your actual environment variables (create this)
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

## Database Schema

The application uses a single table `weather_records` with the following structure:

```prisma
model WeatherRecord {
  id          String   @id @default(uuid())
  location    String
  latitude    Float?
  longitude   Float?
  date        DateTime
  temperature Float
  humidity    Int
  description String
  windSpeed   Float?
  pressure    Int?
  feelsLike   Float?
  icon        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## API Endpoints

### Weather Records
- `GET /api/weather` - Get all weather records
- `POST /api/weather` - Create a new weather record
- `GET /api/weather/[id]` - Get a specific record
- `PUT /api/weather/[id]` - Update a specific record
- `DELETE /api/weather/[id]` - Delete a specific record

### Weather Data
- `POST /api/weather/search` - Search weather by location
- `POST /api/weather/current` - Get weather by coordinates

### Export
- `GET /api/weather/export/json` - Export all records as JSON
- `GET /api/weather/export/csv` - Export all records as CSV

### YouTube
- `POST /api/youtube` - Get YouTube videos for a location

## Usage

### Searching for Weather
1. Enter a location (city, zip code, or landmark) in the search bar
2. Click "Search" or press Enter
3. View current weather, 5-day forecast, map, and videos

### Using Current Location
1. Click the "Current" button
2. Allow browser location access when prompted
3. View weather for your current location

### Managing History
1. Click the history button (bottom-right corner)
2. View all saved weather searches
3. Edit or delete records as needed
4. Export data to JSON or CSV

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

### Database Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create and run migrations
- `npx prisma studio` - Open Prisma Studio (database GUI)
- `npx prisma db push` - Push schema changes to database

## Production Deployment

1. **Set production environment variables** on your hosting platform
2. **Build the application**:
   ```bash
   npm run build
   ```
3. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   ```
4. **Start the production server**:
   ```bash
   npm start
   ```

## Security Notes

- Never commit `.env.local` to version control
- Use environment-specific API keys (separate dev/prod keys)
- Implement rate limiting for API endpoints in production
- Add authentication for history management in production
- Restrict API keys in Google Cloud Console (domain referrer, IP restrictions)

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format in `.env.local`
- Verify database user has necessary permissions

### API Key Errors
- Verify all API keys are correctly set in `.env.local`
- Check API key quotas and limits
- Ensure API keys are enabled in respective consoles

### Build Errors
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Ensure Node.js version is 18+

## License

This project is built as a technical assessment for PM Accelerator.

## Developer

Built by PM Accelerator Developer

## About PM Accelerator

PM Accelerator is a premier program designed to accelerate the careers of aspiring and current Product Managers. Through comprehensive training, mentorship, and hands-on project experience, participants develop the skills needed to excel in product management roles at top tech companies. The program focuses on practical application, industry best practices, and building a strong professional network.
