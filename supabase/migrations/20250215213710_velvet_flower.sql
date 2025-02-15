/*
  # Update rental applications and property inquiries

  1. Changes
    - Remove monthly_income and current_address from rental_applications
    - Add preferred_contact_method and phone to rental_applications
    - Add site visit scheduling fields to property_inquiries
    - Add trigger for property images limit

  2. Security
    - Maintain existing RLS policies
    - Add new indexes for improved query performance
*/

-- Modify rental_applications table
ALTER TABLE rental_applications
DROP COLUMN IF EXISTS monthly_income,
DROP COLUMN IF EXISTS current_address,
ADD COLUMN IF NOT EXISTS preferred_contact_method text NOT NULL DEFAULT 'email',
ADD COLUMN IF NOT EXISTS phone text;

-- Add site visit scheduling to property_inquiries
ALTER TABLE property_inquiries
ADD COLUMN IF NOT EXISTS visit_requested boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS preferred_visit_date date,
ADD COLUMN IF NOT EXISTS visit_time_slot text,
ADD COLUMN IF NOT EXISTS visit_status text DEFAULT 'pending' CHECK (visit_status IN ('pending', 'confirmed', 'rejected', 'completed'));

-- Create function to enforce image limit
CREATE OR REPLACE FUNCTION check_property_images_limit()
RETURNS TRIGGER AS $$
DECLARE
  image_count integer;
BEGIN
  SELECT COUNT(*) INTO image_count
  FROM property_images
  WHERE property_id = NEW.property_id;
  
  IF image_count >= 4 THEN
    RAISE EXCEPTION 'Maximum of 4 images allowed per property';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS enforce_property_images_limit ON property_images;

-- Create trigger for image limit
CREATE TRIGGER enforce_property_images_limit
  BEFORE INSERT ON property_images
  FOR EACH ROW
  EXECUTE FUNCTION check_property_images_limit();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_property_inquiries_visit_status 
ON property_inquiries(visit_status);

CREATE INDEX IF NOT EXISTS idx_property_inquiries_visit_date 
ON property_inquiries(preferred_visit_date);

-- Add index for preferred contact method
CREATE INDEX IF NOT EXISTS idx_rental_applications_contact_method
ON rental_applications(preferred_contact_method);