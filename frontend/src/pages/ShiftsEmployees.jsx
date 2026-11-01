import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Clock, Users, Play, StopCircle, UserPlus, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';

export const ShiftsEmployees = () => {
  const { activeStationId } = useStation();
  const { isManager } = useAuth();
  const toast = useToast();

  const [shifts, setShifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [pumps, setPumps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Open Shift Modal State
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [openShiftForm, setOpenShiftForm] = useState({
    employeeId: '',
    shiftName: 'MORNING',
    openingCash: '5000',
  });
  const [openSubmitting, setOpenSubmitting] = useState(false);

  // Close Shift Modal State
  const [closingShift, setClosingShift] = useState(null);
  const [closeShiftForm, setCloseShiftForm] = useState({
    actualCash: '',
    closingNotes: '',
    pumpsReadings: {},
  });
  const [closeSubmitting, setCloseSubmitting] = useState(false);

  // Add Employee Modal
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    fullName: '',
    phone: '',
    role: 'Attendant',
    salary: '25000',
  });
  const [employeeSubmitting, setEmployeeSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shiftsRes, empRes, pumpsRes] = await Promise.all([
        api.get('/shifts'),
        api.get('/employees'),
        api.get('/pumps'),
      ]);
      setShifts(shiftsRes.data || []);
      setEmployees(empRes.data || []);
      setPumps(pumpsRes.data || []);
    } catch (err) {
      toast.error('Failed to load shift management data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeStationId]);

  const handleOpenShift = async (e) => {
    e.preventDefault();
    setOpenSubmitting(true);
    try {
      // Map pumps to current opening meters
      const pumpPayload = pumps.map((p) => ({
        pumpId: p.id,
        openingReading: Number(p.totalLifetimeLiters || 0),
      }));

      await api.post('/shifts/open', {
        employeeId: openShiftForm.employeeId || employees[0]?.id,
        shiftName: openShiftForm.shiftName,
        openingCash: parseFloat(openShiftForm.openingCash || 0),
        pumps: pumpPayload,
      });

      toast.success('Shift opened successfully.');
      setIsOpenShiftModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to open shift');
    } finally {
      setOpenSubmitting(false);
    }
  };

  const handleOpenCloseModal = (shift) => {
    setClosingShift(shift);
    const initialPumps = {};
    pumps.forEach((p) => {
      initialPumps[p.id] = Number(p.totalLifetimeLiters || 0);
    });

    setCloseShiftForm({
      actualCash: shift.expectedCash ? Number(shift.expectedCash).toFixed(2) : '5000',
      closingNotes: '',
      pumpsReadings: initialPumps,
    });
  };

  const handleCloseShift = async (e) => {
    e.preventDefault();
    setCloseSubmitting(true);
    try {
      const pumpsPayload = Object.entries(closeShiftForm.pumpsReadings).map(([pumpId, val]) => ({
        pumpId,
        closingReading: parseFloat(val || 0),
      }));

      const res = await api.post(`/shifts/${closingShift.id}/close`, {
        actualCash: parseFloat(closeShiftForm.actualCash),
        closingNotes: closeShiftForm.closingNotes,
        pumps: pumpsPayload,
      });

      toast.success(
        `Shift closed! Cash variance: ₹${Number(res.data.cashVariance).toFixed(2)}`
      );
      setClosingShift(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Shift closing failed');
    } finally {
      setCloseSubmitting(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setEmployeeSubmitting(true);
    try {
      await api.post('/employees', {
        ...employeeForm,
        salary: parseFloat(employeeForm.salary),
      });
      toast.success('Employee added to station roster.');
      setIsEmployeeModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to add employee');
    } finally {
      setEmployeeSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Attendant Shifts & Cash Reconciliation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Shift assignments, mechanical totalizer lockouts, and expected vs physical cash reconciliation
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isManager && (
            <Button
              variant="outline"
              size="md"
              onClick={() => setIsEmployeeModalOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1" />
              Add Employee
            </Button>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsOpenShiftModalOpen(true)}
          >
            <Play className="w-4 h-4 mr-1" />
            Start New Shift
          </Button>
        </div>
      </div>

      {/* Shifts Ledger */}
      <Card>
        <CardHeader
          title="Station Shift Operations & Cash Balancing"
          subtitle="Monitors active personnel on duty and reconciles total cash sales against physical collections"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Shift</th>
                <th className="p-3">Attendant</th>
                <th className="p-3">Start Time</th>
                <th className="p-3">End Time</th>
                <th className="p-3">Opening Cash Float</th>
                <th className="p-3">Expected Cash</th>
                <th className="p-3">Actual Cash Handover</th>
                <th className="p-3">Cash Variance</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map((shift) => {
                const isOpen = shift.status === 'OPEN';
                const variance = Number(shift.cashVariance || 0);
                const hasVarianceAlert = Math.abs(variance) >= 500;

                return (
                  <tr key={shift.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-bold text-slate-900">
                      {shift.shiftName}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {shift.employee?.fullName}
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(shift.startTime).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-slate-500">
                      {shift.endTime ? new Date(shift.endTime).toLocaleString('en-IN') : '—'}
                    </td>
                    <td className="p-3">₹{Number(shift.openingCash).toFixed(2)}</td>
                    <td className="p-3 font-semibold text-slate-900">
                      ₹{Number(shift.expectedCash).toFixed(2)}
                    </td>
                    <td className="p-3 font-bold text-slate-900">
                      {isOpen ? '—' : `₹${Number(shift.actualCash).toFixed(2)}`}
                    </td>
                    <td className="p-3 font-bold">
                      {isOpen ? (
                        '—'
                      ) : (
                        <span
                          className={
                            hasVarianceAlert
                              ? 'text-rose-600'
                              : variance < 0
                              ? 'text-amber-600'
                              : 'text-emerald-600'
                          }
                        >
                          {variance >= 0 ? `+₹${variance.toFixed(2)}` : `-₹${Math.abs(variance).toFixed(2)}`}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <Badge variant={isOpen ? 'success' : 'default'}>
                        {shift.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-right">
                      {isOpen && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenCloseModal(shift)}
                        >
                          <StopCircle className="w-3.5 h-3.5 mr-1" />
                          Reconcile & Close
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Employee Roster */}
      <Card>
        <CardHeader
          title="Staff & Forecourt Attendant Roster"
          subtitle="Active station employees and wage allocations"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{emp.fullName}</span>
                <Badge variant="primary">{emp.status}</Badge>
              </div>
              <div className="text-xs text-slate-500 space-y-0.5">
                <div>Role: <b className="text-slate-800">{emp.role}</b></div>
                <div>Code: <span className="font-mono text-[11px]">{emp.employeeCode}</span></div>
                <div>Phone: {emp.phone}</div>
                <div>Shifts Handled: {emp._count?.shifts || 0}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Start Shift Modal */}
      <Modal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
        title="Open Attendant Shift"
        subtitle="Assign attendant, initialize cash drawer float, and capture pump totalizers"
      >
        <form onSubmit={handleOpenShift} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Attendant on Duty
            </label>
            <select
              required
              value={openShiftForm.employeeId}
              onChange={(e) => setOpenShiftForm({ ...openShiftForm, employeeId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>{e.fullName} ({e.role})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shift Designation
            </label>
            <select
              value={openShiftForm.shiftName}
              onChange={(e) => setOpenShiftForm({ ...openShiftForm, shiftName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="MORNING">Morning Shift (06:00 - 14:00)</option>
              <option value="EVENING">Evening Shift (14:00 - 22:00)</option>
              <option value="NIGHT">Night Super Shift (22:00 - 06:00)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Opening Petty Cash Float (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={openShiftForm.openingCash}
              onChange={(e) => setOpenShiftForm({ ...openShiftForm, openingCash: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpenShiftModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={openSubmitting}>
              Commence Shift
            </Button>
          </div>
        </form>
      </Modal>

      {/* Close Shift & Cash Reconciliation Modal */}
      <Modal
        isOpen={!!closingShift}
        onClose={() => setClosingShift(null)}
        title={`Reconcile & Close Shift: ${closingShift?.shiftName}`}
        subtitle={`Attendant: ${closingShift?.employee?.fullName}`}
      >
        <form onSubmit={handleCloseShift} className="space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 space-y-1">
            <div className="flex justify-between">
              <span>Opening Cash Float:</span>
              <b>₹{Number(closingShift?.openingCash || 0).toFixed(2)}</b>
            </div>
            <div className="flex justify-between">
              <span>System Expected Cash from POS Sales:</span>
              <b className="text-base text-blue-700">₹{Number(closingShift?.expectedCash || 0).toFixed(2)}</b>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physical Cash Handover Collected (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={closeShiftForm.actualCash}
              onChange={(e) => setCloseShiftForm({ ...closeShiftForm, actualCash: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shift Closing Notes & Handover Remarks
            </label>
            <textarea
              rows="3"
              value={closeShiftForm.closingNotes}
              onChange={(e) => setCloseShiftForm({ ...closeShiftForm, closingNotes: e.target.value })}
              placeholder="e.g. Forecourt clean, change float handed over to supervisor..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setClosingShift(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={closeSubmitting}>
              Reconcile & Sign Off Shift
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        title="Add Station Employee"
        subtitle="Registers staff member for shift operations"
      >
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={employeeForm.fullName}
              onChange={(e) => setEmployeeForm({ ...employeeForm, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={employeeForm.phone}
              onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
            <input
              type="text"
              required
              value={employeeForm.role}
              onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsEmployeeModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={employeeSubmitting}>Save Employee</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
