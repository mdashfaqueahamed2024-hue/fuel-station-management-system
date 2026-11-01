import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const registerUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['ADMIN', 'MANAGER', 'ATTENDANT']),
  phone: z.string().optional(),
  stationId: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});

export const createSaleSchema = z.object({
  stationId: z.string().optional(),
  pumpId: z.string().min(1, 'Pump is required'),
  fuelProductId: z.string().min(1, 'Fuel product is required'),
  tankId: z.string().min(1, 'Tank is required'),
  attendantId: z.string().min(1, 'Attendant is required'),
  customerId: z.string().optional().nullable(),
  shiftId: z.string().optional().nullable(),
  quantityLiters: z.number().positive('Quantity in liters must be greater than zero'),
  pricePerLiter: z.number().positive('Price per liter must be positive'),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'UPI', 'FLEET_CREDIT']).default('CASH'),
});

export const reverseSaleSchema = z.object({
  reason: z.string().min(5, 'A clear reason for sale reversal is required (minimum 5 characters)'),
});

export const updateFuelPriceSchema = z.object({
  currentPrice: z.number().positive('Price must be greater than zero'),
  costPrice: z.number().positive().optional(),
});

export const adjustStockSchema = z.object({
  tankId: z.string().min(1, 'Tank ID is required'),
  fuelProductId: z.string().min(1, 'Fuel product ID is required'),
  adjustmentType: z.enum(['POSITIVE', 'NEGATIVE']),
  quantityLiters: z.number().positive('Quantity must be greater than zero'),
  reason: z.enum(['EVAPORATION', 'CALIBRATION_DISCREPANCY', 'AUDIT_CORRECTION', 'SPILLAGE']),
  notes: z.string().optional(),
});

export const createDeliverySchema = z.object({
  stationId: z.string().optional(),
  supplierId: z.string().min(1, 'Supplier is required'),
  destinationTankId: z.string().min(1, 'Destination tank is required'),
  fuelProductId: z.string().min(1, 'Fuel product is required'),
  deliveryReference: z.string().min(1, 'Delivery reference is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  orderedQuantityLiters: z.number().positive('Ordered quantity must be positive'),
  receivedQuantityLiters: z.number().positive('Received quantity must be positive'),
  unitCost: z.number().positive('Unit purchase cost must be positive'),
  receivingEmployeeId: z.string().optional().nullable(),
  notes: z.string().optional(),
});

export const openShiftSchema = z.object({
  stationId: z.string().optional(),
  employeeId: z.string().min(1, 'Employee is required'),
  shiftName: z.enum(['MORNING', 'EVENING', 'NIGHT']),
  openingCash: z.number().min(0).default(0),
  pumps: z.array(
    z.object({
      pumpId: z.string(),
      openingReading: z.number().min(0),
    })
  ).optional(),
});

export const closeShiftSchema = z.object({
  actualCash: z.number().min(0, 'Actual cash collected must be 0 or positive'),
  closingNotes: z.string().optional(),
  pumps: z.array(
    z.object({
      pumpId: z.string(),
      closingReading: z.number().min(0),
    })
  ).optional(),
});

export const createExpenseSchema = z.object({
  stationId: z.string().optional(),
  categoryId: z.string().min(1, 'Expense category is required'),
  description: z.string().min(3, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  receiptRef: z.string().optional(),
});

export const approveExpenseSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
});

export const createCustomerSchema = z.object({
  stationId: z.string().optional(),
  name: z.string().min(2, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  companyName: z.string().optional(),
  customerType: z.enum(['INDIVIDUAL', 'COMMERCIAL_FLEET']).default('INDIVIDUAL'),
  creditLimit: z.number().min(0).default(0),
});

export const createSupplierSchema = z.object({
  name: z.string().min(2, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  phone: z.string().min(5, 'Valid phone number is required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  taxId: z.string().optional(),
});

export const createReconciliationSchema = z.object({
  stationId: z.string().optional(),
  tankId: z.string().min(1, 'Tank is required'),
  physicalMeasuredStock: z.number().min(0, 'Physical measured stock dip reading must be zero or positive'),
  notes: z.string().optional(),
});
