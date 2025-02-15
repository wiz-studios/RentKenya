import React from 'react';
import { Users, Building2, FileText, AlertCircle } from 'lucide-react';

const stats = [
  { name: 'Total Tenants', value: '0', icon: Users, color: 'bg-blue-500' },
  { name: 'Properties', value: '0', icon: Building2, color: 'bg-green-500' },
  { name: 'Active Leases', value: '0', icon: FileText, color: 'bg-purple-500' },
  { name: 'Pending Requests', value: '0', icon: AlertCircle, color: 'bg-yellow-500' },
];

export default function Dashboard() {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      
      <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:px-6 sm:py-6"
            >
              <dt>
                <div className={`absolute rounded-md ${item.color} p-3`}>
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <p className="ml-16 truncate text-sm font-medium text-gray-500">
                  {item.name}
                </p>
              </dt>
              <dd className="ml-16 flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
              </dd>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">No recent activity</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900">Upcoming Payments</h2>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">No upcoming payments</p>
          </div>
        </div>
      </div>
    </div>
  );
}