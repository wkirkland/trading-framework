// components/layout/MainLayout.tsx
'use client';

import { useState, useEffect } from 'react';

import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
      // Close sidebar on mobile when switching to desktop
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Close sidebar when clicking outside on mobile
  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Handle escape key to close sidebar
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  return (
    <div className="main-layout">
      {/* Mobile hamburger menu */}
      {!isDesktop && (
        <header className="mobile-header">
          <button
            className="hamburger-menu"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={sidebarOpen}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="mobile-brand">
            <span className="mobile-title">Trading Framework</span>
          </div>
        </header>
      )}

      {/* Sidebar overlay for mobile */}
      {!isDesktop && (
        <div 
          className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div className={`sidebar-container ${sidebarOpen ? 'open' : ''}`}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <main className={`main-content ${isDesktop ? 'with-sidebar' : ''}`}>
        {children}
      </main>
    </div>
  );
}