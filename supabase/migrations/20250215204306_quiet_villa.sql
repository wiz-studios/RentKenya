/*
  # Add tenant property submission support

  1. Changes
    - Add `submitted_by` column to properties table to track who submitted the property
    - Add `status` column to track property verification status
    - Add `verification_notes` for admin feedback
    - Update RLS policies to allow tenants to submit properties

  2. Security
    - Enable RLS for new columns
    - Add policies for tenant property submission
    - Maintain existing landlord policies
*/

-- Add new columns to properties table
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS verification_notes text,
ADD COLUMN IF NOT EXISTS submission_date timestamptz DEFAULT now();

-- Update RLS policies for tenant property submission
CREATE POLICY "Tenants can submit properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'tenant'
    )
    AND submitted_by = auth.uid()
  );

CREATE POLICY "Tenants can view their submitted properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    submitted_by = auth.uid()
    OR landlord_id = auth.uid()
    OR status = 'approved'
  );

CREATE POLICY "Tenants can update their pending submissions"
  ON properties FOR UPDATE
  TO authenticated
  USING (
    submitted_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    submitted_by = auth.uid()
    AND status = 'pending'
  );

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_submitted_by ON properties(submitted_by);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);