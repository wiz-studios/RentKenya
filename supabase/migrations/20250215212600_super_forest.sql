/*
  # Update rental applications and add site visit scheduling

  1. Changes
    - Remove salary and address fields from rental applications
    - Add site visit scheduling to property inquiries
    - Add image limit enforcement via trigger

  2. Security
    - Maintain existing RLS policies
    - Add trigger for image limit enforcement
*/

-- Modify rental_applications table
ALTER TABLE rental_applications
DROP COLUMN monthly_income,
DROP COLUMN current_address,
ADD COLUMN preferred_contact_method text NOT NULL DEFAULT 'email',
ADD COLUMN phone text;

-- Add site visit scheduling to property_inquiries
ALTER TABLE property_inquiries
ADD COLUMN visit_requested boolean DEFAULT false,
ADD COLUMN preferred_visit_date date,
ADD COLUMN visit_time_slot text,
ADD COLUMN visit_status text DEFAULT 'pending' CHECK (visit_status IN ('pending', 'confirmed', 'rejected', 'completed'));

-- Create function to enforce image limit
CREATE OR REPLACE FUNCTION check_property_images_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    SELECT COUNT(*)
    FROM property_images
    WHERE property_id = NEW.property_id
  ) >= 4 THEN
    RAISE EXCEPTION 'Maximum of 4 images allowed per property';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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