/*
  # Add rental features and update policies

  1. Changes
    - Drop existing policies first
    - Add rental-specific columns
    - Update policies for direct property submission

  2. Security
    - Maintain RLS for property access
    - Update policies for direct property submission
*/

-- First, drop all existing policies for properties
DROP POLICY IF EXISTS "Everyone can view properties" ON properties;
DROP POLICY IF EXISTS "Landlords can manage their properties" ON properties;
DROP POLICY IF EXISTS "Tenants can submit properties" ON properties;
DROP POLICY IF EXISTS "Tenants can view their submitted properties" ON properties;
DROP POLICY IF EXISTS "Tenants can update their pending submissions" ON properties;

-- Add rental-specific columns
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS monthly_rent numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_deposit numeric(10,2) NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS available_from date,
ADD COLUMN IF NOT EXISTS minimum_lease_months integer NOT NULL DEFAULT 12,
ADD COLUMN IF NOT EXISTS utilities_included text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS additional_fees jsonb DEFAULT '{}';

-- Make landlord_id nullable and add submitted_by
ALTER TABLE properties
ALTER COLUMN landlord_id DROP NOT NULL,
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id);

-- Create new policies for direct property submission
CREATE POLICY "Anyone can submit properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Properties are viewable by all"
  ON properties FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Owners can update their properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    submitted_by = auth.uid() OR 
    landlord_id = auth.uid()
  );

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_monthly_rent ON properties(monthly_rent);
CREATE INDEX IF NOT EXISTS idx_properties_available_from ON properties(available_from);
CREATE INDEX IF NOT EXISTS idx_properties_submitted_by ON properties(submitted_by);