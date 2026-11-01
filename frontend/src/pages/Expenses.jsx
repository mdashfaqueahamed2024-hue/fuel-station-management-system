import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Receipt, Plus, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';

export const Expenses = () => {
  const { activeStationId } = useStation();
  const { isManager } = useAuth();
  const toast = useToast();

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Expense Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    categoryId: '',
    description: '',
    amount: '',
    receiptRef: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, catRes] = await Promise.all([
        api.get('/expenses'),
        api.get('/expenses/categories'),
      ]);
      setExpenses(expRes.data || []);
      setCategories(catRes.data || []);
      if (catRes.data?.length > 0 && !form.categoryId) {
        setForm((prev) => ({ ...prev, categoryId: catRes.data[0].id }));
      }
    } catch (err) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeStationId]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/expenses', {
        ...form,
        amount: parseFloat(form.amount),
      });
      toast.success('Expense submitted successfully.');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewExpense = async (id, status) => {
    try {
      await api.patch(`/expenses/${id}/review`, { status });
      toast.success(`Expense marked as ${status}.`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Review action failed');
    }
  };

  const totalApproved = expenses
    .filter((e) => e.approvalStatus === 'APPROVED')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const totalPending = expenses
    .filter((e) => e.approvalStatus === 'PENDING')
    .reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operating Expenses & Overhead Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track station electricity, generator fuel, dispenser calibration, and maintenance costs
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4 mr-1" />
          Log New Expense
        </Button>
      </div>

      {/* Summary Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-5 border-l-4 border-l-emerald-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Total Approved Operating Expenses</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">
            ₹{totalApproved.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Deducted from Gross Margin for Net Operating Profit</div>
        </Card>

        <Card className="p-5 border-l-4 border-l-amber-500">
          <div className="text-xs font-semibold text-slate-500 uppercase">Pending Review / Awaiting Sign-off</div>
          <div className="text-2xl font-bold text-amber-700 mt-1">
            ₹{totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Submitted expenses awaiting managerial approval</div>
        </Card>
      </div>

      {/* Expenses Table */}
      <Card>
        <CardHeader
          title="Operational Expense Invoices"
          subtitle="Showing all recorded utility bills, maintenance checks, and statutory fees"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Expense Date</th>
                <th className="p-3">Category</th>
                <th className="p-3">Description</th>
                <th className="p-3">Receipt / Ref #</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Recorded By</th>
                <th className="p-3">Approval Status</th>
                {isManager && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3 text-slate-500">
                    {new Date(exp.expenseDate).toLocaleDateString('en-IN')}
                  </td>
                  <td className="p-3 font-semibold text-slate-800">{exp.category?.name}</td>
                  <td className="p-3 text-slate-700">{exp.description}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-500">{exp.receiptRef || '—'}</td>
                  <td className="p-3 font-bold text-slate-900 text-sm">
                    ₹{Number(exp.amount).toFixed(2)}
                  </td>
                  <td className="p-3">{exp.recordedBy?.fullName}</td>
                  <td className="p-3">
                    <Badge
                      variant={
                        exp.approvalStatus === 'APPROVED'
                          ? 'success'
                          : exp.approvalStatus === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                      }
                    >
                      {exp.approvalStatus}
                    </Badge>
                  </td>
                  {isManager && (
                    <td className="p-3 text-right space-x-1">
                      {exp.approvalStatus === 'PENDING' && (
                        <>
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => handleReviewExpense(exp.id, 'APPROVED')}
                            title="Approve Expense"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleReviewExpense(exp.id, 'REJECTED')}
                            title="Reject Expense"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Expense Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Operating Expense"
        subtitle="Submitted expenses require managerial approval before deduction from net operating results"
      >
        <form onSubmit={handleCreateExpense} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Cost Category</label>
            <select
              required
              value={form.categoryId}
              onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Expense Description</label>
            <input
              type="text"
              required
              placeholder="e.g. BESCOM Electricity Bill for Island Canopy Lighting..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Invoice Amount (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 15000"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Receipt / Invoice Ref #</label>
              <input
                type="text"
                placeholder="Optional"
                value={form.receiptRef}
                onChange={(e) => setForm({ ...form, receiptRef: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={submitting}>Submit Expense</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
