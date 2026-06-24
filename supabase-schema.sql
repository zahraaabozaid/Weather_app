-- Weather Application Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for spatial data (coordinates)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create weather_records table with forecast support
CREATE TABLE IF NOT EXISTS weather_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  location TEXT NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  coordinates GEOMETRY(POINT, 4326),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  temperature FLOAT NOT NULL,
  humidity INTEGER NOT NULL,
  description TEXT NOT NULL,
  wind_speed FLOAT,
  pressure INTEGER,
  feels_like FLOAT,
  icon TEXT,
  forecast_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add constraints for data integrity (idempotent drops to prevent conflicts on re-run)
ALTER TABLE weather_records DROP CONSTRAINT IF EXISTS check_humidity_range;
ALTER TABLE weather_records ADD CONSTRAINT check_humidity_range CHECK (humidity >= 0 AND humidity <= 100);

ALTER TABLE weather_records DROP CONSTRAINT IF EXISTS check_temperature_range;
ALTER TABLE weather_records ADD CONSTRAINT check_temperature_range CHECK (temperature >= -100 AND temperature <= 100);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_weather_records_location ON weather_records(location);
CREATE INDEX IF NOT EXISTS idx_weather_records_date ON weather_records(date DESC);
CREATE INDEX IF NOT EXISTS idx_weather_records_created_at ON weather_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_records_latitude_longitude ON weather_records(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_weather_records_coordinates ON weather_records USING GIST(coordinates);

-- Unique index on normalised location: enforces the upsert-by-location contract
-- (the POST /api/weather handler checks by LOWER(location) before deciding to INSERT or UPDATE)
-- NOTE: Run the deduplication block below FIRST if you have existing duplicate rows.
CREATE UNIQUE INDEX IF NOT EXISTS idx_weather_records_location_unique
  ON weather_records (LOWER(TRIM(location)));

-- Enable Row Level Security (optional, recommended for production)
ALTER TABLE weather_records ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for all users" ON weather_records;
DROP POLICY IF EXISTS "Enable insert for all users" ON weather_records;
DROP POLICY IF EXISTS "Enable update for all users" ON weather_records;
DROP POLICY IF EXISTS "Enable delete for all users" ON weather_records;

-- Allow public access for development (adjust for production)
CREATE POLICY "Enable read access for all users" ON weather_records FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users"      ON weather_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users"      ON weather_records FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users"      ON weather_records FOR DELETE USING (true);

-- ============================================================
-- DEDUPLICATION CLEANUP
-- Run this block BEFORE creating the unique index above if you
-- already have duplicate location rows in the table (e.g. from
-- searches performed before the upsert fix was deployed).
--
-- It keeps the most recently-updated row for each location and
-- permanently removes the older duplicates.
-- ============================================================
/*
DELETE FROM weather_records
WHERE id NOT IN (
  SELECT DISTINCT ON (LOWER(TRIM(location))) id
  FROM weather_records
  ORDER BY LOWER(TRIM(location)), updated_at DESC NULLS LAST
);
*/

-- Add comments for documentation
COMMENT ON TABLE weather_records IS 'Stores weather data with location information, coordinates, and 5-day forecast';
COMMENT ON COLUMN weather_records.id          IS 'Unique identifier for each weather record (UUID)';
COMMENT ON COLUMN weather_records.location    IS 'Full place name returned by Mapbox geocoding (unique, case-insensitive)';
COMMENT ON COLUMN weather_records.latitude    IS 'Geographic latitude coordinate';
COMMENT ON COLUMN weather_records.longitude   IS 'Geographic longitude coordinate';
COMMENT ON COLUMN weather_records.coordinates IS 'PostGIS point geometry for spatial queries (auto-updated by trigger)';
COMMENT ON COLUMN weather_records.date        IS 'User-selected search date stored as a timezone-aware timestamp';
COMMENT ON COLUMN weather_records.temperature IS 'Current temperature in Celsius from OpenWeatherMap';
COMMENT ON COLUMN weather_records.humidity    IS 'Relative humidity percentage (0–100)';
COMMENT ON COLUMN weather_records.description IS 'Short weather condition description (e.g. "clear sky")';
COMMENT ON COLUMN weather_records.wind_speed  IS 'Wind speed in metres per second';
COMMENT ON COLUMN weather_records.pressure    IS 'Atmospheric pressure in hPa';
COMMENT ON COLUMN weather_records.feels_like  IS 'Perceived / "feels like" temperature in Celsius';
COMMENT ON COLUMN weather_records.icon        IS 'OpenWeatherMap icon code (e.g. "01d")';
COMMENT ON COLUMN weather_records.forecast_json IS '5-day / 3-hour forecast JSON payload from OpenWeatherMap /forecast endpoint';
COMMENT ON COLUMN weather_records.created_at  IS 'Timestamp when the record was first inserted';
COMMENT ON COLUMN weather_records.updated_at  IS 'Timestamp of the most recent upsert (auto-updated by trigger)';


-- Create trigger function to automatically update coordinates and updated_at timestamp
CREATE OR REPLACE FUNCTION update_weather_record_triggers()
RETURNS TRIGGER AS $$
BEGIN
    -- Update coordinates point from latitude/longitude
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
        NEW.coordinates = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
    END IF;
    
    -- Update updated_at timestamp
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists to avoid conflicts
DROP TRIGGER IF EXISTS update_weather_records_triggers ON weather_records;

-- Create trigger for weather_records table
CREATE TRIGGER update_weather_records_triggers 
    BEFORE INSERT OR UPDATE ON weather_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_weather_record_triggers();
