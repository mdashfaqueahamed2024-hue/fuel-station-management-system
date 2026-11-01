import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { Navbar } from './Navbar.jsx';
import { Breadcrumbs } from './Breadcrumbs.jsx';

export const MainLayout = () => {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Dark Navy Sidebar */}
      <Sidebar />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Breadcrumbs />
          <Outlet />
        </main>

        {/* Global Footer */}
        <footer className="h-10 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
          <div>
            © 2026 PetroFlow Enterprise Management System | B.Tech Capstone Project
          </div>
          <div className="flex gap-4">
            <span>Stack: Node.js • Express • PostgreSQL / Prisma • React • Tailwind</span>
          </div>
        </footer>
      </div>
    </div>
  );
};
