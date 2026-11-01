import bcrypt from 'bcryptjs';
import prisma from '../src/config/db.js';

async function main() {
  console.log('🌱 Seeding PetroFlow Enterprise Fuel Station Database...');

  // Clean existing records in correct relation order
  await prisma.auditLog.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.stockReconciliation.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.expenseCategory.deleteMany({});
  await prisma.stockMovement.deleteMany({});
  await prisma.stockAdjustment.deleteMany({});
  await prisma.sale.deleteMany({});
  await prisma.meterReading.deleteMany({});
  await prisma.shiftMeter.deleteMany({});
  await prisma.shift.deleteMany({});
  await prisma.pump.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.tank.deleteMany({});
  await prisma.fuelProduct.deleteMany({});
  await prisma.employee.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.station.deleteMany({});

  // 1. Create Stations
  const station1 = await prisma.station.create({
    data: {
      code: 'STN-001',
      name: 'PetroFlow Flagship Highway Superstation',
      address: 'Plot 42, Outer Ring Road, Hebbal Flyover Corridor',
      city: 'Bangalore',
      state: 'Karnataka',
      phone: '+91 80 2345 6789',
      active: true,
    },
  });

  const station2 = await prisma.station.create({
    data: {
      code: 'STN-002',
      name: 'PetroFlow Metro City Center Express',
      address: '88 MG Road, Commercial District',
      city: 'Bangalore',
      state: 'Karnataka',
      phone: '+91 80 2345 9900',
      active: true,
    },
  });

  // 2. Create Users with Hashed Passwords
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const managerPassword = await bcrypt.hash('Manager@123', 10);
  const attendantPassword = await bcrypt.hash('Attendant@123', 10);

  const adminUser = await prisma.user.create({
    data: {
      stationId: station1.id,
      email: 'admin@petroflow.com',
      passwordHash: adminPassword,
      fullName: 'Vikramaditya Rathore',
      role: 'ADMIN',
      phone: '+91 98765 43210',
      active: true,
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      stationId: station1.id,
      email: 'manager@petroflow.com',
      passwordHash: managerPassword,
      fullName: 'Anita Sharma',
      role: 'MANAGER',
      phone: '+91 98765 43211',
      active: true,
    },
  });

  const attendantUser = await prisma.user.create({
    data: {
      stationId: station1.id,
      email: 'attendant@petroflow.com',
      passwordHash: attendantPassword,
      fullName: 'Rahul Verma',
      role: 'ATTENDANT',
      phone: '+91 98765 43212',
      active: true,
    },
  });

  const attendantUser2 = await prisma.user.create({
    data: {
      stationId: station1.id,
      email: 'suresh@petroflow.com',
      passwordHash: attendantPassword,
      fullName: 'Suresh Kumar',
      role: 'ATTENDANT',
      phone: '+91 98765 43213',
      active: true,
    },
  });

  // 3. Employees
  const emp1 = await prisma.employee.create({
    data: {
      stationId: station1.id,
      userId: attendantUser.id,
      employeeCode: 'EMP-1001',
      fullName: 'Rahul Verma',
      phone: '+91 98765 43212',
      role: 'Senior Pump Specialist',
      status: 'ACTIVE',
      salary: 28000.0,
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      stationId: station1.id,
      userId: attendantUser2.id,
      employeeCode: 'EMP-1002',
      fullName: 'Suresh Kumar',
      phone: '+91 98765 43213',
      role: 'Forecourt Dispenser',
      status: 'ACTIVE',
      salary: 24000.0,
    },
  });

  const empManager = await prisma.employee.create({
    data: {
      stationId: station1.id,
      userId: managerUser.id,
      employeeCode: 'EMP-0501',
      fullName: 'Anita Sharma',
      phone: '+91 98765 43211',
      role: 'Station General Manager',
      status: 'ACTIVE',
      salary: 65000.0,
    },
  });

  // 4. Fuel Products
  const petrol = await prisma.fuelProduct.create({
    data: {
      stationId: station1.id,
      code: 'PETROL-91',
      name: 'Regular Unleaded Petrol (RON 91)',
      fuelType: 'PETROL',
      currentPrice: 103.50,
      costPrice: 96.20,
      lowStockThreshold: 4000.0,
      colorCode: '#2563eb',
      active: true,
    },
  });

  const diesel = await prisma.fuelProduct.create({
    data: {
      stationId: station1.id,
      code: 'DIESEL-BS6',
      name: 'High-Speed Clean Diesel (BS-VI)',
      fuelType: 'DIESEL',
      currentPrice: 91.20,
      costPrice: 84.80,
      lowStockThreshold: 5000.0,
      colorCode: '#059669',
      active: true,
    },
  });

  const premiumPetrol = await prisma.fuelProduct.create({
    data: {
      stationId: station1.id,
      code: 'PETROL-XP95',
      name: 'Power 95 Premium Octane Petrol',
      fuelType: 'PREMIUM_PETROL',
      currentPrice: 110.80,
      costPrice: 102.10,
      lowStockThreshold: 2500.0,
      colorCode: '#d97706',
      active: true,
    },
  });

  // 5. Fuel Storage Tanks
  const tankPetrol = await prisma.tank.create({
    data: {
      stationId: station1.id,
      fuelProductId: petrol.id,
      tankNumber: 'TANK-01 (Petrol Main)',
      capacityLiters: 25000.0,
      currentStockLiters: 17850.0,
      lowStockThresholdLiters: 4000.0,
      active: true,
    },
  });

  const tankDiesel = await prisma.tank.create({
    data: {
      stationId: station1.id,
      fuelProductId: diesel.id,
      tankNumber: 'TANK-02 (Diesel Heavy)',
      capacityLiters: 35000.0,
      currentStockLiters: 26400.0,
      lowStockThresholdLiters: 5000.0,
      active: true,
    },
  });

  const tankPremium = await prisma.tank.create({
    data: {
      stationId: station1.id,
      fuelProductId: premiumPetrol.id,
      tankNumber: 'TANK-03 (Power 95 Buffer)',
      capacityLiters: 15000.0,
      currentStockLiters: 9200.0,
      lowStockThresholdLiters: 2500.0,
      active: true,
    },
  });

  const tankDieselReserve = await prisma.tank.create({
    data: {
      stationId: station1.id,
      fuelProductId: diesel.id,
      tankNumber: 'TANK-04 (Diesel Commercial Reserve)',
      capacityLiters: 20000.0,
      currentStockLiters: 4200.0, // Low stock on purpose for testing alerts
      lowStockThresholdLiters: 5000.0,
      active: true,
    },
  });

  // 6. Fuel Pumps
  const pump1 = await prisma.pump.create({
    data: {
      stationId: station1.id,
      tankId: tankPetrol.id,
      pumpNumber: 'PUMP-01',
      pumpName: 'Island A - West (Petrol Fast Flow)',
      status: 'ACTIVE',
      totalLifetimeLiters: 142500.0,
    },
  });

  const pump2 = await prisma.pump.create({
    data: {
      stationId: station1.id,
      tankId: tankDiesel.id,
      pumpNumber: 'PUMP-02',
      pumpName: 'Island A - East (Diesel High Volume)',
      status: 'ACTIVE',
      totalLifetimeLiters: 215400.0,
    },
  });

  const pump3 = await prisma.pump.create({
    data: {
      stationId: station1.id,
      tankId: tankPremium.id,
      pumpNumber: 'PUMP-03',
      pumpName: 'Island B - West (XP95 Premium)',
      status: 'ACTIVE',
      totalLifetimeLiters: 68900.0,
    },
  });

  const pump4 = await prisma.pump.create({
    data: {
      stationId: station1.id,
      tankId: tankDiesel.id,
      pumpNumber: 'PUMP-04',
      pumpName: 'Commercial Bay - Truck Master (Diesel)',
      status: 'ACTIVE',
      totalLifetimeLiters: 320100.0,
    },
  });

  // 7. Suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Indian Oil Corporation Ltd. (IOCL Devangonthi Terminal)',
      contactPerson: 'Ramesh Kulkarni',
      phone: '+91 80 2845 1122',
      email: 'logistics@iocl-south.in',
      address: 'Plot 10, Industrial Hub, Whitefield',
      taxId: '29AABCI1234F1Z8',
      active: true,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Bharat Petroleum Corporation Ltd. (BPCL Refineries)',
      contactPerson: 'Sunil Rao',
      phone: '+91 80 2855 3344',
      email: 'distribution@bpcl.co.in',
      address: 'Refinery Division, Mahul Road',
      taxId: '29AABCB5678J1Z2',
      active: true,
    },
  });

  // 8. Customers
  const cust1 = await prisma.customer.create({
    data: {
      stationId: station1.id,
      name: 'Apex Freight Logistics Pvt. Ltd.',
      phone: '+91 99887 76655',
      email: 'billing@apexfreight.com',
      companyName: 'Apex Heavy Haulage Fleet',
      customerType: 'COMMERCIAL_FLEET',
      creditLimit: 250000.0,
      currentBalance: 42150.0,
      active: true,
    },
  });

  const cust2 = await prisma.customer.create({
    data: {
      stationId: station1.id,
      name: 'Bangalore City Metro Cabs Consortium',
      phone: '+91 98866 55443',
      email: 'operations@metrocabs.in',
      companyName: 'Metro Cabs Urban Transport',
      customerType: 'COMMERCIAL_FLEET',
      creditLimit: 100000.0,
      currentBalance: 18400.0,
      active: true,
    },
  });

  const cust3 = await prisma.customer.create({
    data: {
      stationId: station1.id,
      name: 'Arjun Menon',
      phone: '+91 98450 12345',
      customerType: 'INDIVIDUAL',
    },
  });

  // 9. Expense Categories
  const cat1 = await prisma.expenseCategory.create({
    data: { name: 'Electricity & High-KVA Generator Diesel', description: 'Monthly electricity bill and standby generator fuel' },
  });
  const cat2 = await prisma.expenseCategory.create({
    data: { name: 'Dispenser Calibration & W&M Compliance', description: 'Weights & Measures statutory testing and calibration' },
  });
  const cat3 = await prisma.expenseCategory.create({
    data: { name: 'Forecourt Attendant Wages & Shift Incentives', description: 'Monthly payroll and attendance bonuses' },
  });
  const cat4 = await prisma.expenseCategory.create({
    data: { name: 'Station Infrastructure Maintenance & Filters', description: 'Nozzle replacements, hose swivels, and filter cleans' },
  });

  // 10. Sample Approved Expenses
  await prisma.expense.create({
    data: {
      stationId: station1.id,
      categoryId: cat1.id,
      description: 'BESCOM Monthly Commercial Electricity Bill - Tariff HV-1',
      amount: 42350.0,
      recordedByUserId: managerUser.id,
      approvedByUserId: adminUser.id,
      approvalStatus: 'APPROVED',
      receiptRef: 'BESCOM-OCT-2026-9981',
      expenseDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.expense.create({
    data: {
      stationId: station1.id,
      categoryId: cat2.id,
      description: 'Semi-Annual Weights & Measures Stamping Fee for 4 Pumps',
      amount: 12000.0,
      recordedByUserId: managerUser.id,
      approvedByUserId: adminUser.id,
      approvalStatus: 'APPROVED',
      receiptRef: 'WM-KAR-2026-042',
      expenseDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  // 11. Shifts: One Closed Shift + One Active Shift
  const shiftMorning = await prisma.shift.create({
    data: {
      stationId: station1.id,
      employeeId: emp1.id,
      shiftName: 'MORNING',
      startTime: new Date(Date.now() - 14 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'CLOSED',
      openingCash: 5000.0,
      expectedCash: 38450.0,
      actualCash: 38400.0,
      cashVariance: -50.0,
      closingNotes: 'Morning highway rush handled smoothly. Minor ₹50 shortfall reconciled against roundoff.',
    },
  });

  const shiftEvening = await prisma.shift.create({
    data: {
      stationId: station1.id,
      employeeId: emp2.id,
      shiftName: 'EVENING',
      startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'OPEN',
      openingCash: 5000.0,
      expectedCash: 5000.0,
    },
  });

  // Shift Meters for closed morning shift
  await prisma.shiftMeter.create({
    data: {
      shiftId: shiftMorning.id,
      pumpId: pump1.id,
      openingReading: 142100.0,
      closingReading: 142350.0,
      volumeSold: 250.0,
    },
  });

  await prisma.shiftMeter.create({
    data: {
      shiftId: shiftMorning.id,
      pumpId: pump2.id,
      openingReading: 215000.0,
      closingReading: 215380.0,
      volumeSold: 380.0,
    },
  });

  // 12. Deliveries: 1 Confirmed + 1 Pending
  const deliveryConfirmed = await prisma.delivery.create({
    data: {
      stationId: station1.id,
      supplierId: supplier1.id,
      destinationTankId: tankDiesel.id,
      fuelProductId: diesel.id,
      deliveryReference: 'DEL-2026-OCT-8812',
      invoiceNumber: 'INV-IOCL-99881',
      orderedQuantityLiters: 12000.0,
      receivedQuantityLiters: 11980.0,
      discrepancyLiters: -20.0,
      unitCost: 84.80,
      totalCost: 1015904.0,
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      receivingEmployeeId: empManager.id,
      status: 'CONFIRMED',
      notes: 'Tanker TT-KA-04-E-1284. Dip test and density checks verified prior to decanting.',
    },
  });

  await prisma.stockMovement.create({
    data: {
      stationId: station1.id,
      tankId: tankDiesel.id,
      fuelProductId: diesel.id,
      movementType: 'DELIVERY',
      quantityLiters: 11980.0,
      balanceAfterLiters: 26400.0,
      referenceId: deliveryConfirmed.id,
      referenceType: 'DELIVERY',
      notes: 'Confirmed delivery from IOCL Devangonthi',
    },
  });

  const deliveryPending = await prisma.delivery.create({
    data: {
      stationId: station1.id,
      supplierId: supplier2.id,
      destinationTankId: tankPetrol.id,
      fuelProductId: petrol.id,
      deliveryReference: 'DEL-2026-NOV-0104',
      invoiceNumber: 'INV-BPCL-44120',
      orderedQuantityLiters: 10000.0,
      receivedQuantityLiters: 9850.0,
      discrepancyLiters: -150.0,
      unitCost: 96.20,
      totalCost: 947570.0,
      status: 'PENDING',
      notes: 'Tanker arrived at bay 1. Awaiting temperature stabilization dip inspection.',
    },
  });

  // 13. Realistic Sales Transactions (Today & Past few days)
  const salesData = [
    { pump: pump1, fuel: petrol, tank: tankPetrol, emp: emp1, qty: 35.5, method: 'UPI', cust: cust3, shift: shiftMorning, minsAgo: 450 },
    { pump: pump1, fuel: petrol, tank: tankPetrol, emp: emp1, qty: 42.0, method: 'CARD', cust: null, shift: shiftMorning, minsAgo: 420 },
    { pump: pump2, fuel: diesel, tank: tankDiesel, emp: emp1, qty: 120.0, method: 'FLEET_CREDIT', cust: cust1, shift: shiftMorning, minsAgo: 400 },
    { pump: pump2, fuel: diesel, tank: tankDiesel, emp: emp1, qty: 85.0, method: 'CASH', cust: null, shift: shiftMorning, minsAgo: 380 },
    { pump: pump3, fuel: premiumPetrol, tank: tankPremium, emp: emp1, qty: 50.0, method: 'UPI', cust: null, shift: shiftMorning, minsAgo: 360 },
    { pump: pump4, fuel: diesel, tank: tankDiesel, emp: emp1, qty: 250.0, method: 'FLEET_CREDIT', cust: cust2, shift: shiftMorning, minsAgo: 320 },
    { pump: pump1, fuel: petrol, tank: tankPetrol, emp: emp1, qty: 28.5, method: 'CASH', cust: null, shift: shiftMorning, minsAgo: 300 },
    { pump: pump2, fuel: diesel, tank: tankDiesel, emp: emp1, qty: 65.0, method: 'UPI', cust: null, shift: shiftMorning, minsAgo: 280 },
    { pump: pump3, fuel: premiumPetrol, tank: tankPremium, emp: emp1, qty: 40.0, method: 'CARD', cust: null, shift: shiftMorning, minsAgo: 260 },
    // Sales during active evening shift
    { pump: pump1, fuel: petrol, tank: tankPetrol, emp: emp2, qty: 55.0, method: 'UPI', cust: null, shift: shiftEvening, minsAgo: 180 },
    { pump: pump2, fuel: diesel, tank: tankDiesel, emp: emp2, qty: 140.0, method: 'FLEET_CREDIT', cust: cust1, shift: shiftEvening, minsAgo: 140 },
    { pump: pump3, fuel: premiumPetrol, tank: tankPremium, emp: emp2, qty: 60.0, method: 'CASH', cust: null, shift: shiftEvening, minsAgo: 100 },
    { pump: pump1, fuel: petrol, tank: tankPetrol, emp: emp2, qty: 32.0, method: 'CARD', cust: null, shift: shiftEvening, minsAgo: 60 },
    { pump: pump2, fuel: diesel, tank: tankDiesel, emp: emp2, qty: 95.0, method: 'UPI', cust: null, shift: shiftEvening, minsAgo: 25 },
  ];

  for (let i = 0; i < salesData.length; i++) {
    const s = salesData[i];
    const unitPrice = Number(s.fuel.currentPrice);
    const totalAmount = Number((s.qty * unitPrice).toFixed(2));
    const txTime = new Date(Date.now() - s.minsAgo * 60 * 1000);

    const saleRecord = await prisma.sale.create({
      data: {
        stationId: station1.id,
        transactionNumber: `TXN-20261101-${1000 + i}`,
        pumpId: s.pump.id,
        fuelProductId: s.fuel.id,
        tankId: s.tank.id,
        attendantId: s.emp.id,
        customerId: s.cust?.id || null,
        shiftId: s.shift?.id || null,
        quantityLiters: s.qty,
        pricePerLiter: unitPrice,
        discountAmount: 0.0,
        taxAmount: 0.0,
        totalAmount,
        paymentMethod: s.method,
        paymentStatus: 'COMPLETED',
        createdAt: txTime,
      },
    });

    await prisma.stockMovement.create({
      data: {
        stationId: station1.id,
        tankId: s.tank.id,
        fuelProductId: s.fuel.id,
        movementType: 'SALE',
        quantityLiters: -s.qty,
        balanceAfterLiters: Number(s.tank.currentStockLiters) - (i * 20),
        referenceId: saleRecord.id,
        referenceType: 'SALE',
        notes: `Dispensed at ${s.pump.pumpNumber}`,
        createdAt: txTime,
      },
    });
  }

  // 14. Stock Reconciliation Record
  await prisma.stockReconciliation.create({
    data: {
      stationId: station1.id,
      tankId: tankPetrol.id,
      reconciliationDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      openingStock: 18500.0,
      deliveriesReceived: 0.0,
      salesDeducted: 620.0,
      adjustments: -30.0,
      expectedClosingStock: 17850.0,
      physicalMeasuredStock: 17840.0,
      varianceLiters: -10.0,
      variancePercentage: -0.06,
      status: 'BALANCED',
      notes: 'Dip measurement with calibrated sounding rod. Acceptable thermal shrinkage observed.',
      reconciledByUserId: managerUser.id,
    },
  });

  // 15. Operational Alerts
  await prisma.alert.create({
    data: {
      stationId: station1.id,
      alertType: 'LOW_STOCK',
      severity: 'HIGH',
      title: 'Low Fuel Stock: TANK-04 (Diesel Commercial Reserve)',
      message: 'Available stock is 4,200 L, which is below the safe threshold of 5,000 L (21.0% utilization).',
      status: 'ACTIVE',
    },
  });

  await prisma.alert.create({
    data: {
      stationId: station1.id,
      alertType: 'DELIVERY_DISCREPANCY',
      severity: 'MEDIUM',
      title: 'Delivery Shortfall: BPCL Invoice INV-BPCL-44120',
      message: 'Ordered 10,000 L of Petrol, received dip showed 9,850 L (-150 L discrepancy). Pending confirmation review.',
      status: 'ACTIVE',
    },
  });

  // 16. Audit Log Entries
  await prisma.auditLog.create({
    data: {
      stationId: station1.id,
      userId: adminUser.id,
      actorName: adminUser.fullName,
      action: 'SYSTEM_BOOT',
      entityType: 'System',
      afterState: JSON.stringify({ message: 'PetroFlow Core Engine Initialized with Enterprise Schema' }),
    },
  });

  await prisma.auditLog.create({
    data: {
      stationId: station1.id,
      userId: managerUser.id,
      actorName: managerUser.fullName,
      action: 'DELIVERY_CONFIRM',
      entityType: 'Delivery',
      entityId: deliveryConfirmed.id,
      afterState: JSON.stringify({ reference: deliveryConfirmed.deliveryReference, liters: 11980.0 }),
    },
  });

  console.log('✅ PetroFlow Enterprise Database Seeded Successfully!');
  console.log('---------------------------------------------------------');
  console.log('🔐 DEMONSTRATION CREDENTIALS:');
  console.log('   👑 Administrator : admin@petroflow.com     / Admin@123');
  console.log('   👔 Station Manager: manager@petroflow.com   / Manager@123');
  console.log('   ⛽ Fuel Attendant : attendant@petroflow.com / Attendant@123');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
