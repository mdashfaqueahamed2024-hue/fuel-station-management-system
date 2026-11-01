import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { StationProvider } from './context/StationContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';

import { MainLayout } from './components/layout/MainLayout.jsx';
import { Login } from './pages/Login.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { SalesBilling } from './pages/SalesBilling.jsx';
import { FuelAndTanks } from './pages/FuelAndTanks.jsx';
import { PumpsAndMeters } from './pages/PumpsAndMeters.jsx';
import { DeliveriesSuppliers } from './pages/DeliveriesSuppliers.jsx';
import { ShiftsEmployees } from './pages/ShiftsEmployees.jsx';
import { Customers } from './pages/Customers.jsx';
import { Expenses } from './pages/Expenses.jsx';
import { StockReconciliation } from './pages/StockReconciliation.jsx';
import { ReportsAnalytics } from './pages/ReportsAnalytics.jsx';
import { AnomaliesAlerts } from './pages/AnomaliesAlerts.jsx';
import { AuditLogs } from './pages/AuditLogs.jsx';
import { Unauthorized } from './pages/Unauthorized.jsx';
import { NotFound } from './pages/NotFound.jsx';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-900 text-white font-sans text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating Session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <StationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Workspace Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="sales" element={<SalesBilling />} />
                <Route path="fuels-tanks" element={<FuelAndTanks />} />
                <Route path="pumps" element={<PumpsAndMeters />} />
                <Route path="deliveries" element={<DeliveriesSuppliers />} />
                <Route path="shifts" element={<ShiftsEmployees />} />
                <Route path="customers" element={<Customers />} />
                <Route path="expenses" element={<Expenses />} />
                <Route path="reconciliation" element={<StockReconciliation />} />
                <Route path="reports" element={<ReportsAnalytics />} />
                <Route path="anomalies" element={<AnomaliesAlerts />} />
                <Route
                  path="audit-logs"
                  element={
                    <ProtectedRoute allowedRoles={['ADMIN']}>
                      <AuditLogs />
                    </ProtectedRoute>
                  }
                />
                <Route path="unauthorized" element={<Unauthorized />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </StationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
