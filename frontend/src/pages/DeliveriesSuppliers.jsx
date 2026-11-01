import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { Truck, CheckCircle2, AlertTriangle, Download, Plus, Building2, FileText } from 'lucide-react';

export const DeliveriesSuppliers = () => {
  const { activeStationId } = useStation();
  const { isManager } = useAuth();
  const toast = useToast();

  const [deliveries, setDeliveries] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [tanks, setTanks] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Delivery Modal State
  const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    supplierId: '',
    destinationTankId: '',
    deliveryReference: '',
    invoiceNumber: '',
    orderedQuantityLiters: '',
    receivedQuantityLiters: '',
    unitCost: '',
    notes: '',
  });
  const [deliverySubmitting, setDeliverySubmitting] = useState(false);

  // New Supplier Modal State
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
  });
  const [supplierSubmitting, setSupplierSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [delRes, supRes, tankRes] = await Promise.all([
        api.get('/deliveries'),
        api.get('/suppliers'),
        api.get('/tanks'),
      ]);
      setDeliveries(delRes.data || []);
      setSuppliers(supRes.data || []);
      setTanks(tankRes.data || []);
    } catch (err) {
      toast.error('Failed to load delivery records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeStationId]);

  const handleConfirmDelivery = async (deliveryId) => {
    try {
      await api.post(`/deliveries/${deliveryId}/confirm`);
      toast.success('Delivery confirmed! Destination tank stock incremented and movement recorded.');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Confirmation failed');
    }
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setDeliverySubmitting(true);
    try {
      const tank = tanks.find((t) => t.id === deliveryForm.destinationTankId);
      if (!tank) throw new Error('Please select destination storage tank');

      await api.post('/deliveries', {
        ...deliveryForm,
        fuelProductId: tank.fuelProductId,
        orderedQuantityLiters: parseFloat(deliveryForm.orderedQuantityLiters),
        receivedQuantityLiters: parseFloat(deliveryForm.receivedQuantityLiters),
        unitCost: parseFloat(deliveryForm.unitCost),
      });

      toast.success('Delivery recorded in PENDING status. Awaiting decanting confirmation.');
      setIsDeliveryModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to record delivery');
    } finally {
      setDeliverySubmitting(false);
    }
  };

  const handleCreateSupplier = async (e) => {
    e.preventDefault();
    setSupplierSubmitting(true);
    try {
      await api.post('/suppliers', supplierForm);
      toast.success('Supplier profile registered successfully.');
      setIsSupplierModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create supplier');
    } finally {
      setSupplierSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.downloadCSV('/deliveries/export/csv', 'deliveries-report.csv');
      toast.success('Deliveries report downloaded.');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Bulk Deliveries & Fuel Suppliers
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log bulk tanker consignments, track invoice discrepancies, and confirm tank decanting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>

          {isManager && (
            <>
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsSupplierModalOpen(true)}
              >
                <Building2 className="w-4 h-4 mr-1" />
                Add Supplier
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={() => setIsDeliveryModalOpen(true)}
              >
                <Plus className="w-4 h-4 mr-1" />
                Log Delivery
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Deliveries Consignments Ledger */}
      <Card>
        <CardHeader
          title="Bulk Consignment & Decanting Ledger"
          subtitle="Stock is credited only when an authorized employee verifies dip and confirms receipt"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Reference #</th>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Supplier</th>
                <th className="p-3">Fuel Grade</th>
                <th className="p-3">Dest. Tank</th>
                <th className="p-3">Ordered (L)</th>
                <th className="p-3">Received (L)</th>
                <th className="p-3">Discrepancy</th>
                <th className="p-3">Cost/L</th>
                <th className="p-3">Total Cost</th>
                <th className="p-3">Status</th>
                {isManager && <th className="p-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deliveries.length > 0 ? (
                deliveries.map((del) => {
                  const hasDiscrepancy = Math.abs(Number(del.discrepancyLiters || 0)) > 50;
                  return (
                    <tr key={del.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3 font-mono font-bold text-slate-900">{del.deliveryReference}</td>
                      <td className="p-3 text-slate-600">{del.invoiceNumber}</td>
                      <td className="p-3 font-medium text-slate-800">{del.supplier?.name}</td>
                      <td className="p-3">{del.fuelProduct?.name}</td>
                      <td className="p-3 font-semibold">{del.destinationTank?.tankNumber}</td>
                      <td className="p-3">{Number(del.orderedQuantityLiters).toLocaleString()} L</td>
                      <td className="p-3 font-bold text-slate-900">
                        {Number(del.receivedQuantityLiters).toLocaleString()} L
                      </td>
                      <td
                        className={`p-3 font-semibold ${
                          hasDiscrepancy ? 'text-rose-600 font-bold' : 'text-slate-500'
                        }`}
                      >
                        {Number(del.discrepancyLiters).toFixed(2)} L
                      </td>
                      <td className="p-3">₹{Number(del.unitCost).toFixed(2)}</td>
                      <td className="p-3 font-bold text-slate-900">
                        ₹{Number(del.totalCost).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3">
                        <Badge variant={del.status === 'CONFIRMED' ? 'success' : 'warning'}>
                          {del.status}
                        </Badge>
                      </td>
                      {isManager && (
                        <td className="p-3 text-right">
                          {del.status === 'PENDING' ? (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleConfirmDelivery(del.id)}
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                              Confirm
                            </Button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Decanted</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="12" className="text-center py-10 text-xs text-slate-400">
                    No bulk delivery records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Supplier Directory */}
      <Card>
        <CardHeader
          title="Authorized Oil Refineries & Bulk Logistics Suppliers"
          subtitle="Wholesale petroleum partners registered with station"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-5">
          {suppliers.map((sup) => (
            <div key={sup.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{sup.name}</span>
                <Badge variant="primary">ACTIVE</Badge>
              </div>
              <div className="text-xs text-slate-600 space-y-0.5">
                <div>Contact: <b>{sup.contactPerson || 'Logistics Office'}</b></div>
                <div>Phone: {sup.phone}</div>
                <div>GSTIN: <span className="font-mono text-[11px]">{sup.taxId || 'N/A'}</span></div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Log Delivery Modal */}
      <Modal
        isOpen={isDeliveryModalOpen}
        onClose={() => setIsDeliveryModalOpen(false)}
        title="Record New Bulk Consignment Delivery"
        subtitle="Delivery status will stay PENDING until authorized decanting confirmation"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateDelivery} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fuel Supplier
              </label>
              <select
                required
                value={deliveryForm.supplierId}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, supplierId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Destination Storage Tank
              </label>
              <select
                required
                value={deliveryForm.destinationTankId}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, destinationTankId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Tank...</option>
                {tanks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.tankNumber} ({t.fuelProduct?.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Consignment Reference #
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DEL-2026-NOV-001"
                value={deliveryForm.deliveryReference}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, deliveryReference: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Supplier Invoice / Challan #
              </label>
              <input
                type="text"
                required
                placeholder="e.g. INV-IOCL-99881"
                value={deliveryForm.invoiceNumber}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, invoiceNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ordered Volume (L)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="10000"
                value={deliveryForm.orderedQuantityLiters}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, orderedQuantityLiters: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Received Dip (L)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="9980"
                value={deliveryForm.receivedQuantityLiters}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, receivedQuantityLiters: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Unit Wholesale Cost (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="84.50"
                value={deliveryForm.unitCost}
                onChange={(e) => setDeliveryForm({ ...deliveryForm, unitCost: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Decanting Notes & Density Check Observation
            </label>
            <textarea
              rows="2"
              value={deliveryForm.notes}
              onChange={(e) => setDeliveryForm({ ...deliveryForm, notes: e.target.value })}
              placeholder="e.g. Tanker registration KA-04-1234, density @ 15°C verified at 832 kg/m³..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDeliveryModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={deliverySubmitting}>
              Log Delivery
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Register New Fuel Supplier"
        subtitle="Onboards wholesale oil marketing company"
      >
        <form onSubmit={handleCreateSupplier} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Company Name</label>
            <input
              type="text"
              required
              value={supplierForm.name}
              onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Officer</label>
            <input
              type="text"
              value={supplierForm.contactPerson}
              onChange={(e) => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              required
              value={supplierForm.phone}
              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">GSTIN / Tax ID</label>
            <input
              type="text"
              value={supplierForm.taxId}
              onChange={(e) => setSupplierForm({ ...supplierForm, taxId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsSupplierModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={supplierSubmitting}>Register Supplier</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
