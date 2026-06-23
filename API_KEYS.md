# API Keys and Environment Variables Setup

## Complete List of Required External API Keys/Credentials

### 1. OpenWeatherMap API Key
- **Purpose**: Fetch current weather data, 5-day forecasts, and geocoding
- **Required**: YES (Application cannot function without this)
- **Usage Location**: Server-side API routes only
- **Environment Variable**: `OPENWEATHER_API_KEY`
- **Free Tier**: 1,000 calls/day (sufficient for development and testing)
- **How to Obtain**:
  1. Visit https://openweathermap.org/api
  2. Sign up for a free account
  3. Navigate to API Keys section in your account
  4. Copy your API key
- **Cost**: Free tier available, paid plans start at $40/month for higher limits

### 2. Google Maps API Key
- **Purpose**: Display embedded interactive maps for searched locations
- **Required**: OPTIONAL (Application works without it, maps won't display)
- **Usage Location**: Client-side components
- **Environment Variable**: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- **Free Tier**: $200 free credit/month (generous for development)
- **How to Obtain**:
  1. Go to Google Cloud Console (https://console.cloud.google.com)
  2. Create a new project or select existing one
  3. Navigate to APIs & Services > Library
  4. Search for "Maps JavaScript API" and enable it
  5. Go to APIs & Services > Credentials
  6. Click "Create Credentials" > "API Key"
  7. Restrict the key (recommended):
     - Application restrictions: HTTP referrers (your domain)
     - API restrictions: Maps JavaScript API only
- **Cost**: Free tier available, pay-as-you-go after credit exhausted

### 3. YouTube Data API v3 Key
- **Purpose**: Fetch travel/informational videos about searched locations
- **Required**: OPTIONAL (Application works without it, videos won't display)
- **Usage Location**: Server-side API routes only
- **Environment Variable**: `YOUTUBE_API_KEY`
- **Free Tier**: 10,000 units/day (sufficient for development)
- **How to Obtain**:
  1. Go to Google Cloud Console (https://console.cloud.google.com)
  2. Create a new project or select existing one
  3. Navigate to APIs & Services > Library
  4. Search for "YouTube Data API v3" and enable it
  5. Go to APIs & Services > Credentials
  6. Click "Create Credentials" > "API Key"
  7. Restrict the key (recommended):
     - Application restrictions: None (server-side)
     - API restrictions: YouTube Data API v3 only
- **Cost**: Free tier available, pay-as-you-go after quota exhausted

### 4. PostgreSQL Database Connection String
- **Purpose**: Connect to PostgreSQL database for data persistence
- **Required**: YES (Application cannot function without database)
- **Usage Location**: Server-side Prisma ORM only
- **Environment Variable**: `DATABASE_URL`
- **Format**: `postgresql://username:password@host:port/database?schema=public`
- **Example**: `postgresql://postgres:password@localhost:5432/weather_app?schema=public`
- **How to Set Up**:
  1. Install PostgreSQL locally or use a cloud provider (Supabase, Neon, Railway)
  2. Create a new database named `weather_app`
  3. Create a user with appropriate permissions
  4. Construct the connection string with your credentials
- **Cost**: Free for local development, cloud providers have free tiers

---

## Complete .env.local Template

Copy the following content into a file named `.env.local` in your project root directory:

```env
# ============================================================
# DATABASE CONFIGURATION
# ============================================================
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database?schema=public
# Example: postgresql://postgres:mysecretpassword@localhost:5432/weather_app?schema=public
DATABASE_URL="postgresql://username:password@localhost:5432/weather_app?schema=public"

# ============================================================
# OPENWEATHERMAP API (REQUIRED)
# ============================================================
# Get your free API key from: https://openweathermap.org/api
# Free tier: 1,000 calls/day
# This key is used server-side only
OPENWEATHER_API_KEY="your_openweather_api_key_here"

# ============================================================
# GOOGLE MAPS API (OPTIONAL)
# ============================================================
# Get your API key from: https://console.cloud.google.com
# Enable: Maps JavaScript API
# Free tier: $200 credit/month
# This key is used client-side, hence the NEXT_PUBLIC_ prefix
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="your_google_maps_api_key_here"

# ============================================================
# YOUTUBE DATA API (OPTIONAL)
# ============================================================
# Get your API key from: https://console.cloud.google.com
# Enable: YouTube Data API v3
# Free tier: 10,000 units/day
# This key is used server-side only
YOUTUBE_API_KEY="your_youtube_api_key_here"
```

---

## Where to Place the .env.local File

### Exact Location
- **File Path**: `c:\Users\elmohandes\Desktop\Weather_App\.env.local`
- **Directory Level**: Same directory as `package.json`
- **File Name**: Exactly `.env.local` (note the dot at the beginning)

### Visual Representation
```
Weather_App/
├── .env.local              ← PLACE THIS FILE HERE
├── .env.example
├── .gitignore
├── package.json
├── next.config.js
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
└── README.md
```

### Important Notes
- The `.env.local` file is **automatically git-ignored** by the `.gitignore` file
- **Never commit** `.env.local` to version control
- **Never share** your API keys publicly
- Use different API keys for development and production environments

---

## How to Safely Reference Keys in Code

### Server-Side (API Routes)
For keys used in server-side code (API routes), reference them directly:

```typescript
// Example: src/app/api/weather/search/route.ts
const apiKey = process.env.OPENWEATHER_API_KEY

if (!apiKey) {
  return NextResponse.json(
    { error: 'API key not configured' },
    { status: 500 }
  )
}
```

**Server-side keys** (no prefix required):
- `DATABASE_URL`
- `OPENWEATHER_API_KEY`
- `YOUTUBE_API_KEY`

### Client-Side (React Components)
For keys used in client-side components, you MUST prefix with `NEXT_PUBLIC_`:

```typescript
// Example: src/components/GoogleMap.tsx
const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
```

**Client-side keys** (requires NEXT_PUBLIC_ prefix):
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`

### Why the Prefix?
Next.js automatically exposes environment variables prefixed with `NEXT_PUBLIC_` to the browser. Variables without this prefix are only available on the server for security reasons.

---

## Security Best Practices

### 1. API Key Restrictions
**Google Maps API**:
- Set application restrictions (HTTP referrers)
- Set API restrictions (Maps JavaScript API only)
- Rotate keys if compromised

**YouTube API**:
- Set API restrictions (YouTube Data API v3 only)
- Set application restrictions (IP addresses if possible)
- Monitor usage regularly

**OpenWeatherMap API**:
- Monitor usage to stay within free tier limits
- Consider IP whitelisting if API supports it

### 2. Environment-Specific Keys
- Use separate API keys for development, staging, and production
- Never use production keys in development
- Rotate keys periodically

### 3. Database Security
- Use strong passwords for database user
- Restrict database user to minimum required permissions
- Use SSL/TLS for database connections in production
- Regular database backups

### 4. Git Safety
- Ensure `.env.local` is in `.gitignore`
- Use `.env.example` as a template for team members
- Never accidentally commit real keys
- Use git-secrets or similar tools to prevent key leaks

---

## Troubleshooting API Key Issues

### OpenWeatherMap API Not Working
1. Verify the key is correct in `.env.local`
2. Check if you've exceeded the free tier limit (1,000 calls/day)
3. Ensure the key is enabled for the correct APIs
4. Check the OpenWeatherMap status page for outages

### Google Maps Not Displaying
1. Ensure the key has `NEXT_PUBLIC_` prefix
2. Verify Maps JavaScript API is enabled in Google Cloud Console
3. Check if you've set up HTTP referrer restrictions correctly
4. Ensure you haven't exceeded the $200 free credit

### YouTube Videos Not Loading
1. Verify the key is correct in `.env.local`
2. Ensure YouTube Data API v3 is enabled
3. Check if you've exceeded the 10,000 units/day quota
4. Verify the API key has the correct restrictions

### Database Connection Failing
1. Verify PostgreSQL is running
2. Check the connection string format in `.env.local`
3. Ensure the database user has necessary permissions
4. Verify the database exists and is accessible

---

## Quick Setup Checklist

- [ ] Create `.env.local` file in project root
- [ ] Add PostgreSQL connection string to `DATABASE_URL`
- [ ] Add OpenWeatherMap API key to `OPENWEATHER_API_KEY`
- [ ] (Optional) Add Google Maps API key to `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
- [ ] (Optional) Add YouTube API key to `YOUTUBE_API_KEY`
- [ ] Run `npx prisma generate` to generate Prisma client
- [ ] Run `npx prisma migrate dev --name init` to set up database
- [ ] Run `npm run dev` to start the development server
- [ ] Open http://localhost:3000 in your browser

---

## Additional Resources

- [OpenWeatherMap API Documentation](https://openweathermap.org/api)
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [YouTube Data API Documentation](https://developers.google.com/youtube/v3)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Prisma Documentation](https://www.prisma.io/docs)
