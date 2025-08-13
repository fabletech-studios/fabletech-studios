'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Customer {
  uid: string;
  email: string;
  name: string;
  credits: number;
  unlockedEpisodes: number;
  createdAt: string;
  lastActive?: string;
  totalSpent?: number;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [editCredits, setEditCredits] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch('/api/admin/customers/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          alert('Admin access required');
          router.push('/');
          return;
        }
        throw new Error('Failed to fetch customers');
      }

      const data = await response.json();
      setCustomers(data.customers);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetails = async (uid: string) => {
    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/admin/customers/${uid}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data);
        setEditCredits(data.credits.toString());
      }
    } catch (error) {
      console.error('Error fetching customer details:', error);
    }
  };

  const updateCustomerCredits = async () => {
    if (!selectedCustomer) return;

    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch(`/api/admin/customers/${selectedCustomer.uid}/credits`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          credits: parseInt(editCredits)
        })
      });

      if (response.ok) {
        alert('Credits updated successfully');
        fetchCustomers();
        viewCustomerDetails(selectedCustomer.uid);
      }
    } catch (error) {
      console.error('Error updating credits:', error);
    }
  };

  const impersonateCustomer = async (uid: string, email: string) => {
    if (confirm(`Impersonate customer ${email}? This will log you in as this user for testing.`)) {
      try {
        const token = localStorage.getItem('customerToken');
        const response = await fetch('/api/admin/customers/impersonate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ targetUid: uid })
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('customerToken', data.token);
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Error impersonating customer:', error);
      }
    }
  };

  const exportCustomerData = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      const response = await fetch('/api/admin/customers/export', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString()}.csv`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="min-h-screen bg-black text-white p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Customer Management</h1>
          <button
            onClick={exportCustomerData}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Export CSV
          </button>
        </div>

        <div className="bg-gray-900 p-4 rounded mb-6">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{customers.length}</p>
              <p className="text-sm text-gray-400">Total Customers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {customers.filter(c => c.credits > 100).length}
              </p>
              <p className="text-sm text-gray-400">Paying Customers</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                ${customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0) / 100}
              </p>
              <p className="text-sm text-gray-400">Total Revenue</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {customers.reduce((sum, c) => sum + c.credits, 0)}
              </p>
              <p className="text-sm text-gray-400">Total Credits</p>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by email or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-2 bg-gray-900 rounded"
          />
        </div>

        <div className="bg-gray-900 rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-center">Credits</th>
                <th className="p-3 text-center">Unlocked</th>
                <th className="p-3 text-center">Created</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map(customer => (
                <tr key={customer.uid} className="border-t border-gray-800 hover:bg-gray-800">
                  <td className="p-3">{customer.email}</td>
                  <td className="p-3">{customer.name || '-'}</td>
                  <td className="p-3 text-center font-bold">{customer.credits}</td>
                  <td className="p-3 text-center">{customer.unlockedEpisodes}</td>
                  <td className="p-3 text-center">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => viewCustomerDetails(customer.uid)}
                      className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm mr-2"
                    >
                      View
                    </button>
                    <button
                      onClick={() => impersonateCustomer(customer.uid, customer.email)}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm"
                    >
                      Test
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Customer Details</h2>
              
              <div className="space-y-3">
                <p><strong>UID:</strong> {selectedCustomer.uid}</p>
                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                <p><strong>Name:</strong> {selectedCustomer.name || 'Not set'}</p>
                
                <div className="flex items-center gap-3">
                  <strong>Credits:</strong>
                  <input
                    type="number"
                    value={editCredits}
                    onChange={(e) => setEditCredits(e.target.value)}
                    className="bg-gray-800 px-2 py-1 rounded w-24"
                  />
                  <button
                    onClick={updateCustomerCredits}
                    className="bg-green-600 hover:bg-green-700 px-3 py-1 rounded text-sm"
                  >
                    Update
                  </button>
                </div>

                <div>
                  <strong>Unlocked Episodes:</strong>
                  {selectedCustomer.unlockedEpisodes?.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {selectedCustomer.unlockedEpisodes.map((ep: any, i: number) => (
                        <li key={i} className="text-sm text-gray-400">
                          Episode {ep.episodeNumber} - {new Date(ep.unlockedAt).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">None</p>
                  )}
                </div>

                <div>
                  <strong>Recent Purchases:</strong>
                  {selectedCustomer.purchases?.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {selectedCustomer.purchases.map((p: any, i: number) => (
                        <li key={i} className="text-sm text-gray-400">
                          ${p.amount/100} - {p.credits} credits - {new Date(p.createdAt).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-400">None</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => impersonateCustomer(selectedCustomer.uid, selectedCustomer.email)}
                  className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
                >
                  Impersonate User
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}