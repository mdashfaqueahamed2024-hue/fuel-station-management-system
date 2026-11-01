import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Modal } from '../components/ui/Modal.jsx';
import { ReceiptModal } from '../components/ReceiptModal.jsx';
import {
  CircleDollarSign,
  Plus,
  Download,
  Search,
  Filter,
  Printer,
  RotateCcw,
  AlertCircle,
  CreditCard,
  QrCode,
  Banknote,
  Truck,
} from 'lucide-react';

export const SalesBilling = () => {
  const { activeStationId, activeStation } = useStation();
  const { isManager, user } = useAuth();
  const toast = useToast();

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFuel, setFilterFuel] = useState('');
  const [filterMethod, setFilterMethod] = useState('');

  // Dropdown reference data
  const [pumps, setPumps] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [customers, setCustomers] = useState([]);

  // New Sale Modal State
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [saleForm, setSaleForm] = useState({
    pumpId: '',
    quantityLiters: '',
    discountAmount: '0',
    paymentMethod: 'CASH',
    customerId: '',
    attendantId: '',
  });
  const [saleSubmitting, setSaleSubmitting] = useState(false);

  // Active pump/fuel preview
  const [selectedPumpObj, setSelectedPumpObj] = useState(null);

  // Receipt Modal State
  const [receiptSale, setReceiptSale] = useState(null);

  // Reversal Modal State
  const [reversingSale, setReversingSale] = useState(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reverseSubmitting, setReverseSubmitting] = useState(false);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales', {
        search,
        fuelProductId: filterFuel,
        paymentMethod: filterMethod,
      });
      setSales(res.data?.sales || []);
    } catch (err) {
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [pumpsRes, empRes, custRes] = await Promise.all([
        api.get('/pumps'),
        api.get('/employees'),
        api.get('/customers'),
      ]);
      const activePumps = (pumpsRes.data || []).filter((p) => p.status === 'ACTIVE');
      setPumps(activePumps);
      setEmployees(empRes.data || []);
      setCustomers(custRes.data || []);

      if (activePumps.length > 0 && !saleForm.pumpId) {
        setSaleForm((prev) => ({
          ...prev,
          pumpId: activePumps[0].id,
          attendantId: empRes.data?.[0]?.id || '',
        }));
        setSelectedPumpObj(activePumps[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSales();
    fetchDependencies();
  }, [activeStationId]);

  const handlePumpSelect = (pumpId) => {
    const pump = pumps.find((p) => p.id === pumpId);
    setSelectedPumpObj(pump || null);
    setSaleForm((prev) => ({ ...prev, pumpId }));
  };

  const handleCreateSale = async (e) => {
    e.preventDefault();
    if (!selectedPumpObj) {
      toast.error('Please select an active fuel dispenser pump');
      return;
    }

    setSaleSubmitting(true);
    try {
      const fuel = selectedPumpObj.tank?.fuelProduct;
      const res = await api.post('/sales', {
        pumpId: selectedPumpObj.id,
        fuelProductId: fuel.id,
        tankId: selectedPumpObj.tankId,
        attendantId: saleForm.attendantId || employees[0]?.id,
        customerId: saleForm.customerId || null,
        quantityLiters: parseFloat(saleForm.quantityLiters),
        pricePerLiter: parseFloat(fuel.currentPrice),
        discountAmount: parseFloat(saleForm.discountAmount || 0),
        paymentMethod: saleForm.paymentMethod,
      });

      toast.success(`Sale completed! Txn: ${res.data.transactionNumber}`);
      setIsNewSaleOpen(false);
      setReceiptSale(res.data);
      fetchSales();
    } catch (err) {
      toast.error(err.message || 'Sale execution failed');
    } finally {
      setSaleSubmitting(false);
    }
  };

  const handleReverseSale = async (e) => {
    e.preventDefault();
    setReverseSubmitting(true);
    try {
      await api.post(`/sales/${reversingSale.id}/reverse`, {
        reason: reversalReason,
      });
      toast.success('Sale successfully reversed and fuel returned to inventory.');
      setReversingSale(null);
      setReversalReason('');
      fetchSales();
    } catch (err) {
      toast.error(err.message || 'Reversal failed');
    } finally {
      setReverseSubmitting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      await api.downloadCSV('/sales/export/csv', 'petroflow-sales-ledger.csv');
      toast.success('Sales ledger exported as CSV.');
    } catch (err) {
      toast.error('Failed to export CSV');
    }
  };

  // Live calculations for quick POS modal
  const fuel = selectedPumpObj?.tank?.fuelProduct;
  const currentPrice = Number(fuel?.currentPrice || 0);
  const qty = parseFloat(saleForm.quantityLiters || 0);
  const discount = parseFloat(saleForm.discountAmount || 0);
  const calculatedSubtotal = Math.max(0, qty * currentPrice);
  const calculatedFinal = Math.max(0, calculatedSubtotal - discount);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Sales & Point-of-Sale Billing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Process fuel transactions with ACID inventory locking, audit logging, and automated receipts
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5 mr-1" />
            Export CSV
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={() => setIsNewSaleOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Fuel Dispense
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <div className="p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by transaction #, attendant name, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchSales()}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={filterMethod}
              onChange={(e) => setFilterMethod(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs text-slate-700 bg-white"
            >
              <option value="">All Payment Modes</option>
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CARD">Card</option>
              <option value="FLEET_CREDIT">Fleet Credit</option>
            </select>

            <Button variant="secondary" size="sm" onClick={fetchSales}>
              <Filter className="w-3.5 h-3.5 mr-1" />
              Filter
            </Button>
          </div>
        </div>
      </Card>

      {/* Sales Transactions History Table */}
      <Card>
        <CardHeader
          title="Authoritative Sales Ledger"
          subtitle="Showing recent completed transactions and reconciliations"
        />
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-3">Txn #</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Fuel Grade</th>
                <th className="p-3">Pump</th>
                <th className="p-3">Attendant</th>
                <th className="p-3">Volume (L)</th>
                <th className="p-3">Rate (₹/L)</th>
                <th className="p-3">Total Amount</th>
                <th className="p-3">Method</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length > 0 ? (
                sales.map((sale) => {
                  const isReversed = sale.paymentStatus === 'REVERSED';
                  return (
                    <tr
                      key={sale.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isReversed ? 'bg-rose-50/40 text-slate-400' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-slate-900">
                        {sale.transactionNumber}
                      </td>
                      <td className="p-3 text-slate-500">
                        {new Date(sale.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 font-medium text-slate-800">
                        {sale.fuelProduct?.name}
                      </td>
                      <td className="p-3 font-semibold">{sale.pump?.pumpNumber}</td>
                      <td className="p-3">{sale.attendant?.fullName || 'Attendant'}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {Number(sale.quantityLiters).toFixed(2)} L
                      </td>
                      <td className="p-3 text-slate-500">
                        ₹{Number(sale.pricePerLiter).toFixed(2)}
                      </td>
                      <td className="p-3 font-bold text-slate-900 text-sm">
                        ₹{Number(sale.totalAmount).toFixed(2)}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            sale.paymentMethod === 'UPI'
                              ? 'primary'
                              : sale.paymentMethod === 'FLEET_CREDIT'
                              ? 'purple'
                              : 'default'
                          }
                        >
                          {sale.paymentMethod}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={isReversed ? 'danger' : 'success'}>
                          {sale.paymentStatus}
                        </Badge>
                      </td>
                      <td className="p-3 text-right space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReceiptSale(sale)}
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </Button>
                        {isManager && !isReversed && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                            onClick={() => {
                              setReversingSale(sale);
                              setReversalReason('');
                            }}
                            title="Reverse Sale & Restore Inventory"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="11" className="text-center py-10 text-xs text-slate-400">
                    No sales transactions found matching query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Fuel Dispenser POS Modal */}
      <Modal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
        title="Execute Point-of-Sale Fuel Dispense"
        subtitle="Calculates monetary balance and validates inventory before commit"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleCreateSale} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Pump Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispenser Pump
              </label>
              <select
                required
                value={saleForm.pumpId}
                onChange={(e) => handlePumpSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {pumps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.pumpNumber} — {p.tank?.fuelProduct?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Attendant Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dispensing Attendant
              </label>
              <select
                required
                value={saleForm.attendantId}
                onChange={(e) => setSaleForm({ ...saleForm, attendantId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Fuel Rate Telemetry Banner */}
          {selectedPumpObj && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-bold text-blue-600">
                  Fuel Product & Source Tank
                </div>
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: fuel?.colorCode }}
                  />
                  <span>{fuel?.name}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Available in tank: {Number(selectedPumpObj.tank?.currentStockLiters).toLocaleString()} L
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-slate-400">Current Rate</div>
                <div className="text-lg font-black text-blue-700">₹{currentPrice.toFixed(2)}/L</div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Quantity in Liters */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Volume to Dispense (Liters)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.05"
                required
                placeholder="e.g. 25.00"
                value={saleForm.quantityLiters}
                onChange={(e) => setSaleForm({ ...saleForm, quantityLiters: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 font-bold"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Method
              </label>
              <select
                value={saleForm.paymentMethod}
                onChange={(e) => setSaleForm({ ...saleForm, paymentMethod: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash Payment</option>
                <option value="UPI">UPI Digital (QR Code)</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="FLEET_CREDIT">Commercial Fleet Credit Account</option>
              </select>
            </div>
          </div>

          {/* Customer Selection (Optional / Required for Fleet Credit) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Customer Account (Optional / Mandatory for Fleet Credit)
            </label>
            <select
              value={saleForm.customerId}
              onChange={(e) => setSaleForm({ ...saleForm, customerId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Walk-in Retail Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.companyName ? `(${c.companyName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Monetary Summary */}
          <div className="p-4 rounded-xl bg-slate-900 text-white space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Subtotal ({qty.toFixed(2)} L × ₹{currentPrice.toFixed(2)}):</span>
              <span>₹{calculatedSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-base font-bold text-white pt-1 border-t border-slate-800">
              <span>Final Payable:</span>
              <span className="text-xl text-amber-400">₹{calculatedFinal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsNewSaleOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="lg"
              isLoading={saleSubmitting}
              disabled={qty <= 0}
            >
              Confirm Dispense & Print
            </Button>
          </div>
        </form>
      </Modal>

      {/* Sale Reversal Modal */}
      <Modal
        isOpen={!!reversingSale}
        onClose={() => setReversingSale(null)}
        title={`Authorize Sale Reversal: ${reversingSale?.transactionNumber}`}
        subtitle="This action will return the dispensed liters back into the storage tank"
      >
        <form onSubmit={handleReverseSale} className="space-y-4">
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 leading-relaxed">
            <b>Warning:</b> This will reverse financial transaction of{' '}
            <b>₹{reversingSale?.totalAmount}</b> and restore{' '}
            <b>{reversingSale?.quantityLiters} Liters</b> to tank{' '}
            <b>{reversingSale?.tank?.tankNumber}</b>. It is an immutable audited event.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mandatory Reason for Cancellation
            </label>
            <textarea
              rows="3"
              required
              value={reversalReason}
              onChange={(e) => setReversalReason(e.target.value)}
              placeholder="e.g. Customer card declined at POS, dispenser calibration test volume, accidental duplicate entry..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setReversingSale(null)}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" isLoading={reverseSubmitting}>
              Execute Reversal
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!receiptSale}
        onClose={() => setReceiptSale(null)}
        sale={receiptSale}
        stationName={activeStation?.name}
      />
    </div>
  );
};
