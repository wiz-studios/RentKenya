import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Clock, Calendar, Wallet, FileText, PenTool as Tool, CreditCard, CheckCircle, AlertCircle, XCircle, Upload } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Property = Database['public']['Tables']['properties']['Row'];
type MaintenanceRequest = {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
};

type PaymentRecord = {
  id: string;
  amount: number;
  type: 'rent' | 'deposit' | 'maintenance';
  status: 'pending' | 'completed';
  due_date: string;
  paid_date: string | null;
};

export default function Tenants() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'applications' | 'documents' | 'payments' | 'maintenance'>('applications');
  const [applications, setApplications] = useState<Property[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchMaintenanceRequests();
      fetchPayments();
    }
  }, [user]);

  async function fetchApplications() {
    try {
      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('submitted_by', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (err) {
      console.error('Error fetching applications:', err);
      setError('Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMaintenanceRequests() {
    // Simulated data for now - would be replaced with actual Supabase query
    setMaintenanceRequests([
      {
        id: '1',
        title: 'Leaking Faucet',
        description: 'The kitchen sink faucet is leaking',
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ] as MaintenanceRequest[]);
  }

  async function fetchPayments() {
    // Simulated data for now - would be replaced with actual Supabase query
    setPayments([
      {
        id: '1',
        amount: 25000,
        type: 'rent',
        status: 'completed',
        due_date: '2025-03-01',
        paid_date: '2025-02-28',
      },
    ] as PaymentRecord[]);
  }

  async function handleMaintenanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Would be replaced with actual Supabase mutation
    const newMaintenanceRequest = {
      id: Date.now().toString(),
      ...newRequest,
      status: 'pending' as const,
      created_at: new Date().toISOString(),
    };
    setMaintenanceRequests(prev => [newMaintenanceRequest, ...prev]);
    setNewRequest({ title: '', description: '' });
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
    }).format(amount);
  }

  const filteredApplications = applications.filter(
    (application) =>
      application.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      application.city.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Tenant Dashboard</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your rental applications, documents, payments, and maintenance requests.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            type="button"
            onClick={() => navigate('/properties')}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
          >
            <Building2 className="h-4 w-4 mr-2" />
            Browse Properties
          </button>
        </div>
      </div>

      <div className="mt-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'applications', label: 'Applications', icon: FileText },
            { id: 'documents', label: 'Documents', icon: Upload },
            { id: 'payments', label: 'Payments', icon: CreditCard },
            { id: 'maintenance', label: 'Maintenance', icon: Tool },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`
                ${activeTab === id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }
                group inline-flex items-center border-b-2 py-4 px-1 text-sm font-medium
              `}
            >
              <Icon className={`
                ${activeTab === id ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'}
                -ml-0.5 mr-2 h-5 w-5
              `} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-8">
        {activeTab === 'applications' && (
          <>
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
                  placeholder="Search applications..."
                />
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {loading ? (
                <div className="col-span-full text-center py-12">Loading applications...</div>
              ) : filteredApplications.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Building2 className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No applications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Get started by browsing available properties.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => navigate('/properties')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Browse Properties
                    </button>
                  </div>
                </div>
              ) : (
                filteredApplications.map((application) => (
                  <div
                    key={application.id}
                    className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200"
                  >
                    <div className="px-4 py-5 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <Building2 className="h-8 w-8 text-indigo-600" />
                          <div className="ml-4">
                            <h3 className="text-lg font-medium text-gray-900">{application.name}</h3>
                            <p className="text-sm text-gray-500 capitalize">
                              {application.property_type}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-indigo-600">
                            {formatCurrency(application.monthly_rent)}
                          </p>
                          <p className="text-sm text-gray-500">per month</p>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-4 sm:px-6">
                      <div className="space-y-3">
                        <div className="flex items-center">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-600">
                            Available from:{' '}
                            {new Date(application.available_from || '').toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Clock className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-600">
                            Min. lease: {application.minimum_lease_months} months
                          </span>
                        </div>

                        <div className="flex items-center">
                          <Wallet className="h-5 w-5 text-gray-400" />
                          <span className="ml-2 text-sm text-gray-600">
                            Security deposit: {formatCurrency(application.security_deposit)}
                          </span>
                        </div>

                        {application.utilities_included && application.utilities_included.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Utilities Included:</p>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {application.utilities_included.map((utility) => (
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

                        {Object.entries(application.additional_fees as Record<string, number>).length >
                          0 && (
                          <div>
                            <p className="text-sm font-medium text-gray-700">Additional Fees:</p>
                            <div className="mt-1 space-y-1">
                              {Object.entries(application.additional_fees as Record<string, number>).map(
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

                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => navigate(`/properties/${application.id}`)}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium leading-6 text-gray-900">Required Documents</h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Please upload the following documents for verification.</p>
              </div>
              <div className="mt-5 space-y-4">
                {[
                  { name: 'ID Document', required: true },
                  { name: 'Proof of Income', required: true },
                  { name: 'Bank Statements', required: true },
                  { name: 'Employment Letter', required: false },
                ].map((doc) => (
                  <div key={doc.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {doc.name}
                          {doc.required && (
                            <span className="ml-1 text-red-500">*</span>
                          )}
                        </h4>
                        <p className="mt-1 text-sm text-gray-500">PDF or image files only</p>
                      </div>
                      <button
                        type="button"
                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Payment History</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    View your payment history and upcoming payments.
                  </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                  <button
                    type="button"
                    className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Make Payment
                  </button>
                </div>
              </div>
              <div className="mt-6">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                          Type
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Amount
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Due Date
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {payments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm capitalize">
                            <div className="flex items-center">
                              <span className="font-medium text-gray-900">{payment.type}</span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                            {new Date(payment.due_date).toLocaleDateString()}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                payment.status === 'completed'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {payment.status === 'completed' ? (
                                <CheckCircle className="h-4 w-4 mr-1" />
                              ) : (
                                <AlertCircle className="h-4 w-4 mr-1" />
                              )}
                              {payment.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Maintenance Requests</h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Submit and track maintenance requests for your rental unit.
                  </p>
                </div>
              </div>

              <form onSubmit={handleMaintenanceSubmit} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Issue Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={newRequest.description}
                    onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <Tool className="h-4 w-4 mr-2" />
                    Submit Request
                  </button>
                </div>
              </form>

              <div className="mt-8">
                <h4 className="text-sm font-medium text-gray-900">Recent Requests</h4>
                <div className="mt-4 space-y-4">
                  {maintenanceRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900">{request.title}</h5>
                          <p className="mt-1 text-sm text-gray-500">{request.description}</p>
                          <p className="mt-2 text-xs text-gray-400">
                            Submitted on {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : request.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {request.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          ) : request.status === 'in_progress' ? (
                            <Tool className="h-4 w-4 mr-1" />
                          ) : (
                            <AlertCircle className="h-4 w-4 mr-1" />
                          )}
                          {request.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}