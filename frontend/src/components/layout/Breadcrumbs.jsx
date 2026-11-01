import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames = {
  dashboard: 'Operational Dashboard',
  sales: 'Sales & POS Dispenser',
  'fuels-tanks': 'Fuel Inventory & Storage Tanks',
  pumps: 'Pumps & Meter Readings',
  deliveries: 'Deliveries & Suppliers',
  shifts: 'Attendant Shifts & Cash',
  customers: 'Commercial & Fleet Customers',
  expenses: 'Operating Expenses & Financials',
  reconciliation: 'Stock Reconciliation',
  reports: 'Reports & Business Intelligence',
  anomalies: 'Anomaly Detection & Alerts',
  'audit-logs': 'Immutable Audit Logs',
};

export const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0 || pathnames[0] === 'login') return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
      <Link to="/dashboard" className="flex items-center gap-1 hover:text-blue-600 transition">
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {pathnames.map((segment, idx) => {
        const routeTo = `/${pathnames.slice(0, idx + 1).join('/')}`;
        const isLast = idx === pathnames.length - 1;
        const displayName = routeNames[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <React.Fragment key={routeTo}>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-800">{displayName}</span>
            ) : (
              <Link to={routeTo} className="hover:text-blue-600 transition">
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
