import React, { useState, useEffect } from 'react';
import { Building2, Search, Plus, MapPin, Home, Wifi, Car, Calendar, Clock, Wallet, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];

const UTILITIES = ['Electricity', 'Water', 'Internet', 'Gas', 'Garbage'];
const ADDITIONAL_FEES = ['Service Charge', 'Parking Fee', 'Pet Deposit'];

export default function Properties() {
  const { user, profile } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    property_type: 'apartment' as const,
    address: '',
    county: '',
    city: '',
    amenities: [] as string[],
    monthly_rent: '',
    security_deposit: '',
    available_from: '',
    minimum_lease_months: 12,
    utilities_included: [] as string[],
    additional_fees: {} as Record<string, string>,
    total_units: 1,
  });
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProperties();
    }
  }, [user]);

  useEffect(() => {
    return () => {
      images.forEach(image => URL.revokeObjectURL(image.preview));
    };
  }, [images]);

  async function fetchProperties() {
    try {
      let query = supabase
        .from('properties')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Error fetching properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    
    const newFiles = Array.from(e.target.files);
    const totalImages = images.length + newFiles.length;
    
    if (totalImages > 4) {
      setError('Maximum 4 images allowed');
      return;
    }

    const newImages = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));

    setImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  }

  function removeImage(index: number) {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  }

  async function uploadImages(propertyId: string) {
    const uploadPromises = images.map(async (image, index) => {
      try {
        const fileExt = image.file.name.split('.').pop();
        const uniqueId = Math.random().toString(36).substring(2);
        const filePath = `${propertyId}/${Date.now()}-${uniqueId}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('property-images')
          .upload(filePath, image.file, {
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        const { error: dbError } = await supabase
          .from('property_images')
          .insert([{
            property_id: propertyId,
            url: publicUrl,
            display_order: index
          }]);

        if (dbError) {
          console.error('Database error:', dbError);
          throw dbError;
        }
      } catch (error) {
        console.error('Error in upload process:', error);
        throw error;
      }
    });

    try {
      await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading images:', error);
      throw new Error('Failed to upload one or more images');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;

    try {
      setError(null);
      setUploading(true);
      const propertyData = {
        ...formData,
        submitted_by: user.id,
        monthly_rent: parseFloat(formData.monthly_rent) || 0,
        security_deposit: parseFloat(formData.security_deposit) || 0,
        additional_fees: Object.fromEntries(
          Object.entries(formData.additional_fees)
            .filter(([_, value]) => value && parseFloat(value) > 0)
            .map(([key, value]) => [key, parseFloat(value)])
        ),
      };

      const { data: property, error: propertyError } = await supabase
        .from('properties')
        .insert([propertyData])
        .select()
        .single();

      if (propertyError) throw propertyError;

      if (images.length > 0) {
        await uploadImages(property.id);
      }

      setShowAddForm(false);
      setFormData({
        name: '',
        property_type: 'apartment',
        address: '',
        county: '',
        city: '',
        amenities: [],
        monthly_rent: '',
        security_deposit: '',
        available_from: '',
        minimum_lease_months: 12,
        utilities_included: [],
        additional_fees: {},
        total_units: 1,
      });
      setImages([]);
      fetchProperties();
    } catch (err) {
      console.error('Error adding property:', err);
      setError('Failed to add property');
    } finally {
      setUploading(false);
    }
  }

  const filteredProperties = properties.filter(
    (property) =>
      property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const propertyTypeIcons = {
    apartment: Building2,
    house: Home,
    room: Building2,
    commercial: Building2,
  };

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  }

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Properties</h1>
          <p className="mt-2 text-sm text-gray-700">
            Browse available properties or list your own property for rent.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            List Property
          </button>
        </div>
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="relative flex-1 max-w-lg">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Search properties..."
            />
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {showAddForm && (
          <div className="mt-6 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">List New Property</h3>
              <form onSubmit={handleSubmit} className="mt-5 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Property Images (Max 4)
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={image.preview}
                          alt={`Preview ${index + 1}`}
                          className="h-24 w-full object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {images.length < 4 && (
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="sr-only"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="flex h-24 w-full cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white text-sm font-medium text-gray-600 hover:border-indigo-500 hover:bg-gray-50"
                        >
                          <div className="space-y-1 text-center">
                            <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                            <div className="flex text-sm text-gray-600">
                              <span>Add image</span>
                            </div>
                          </div>
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Property Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                    Property Type
                  </label>
                  <select
                    id="type"
                    value={formData.property_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        property_type: e.target.value as Property['property_type'],
                      })
                    }
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  >
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="room">Room</option>
                    <option value="commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="county" className="block text-sm font-medium text-gray-700">
                      County
                    </label>
                    <input
                      type="text"
                      id="county"
                      required
                      value={formData.county}
                      onChange={(e) => setFormData({ ...formData, county: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="monthly_rent" className="block text-sm font-medium text-gray-700">
                      Monthly Rent (KES)
                    </label>
                    <input
                      type="number"
                      id="monthly_rent"
                      required
                      min="0"
                      value={formData.monthly_rent}
                      onChange={(e) =>
                        setFormData({ ...formData, monthly_rent: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="security_deposit"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Security Deposit (KES)
                    </label>
                    <input
                      type="number"
                      id="security_deposit"
                      required
                      min="0"
                      value={formData.security_deposit}
                      onChange={(e) =>
                        setFormData({ ...formData, security_deposit: e.target.value })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="available_from" className="block text-sm font-medium text-gray-700">
                      Available From
                    </label>
                    <input
                      type="date"
                      id="available_from"
                      required
                      value={formData.available_from}
                      onChange={(e) => setFormData({ ...formData, available_from: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="minimum_lease_months"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Minimum Lease Period (Months)
                    </label>
                    <input
                      type="number"
                      id="minimum_lease_months"
                      required
                      min="1"
                      value={formData.minimum_lease_months}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          minimum_lease_months: parseInt(e.target.value) || 12,
                        })
                      }
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="total_units" className="block text-sm font-medium text-gray-700">
                    Number of Units
                  </label>
                  <input
                    type="number"
                    id="total_units"
                    required
                    min="1"
                    value={formData.total_units}
                    onChange={(e) => setFormData({ ...formData, total_units: parseInt(e.target.value) || 1 })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter the total number of units available in this property
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Amenities</label>
                  <div className="mt-2 space-y-2">
                    {['WiFi', 'Parking', 'Security', 'Water', 'Gym', 'Swimming Pool'].map(
                      (amenity) => (
                        <label key={amenity} className="inline-flex items-center mr-6">
                          <input
                            type="checkbox"
                            checked={formData.amenities.includes(amenity)}
                            onChange={(e) => {
                              const newAmenities = e.target.checked
                                ? [...formData.amenities, amenity]
                                : formData.amenities.filter((a) => a !== amenity);
                              setFormData({ ...formData, amenities: newAmenities });
                            }}
                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-sm text-gray-600">{amenity}</span>
                        </label>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Utilities Included in Rent
                  </label>
                  <div className="mt-2 space-y-2">
                    {UTILITIES.map((utility) => (
                      <label key={utility} className="inline-flex items-center mr-6">
                        <input
                          type="checkbox"
                          checked={formData.utilities_included.includes(utility)}
                          onChange={(e) => {
                            const newUtilities = e.target.checked
                              ? [...formData.utilities_included, utility]
                              : formData.utilities_included.filter((u) => u !== utility);
                            setFormData({ ...formData, utilities_included: newUtilities });
                          }}
                          className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <span className="ml-2 text-sm text-gray-600">{utility}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Additional Fees</label>
                  <div className="mt-2 space-y-4">
                    {ADDITIONAL_FEES.map((fee) => (
                      <div key={fee} className="flex items-center space-x-4">
                        <label className="inline-flex items-center">
                          <span className="text-sm text-gray-600">{fee}</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.additional_fees[fee] || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              additional_fees: {
                                ...formData.additional_fees,
                                [fee]: e.target.value,
                              },
                            })
                          }
                          className="block w-32 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="Amount"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setImages([]);
                    }}
                    className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                  >
                    {uploading ? 'Uploading...' : 'List Property'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div className="col-span-full text-center py-12">Loading properties...</div>
          ) : filteredProperties.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No properties</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by listing a property.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  List Property
                </button>
              </div>
            </div>
          ) : (
            filteredProperties.map((property) => {
              const PropertyIcon = propertyTypeIcons[property.property_type];
              return (
                <div
                  key={property.id}
                  className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
                >
                  <div className="px-4 py-5 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <PropertyIcon className="h-8 w-8 text-indigo-600" />
                        <div className="ml-4">
                          <h3 className="text-lg font-medium text-gray-900">{property.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">
                            {property.property_type}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-indigo-600">
                          {formatCurrency(property.monthly_rent)}
                        </p>
                        <p className="text-sm text-gray-500">per month</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div className="ml-2 text-sm text-gray-600">
                          <div>{property.address}</div>
                          <div>
                            {property.city}, {property.county}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-600">
                          Available from:{' '}
                          {new Date(property.available_from || '').toLocaleDateString()}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-600">
                          Min. lease: {property.minimum_lease_months} months
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Wallet className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-600">
                          Security deposit: {formatCurrency(property.security_deposit)}
                        </span>
                      </div>

                      <div className="flex items-center">
                        <Building2 className="h-5 w-5 text-gray-400" />
                        <span className="ml-2 text-sm text-gray-600">
                          {property.available_units} of {property.total_units} units available
                        </span>
                      </div>

                      {property.amenities && property.amenities.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {property.amenities.map((amenity) => (
                            <span
                              key={amenity}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                            >
                              {amenity === 'WiFi' && <Wifi className="h-3 w-3 mr-1" />}
                              {amenity === 'Parking' && <Car className="h-3 w-3 mr-1" />}
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}

                      {property.utilities_included && property.utilities_included.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Utilities Included:</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            {property.utilities_included.map((utility) => (
                              <span
                                key={utility}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                              >
                                {utility}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {Object.entries(property.additional_fees as Record<string, number>).length >
                        0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">Additional Fees:</p>
                          <div className="mt-1 space-y-1">
                            {Object.entries(property.additional_fees as Record<string, number>).map(
                              ([fee, amount]) => (
                                <div key={fee} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{fee}:</span>
                                  <span className="font-medium">{formatCurrency(amount)}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}