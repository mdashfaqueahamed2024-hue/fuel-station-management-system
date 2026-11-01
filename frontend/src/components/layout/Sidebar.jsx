import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Fuel,
  Gauge,
  CircleDollarSign,
  Truck,
  Clock3,
  Users,
  Receipt,
  FileBarChart2,
  Scale,
  ShieldAlert,
  History,
  LogOut,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

export const Sidebar = () => {
  const { user, logout, isAdmin, isManager } = useAuth();

  const navGroups = [
    {
      title: 'PRIMARY',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'Sales & POS Dispenser', path: '/sales', icon: CircleDollarSign },
      ],
    },
    {
      title: 'OPERATIONS',
      items: [
        { label: 'Fuel & Storage Tanks', path: '/fuels-tanks', icon: Fuel },
        { label: 'Pumps & Meter Readings', path: '/pumps', icon: Gauge },
        { label: 'Deliveries & Suppliers', path: '/deliveries', icon: Truck },
        { label: 'Attendant Shifts & Cash', path: '/shifts', icon: Clock3 },
      ],
    },
    {
      title: 'FINANCE & ACCOUNTS',
      items: [
        { label: 'Commercial Customers', path: '/customers', icon: Users },
        { label: 'Operating Expenses', path: '/expenses', icon: Receipt },
        { label: 'Stock Reconciliation', path: '/reconciliation', icon: Scale },
      ],
    },
    {
      title: 'INTELLIGENCE & SECURITY',
      items: [
        { label: 'Reports & Analytics', path: '/reports', icon: FileBarChart2 },
        { label: 'Anomaly Detector & Alerts', path: '/anomalies', icon: ShieldAlert },
        { label: 'Immutable Audit Trail', path: '/audit-logs', icon: History, adminOnly: true },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0 select-none">
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 gap-3 border-b border-slate-800/80 bg-slate-950/40">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
          <Flame className="w-5 h-5 text-amber-300 fill-amber-300" />
        </div>
        <div>
          <div className="font-bold text-white text-base tracking-tight flex items-center gap-1.5">
            PetroFlow
            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-400 border border-blue-800/60">
              PRO
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Enterprise Fuel Station OS</div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navGroups.map((group, idx) => {
          const visibleItems = group.items.filter((item) => !item.adminOnly || isAdmin);
          if (visibleItems.length === 0) return null;

          return (
            <div key={idx} className="space-y-1">
              <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </div>
              {visibleItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      }`
                    }
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-105" />
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition" />
                  </NavLink>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Session Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">{user?.fullName || 'Active User'}</div>
              <div className="text-[10px] text-blue-400 font-medium tracking-wide uppercase">
                {user?.role || 'Attendant'}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            title="Log Out"
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded hover:bg-slate-800 transition shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
