/*
  # Add available units count to properties

  1. Changes
    - Add total_units and available_units columns to properties table
    - Add trigger to automatically update available_units count
    - Add validation to ensure total_units is greater than 0

  2. Security
    - Maintain existing RLS policies
    - Add indexes for improved query performance
*/

-- Add unit count columns to properties
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS total_units integer NOT NULL DEFAULT 1 CHECK (total_units > 0),
ADD COLUMN IF NOT EXISTS available_units integer NOT NULL DEFAULT 1 CHECK (available_units >= 0);

-- Create function to update available units count
CREATE OR REPLACE FUNCTION update_available_units()
RETURNS TRIGGER AS $$
BEGIN
  -- Update available_units count for the property
  UPDATE properties
  SET available_units = (
    SELECT COUNT(*)
    FROM units
    WHERE property_id = NEW.property_id
    AND status = 'available'
  )
  WHERE id = NEW.property_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update available_units count
CREATE TRIGGER update_available_units_on_insert
  AFTER INSERT ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_available_units();

CREATE TRIGGER update_available_units_on_update
  AFTER UPDATE OF status ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_available_units();

CREATE TRIGGER update_available_units_on_delete
  AFTER DELETE ON units
  FOR EACH ROW
  EXECUTE FUNCTION update_available_units();

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_properties_total_units 
ON properties(total_units);

CREATE INDEX IF NOT EXISTS idx_properties_available_units 
ON properties(available_units);