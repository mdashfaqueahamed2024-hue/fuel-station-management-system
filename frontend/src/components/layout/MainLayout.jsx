import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { Breadcrumbs } from './Breadcrumbs.jsx';

export const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 md:hidden backdrop-blur-xs transition-opacity animate-in fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Responsive Sidebar (Drawer on Mobile, Static on Desktop) */}
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar setIsMobileMenuOpen={setIsMobileMenuOpen} />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <Breadcrumbs />
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 px-4 sm:px-6 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div className="truncate">
            © 2026 PetroFlow Enterprise • B.Tech Project
          </div>
          <div className="hidden sm:flex gap-4">
            <span>Stack: Node.js • Express • PostgreSQL / Prisma • React</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
