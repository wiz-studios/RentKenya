import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, MapPin, Calendar, Clock, Wallet, Wifi, Car, ArrowLeft, CheckCircle, Image as ImageIcon, Send, Briefcase as BriefCase, Home as HomeIcon, DollarSign } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyImage = Database['public']['Tables']['property_images']['Row'];

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [property, setProperty] = useState<Property | null>(null);
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [applicationData, setApplicationData] = useState({
    monthly_income: '',
    employment_status: '',
    current_address: '',
    move_in_date: '',
    lease_term_months: '12',
    notes: '',
  });
  const [inquiryData, setInquiryData] = useState({
    subject: '',
    message: '',
    visit_requested: false,
    preferred_visit_date: '',
    visit_time_slot: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProperty();
      fetchImages();
    }
  }, [id]);

  async function fetchProperty() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProperty(data);
    } catch (err) {
      console.error('Error fetching property:', err);
      setError('Failed to load property details');
    } finally {
      setLoading(false);
    }
  }

  async function fetchImages() {
    try {
      const { data, error } = await supabase
        .from('property_images')
        .select('*')
        .eq('property_id', id)
        .order('display_order', { ascending: true });

      if (error) throw error;
      setImages(data || []);
    } catch (err) {
      console.error('Error fetching images:', err);
    }
  }

  async function handleApplicationSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !property) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('rental_applications').insert([
        {
          property_id: property.id,
          applicant_id: user.id,
          monthly_income: parseFloat(applicationData.monthly_income),
          employment_status: applicationData.employment_status,
          current_address: applicationData.current_address,
          move_in_date: applicationData.move_in_date,
          lease_term_months: parseInt(applicationData.lease_term_months, 10),
          notes: applicationData.notes,
        },
      ]);

      if (error) throw error;

      setShowApplicationForm(false);
      setApplicationData({
        monthly_income: '',
        employment_status: '',
        current_address: '',
        move_in_date: '',
        lease_term_months: '12',
        notes: '',
      });
      alert('Application submitted successfully!');
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !property) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('property_inquiries').insert([
        {
          property_id: property.id,
          sender_id: user.id,
          recipient_id: property.landlord_id || property.submitted_by,
          subject: inquiryData.subject,
          message: inquiryData.message,
          visit_requested: inquiryData.visit_requested,
          preferred_visit_date: inquiryData.visit_requested ? inquiryData.preferred_visit_date : null,
          visit_time_slot: inquiryData.visit_requested ? inquiryData.visit_time_slot : null,
        },
      ]);

      if (error) throw error;

      setShowInquiryForm(false);
      setInquiryData({
        subject: '',
        message: '',
        visit_requested: false,
        preferred_visit_date: '',
        visit_time_slot: '',
      });
      alert('Message sent successfully!');
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading property details...</h3>
        </div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error || 'Property not found'}</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </button>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Photo Gallery */}
          <div className="relative aspect-video bg-gray-100">
            {images.length > 0 ? (
              <>
                <img
                  src={images[currentImageIndex].url}
                  alt={images[currentImageIndex].caption || property.name}
                  className="w-full h-full object-cover"
                />
                {images.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={`w-2 h-2 rounded-full ${
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
          </div>

          <div className="px-4 py-5 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-indigo-600" />
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
                  <p className="text-sm text-gray-500 capitalize">{property.property_type}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-indigo-600">
                  {formatCurrency(property.monthly_rent)}
                </p>
                <p className="text-sm text-gray-500">per month</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">Location</p>
                    <p className="text-sm text-gray-500">{property.address}</p>
                    <p className="text-sm text-gray-500">
                      {property.city}, {property.county}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">Available From</p>
                    <p className="text-sm text-gray-500">
                      {new Date(property.available_from || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">Minimum Lease Period</p>
                    <p className="text-sm text-gray-500">{property.minimum_lease_months} months</p>
                  </div>
                </div>

                <div className="flex items-center">
                  <Wallet className="h-5 w-5 text-gray-400" />
                  <div className="ml-2">
                    <p className="text-sm font-medium text-gray-900">Security Deposit</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(property.security_deposit)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {property.amenities && property.amenities.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Amenities</h3>
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
                  </div>
                )}

                {property.utilities_included && property.utilities_included.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Utilities Included</h3>
                    <div className="flex flex-wrap gap-2">
                      {property.utilities_included.map((utility) => (
                        <span
                          key={utility}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {utility}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {Object.entries(property.additional_fees as Record<string, number>).length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Additional Fees</h3>
                    <div className="space-y-2">
                      {Object.entries(property.additional_fees as Record<string, number>).map(
                        ([fee, amount]) => (
                          <div key={fee} className="flex justify-between text-sm">
                            <span className="text-gray-600">{fee}</span>
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

          <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowInquiryForm(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Send className="h-4 w-4 mr-2" />
                Contact Landlord
              </button>
              <button
                type="button"
                onClick={() => setShowApplicationForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Apply Now
              </button>
            </div>
          </div>
        </div>

        {/* Application Form Modal */}
        {showApplicationForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Rental Application</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Please fill out all required information to apply for this property.
                </p>
              </div>
              <form onSubmit={handleApplicationSubmit} className="border-t border-gray-200">
                <div className="px-4 py-5 sm:px-6 space-y-6">
                  <div>
                    <label htmlFor="monthly_income" className="block text-sm font-medium text-gray-700">
                      Monthly Income (KES)
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        id="monthly_income"
                        required
                        value={applicationData.monthly_income}
                        onChange={(e) =>
                          setApplicationData({ ...applicationData, monthly_income: e.target.value })
                        }
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="employment_status"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Employment Status
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BriefCase className="h-5 w-5 text-gray-400" />
                      </div>
                      <select
                        id="employment_status"
                        required
                        value={applicationData.employment_status}
                        onChange={(e) =>
                          setApplicationData({
                            ...applicationData,
                            employment_status: e.target.value,
                          })
                        }
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="">Select status</option>
                        <option value="employed">Employed</option>
                        <option value="self-employed">Self-employed</option>
                        <option value="student">Student</option>
                        <option value="retired">Retired</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="current_address"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Current Address
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <HomeIcon className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        id="current_address"
                        required
                        value={applicationData.current_address}
                        onChange={(e) =>
                          setApplicationData({ ...applicationData, current_address: e.target.value })
                        }
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="move_in_date" className="block text-sm font-medium text-gray-700">
                      Desired Move-in Date
                    </label>
                    <div className="mt-1">
                      <input
                        type="date"
                        id="move_in_date"
                        required
                        value={applicationData.move_in_date}
                        onChange={(e) =>
                          setApplicationData({ ...applicationData, move_in_date: e.target.value })
                        }
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="lease_term_months"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Lease Term (months)
                    </label>
                    <div className="mt-1">
                      <input
                        type="number"
                        id="lease_term_months"
                        required
                        min={property.minimum_lease_months}
                        value={applicationData.lease_term_months}
                        onChange={(e) =>
                          setApplicationData({
                            ...applicationData,
                            lease_term_months: e.target.value,
                          })
                        }
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                      Additional Notes
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="notes"
                        rows={3}
                        value={applicationData.notes}
                        onChange={(e) =>
                          setApplicationData({ ...applicationData, notes: e.target.value })
                        }
                        className="focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowApplicationForm(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Inquiry Form Modal */}
        {showInquiryForm && (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900">Contact Landlord</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Send a message to inquire about this property or schedule a visit.
                </p>
              </div>
              <form onSubmit={handleInquirySubmit} className="border-t border-gray-200">
                <div className="px-4 py-5 sm:px-6 space-y-6">
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      required
                      value={inquiryData.subject}
                      onChange={(e) => setInquiryData({ ...inquiryData, subject: e.target.value })}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                      Message
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={4}
                      value={inquiryData.message}
                      onChange={(e) => setInquiryData({ ...inquiryData, message: e.target.value })}
                      className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="visit_requested"
                          type="checkbox"
                          checked={inquiryData.visit_requested}
                          onChange={(e) =>
                            setInquiryData({ ...inquiryData, visit_requested: e.target.checked })
                          }
                          className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="visit_requested" className="font-medium text-gray-700">
                          Schedule a site visit
                        </label>
                        <p className="text-gray-500">Request to view the property in person</p>
                      </div>
                    </div>

                    {inquiryData.visit_requested && (
                      <>
                        <div>
                          <label
                            htmlFor="preferred_visit_date"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Preferred Visit Date
                          </label>
                          <input
                            type="date"
                            id="preferred_visit_date"
                            required={inquiryData.visit_requested}
                            min={new Date().toISOString().split('T')[0]}
                            value={inquiryData.preferred_visit_date}
                            onChange={(e) =>
                              setInquiryData({ ...inquiryData, preferred_visit_date: e.target.value })
                            }
                            className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor="visit_time_slot"
                            className="block text-sm font-medium text-gray-700"
                          >
                            Preferred Time Slot
                          </label>
                          <select
                            id="visit_time_slot"
                            required={inquiryData.visit_requested}
                            value={inquiryData.visit_time_slot}
                            onChange={(e) =>
                              setInquiryData({ ...inquiryData, visit_time_slot: e.target.value })
                            }
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                          >
                            <option value="">Select a time slot</option>
                            <option value="morning">Morning (9 AM - 12 PM)</option>
                            <option value="afternoon">Afternoon (12 PM - 3 PM)</option>
                            <option value="evening">Evening (3 PM - 6 PM)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowInquiryForm(false)}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}