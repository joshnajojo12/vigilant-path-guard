/*
  # Women's Safety App Database Schema

  ## Overview
  Complete database schema for emergency detection, alerts, buddy system, and safe path tracking.

  ## Tables Created
  
  ### 1. profiles
  - `id` (uuid, references auth.users)
  - `phone_number` (text) - Emergency contact number
  - `secret_code` (text) - User's secret emergency code
  - `is_active` (boolean) - Profile active status
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. emergency_alerts
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `latitude` (numeric) - Location coordinates
  - `longitude` (numeric)
  - `trigger_reason` (text) - Why alert was triggered
  - `sensor_data` (jsonb) - All sensor readings at trigger time
  - `whatsapp_sent` (boolean) - Alert delivery status
  - `whatsapp_error` (text) - Any delivery errors
  - `created_at` (timestamptz)

  ### 3. sensor_thresholds
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `voice_sensitivity` (numeric) - Voice detection threshold
  - `motion_threshold` (numeric) - Motion detection threshold
  - `light_change_threshold` (numeric) - Light detection threshold
  - `sound_threshold` (numeric) - Sound level threshold
  - `movement_threshold` (numeric) - Accelerometer threshold
  - `confirmation_window_seconds` (integer) - Multi-sensor window
  - `sensors_required` (integer) - Minimum sensors to trigger
  - `updated_at` (timestamptz)

  ### 4. buddy_connections
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `buddy_id` (uuid, references profiles)
  - `status` (text) - pending/accepted/blocked
  - `last_location_lat` (numeric)
  - `last_location_lng` (numeric)
  - `last_seen` (timestamptz)
  - `created_at` (timestamptz)

  ### 5. dangerous_zones
  - `id` (uuid, primary key)
  - `latitude` (numeric)
  - `longitude` (numeric)
  - `radius_meters` (integer)
  - `danger_level` (integer) - 1-10 scale
  - `reason` (text) - Crime data, user reports, etc.
  - `reported_by` (uuid, references profiles)
  - `verified` (boolean)
  - `created_at` (timestamptz)

  ### 6. safe_paths
  - `id` (uuid, primary key)
  - `user_id` (uuid, references profiles)
  - `start_lat` (numeric)
  - `start_lng` (numeric)
  - `end_lat` (numeric)
  - `end_lng` (numeric)
  - `path_data` (jsonb) - Route waypoints and safety scores
  - `danger_zones_avoided` (integer)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can only access their own data
  - Buddy connections require mutual consent
  - Emergency alerts are private to user
  - Dangerous zones can be read by all, created by authenticated users
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number text,
  secret_code text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Create emergency_alerts table
CREATE TABLE IF NOT EXISTS emergency_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  trigger_reason text NOT NULL,
  sensor_data jsonb DEFAULT '{}'::jsonb,
  whatsapp_sent boolean DEFAULT false,
  whatsapp_error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON emergency_alerts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own alerts"
  ON emergency_alerts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create sensor_thresholds table
CREATE TABLE IF NOT EXISTS sensor_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  voice_sensitivity numeric DEFAULT 0.7,
  motion_threshold numeric DEFAULT 0.5,
  light_change_threshold numeric DEFAULT 0.3,
  sound_threshold numeric DEFAULT 0.8,
  movement_threshold numeric DEFAULT 0.6,
  confirmation_window_seconds integer DEFAULT 5,
  sensors_required integer DEFAULT 2,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sensor_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own thresholds"
  ON sensor_thresholds FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own thresholds"
  ON sensor_thresholds FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own thresholds"
  ON sensor_thresholds FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create buddy_connections table
CREATE TABLE IF NOT EXISTS buddy_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  buddy_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  last_location_lat numeric,
  last_location_lng numeric,
  last_seen timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, buddy_id)
);

ALTER TABLE buddy_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON buddy_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = buddy_id);

CREATE POLICY "Users can create connections"
  ON buddy_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own connections"
  ON buddy_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = buddy_id)
  WITH CHECK (auth.uid() = user_id OR auth.uid() = buddy_id);

CREATE POLICY "Users can delete own connections"
  ON buddy_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create dangerous_zones table
CREATE TABLE IF NOT EXISTS dangerous_zones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_meters integer DEFAULT 500,
  danger_level integer DEFAULT 5 CHECK (danger_level BETWEEN 1 AND 10),
  reason text,
  reported_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dangerous_zones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view dangerous zones"
  ON dangerous_zones FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can report zones"
  ON dangerous_zones FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Create safe_paths table
CREATE TABLE IF NOT EXISTS safe_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  start_lat numeric NOT NULL,
  start_lng numeric NOT NULL,
  end_lat numeric NOT NULL,
  end_lng numeric NOT NULL,
  path_data jsonb DEFAULT '{}'::jsonb,
  danger_zones_avoided integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE safe_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own paths"
  ON safe_paths FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own paths"
  ON safe_paths FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_user_id ON emergency_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_created_at ON emergency_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_buddy_connections_user_id ON buddy_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_buddy_connections_buddy_id ON buddy_connections(buddy_id);
CREATE INDEX IF NOT EXISTS idx_dangerous_zones_location ON dangerous_zones(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_safe_paths_user_id ON safe_paths(user_id);