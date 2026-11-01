import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Scale, CheckCircle2, AlertTriangle, ArrowRight, Calculator } from 'lucide-react';

export const StockReconciliation = () => {
  const { activeStationId } = useStation();
  const { isManager } = useAuth();
  const toast = useToast();

  const [tanks, setTanks] = useState([]);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reconciliation Form
  const [selectedTankId, setSelectedTankId] = useState('');
  const [physicalDip, setPhysicalDip] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tankRes, recRes] = await Promise.all([
        api.get('/tanks'),
        api.get('/reconciliations'),
      ]);
      setTanks(tankRes.data || []);
      setReconciliations(recRes.data || []);
      if (tankRes.data?.length > 0 && !selectedTankId) {
        setSelectedTankId(tankRes.data[0].id);
      }
    } catch (err) {
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeStationId]);

  const selectedTank = tanks.find((t) => t.id === selectedTankId);

  const handlePerformReconciliation = async (e) => {
    e.preventDefault();
    if (!physicalDip || isNaN(physicalDip) || parseFloat(physicalDip) < 0) {
      toast.error('Please enter a valid physical dip measurement in Liters');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/reconciliations', {
        tankId: selectedTankId,
        physicalMeasuredStock: parseFloat(physicalDip),
        notes,
      });

      toast.success(
        `Reconciliation completed. Status: ${res.data.status} (Variance: ${res.data.varianceLiters.toFixed(2)} L)`
      );
      setPhysicalDip('');
      setNotes('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Reconciliation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Physical Stock Reconciliation & Mathematical Calibration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audits inventory balances using authoritative formula:{' '}
          <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-[11px]">
            Expected Closing Stock = Opening Stock + Confirmed Deliveries - Recorded Sales + Authorized Adjustments
          </code>
        </p>
      </div>

      {/* Reconciliation Entry Card */}
      {isManager && (
        <Card className="border-blue-200 bg-gradient-to-br from-white to-blue-50/20">
          <CardHeader
            title="Execute Storage Tank Dip Calibration"
            subtitle="Input physical sounding rod measurement to test against authoritative database ledger"
          />
          <CardContent>
            <form onSubmit={handlePerformReconciliation} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Underground Tank
                  </label>
                  <select
                    value={selectedTankId}
                    onChange={(e) => setSelectedTankId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    {tanks.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.tankNumber} ({t.fuelProduct?.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Physical Dip Measurement (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="e.g. 17840.00"
                    value={physicalDip}
                    onChange={(e) => setPhysicalDip(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Calibrated Dip Sounding Remarks
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tape depth 142.5 cm, water paste negative..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Dynamic Telemetry Snapshot */}
              {selectedTank && (
                <div className="p-3.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block font-bold">Current Ledger Volume</span>
                    <span className="font-bold text-slate-900 text-sm">
                      {Number(selectedTank.currentStockLiters).toLocaleString()} Liters
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block font-bold">Tank Capacity</span>
                    <span className="font-semibold text-slate-900">
                      {Number(selectedTank.capacityLiters).toLocaleString()} Liters
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase text-[10px] block font-bold">Threshold</span>
                    <span className="font-semibold text-slate-900">
                      {Number(selectedTank.lowStockThresholdLiters).toLocaleString()} Liters
                    </span>
                  </div>
                  <Button type="submit" variant="primary" size="md" isLoading={submitting}>
                    <Calculator className="w-4 h-4 mr-1.5" />
                    Evaluate & Calibrate
                  </Button>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reconciliation History Ledger */}
      <Card>
        <CardHeader
          title="Stock Reconciliation Ledger & Variance Audits"
          subtitle="Showing mathematical formula results and variance discrepancy classifications"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Audit Date</th>
                <th className="p-3">Tank & Fuel</th>
                <th className="p-3">Opening Stock</th>
                <th className="p-3">+ Confirmed Deliveries</th>
                <th className="p-3">- POS Sales Sold</th>
                <th className="p-3">± Adjustments</th>
                <th className="p-3">Expected Stock</th>
                <th className="p-3">Physical Dip Reading</th>
                <th className="p-3">Variance (L)</th>
                <th className="p-3">Variance %</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {reconciliations.length > 0 ? (
                reconciliations.map((rec) => {
                  const isDiscrepancy = rec.status === 'DISCREPANCY';
                  const varianceLiters = Number(rec.varianceLiters);
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 text-slate-500">
                        {new Date(rec.reconciliationDate).toLocaleDateString('en-IN')}
                      </td>
                      <td className="p-3 font-semibold text-slate-800">
                        {rec.tank?.tankNumber}
                      </td>
                      <td className="p-3">{Number(rec.openingStock).toLocaleString()} L</td>
                      <td className="p-3 text-emerald-600 font-medium">
                        +{Number(rec.deliveriesReceived).toLocaleString()} L
                      </td>
                      <td className="p-3 text-rose-600 font-medium">
                        -{Number(rec.salesDeducted).toLocaleString()} L
                      </td>
                      <td className="p-3">
                        {Number(rec.adjustments) >= 0 ? `+${rec.adjustments}` : rec.adjustments} L
                      </td>
                      <td className="p-3 font-bold text-slate-900">
                        {Number(rec.expectedClosingStock).toLocaleString()} L
                      </td>
                      <td className="p-3 font-bold text-blue-700 bg-blue-50/50">
                        {Number(rec.physicalMeasuredStock).toLocaleString()} L
                      </td>
                      <td
                        className={`p-3 font-bold ${
                          isDiscrepancy ? 'text-rose-600' : 'text-slate-800'
                        }`}
                      >
                        {varianceLiters >= 0 ? `+${varianceLiters.toFixed(2)}` : varianceLiters.toFixed(2)} L
                      </td>
                      <td className="p-3 font-semibold">
                        {Number(rec.variancePercentage).toFixed(2)}%
                      </td>
                      <td className="p-3">
                        <Badge variant={isDiscrepancy ? 'danger' : 'success'}>
                          {rec.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-10 text-xs text-slate-400">
                    No physical stock reconciliation audits recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
