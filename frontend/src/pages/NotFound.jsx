import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { Button } from '../components/ui/Button.jsx';

export const NotFound = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mb-4">
        <FileQuestion className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-bold text-slate-900">404 — Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
        The requested forecourt module or resource route could not be found in the PetroFlow station directory.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary">Return to Operational Dashboard</Button>
        </Link>
      </div>
    </div>
  );
};
