/*
  # Initial Schema Setup for Rental Management System

  1. New Tables
    - `profiles`
      - Extends auth.users with additional user information
      - Stores user role (landlord/tenant) and contact details
    
    - `properties`
      - Stores property information
      - Includes location, type, and amenities
      - Linked to landlord profile
    
    - `units`
      - Individual rental units within properties
      - Tracks status and rental rates
      - Connected to properties table
    
    - `leases`
      - Manages lease agreements
      - Links tenants to units
      - Tracks lease terms and payment details

  2. Security
    - Enable RLS on all tables
    - Policies for landlords to manage their properties
    - Policies for tenants to view their leases
    - Policies for profile access
*/

-- Create custom types
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'room', 'commercial');
CREATE TYPE unit_status AS ENUM ('available', 'occupied', 'maintenance');
CREATE TYPE user_role AS ENUM ('landlord', 'tenant');

-- Create profiles table
CREATE TABLE profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'tenant',
  first_name text,
  last_name text,
  phone text,
  national_id text UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create properties table
CREATE TABLE properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  property_type property_type NOT NULL,
  address text NOT NULL,
  county text NOT NULL,
  city text NOT NULL,
  amenities text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create units table
CREATE TABLE units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  unit_number text NOT NULL,
  status unit_status DEFAULT 'available',
  monthly_rent numeric(10,2) NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(property_id, unit_number)
);

-- Create leases table
CREATE TABLE leases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES units(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  monthly_rent numeric(10,2) NOT NULL,
  security_deposit numeric(10,2) NOT NULL,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (end_date > start_date)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE leases ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Landlords can manage their properties"
  ON properties FOR ALL
  USING (auth.uid() = landlord_id);

CREATE POLICY "Everyone can view properties"
  ON properties FOR SELECT
  USING (true);

-- Units policies
CREATE POLICY "Landlords can manage their units"
  ON units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = units.property_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view units"
  ON units FOR SELECT
  USING (true);

-- Leases policies
CREATE POLICY "Landlords can view their property leases"
  ON leases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON units.property_id = properties.id
      WHERE units.id = leases.unit_id
      AND properties.landlord_id = auth.uid()
    )
  );

CREATE POLICY "Tenants can view their own leases"
  ON leases FOR SELECT
  USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can manage leases for their properties"
  ON leases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM units
      JOIN properties ON units.property_id = properties.id
      WHERE units.id = leases.unit_id
      AND properties.landlord_id = auth.uid()
    )
  );

-- Create functions for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_units_updated_at
  BEFORE UPDATE ON units
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_leases_updated_at
  BEFORE UPDATE ON leases
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();