import { getMockStore, updateMockStore } from './mockData.js';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

const getHeaders = () => {
  const headers = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('petroflow_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const stationId = localStorage.getItem('petroflow_station_id');
  if (stationId) {
    headers['x-station-id'] = stationId;
  }
  return headers;
};

// Fallback Mock Dispatcher for mobile devices or static cloud deployments without direct backend connectivity
const handleMockFallback = (endpoint, method = 'GET', body = null, params = {}) => {
  const store = getMockStore();

  // 1. Auth endpoints
  if (endpoint === '/auth/login' && method === 'POST') {
    const { email } = body || {};
    let role = 'ATTENDANT';
    let fullName = 'Rahul Verma (Pump Specialist)';
    if (email?.includes('admin')) {
      role = 'ADMIN';
      fullName = 'Vikramaditya Rathore (Chief Operating Officer)';
    } else if (email?.includes('manager')) {
      role = 'MANAGER';
      fullName = 'Anita Sharma (Station General Manager)';
    }

    const user = {
      id: `usr-${role.toLowerCase()}`,
      email: email || 'demo@petroflow.com',
      fullName,
      role,
      stationId: 'stn-001',
      stationName: 'PetroFlow Flagship Highway Superstation',
    };
    return {
      success: true,
      data: {
        token: `mock-jwt-${Date.now()}`,
        user,
      },
    };
  }

  if (endpoint === '/auth/me') {
    const saved = localStorage.getItem('petroflow_user');
    return { success: true, data: saved ? JSON.parse(saved) : store.employees[0] };
  }

  if (endpoint === '/auth/logout') {
    return { success: true, data: null };
  }

  // 2. Stations
  if (endpoint === '/stations') {
    return { success: true, data: store.stations };
  }

  // 3. Dashboard
  if (endpoint === '/reports/dashboard') {
    const totalRev = store.sales.reduce((sum, s) => sum + (s.paymentStatus === 'COMPLETED' ? Number(s.totalAmount) : 0), 0);
    const totalVol = store.sales.reduce((sum, s) => sum + (s.paymentStatus === 'COMPLETED' ? Number(s.quantityLiters) : 0), 0);
    const cogs = totalVol * 92.5;
    const grossMargin = totalRev - cogs;
    const totalExpenses = store.expenses.filter(e => e.approvalStatus === 'APPROVED').reduce((sum, e) => sum + Number(e.amount), 0);

    return {
      success: true,
      data: {
        kpis: {
          totalRevenue: totalRev,
          totalVolumeLiters: totalVol,
          transactionCount: store.sales.length,
          costOfGoodsSold: cogs,
          estimatedGrossMargin: grossMargin,
          totalExpenses,
          estimatedNetProfit: grossMargin - totalExpenses,
        },
        tankSummaries: store.tanks,
        fuelDistribution: [
          { name: 'Regular Petrol (RON 91)', liters: Math.round(totalVol * 0.45), color: '#2563eb' },
          { name: 'High-Speed Diesel (BS-VI)', liters: Math.round(totalVol * 0.40), color: '#059669' },
          { name: 'Power 95 Premium', liters: Math.round(totalVol * 0.15), color: '#d97706' },
        ],
        salesTrend: [
          { date: 'Oct 26', revenue: 42000, liters: 410 },
          { date: 'Oct 27', revenue: 58000, liters: 560 },
          { date: 'Oct 28', revenue: 51000, liters: 500 },
          { date: 'Oct 29', revenue: 64000, liters: 620 },
          { date: 'Oct 30', revenue: 72000, liters: 710 },
          { date: 'Oct 31', revenue: 69000, liters: 680 },
          { date: 'Nov 01', revenue: Math.round(totalRev), liters: Math.round(totalVol) },
        ],
        recentSales: store.sales.slice(0, 6),
        recentDeliveries: store.deliveries.slice(0, 3),
        activeShifts: store.shifts.filter(s => s.status === 'OPEN'),
        activeAlerts: store.alerts.filter(a => a.status === 'ACTIVE'),
      },
    };
  }

  // 4. Fuels & Tanks
  if (endpoint === '/fuels') return { success: true, data: store.fuels };
  if (endpoint.startsWith('/fuels/') && endpoint.endsWith('/price') && method === 'PATCH') {
    const id = endpoint.split('/')[2];
    updateMockStore(prev => ({
      ...prev,
      fuels: prev.fuels.map(f => f.id === id ? { ...f, currentPrice: body.currentPrice } : f),
    }));
    return { success: true, message: 'Price updated' };
  }

  if (endpoint === '/tanks') return { success: true, data: store.tanks };
  if (endpoint === '/tanks/movements') return { success: true, data: store.stockMovements };
  if (endpoint === '/tanks/adjust' && method === 'POST') {
    const { tankId, quantityLiters, adjustmentType, reason, notes } = body;
    const qty = parseFloat(quantityLiters);
    updateMockStore(prev => {
      const tank = prev.tanks.find(t => t.id === tankId);
      const newStock = adjustmentType === 'POSITIVE' ? tank.currentStockLiters + qty : tank.currentStockLiters - qty;
      return {
        ...prev,
        tanks: prev.tanks.map(t => t.id === tankId ? { ...t, currentStockLiters: newStock } : t),
        stockMovements: [
          {
            id: `mov-${Date.now()}`,
            createdAt: new Date().toISOString(),
            tank: { tankNumber: tank?.tankNumber || 'Tank' },
            fuelProduct: tank?.fuelProduct,
            movementType: 'ADJUSTMENT',
            quantityLiters: adjustmentType === 'POSITIVE' ? qty : -qty,
            balanceAfterLiters: newStock,
            notes: `Manual adjustment: ${reason}. ${notes || ''}`,
          },
          ...prev.stockMovements,
        ],
      };
    });
    return { success: true, message: 'Stock adjusted' };
  }

  // 5. Pumps
  if (endpoint === '/pumps') return { success: true, data: store.pumps };
  if (endpoint.startsWith('/pumps/') && endpoint.endsWith('/status') && method === 'PATCH') {
    const id = endpoint.split('/')[2];
    updateMockStore(prev => ({
      ...prev,
      pumps: prev.pumps.map(p => p.id === id ? { ...p, status: body.status } : p),
    }));
    return { success: true, message: 'Status updated' };
  }

  // 6. Sales
  if (endpoint === '/sales') {
    if (method === 'GET') {
      return { success: true, data: { sales: store.sales } };
    }
    if (method === 'POST') {
      const { pumpId, quantityLiters, pricePerLiter, paymentMethod, customerId, attendantId } = body;
      const pump = store.pumps.find(p => p.id === pumpId);
      const attendant = store.employees.find(e => e.id === attendantId) || store.employees[0];
      const customer = store.customers.find(c => c.id === customerId);
      const qty = parseFloat(quantityLiters);
      const rate = parseFloat(pricePerLiter);
      const total = qty * rate;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const txnNumber = `TXN-${dateStr}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newSale = {
        id: `sale-${Date.now()}`,
        transactionNumber: txnNumber,
        createdAt: new Date().toISOString(),
        fuelProduct: pump?.tank?.fuelProduct || { name: 'Fuel' },
        pump: { pumpNumber: pump?.pumpNumber || 'PUMP-01' },
        attendant,
        customer,
        quantityLiters: qty,
        pricePerLiter: rate,
        totalAmount: total,
        paymentMethod: paymentMethod || 'CASH',
        paymentStatus: 'COMPLETED',
      };

      updateMockStore(prev => ({
        ...prev,
        sales: [newSale, ...prev.sales],
        tanks: prev.tanks.map(t => t.id === pump?.tankId ? { ...t, currentStockLiters: Math.max(0, t.currentStockLiters - qty) } : t),
      }));

      return { success: true, data: newSale };
    }
  }

  if (endpoint.includes('/reverse') && method === 'POST') {
    const saleId = endpoint.split('/')[2];
    updateMockStore(prev => ({
      ...prev,
      sales: prev.sales.map(s => s.id === saleId ? { ...s, paymentStatus: 'REVERSED', reversalReason: body.reason } : s),
    }));
    return { success: true, message: 'Sale reversed' };
  }

  // 7. Deliveries
  if (endpoint === '/deliveries') {
    if (method === 'GET') return { success: true, data: store.deliveries };
    if (method === 'POST') {
      const sup = store.suppliers.find(s => s.id === body.supplierId);
      const tank = store.tanks.find(t => t.id === body.destinationTankId);
      const newDel = {
        id: `del-${Date.now()}`,
        deliveryReference: body.deliveryReference,
        invoiceNumber: body.invoiceNumber,
        supplier: sup,
        destinationTank: tank,
        fuelProduct: tank?.fuelProduct,
        orderedQuantityLiters: body.orderedQuantityLiters,
        receivedQuantityLiters: body.receivedQuantityLiters,
        discrepancyLiters: body.receivedQuantityLiters - body.orderedQuantityLiters,
        unitCost: body.unitCost,
        totalCost: body.receivedQuantityLiters * body.unitCost,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };
      updateMockStore(prev => ({ ...prev, deliveries: [newDel, ...prev.deliveries] }));
      return { success: true, data: newDel };
    }
  }

  if (endpoint.includes('/confirm') && method === 'POST') {
    const id = endpoint.split('/')[2];
    updateMockStore(prev => ({
      ...prev,
      deliveries: prev.deliveries.map(d => d.id === id ? { ...d, status: 'CONFIRMED' } : d),
    }));
    return { success: true, message: 'Delivery confirmed' };
  }

  // 8. Shifts
  if (endpoint === '/shifts') {
    if (method === 'GET') return { success: true, data: store.shifts };
    if (endpoint === '/shifts/open' && method === 'POST') {
      const emp = store.employees.find(e => e.id === body.employeeId);
      const newShift = {
        id: `shift-${Date.now()}`,
        shiftName: body.shiftName,
        employee: emp,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'OPEN',
        openingCash: body.openingCash,
        expectedCash: body.openingCash,
        actualCash: 0,
        cashVariance: 0,
      };
      updateMockStore(prev => ({ ...prev, shifts: [newShift, ...prev.shifts] }));
      return { success: true, data: newShift };
    }
  }

  if (endpoint.includes('/close') && method === 'POST') {
    const id = endpoint.split('/')[2];
    updateMockStore(prev => ({
      ...prev,
      shifts: prev.shifts.map(s => s.id === id ? {
        ...s,
        status: 'CLOSED',
        endTime: new Date().toISOString(),
        actualCash: body.actualCash,
        cashVariance: body.actualCash - s.expectedCash,
        closingNotes: body.closingNotes,
      } : s),
    }));
    return { success: true, data: { cashVariance: 0 } };
  }

  // 9. Employees, Customers, Suppliers, Expenses, Reports, Reconciliations, Anomalies, Audits
  if (endpoint === '/employees') return { success: true, data: store.employees };
  if (endpoint === '/customers') return { success: true, data: store.customers };
  if (endpoint === '/suppliers') return { success: true, data: store.suppliers };
  if (endpoint === '/expenses') return { success: true, data: store.expenses };
  if (endpoint === '/expenses/categories') return { success: true, data: store.expenseCategories };
  if (endpoint === '/reconciliations') return { success: true, data: store.reconciliations };
  if (endpoint === '/anomalies/anomalies') return { success: true, data: store.anomalies };
  if (endpoint === '/anomalies/alerts') return { success: true, data: store.alerts };
  if (endpoint === '/audit-logs') return { success: true, data: { logs: store.auditLogs } };

  if (endpoint === '/reports/daily-sales') {
    return {
      success: true,
      data: {
        totalRevenue: 85240,
        totalLiters: 890,
        totalTransactions: store.sales.length,
        breakdownByFuel: [
          { fuel: 'Regular Unleaded Petrol (RON 91)', liters: 420, revenue: 43470, count: 6 },
          { fuel: 'High-Speed Clean Diesel (BS-VI)', liters: 380, revenue: 34656, count: 4 },
          { fuel: 'Power 95 Premium Octane Petrol', liters: 90, revenue: 9972, count: 2 },
        ],
        salesList: store.sales,
      },
    };
  }

  return { success: true, data: [] };
};

export const api = {
  async get(endpoint, params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    const queryString = query.toString() ? `?${query.toString()}` : '';

    try {
      const res = await fetch(`${BASE_URL}${endpoint}${queryString}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn(`[PetroFlow Core] Fallback to client state store for: GET ${endpoint}`);
      return handleMockFallback(endpoint, 'GET', null, params);
    }
  },

  async post(endpoint, data = {}) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn(`[PetroFlow Core] Fallback to client state store for: POST ${endpoint}`);
      return handleMockFallback(endpoint, 'POST', data);
    }
  },

  async patch(endpoint, data = {}) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data),
      });
      return await handleResponse(res);
    } catch (err) {
      console.warn(`[PetroFlow Core] Fallback to client state store for: PATCH ${endpoint}`);
      return handleMockFallback(endpoint, 'PATCH', data);
    }
  },

  async delete(endpoint) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });
      return await handleResponse(res);
    } catch (err) {
      return handleMockFallback(endpoint, 'DELETE');
    }
  },

  async downloadCSV(endpoint, filename = 'export.csv') {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error('Failed to download CSV export');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // Generate client-side CSV export
      const store = getMockStore();
      const rows = store.sales.map(s => `"${s.transactionNumber}","${s.createdAt}","${s.fuelProduct?.name}","${s.quantityLiters}","${s.pricePerLiter}","${s.totalAmount}","${s.paymentMethod}"`);
      const csv = `"Transaction #","Date","Fuel","Volume (L)","Rate","Total (₹)","Method"\r\n` + rows.join('\r\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  },
};

async function handleResponse(res) {
  if (res.status === 401) {
    localStorage.removeItem('petroflow_token');
    localStorage.removeItem('petroflow_user');
    if (!window.location.pathname.includes('/login')) {
      window.location.href = '/login';
    }
  }

  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errorMessage = json.message || json.errors?.[0]?.message || 'Request failed';
    throw new Error(errorMessage);
  }
  return json;
}
