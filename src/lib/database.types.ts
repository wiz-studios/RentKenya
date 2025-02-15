export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'landlord' | 'tenant'
          first_name: string | null
          last_name: string | null
          phone: string | null
          national_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'landlord' | 'tenant'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          national_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'landlord' | 'tenant'
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          national_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          landlord_id: string | null
          submitted_by: string | null
          name: string
          property_type: 'apartment' | 'house' | 'room' | 'commercial'
          address: string
          county: string
          city: string
          amenities: string[]
          monthly_rent: number
          security_deposit: number
          available_from: string | null
          minimum_lease_months: number
          utilities_included: string[]
          additional_fees: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          landlord_id?: string | null
          submitted_by?: string | null
          name: string
          property_type: 'apartment' | 'house' | 'room' | 'commercial'
          address: string
          county: string
          city: string
          amenities?: string[]
          monthly_rent: number
          security_deposit: number
          available_from?: string | null
          minimum_lease_months?: number
          utilities_included?: string[]
          additional_fees?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          landlord_id?: string | null
          submitted_by?: string | null
          name?: string
          property_type?: 'apartment' | 'house' | 'room' | 'commercial'
          address?: string
          county?: string
          city?: string
          amenities?: string[]
          monthly_rent?: number
          security_deposit?: number
          available_from?: string | null
          minimum_lease_months?: number
          utilities_included?: string[]
          additional_fees?: Json
          created_at?: string
          updated_at?: string
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string
          url: string
          caption: string | null
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          url: string
          caption?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          url?: string
          caption?: string | null
          display_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      rental_applications: {
        Row: {
          id: string
          property_id: string
          applicant_id: string
          status: string
          monthly_income: number
          employment_status: string
          current_address: string
          move_in_date: string
          lease_term_months: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          applicant_id: string
          status?: string
          monthly_income: number
          employment_status: string
          current_address: string
          move_in_date: string
          lease_term_months?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          applicant_id?: string
          status?: string
          monthly_income?: number
          employment_status?: string
          current_address?: string
          move_in_date?: string
          lease_term_months?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      property_inquiries: {
        Row: {
          id: string
          property_id: string
          sender_id: string
          recipient_id: string
          subject: string
          message: string
          read: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          sender_id: string
          recipient_id: string
          subject: string
          message: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          sender_id?: string
          recipient_id?: string
          subject?: string
          message?: string
          read?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      units: {
        Row: {
          id: string
          property_id: string
          unit_number: string
          status: 'available' | 'occupied' | 'maintenance'
          monthly_rent: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          property_id: string
          unit_number: string
          status?: 'available' | 'occupied' | 'maintenance'
          monthly_rent: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          property_id?: string
          unit_number?: string
          status?: 'available' | 'occupied' | 'maintenance'
          monthly_rent?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leases: {
        Row: {
          id: string
          unit_id: string
          tenant_id: string
          start_date: string
          end_date: string
          monthly_rent: number
          security_deposit: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          unit_id: string
          tenant_id: string
          start_date: string
          end_date: string
          monthly_rent: number
          security_deposit: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          unit_id?: string
          tenant_id?: string
          start_date?: string
          end_date?: string
          monthly_rent?: number
          security_deposit?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      property_type: 'apartment' | 'house' | 'room' | 'commercial'
      unit_status: 'available' | 'occupied' | 'maintenance'
      user_role: 'landlord' | 'tenant'
    }
  }
}