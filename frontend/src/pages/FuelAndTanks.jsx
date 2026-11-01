import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Fuel, SlidersHorizontal, AlertTriangle, ArrowUpDown, History } from 'lucide-react';

export const FuelAndTanks = () => {
  const { activeStationId } = useStation();
  const { isManager } = useAuth();
  const toast = useToast();

  const [tanks, setTanks] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);

  // Price Modal State
  const [editingFuel, setEditingFuel] = useState(null);
  const [priceForm, setPriceForm] = useState({ currentPrice: '', costPrice: '' });
  const [priceSubmitting, setPriceSubmitting] = useState(false);

  // Adjustment Modal State
  const [adjustingTank, setAdjustingTank] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    adjustmentType: 'NEGATIVE',
    quantityLiters: '',
    reason: 'EVAPORATION',
    notes: '',
  });
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tanksRes, fuelsRes, movesRes] = await Promise.all([
        api.get('/tanks'),
        api.get('/fuels'),
        api.get('/tanks/movements'),
      ]);
      setTanks(tanksRes.data || []);
      setFuels(fuelsRes.data || []);
      setMovements(movesRes.data || []);
    } catch (err) {
      toast.error('Failed to load inventory data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeStationId]);

  const handleOpenPriceModal = (fuel) => {
    setEditingFuel(fuel);
    setPriceForm({
      currentPrice: fuel.currentPrice,
      costPrice: fuel.costPrice,
    });
  };

  const handleUpdatePrice = async (e) => {
    e.preventDefault();
    setPriceSubmitting(true);
    try {
      await api.patch(`/fuels/${editingFuel.id}/price`, {
        currentPrice: parseFloat(priceForm.currentPrice),
        costPrice: parseFloat(priceForm.costPrice),
      });
      toast.success(`Selling price for ${editingFuel.name} updated!`);
      setEditingFuel(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Price update failed');
    } finally {
      setPriceSubmitting(false);
    }
  };

  const handleOpenAdjustModal = (tank) => {
    setAdjustingTank(tank);
    setAdjustForm({
      adjustmentType: 'NEGATIVE',
      quantityLiters: '',
      reason: 'EVAPORATION',
      notes: '',
    });
  };

  const handleApplyAdjustment = async (e) => {
    e.preventDefault();
    setAdjustSubmitting(true);
    try {
      await api.post('/tanks/adjust', {
        tankId: adjustingTank.id,
        fuelProductId: adjustingTank.fuelProductId,
        adjustmentType: adjustForm.adjustmentType,
        quantityLiters: parseFloat(adjustForm.quantityLiters),
        reason: adjustForm.reason,
        notes: adjustForm.notes,
      });
      toast.success('Stock adjustment applied and movement recorded.');
      setAdjustingTank(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Stock adjustment rejected');
    } finally {
      setAdjustSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Fuel Inventory & Storage Tanks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure fuel pricing, monitor subterranean tank utilization, and record verified stock adjustments
          </p>
        </div>
      </div>

      {/* Fuel Products & Retail Rates Card */}
      <Card>
        <CardHeader
          title="Configured Fuel Products & Selling Rates"
          subtitle="Real-time retail price and purchase wholesale costs"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Fuel Name</th>
                <th className="p-3">Type</th>
                <th className="p-3">Retail Price/Liter</th>
                <th className="p-3">Purchase Cost/Liter</th>
                <th className="p-3">Gross Spread/L</th>
                <th className="p-3">Low-Stock Alert Threshold</th>
                {isManager && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {fuels.map((fuel) => {
                const spread = Number(fuel.currentPrice) - Number(fuel.costPrice);
                return (
                  <tr key={fuel.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-semibold text-slate-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: fuel.colorCode }} />
                      {fuel.name}
                    </td>
                    <td className="p-3">
                      <Badge variant="default">{fuel.fuelType}</Badge>
                    </td>
                    <td className="p-3 font-bold text-slate-900 text-sm">
                      ₹{Number(fuel.currentPrice).toFixed(2)}
                    </td>
                    <td className="p-3 text-slate-500">₹{Number(fuel.costPrice).toFixed(2)}</td>
                    <td className="p-3 font-semibold text-emerald-600">+₹{spread.toFixed(2)}/L</td>
                    <td className="p-3">{Number(fuel.lowStockThreshold).toLocaleString()} L</td>
                    {isManager && (
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPriceModal(fuel)}
                        >
                          Update Rate
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Underground Storage Tanks Grid */}
      <Card>
        <CardHeader
          title="Physical Storage Tanks & Capacity Gauges"
          subtitle="Real-time physical dip volume vs nominal rated capacity"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {tanks.map((tank) => (
              <div
                key={tank.id}
                className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-xs text-slate-900">{tank.tankNumber}</span>
                    <Badge variant={tank.isLowStock ? 'danger' : 'primary'}>
                      {tank.isLowStock ? 'LOW STOCK' : `${tank.utilizationPercentage}%`}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 mb-4 flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tank.fuelProduct?.colorCode }}
                    />
                    <span>{tank.fuelProduct?.name}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Gauge */}
                  <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, tank.utilizationPercentage)}%`,
                        backgroundColor: tank.isLowStock ? '#e11d48' : tank.fuelProduct?.colorCode,
                      }}
                    />
                  </div>

                  <div className="text-[11px] text-slate-600 space-y-1">
                    <div className="flex justify-between">
                      <span>Available Stock:</span>
                      <span className="font-bold text-slate-900">{tank.currentStockLiters.toLocaleString()} L</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rated Capacity:</span>
                      <span>{tank.capacityLiters.toLocaleString()} L</span>
                    </div>
                  </div>

                  {isManager && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleOpenAdjustModal(tank)}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 mr-1" />
                      Adjust Inventory
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Movement History Table */}
      <Card>
        <CardHeader
          title="Stock Movement Ledger (Audit Log)"
          subtitle="Every fuel transaction, decanting delivery, and manual calibration adjustment"
        />
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Tank</th>
                <th className="p-3">Fuel</th>
                <th className="p-3">Type</th>
                <th className="p-3">Quantity</th>
                <th className="p-3">Balance After</th>
                <th className="p-3">Operational Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.map((move) => {
                const isPositive = Number(move.quantityLiters) > 0;
                return (
                  <tr key={move.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 text-slate-500">
                      {new Date(move.createdAt).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{move.tank?.tankNumber}</td>
                    <td className="p-3">{move.fuelProduct?.name}</td>
                    <td className="p-3">
                      <Badge
                        variant={
                          move.movementType === 'DELIVERY'
                            ? 'success'
                            : move.movementType === 'SALE'
                            ? 'default'
                            : move.movementType === 'REVERSAL'
                            ? 'purple'
                            : 'warning'
                        }
                      >
                        {move.movementType}
                      </Badge>
                    </td>
                    <td
                      className={`p-3 font-bold ${
                        isPositive ? 'text-emerald-600' : 'text-slate-800'
                      }`}
                    >
                      {isPositive ? `+${move.quantityLiters}` : move.quantityLiters} L
                    </td>
                    <td className="p-3 font-semibold text-slate-900">
                      {Number(move.balanceAfterLiters).toLocaleString()} L
                    </td>
                    <td className="p-3 text-slate-500 max-w-xs truncate">{move.notes || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Fuel Price Modal */}
      <Modal
        isOpen={!!editingFuel}
        onClose={() => setEditingFuel(null)}
        title={`Update Pricing: ${editingFuel?.name}`}
        subtitle="Changes are immediately logged to immutable audit trail"
      >
        <form onSubmit={handleUpdatePrice} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              New Selling Price per Liter (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={priceForm.currentPrice}
              onChange={(e) => setPriceForm({ ...priceForm, currentPrice: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Purchase Wholesale Cost per Liter (₹)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={priceForm.costPrice}
              onChange={(e) => setPriceForm({ ...priceForm, costPrice: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setEditingFuel(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={priceSubmitting}>
              Apply New Rates
            </Button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={!!adjustingTank}
        onClose={() => setAdjustingTank(null)}
        title={`Authorize Stock Adjustment: ${adjustingTank?.tankNumber}`}
        subtitle="Mandatory accountability recording for physical variance corrections"
      >
        <form onSubmit={handleApplyAdjustment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjustment Direction
            </label>
            <select
              value={adjustForm.adjustmentType}
              onChange={(e) => setAdjustForm({ ...adjustForm, adjustmentType: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="NEGATIVE">Negative Adjustment (Volume Reduction / Shrinkage)</option>
              <option value="POSITIVE">Positive Adjustment (Volume Addition / Overage)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Adjustment Quantity (Liters)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              value={adjustForm.quantityLiters}
              onChange={(e) => setAdjustForm({ ...adjustForm, quantityLiters: e.target.value })}
              placeholder="e.g. 50.00"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Official Justification / Reason
            </label>
            <select
              value={adjustForm.reason}
              onChange={(e) => setAdjustForm({ ...adjustForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="EVAPORATION">Evaporation & Temperature Shrinkage</option>
              <option value="CALIBRATION_DISCREPANCY">Dispenser Calibration Discrepancy</option>
              <option value="AUDIT_CORRECTION">Audit Reconciliation Correction</option>
              <option value="SPILLAGE">Forecourt Spillage / Sampling Waste</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Supervisor Notes & Sounding Dip Reference
            </label>
            <textarea
              rows="3"
              value={adjustForm.notes}
              onChange={(e) => setAdjustForm({ ...adjustForm, notes: e.target.value })}
              placeholder="Describe physical dip tape reading, calibration certificate number, or specific observation..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setAdjustingTank(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={adjustSubmitting}>
              Apply & Log Audit
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
