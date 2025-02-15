export interface Tenant {
  id: string;
  email: string;
  phone: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  created_at: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  county: string;
  city: string;
  propertyType: 'apartment' | 'house' | 'room' | 'commercial';
  numberOfUnits: number;
  amenities: string[];
  created_at: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  status: 'available' | 'occupied' | 'maintenance';
  monthlyRent: number;
  created_at: string;
}