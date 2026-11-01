import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export const Unauthorized = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">403 — Unauthorized Access</h1>
      <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
        Your current operational role does not have authorization to access this administrative module. Role-based access control (RBAC) enforces station privilege boundaries.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary">Return to Operational Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};
