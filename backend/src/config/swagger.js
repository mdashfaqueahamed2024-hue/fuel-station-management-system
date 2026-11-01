import swaggerUi from 'swagger-ui-express';

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Fuel Station Management System — PetroFlow Enterprise API',
    version: '1.0.0',
    description: `Complete university-grade RESTful API engine for intelligent fuel inventory, dispenser pump monitoring, financial transactions, shift reconciliation, and anomaly intelligence.
    
### Architectural Overview
- **Authentication**: JWT Bearer token and Secure HTTP-Only Cookie.
- **Role-Based Access Control**:
  - \`ADMIN\`: Full operational and administrative authorization.
  - \`MANAGER\`: Stock control, pump management, delivery receiving, shift oversight, and reports.
  - \`ATTENDANT\`: Shift logging, POS dispensing, meter entries.
- **ACID Integrity**: All sales, stock reconciliations, and deliveries use database transactions.`,
  },
  servers: [
    {
      url: 'http://localhost:5000/api',
      description: 'Development Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/auth/login': {
      post: {
        summary: 'Authenticate user and issue JWT session',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', example: 'admin@petroflow.com' },
                  password: { type: 'string', example: 'Admin@123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/dashboard/summary': {
      get: {
        summary: 'Operational dashboard metrics, tank utilization, and sales trend',
        tags: ['Dashboard & Analytics'],
        parameters: [
          { name: 'timeframe', in: 'query', schema: { type: 'string', enum: ['today', '7days', 'month'] } },
        ],
        responses: {
          200: { description: 'Aggregated analytics and operational KPIs' },
        },
      },
    },
    '/sales': {
      get: {
        summary: 'Query sales history with filtering and pagination',
        tags: ['Sales & POS'],
        responses: { 200: { description: 'List of sales transactions' } },
      },
      post: {
        summary: 'Process atomic fuel sale transaction and decrement stock',
        tags: ['Sales & POS'],
        responses: { 201: { description: 'Sale processed and receipt generated' } },
      },
    },
    '/sales/{id}/reverse': {
      post: {
        summary: 'Authorized reversal of completed sale with stock restoration',
        tags: ['Sales & POS'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Sale reversed' } },
      },
    },
    '/tanks': {
      get: {
        summary: 'Get all fuel tanks with current volume and capacity utilization',
        tags: ['Inventory & Tanks'],
        responses: { 200: { description: 'List of storage tanks' } },
      },
    },
    '/tanks/adjust': {
      post: {
        summary: 'Execute authorized manual stock adjustment with reasoning',
        tags: ['Inventory & Tanks'],
        responses: { 200: { description: 'Adjustment logged and inventory updated' } },
      },
    },
    '/deliveries': {
      get: {
        summary: 'Get supplier deliveries and purchase order history',
        tags: ['Deliveries & Suppliers'],
        responses: { 200: { description: 'List of bulk deliveries' } },
      },
      post: {
        summary: 'Log new bulk fuel delivery in PENDING status',
        tags: ['Deliveries & Suppliers'],
        responses: { 201: { description: 'Delivery recorded' } },
      },
    },
    '/deliveries/{id}/confirm': {
      post: {
        summary: 'Confirm delivery receipt and credit destination tank volume',
        tags: ['Deliveries & Suppliers'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Delivery confirmed and tank inventory incremented' } },
      },
    },
    '/shifts': {
      get: {
        summary: 'Get shift records and cash reconciliations',
        tags: ['Shifts & Attendants'],
        responses: { 200: { description: 'List of shifts' } },
      },
    },
    '/shifts/open': {
      post: {
        summary: 'Open attendant shift with initial cash float and meter readings',
        tags: ['Shifts & Attendants'],
        responses: { 201: { description: 'Shift activated' } },
      },
    },
    '/shifts/{id}/close': {
      post: {
        summary: 'Close shift, reconcile cash collections, compute variance',
        tags: ['Shifts & Attendants'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Shift closed and variance recorded' } },
      },
    },
    '/reconciliations': {
      get: {
        summary: 'Get stock reconciliation history',
        tags: ['Stock Reconciliation'],
        responses: { 200: { description: 'Reconciliation log' } },
      },
      post: {
        summary: 'Perform dip-reading stock reconciliation formula evaluation',
        tags: ['Stock Reconciliation'],
        responses: { 200: { description: 'Reconciliation evaluated' } },
      },
    },
    '/anomalies/anomalies': {
      get: {
        summary: 'Rule-based anomaly detection scanner results',
        tags: ['Intelligent Anomaly Detection'],
        responses: { 200: { description: 'List of flagged operational anomalies' } },
      },
    },
    '/audit-logs': {
      get: {
        summary: 'Immutable audit trail of system events',
        tags: ['Audit & Security'],
        responses: { 200: { description: 'Paginated audit trail' } },
      },
    },
  },
};
