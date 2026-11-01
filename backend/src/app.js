import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config/env.js';
import { swaggerDocument } from './config/swagger.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import stationRoutes from './routes/stationRoutes.js';
import fuelRoutes from './routes/fuelRoutes.js';
import tankRoutes from './routes/tankRoutes.js';
import pumpRoutes from './routes/pumpRoutes.js';
import salesRoutes from './routes/salesRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import shiftRoutes from './routes/shiftRoutes.js';
import employeeRoutes from './routes/employeeRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import supplierRoutes from './routes/supplierRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import reconciliationRoutes from './routes/reconciliationRoutes.js';
import anomalyRoutes from './routes/anomalyRoutes.js';
import auditRoutes from './routes/auditRoutes.js';

const app = express();

// Security Middlewares
app.use(helmet({
  contentSecurityPolicy: false, // Allows Swagger UI to render assets smoothly
}));

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin) return callback(null, true);
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.endsWith('.vercel.app') ||
      origin === config.clientUrl
    ) {
      return callback(null, true);
    }
    return callback(null, true); // Permissive for university project demonstrations
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-station-id'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/api', apiLimiter);

// API Documentation via Swagger/OpenAPI
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Healthcheck Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Fuel Station Management System API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Domain Routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/fuels', fuelRoutes);
app.use('/api/tanks', tankRoutes);
app.use('/api/pumps', pumpRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/deliveries', deliveryRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/reconciliations', reconciliationRoutes);
app.use('/api/anomalies', anomalyRoutes);
app.use('/api/audit-logs', auditRoutes);

// Centralized Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
