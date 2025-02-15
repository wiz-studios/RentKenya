/*
  # Fix profiles RLS policies

  1. Changes
    - Add policy to allow users to create their own profile during sign up
    - Ensure policy only allows creating profile with matching user ID

  2. Security
    - Maintains existing RLS policies for viewing and updating profiles
    - Adds secure policy for profile creation
*/

-- Drop existing policies if they conflict
DROP POLICY IF EXISTS "Users can create their own profile" ON profiles;

-- Add policy for profile creation
CREATE POLICY "Users can create their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);