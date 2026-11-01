import React, { useState, useEffect } from 'react';
import { api } from '../services/api.js';
import { useStation } from '../context/StationContext.jsx';
import { Card, CardHeader, CardContent } from '../components/ui/Card.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { ReceiptModal } from '../components/ReceiptModal.jsx';
import {
  IndianRupee,
  Droplets,
  ReceiptText,
  TrendingUp,
  AlertTriangle,
  Clock,
  Truck,
  ArrowUpRight,
  ShieldCheck,
  RefreshCw,
  Fuel,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Dashboard = () => {
  const { activeStationId, activeStation } = useStation();
  const [timeframe, setTimeframe] = useState('today');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptSale, setSelectedReceiptSale] = useState(null);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/dashboard', { timeframe });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeStationId, timeframe]);

  const kpis = data?.kpis || {
    totalRevenue: 0,
    totalVolumeLiters: 0,
    transactionCount: 0,
    estimatedGrossMargin: 0,
    costOfGoodsSold: 0,
    totalExpenses: 0,
    estimatedNetProfit: 0,
  };

  const fuelDistributionColors = ['#2563eb', '#059669', '#d97706', '#7c3aed', '#0891b2'];

  return (
    <div className="space-y-6">
      {/* Top Banner & Timeframe Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Operational Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry, forecourt dispensing KPIs, and intelligent inventory monitoring
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Filter Buttons */}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs shadow-2xs">
            <button
              onClick={() => setTimeframe('today')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                timeframe === 'today'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeframe('7days')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                timeframe === '7days'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                timeframe === 'month'
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
          </div>

          <Button variant="outline" size="sm" onClick={fetchDashboard} isLoading={loading}>
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Revenue */}
        <Card className="hover:shadow-md transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Revenue
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                <IndianRupee className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                ₹{kpis.totalRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                <span>Calculated from verified sales</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Volume Sold */}
        <Card className="hover:shadow-md transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Volume Dispensed
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <Droplets className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {kpis.totalVolumeLiters.toLocaleString('en-IN')} <span className="text-sm font-normal text-slate-500">Liters</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Dispensed across all active pumps
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Transactions */}
        <Card className="hover:shadow-md transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Transactions
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <ReceiptText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 tracking-tight">
                {kpis.transactionCount}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Avg. ticket: ₹{kpis.transactionCount > 0 ? (kpis.totalRevenue / kpis.transactionCount).toFixed(0) : '0'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Estimated Gross Margin & Net Profit */}
        <Card className="hover:shadow-md transition">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Est. Gross Margin
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-purple-700 tracking-tight">
                ₹{kpis.estimatedGrossMargin.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Net: <b className="text-slate-800">₹{kpis.estimatedNetProfit.toFixed(0)}</b></span>
                <span className="text-slate-400">COGS: ₹{kpis.costOfGoodsSold.toFixed(0)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tank Inventory Status Bar Gauges */}
      <Card>
        <CardHeader
          title="Underground Tank Inventory & Real-Time Capacity"
          subtitle="Monitors bulk fuel reserves, threshold levels, and automated low-stock warnings"
        />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data?.tankSummaries?.map((tank) => (
              <div
                key={tank.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 truncate">{tank.tankNumber}</span>
                    <Badge variant={tank.isLow ? 'danger' : 'primary'}>
                      {tank.isLow ? 'LOW STOCK' : `${tank.utilizationPercentage}% Full`}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-1.5 mb-3">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: tank.colorCode }}
                    />
                    <span>{tank.fuelName}</span>
                  </div>
                </div>

                <div>
                  {/* Progress Bar Gauge */}
                  <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, tank.utilizationPercentage)}%`,
                        backgroundColor: tank.isLow ? '#e11d48' : tank.colorCode,
                      }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
                    <span>Current: <b className="text-slate-800">{tank.currentStockLiters.toLocaleString()} L</b></span>
                    <span>Cap: {tank.capacityLiters.toLocaleString()} L</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Visual Analytics Charts: Sales Trend & Fuel Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend (2 Cols) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Daily Sales & Volume Trends"
            subtitle="7-day aggregated operational revenue velocity and dispensed liters"
          />
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.salesTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(val) => [`₹${Number(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '8px', fontSize: '12px', border: '1px solid #e2e8f0' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Fuel Distribution (1 Col) */}
        <Card>
          <CardHeader
            title="Product Sales Share"
            subtitle="Volume dispensed by fuel type"
          />
          <CardContent className="pt-0 flex flex-col items-center justify-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data?.fuelDistribution || []}
                    dataKey="liters"
                    nameKey="name"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {(data?.fuelDistribution || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || fuelDistributionColors[index % fuelDistributionColors.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val) => [`${Number(val).toFixed(1)} L`, 'Volume']}
                    contentStyle={{ borderRadius: '8px', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="w-full space-y-1.5 mt-2">
              {(data?.fuelDistribution || []).map((f, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                    <span className="truncate">{f.name}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{Number(f.liters).toFixed(0)} L</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity: Sales Table and Active Shifts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Sales Transactions (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent Sales Transactions"
            subtitle="Verified forecourt dispensing events logged to database"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="p-3">Txn #</th>
                  <th className="p-3">Fuel</th>
                  <th className="p-3">Liters</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Method</th>
                  <th className="p-3 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.recentSales?.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-semibold text-slate-800">{sale.transactionNumber}</td>
                    <td className="p-3">{sale.fuelProduct?.name}</td>
                    <td className="p-3 font-semibold">{Number(sale.quantityLiters).toFixed(2)} L</td>
                    <td className="p-3 font-bold text-slate-900">₹{Number(sale.totalAmount).toFixed(2)}</td>
                    <td className="p-3">
                      <Badge variant="default">{sale.paymentMethod}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReceiptSale(sale)}
                      >
                        Receipt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Operational Highlights: Active Shifts & Deliveries (1 col) */}
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Active Attendant Shifts"
              subtitle="Staff members on duty"
            />
            <CardContent className="space-y-3">
              {data?.activeShifts?.length > 0 ? (
                data.activeShifts.map((shift) => (
                  <div
                    key={shift.id}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{shift.employee?.fullName}</div>
                      <div className="text-[11px] text-slate-500">
                        {shift.shiftName} Shift • Started {new Date(shift.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <Badge variant="success">IN PROGRESS</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  No active shifts in progress.
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader
              title="Recent Bulk Deliveries"
              subtitle="Supplier decanting logs"
            />
            <CardContent className="space-y-3">
              {data?.recentDeliveries?.slice(0, 3).map((del) => (
                <div
                  key={del.id}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/60 text-xs space-y-1"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800">{del.deliveryReference}</span>
                    <Badge variant={del.status === 'CONFIRMED' ? 'success' : 'warning'}>
                      {del.status}
                    </Badge>
                  </div>
                  <div className="text-slate-500 flex justify-between">
                    <span>{del.supplier?.name}</span>
                    <span className="font-semibold text-slate-900">
                      {Number(del.receivedQuantityLiters).toLocaleString()} L
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={!!selectedReceiptSale}
        onClose={() => setSelectedReceiptSale(null)}
        sale={selectedReceiptSale}
        stationName={activeStation?.name}
      />
    </div>
  );
};
