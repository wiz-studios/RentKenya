/*
  # Add Property Features

  1. New Tables
    - `property_images`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `url` (text)
      - `caption` (text)
      - `display_order` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `rental_applications`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `applicant_id` (uuid, foreign key)
      - `status` (enum: pending, approved, rejected)
      - `monthly_income` (numeric)
      - `employment_status` (text)
      - `current_address` (text)
      - `move_in_date` (date)
      - `lease_term_months` (integer)
      - `notes` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `property_inquiries`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `sender_id` (uuid, foreign key)
      - `recipient_id` (uuid, foreign key)
      - `subject` (text)
      - `message` (text)
      - `read` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all new tables
    - Add policies for authenticated users to manage their own data
    - Add policies for property owners to view related data
*/

-- Create property_images table
CREATE TABLE property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  caption text,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create rental_applications table
CREATE TABLE rental_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  applicant_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  monthly_income numeric(10,2) NOT NULL,
  employment_status text NOT NULL,
  current_address text NOT NULL,
  move_in_date date NOT NULL,
  lease_term_months integer NOT NULL DEFAULT 12,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_inquiries table
CREATE TABLE property_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_inquiries ENABLE ROW LEVEL SECURITY;

-- Property Images Policies
CREATE POLICY "Users can view property images"
  ON property_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Property owners can manage images"
  ON property_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND (properties.landlord_id = auth.uid() OR properties.submitted_by = auth.uid())
    )
  );

-- Rental Applications Policies
CREATE POLICY "Users can view their own applications"
  ON rental_applications FOR SELECT
  TO authenticated
  USING (
    applicant_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rental_applications.property_id
      AND (properties.landlord_id = auth.uid() OR properties.submitted_by = auth.uid())
    )
  );

CREATE POLICY "Users can submit applications"
  ON rental_applications FOR INSERT
  TO authenticated
  WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "Users can update their pending applications"
  ON rental_applications FOR UPDATE
  TO authenticated
  USING (
    (applicant_id = auth.uid() AND status = 'pending') OR
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = rental_applications.property_id
      AND (properties.landlord_id = auth.uid() OR properties.submitted_by = auth.uid())
    )
  );

-- Property Inquiries Policies
CREATE POLICY "Users can view their own inquiries"
  ON property_inquiries FOR SELECT
  TO authenticated
  USING (
    sender_id = auth.uid() OR
    recipient_id = auth.uid()
  );

CREATE POLICY "Users can send inquiries"
  ON property_inquiries FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Recipients can mark messages as read"
  ON property_inquiries FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_property_images_updated_at
  BEFORE UPDATE ON property_images
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_rental_applications_updated_at
  BEFORE UPDATE ON rental_applications
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_property_inquiries_updated_at
  BEFORE UPDATE ON property_inquiries
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column();

-- Add indexes
CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_display_order ON property_images(display_order);
CREATE INDEX idx_rental_applications_property_id ON rental_applications(property_id);
CREATE INDEX idx_rental_applications_applicant_id ON rental_applications(applicant_id);
CREATE INDEX idx_rental_applications_status ON rental_applications(status);
CREATE INDEX idx_property_inquiries_property_id ON property_inquiries(property_id);
CREATE INDEX idx_property_inquiries_sender_id ON property_inquiries(sender_id);
CREATE INDEX idx_property_inquiries_recipient_id ON property_inquiries(recipient_id);
CREATE INDEX idx_property_inquiries_read ON property_inquiries(read);