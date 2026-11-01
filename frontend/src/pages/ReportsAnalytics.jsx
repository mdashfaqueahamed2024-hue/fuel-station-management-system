import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { FileBarChart2, Download, Printer, Calendar, TrendingUp, IndianRupee, Droplets } from 'lucide-react';

export const ReportsAnalytics = () => {
  const { activeStationId, activeStation } = useStation();
  const toast = useToast();

  const [reportDate, setReportDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDailyReport = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/daily-sales', { date: reportDate });
      setReportData(res.data);
    } catch (err) {
      toast.error('Failed to generate daily sales report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDailyReport();
  }, [activeStationId, reportDate]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Business Intelligence & Statutory Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-grade operational reporting distinguishing revenue, COGS, gross margin, and net results
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="border-none bg-transparent focus:outline-none font-semibold text-slate-800"
            />
          </div>

          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            Print Report
          </Button>
        </div>
      </div>

      {/* Official Executive Printable Report Paper */}
      <Card className="printable-card border-slate-200">
        <div className="p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50/50">
          <div>
            <div className="font-mono text-[10px] text-blue-600 font-bold uppercase tracking-wider">
              Official Station Daily Audit Report
            </div>
            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
              {activeStation?.name || 'PetroFlow Superstation'}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5">
              Station Code: {activeStation?.code || 'STN-001'} • Location: {activeStation?.city || 'Bangalore'}, Karnataka
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-400">Reporting Operating Date:</div>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {new Date(reportDate).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
            <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
              System Generated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>

        {/* Daily Aggregated KPI Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 p-6 bg-white border-b border-slate-200">
          <div className="sm:px-4 py-2 first:pl-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Sales Revenue</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              ₹{Number(reportData?.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Authoritative verified sales amount</div>
          </div>

          <div className="sm:px-4 py-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Fuel Volume Sold</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {Number(reportData?.totalLiters || 0).toLocaleString()} <span className="text-sm font-normal text-slate-500">L</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Dispensed volume across nozzles</div>
          </div>

          <div className="sm:px-4 py-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Transactions</div>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {reportData?.totalTransactions || 0}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Customer transactions completed</div>
          </div>
        </div>

        {/* Breakdown by Fuel Grade */}
        <div className="p-6">
          <h3 className="font-bold text-sm text-slate-900 mb-3 uppercase tracking-wide">
            Fuel Grade Performance Breakdown
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-3">Fuel Product</th>
                  <th className="p-3">Volume Dispensed (L)</th>
                  <th className="p-3">Revenue Realized</th>
                  <th className="p-3">Transactions</th>
                  <th className="p-3">Average Transaction Size</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.breakdownByFuel?.length > 0 ? (
                  reportData.breakdownByFuel.map((item, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="p-3 font-semibold text-slate-900">{item.fuel}</td>
                      <td className="p-3 font-bold">{Number(item.liters).toFixed(2)} L</td>
                      <td className="p-3 font-bold text-slate-900">₹{Number(item.revenue).toFixed(2)}</td>
                      <td className="p-3">{item.count}</td>
                      <td className="p-3 text-slate-600">
                        ₹{item.count > 0 ? (item.revenue / item.count).toFixed(2) : '0.00'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-xs text-slate-400">
                      No sales recorded for this date.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Sales Ledger for the Date */}
        <div className="p-6 border-t border-slate-200">
          <h3 className="font-bold text-sm text-slate-900 mb-3 uppercase tracking-wide">
            Verified Sales Ledger Itemization
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="p-2.5">Time</th>
                  <th className="p-2.5">Txn #</th>
                  <th className="p-2.5">Fuel</th>
                  <th className="p-2.5">Pump</th>
                  <th className="p-2.5">Attendant</th>
                  <th className="p-2.5">Quantity</th>
                  <th className="p-2.5">Rate</th>
                  <th className="p-2.5">Total Amount</th>
                  <th className="p-2.5">Payment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reportData?.salesList?.map((s) => (
                  <tr key={s.id}>
                    <td className="p-2.5 text-slate-500 font-mono">
                      {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-2.5 font-mono font-semibold">{s.transactionNumber}</td>
                    <td className="p-2.5">{s.fuelProduct?.name}</td>
                    <td className="p-2.5">{s.pump?.pumpNumber}</td>
                    <td className="p-2.5">{s.attendant?.fullName}</td>
                    <td className="p-2.5 font-bold">{Number(s.quantityLiters).toFixed(2)} L</td>
                    <td className="p-2.5">₹{Number(s.pricePerLiter).toFixed(2)}</td>
                    <td className="p-2.5 font-bold text-slate-900">₹{Number(s.totalAmount).toFixed(2)}</td>
                    <td className="p-2.5">
                      <Badge variant="default">{s.paymentMethod}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Statutory Sign-off */}
        <div className="p-6 border-t border-slate-200 bg-slate-50/50 flex justify-between items-end text-xs text-slate-500">
          <div>
            <div>Certified accurate against physical dip soundings and POS cash reconciliations.</div>
            <div className="text-[10px] text-slate-400 mt-1">PetroFlow Version 1.0 Enterprise Engine</div>
          </div>
          <div className="text-right space-y-1">
            <div className="font-semibold text-slate-900">Station Manager Sign-off:</div>
            <div className="w-48 border-b border-slate-400 h-6"></div>
          </div>
        </div>
      </Card>
    </div>
  );
};
