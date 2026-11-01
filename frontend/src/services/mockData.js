// High-Fidelity Standalone Offline Store
// Ensures the entire application works 100% on phones, tablets, or Vercel static deployments
// even when the local backend server is not directly reachable over WAN/LAN.

const STORAGE_KEY = 'petroflow_offline_store_v1';

const initialStore = {
  stations: [
    {
      id: 'stn-001',
      code: 'STN-001',
      name: 'PetroFlow Flagship Highway Superstation',
      address: 'Plot 42, Outer Ring Road, Hebbal Flyover Corridor',
      city: 'Bangalore',
      state: 'Karnataka',
      phone: '+91 80 2345 6789',
    },
    {
      id: 'stn-002',
      code: 'STN-002',
      name: 'PetroFlow Metro City Center Express',
      address: '88 MG Road, Commercial District',
      city: 'Bangalore',
      state: 'Karnataka',
      phone: '+91 80 2345 9900',
    },
  ],
  fuels: [
    {
      id: 'fuel-1',
      code: 'PETROL-91',
      name: 'Regular Unleaded Petrol (RON 91)',
      fuelType: 'PETROL',
      currentPrice: 103.50,
      costPrice: 96.20,
      lowStockThreshold: 4000.0,
      colorCode: '#2563eb',
    },
    {
      id: 'fuel-2',
      code: 'DIESEL-BS6',
      name: 'High-Speed Clean Diesel (BS-VI)',
      fuelType: 'DIESEL',
      currentPrice: 91.20,
      costPrice: 84.80,
      lowStockThreshold: 5000.0,
      colorCode: '#059669',
    },
    {
      id: 'fuel-3',
      code: 'PETROL-XP95',
      name: 'Power 95 Premium Octane Petrol',
      fuelType: 'PREMIUM_PETROL',
      currentPrice: 110.80,
      costPrice: 102.10,
      lowStockThreshold: 2500.0,
      colorCode: '#d97706',
    },
  ],
  tanks: [
    {
      id: 'tank-1',
      fuelProductId: 'fuel-1',
      tankNumber: 'TANK-01 (Petrol Main)',
      capacityLiters: 25000.0,
      currentStockLiters: 17850.0,
      lowStockThresholdLiters: 4000.0,
      active: true,
      fuelProduct: { id: 'fuel-1', name: 'Regular Unleaded Petrol (RON 91)', colorCode: '#2563eb', fuelType: 'PETROL' },
      utilizationPercentage: 71.4,
      isLowStock: false,
    },
    {
      id: 'tank-2',
      fuelProductId: 'fuel-2',
      tankNumber: 'TANK-02 (Diesel Heavy)',
      capacityLiters: 35000.0,
      currentStockLiters: 26400.0,
      lowStockThresholdLiters: 5000.0,
      active: true,
      fuelProduct: { id: 'fuel-2', name: 'High-Speed Clean Diesel (BS-VI)', colorCode: '#059669', fuelType: 'DIESEL' },
      utilizationPercentage: 75.4,
      isLowStock: false,
    },
    {
      id: 'tank-3',
      fuelProductId: 'fuel-3',
      tankNumber: 'TANK-03 (Power 95 Buffer)',
      capacityLiters: 15000.0,
      currentStockLiters: 9200.0,
      lowStockThresholdLiters: 2500.0,
      active: true,
      fuelProduct: { id: 'fuel-3', name: 'Power 95 Premium Octane Petrol', colorCode: '#d97706', fuelType: 'PREMIUM_PETROL' },
      utilizationPercentage: 61.3,
      isLowStock: false,
    },
    {
      id: 'tank-4',
      fuelProductId: 'fuel-2',
      tankNumber: 'TANK-04 (Diesel Commercial Reserve)',
      capacityLiters: 20000.0,
      currentStockLiters: 4200.0,
      lowStockThresholdLiters: 5000.0,
      active: true,
      fuelProduct: { id: 'fuel-2', name: 'High-Speed Clean Diesel (BS-VI)', colorCode: '#059669', fuelType: 'DIESEL' },
      utilizationPercentage: 21.0,
      isLowStock: true,
    },
  ],
  pumps: [
    {
      id: 'pump-1',
      tankId: 'tank-1',
      pumpNumber: 'PUMP-01',
      pumpName: 'Island A - West (Petrol Fast Flow)',
      status: 'ACTIVE',
      totalLifetimeLiters: 142500.0,
      tank: {
        id: 'tank-1',
        tankNumber: 'TANK-01 (Petrol Main)',
        currentStockLiters: 17850.0,
        fuelProduct: { id: 'fuel-1', name: 'Regular Unleaded Petrol (RON 91)', colorCode: '#2563eb', currentPrice: 103.50 },
      },
      meterReadings: [{ readingValue: 142500.0 }],
    },
    {
      id: 'pump-2',
      tankId: 'tank-2',
      pumpNumber: 'PUMP-02',
      pumpName: 'Island A - East (Diesel High Volume)',
      status: 'ACTIVE',
      totalLifetimeLiters: 215400.0,
      tank: {
        id: 'tank-2',
        tankNumber: 'TANK-02 (Diesel Heavy)',
        currentStockLiters: 26400.0,
        fuelProduct: { id: 'fuel-2', name: 'High-Speed Clean Diesel (BS-VI)', colorCode: '#059669', currentPrice: 91.20 },
      },
      meterReadings: [{ readingValue: 215400.0 }],
    },
    {
      id: 'pump-3',
      tankId: 'tank-3',
      pumpNumber: 'PUMP-03',
      pumpName: 'Island B - West (XP95 Premium)',
      status: 'ACTIVE',
      totalLifetimeLiters: 68900.0,
      tank: {
        id: 'tank-3',
        tankNumber: 'TANK-03 (Power 95 Buffer)',
        currentStockLiters: 9200.0,
        fuelProduct: { id: 'fuel-3', name: 'Power 95 Premium Octane Petrol', colorCode: '#d97706', currentPrice: 110.80 },
      },
      meterReadings: [{ readingValue: 68900.0 }],
    },
    {
      id: 'pump-4',
      tankId: 'tank-2',
      pumpNumber: 'PUMP-04',
      pumpName: 'Commercial Bay - Truck Master (Diesel)',
      status: 'ACTIVE',
      totalLifetimeLiters: 320100.0,
      tank: {
        id: 'tank-2',
        tankNumber: 'TANK-02 (Diesel Heavy)',
        currentStockLiters: 26400.0,
        fuelProduct: { id: 'fuel-2', name: 'High-Speed Clean Diesel (BS-VI)', colorCode: '#059669', currentPrice: 91.20 },
      },
      meterReadings: [{ readingValue: 320100.0 }],
    },
  ],
  employees: [
    { id: 'emp-1', employeeCode: 'EMP-1001', fullName: 'Rahul Verma', phone: '+91 98765 43212', role: 'Senior Pump Specialist', status: 'ACTIVE', _count: { shifts: 18 } },
    { id: 'emp-2', employeeCode: 'EMP-1002', fullName: 'Suresh Kumar', phone: '+91 98765 43213', role: 'Forecourt Dispenser', status: 'ACTIVE', _count: { shifts: 14 } },
    { id: 'emp-3', employeeCode: 'EMP-0501', fullName: 'Anita Sharma', phone: '+91 98765 43211', role: 'Station General Manager', status: 'ACTIVE', _count: { shifts: 42 } },
  ],
  suppliers: [
    { id: 'sup-1', name: 'Indian Oil Corporation Ltd. (IOCL Devangonthi)', contactPerson: 'Ramesh Kulkarni', phone: '+91 80 2845 1122', taxId: '29AABCI1234F1Z8' },
    { id: 'sup-2', name: 'Bharat Petroleum Corporation Ltd. (BPCL Refineries)', contactPerson: 'Sunil Rao', phone: '+91 80 2855 3344', taxId: '29AABCB5678J1Z2' },
  ],
  customers: [
    { id: 'cust-1', name: 'Apex Freight Logistics Pvt. Ltd.', companyName: 'Apex Heavy Haulage Fleet', customerType: 'COMMERCIAL_FLEET', creditLimit: 250000.0, currentBalance: 42150.0, phone: '+91 99887 76655', _count: { sales: 48 } },
    { id: 'cust-2', name: 'Bangalore City Metro Cabs Consortium', companyName: 'Metro Cabs Urban Transport', customerType: 'COMMERCIAL_FLEET', creditLimit: 100000.0, currentBalance: 18400.0, phone: '+91 98866 55443', _count: { sales: 32 } },
    { id: 'cust-3', name: 'Arjun Menon', companyName: '', customerType: 'INDIVIDUAL', creditLimit: 0, currentBalance: 0, phone: '+91 98450 12345', _count: { sales: 8 } },
  ],
  expenses: [
    { id: 'exp-1', expenseDate: new Date().toISOString(), category: { name: 'Electricity & High-KVA Generator Diesel' }, description: 'BESCOM Monthly Commercial Electricity Bill - Tariff HV-1', receiptRef: 'BESCOM-OCT-2026-9981', amount: 42350.0, recordedBy: { fullName: 'Anita Sharma' }, approvalStatus: 'APPROVED' },
    { id: 'exp-2', expenseDate: new Date(Date.now() - 86400000 * 3).toISOString(), category: { name: 'Dispenser Calibration & W&M Compliance' }, description: 'Semi-Annual Weights & Measures Stamping Fee for 4 Pumps', receiptRef: 'WM-KAR-2026-042', amount: 12000.0, recordedBy: { fullName: 'Anita Sharma' }, approvalStatus: 'APPROVED' },
    { id: 'exp-3', expenseDate: new Date(Date.now() - 86400000).toISOString(), category: { name: 'Station Infrastructure Maintenance & Filters' }, description: 'Submersible turbine pump filter replacement', receiptRef: 'INV-FIL-081', amount: 8400.0, recordedBy: { fullName: 'Anita Sharma' }, approvalStatus: 'PENDING' },
  ],
  expenseCategories: [
    { id: 'cat-1', name: 'Electricity & High-KVA Generator Diesel' },
    { id: 'cat-2', name: 'Dispenser Calibration & W&M Compliance' },
    { id: 'cat-3', name: 'Forecourt Attendant Wages & Shift Incentives' },
    { id: 'cat-4', name: 'Station Infrastructure Maintenance & Filters' },
  ],
  shifts: [
    { id: 'shift-1', shiftName: 'MORNING', employee: { fullName: 'Rahul Verma' }, startTime: new Date(Date.now() - 14 * 3600000).toISOString(), endTime: new Date(Date.now() - 6 * 3600000).toISOString(), status: 'CLOSED', openingCash: 5000.0, expectedCash: 38450.0, actualCash: 38400.0, cashVariance: -50.0 },
    { id: 'shift-2', shiftName: 'EVENING', employee: { fullName: 'Suresh Kumar' }, startTime: new Date(Date.now() - 4 * 3600000).toISOString(), endTime: null, status: 'OPEN', openingCash: 5000.0, expectedCash: 5000.0, actualCash: 0, cashVariance: 0 },
  ],
  deliveries: [
    { id: 'del-1', deliveryReference: 'DEL-2026-OCT-8812', invoiceNumber: 'INV-IOCL-99881', supplier: { name: 'Indian Oil Corporation Ltd.' }, fuelProduct: { name: 'High-Speed Clean Diesel (BS-VI)' }, destinationTank: { tankNumber: 'TANK-02 (Diesel Heavy)' }, orderedQuantityLiters: 12000.0, receivedQuantityLiters: 11980.0, discrepancyLiters: -20.0, unitCost: 84.80, totalCost: 1015904.0, status: 'CONFIRMED', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
    { id: 'del-2', deliveryReference: 'DEL-2026-NOV-0104', invoiceNumber: 'INV-BPCL-44120', supplier: { name: 'Bharat Petroleum Corporation Ltd.' }, fuelProduct: { name: 'Regular Unleaded Petrol (RON 91)' }, destinationTank: { tankNumber: 'TANK-01 (Petrol Main)' }, orderedQuantityLiters: 10000.0, receivedQuantityLiters: 9850.0, discrepancyLiters: -150.0, unitCost: 96.20, totalCost: 947570.0, status: 'PENDING', createdAt: new Date().toISOString() },
  ],
  sales: [
    { id: 'sale-1', transactionNumber: 'TXN-20261101-1001', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), fuelProduct: { name: 'Regular Unleaded Petrol (RON 91)' }, pump: { pumpNumber: 'PUMP-01' }, attendant: { fullName: 'Rahul Verma' }, quantityLiters: 45.0, pricePerLiter: 103.50, totalAmount: 4657.50, paymentMethod: 'UPI', paymentStatus: 'COMPLETED' },
    { id: 'sale-2', transactionNumber: 'TXN-20261101-1002', createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString(), fuelProduct: { name: 'High-Speed Clean Diesel (BS-VI)' }, pump: { pumpNumber: 'PUMP-02' }, attendant: { fullName: 'Rahul Verma' }, quantityLiters: 120.0, pricePerLiter: 91.20, totalAmount: 10944.00, paymentMethod: 'FLEET_CREDIT', paymentStatus: 'COMPLETED' },
    { id: 'sale-3', transactionNumber: 'TXN-20261101-1003', createdAt: new Date(Date.now() - 3600000).toISOString(), fuelProduct: { name: 'Power 95 Premium Octane Petrol' }, pump: { pumpNumber: 'PUMP-03' }, attendant: { fullName: 'Suresh Kumar' }, quantityLiters: 35.0, pricePerLiter: 110.80, totalAmount: 3878.00, paymentMethod: 'CARD', paymentStatus: 'COMPLETED' },
    { id: 'sale-4', transactionNumber: 'TXN-20261101-1004', createdAt: new Date(Date.now() - 1800000).toISOString(), fuelProduct: { name: 'Regular Unleaded Petrol (RON 91)' }, pump: { pumpNumber: 'PUMP-01' }, attendant: { fullName: 'Suresh Kumar' }, quantityLiters: 20.0, pricePerLiter: 103.50, totalAmount: 2070.00, paymentMethod: 'CASH', paymentStatus: 'COMPLETED' },
    { id: 'sale-5', transactionNumber: 'TXN-20261101-1005', createdAt: new Date(Date.now() - 600000).toISOString(), fuelProduct: { name: 'High-Speed Clean Diesel (BS-VI)' }, pump: { pumpNumber: 'PUMP-04' }, attendant: { fullName: 'Suresh Kumar' }, quantityLiters: 250.0, pricePerLiter: 91.20, totalAmount: 22800.00, paymentMethod: 'FLEET_CREDIT', paymentStatus: 'COMPLETED' },
  ],
  reconciliations: [
    { id: 'rec-1', reconciliationDate: new Date(Date.now() - 86400000).toISOString(), tank: { tankNumber: 'TANK-01 (Petrol Main)' }, openingStock: 18500.0, deliveriesReceived: 0.0, salesDeducted: 620.0, adjustments: -30.0, expectedClosingStock: 17850.0, physicalMeasuredStock: 17840.0, varianceLiters: -10.0, variancePercentage: -0.06, status: 'BALANCED' },
  ],
  anomalies: [
    { type: 'DELIVERY_DISCREPANCY', severity: 'MEDIUM', title: 'Delivery Shortfall: BPCL Invoice INV-BPCL-44120', explanation: 'Ordered 10,000 L of Petrol, received dip showed 9,850 L (-150 L discrepancy). Pending confirmation review.', createdAt: new Date().toISOString() },
    { type: 'LOW_STOCK_WARNING', severity: 'HIGH', title: 'Low Stock: Tank TANK-04 (Diesel Commercial Reserve)', explanation: 'Available volume is below safe operating threshold (4,200 L left / 21.0% full). Re-ordering recommended.', createdAt: new Date().toISOString() },
  ],
  alerts: [
    { id: 'alt-1', alertType: 'LOW_STOCK', severity: 'HIGH', title: 'Low Fuel Stock: TANK-04', message: 'Available stock is 4,200 L, below the safe threshold of 5,000 L.', status: 'ACTIVE', createdAt: new Date().toISOString() },
    { id: 'alt-2', alertType: 'DELIVERY_DISCREPANCY', severity: 'MEDIUM', title: 'Delivery Shortfall: BPCL INV-BPCL-44120', message: 'Dip measurement revealed 150 L shortfall against bill of lading.', status: 'ACTIVE', createdAt: new Date().toISOString() },
  ],
  auditLogs: [
    { id: 'aud-1', createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), actorName: 'Vikramaditya Rathore', user: { role: 'ADMIN' }, action: 'SYSTEM_BOOT', entityType: 'System', afterState: 'PetroFlow Core Engine Initialized' },
    { id: 'aud-2', createdAt: new Date(Date.now() - 3600000).toISOString(), actorName: 'Anita Sharma', user: { role: 'MANAGER' }, action: 'PRICE_UPDATE', entityType: 'FuelProduct', afterState: 'Diesel updated to ₹91.20/L' },
    { id: 'aud-3', createdAt: new Date(Date.now() - 1800000).toISOString(), actorName: 'Rahul Verma', user: { role: 'ATTENDANT' }, action: 'SALE_CREATE', entityType: 'Sale', afterState: 'Txn TXN-20261101-1001 completed' },
  ],
  stockMovements: [
    { id: 'mov-1', createdAt: new Date().toISOString(), tank: { tankNumber: 'TANK-01 (Petrol Main)' }, fuelProduct: { name: 'Regular Unleaded Petrol (RON 91)' }, movementType: 'SALE', quantityLiters: -45.0, balanceAfterLiters: 17850.0, notes: 'Dispensed at PUMP-01' },
    { id: 'mov-2', createdAt: new Date(Date.now() - 3600000).toISOString(), tank: { tankNumber: 'TANK-02 (Diesel Heavy)' }, fuelProduct: { name: 'High-Speed Clean Diesel (BS-VI)' }, movementType: 'DELIVERY', quantityLiters: 11980.0, balanceAfterLiters: 26400.0, notes: 'Confirmed delivery from IOCL' },
  ]
};

export const getMockStore = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialStore));
  return initialStore;
};

export const updateMockStore = (updater) => {
  const current = getMockStore();
  const next = typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
};
