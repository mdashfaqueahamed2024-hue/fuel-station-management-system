import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useStation } from '../../context/StationContext.jsx';
import { Building2, Bell, Clock, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Navbar = ({ setIsMobileMenuOpen }) => {
  const { user } = useAuth();
  const { stations, activeStationId, selectStation, activeStation } = useStation();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
      {/* Left: Mobile Hamburger & Station Selector */}
      <div className="flex items-center gap-2 sm:gap-4 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 md:hidden transition shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 text-slate-700 bg-slate-50 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium max-w-[200px] sm:max-w-xs md:max-w-none truncate">
          <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 shrink-0" />
          <span className="text-slate-500 hidden sm:inline">Active:</span>
          {stations.length > 1 && user?.role === 'ADMIN' ? (
            <select
              value={activeStationId}
              onChange={(e) => selectStation(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 focus:outline-none cursor-pointer pr-1 truncate text-xs"
            >
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          ) : (
            <span className="font-semibold text-slate-900 truncate">
              {activeStation?.name || 'PetroFlow Station 1'}
            </span>
          )}
        </div>

        {/* Database Connection Status Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>DB: Connected</span>
        </div>
      </div>

      {/* Right: Live Station Clock, Alerts, and User Info */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* Real-time Clock */}
        <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-mono bg-slate-100/80 px-2.5 py-1 rounded-md border border-slate-200">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          {time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>

        {/* Alerts Link */}
        <Link
          to="/anomalies"
          title="Active Operational Alerts"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </Link>

        {/* User Identity Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[120px]">
              {user?.fullName}
            </div>
            <div className="text-[10px] text-slate-500 leading-tight capitalize">
              <span className="font-medium text-blue-600">{user?.role}</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};
