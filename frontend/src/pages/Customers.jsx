import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Users, Plus, Search, Building2, CreditCard } from 'lucide-react';

export const Customers = () => {
  const { activeStationId } = useStation();
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Add Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    companyName: '',
    customerType: 'INDIVIDUAL',
    creditLimit: '0',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/customers', { search });
      setCustomers(res.data || []);
    } catch (err) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [activeStationId]);

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/customers', {
        ...form,
        creditLimit: parseFloat(form.creditLimit || 0),
      });
      toast.success('Customer registered successfully.');
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err) {
      toast.error(err.message || 'Customer creation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Commercial & Retail Customers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage corporate logistics fleet credit balances and retail loyal customer profiles
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Add Customer
        </Button>
      </div>

      {/* Customer Directory Table */}
      <Card>
        <CardHeader
          title="Customer Directory & Fleet Credit Accounts"
          subtitle="Showing registered corporate fleets and individual frequent drivers"
          action={
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search customer name or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
                className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Company / Fleet Entity</th>
                <th className="p-3">Account Type</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Credit Limit</th>
                <th className="p-3">Current Credit Balance</th>
                <th className="p-3">Transactions</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 font-semibold text-slate-900">{c.name}</td>
                  <td className="p-3 text-slate-600">{c.companyName || '—'}</td>
                  <td className="p-3">
                    <Badge variant={c.customerType === 'COMMERCIAL_FLEET' ? 'purple' : 'default'}>
                      {c.customerType}
                    </Badge>
                  </td>
                  <td className="p-3">{c.phone || '—'}</td>
                  <td className="p-3 font-semibold">
                    {Number(c.creditLimit) > 0 ? `₹${Number(c.creditLimit).toLocaleString()}` : 'None'}
                  </td>
                  <td className="p-3 font-bold text-slate-900">
                    ₹{Number(c.currentBalance || 0).toLocaleString()}
                  </td>
                  <td className="p-3">{c._count?.sales || 0} purchases</td>
                  <td className="p-3">
                    <Badge variant="success">ACTIVE</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Customer / Fleet"
        subtitle="Configures billing contact and credit limit parameters"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Customer / Driver Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Classification</label>
              <select
                value={form.customerType}
                onChange={(e) => setForm({ ...form, customerType: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                <option value="INDIVIDUAL">Individual Consumer</option>
                <option value="COMMERCIAL_FLEET">Commercial Logistics Fleet</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Business Name</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Authorized Credit Limit (₹)</label>
              <input
                type="number"
                value={form.creditLimit}
                onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Register Customer</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
