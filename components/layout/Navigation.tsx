// components/layout/Navigation.tsx (updated)
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', description: 'Trading Framework Overview' },
    { href: '/module1', label: 'Module 1', description: 'Macro Environment Assessment' },
    { href: '/signal-dashboard', label: 'Signal Dashboard', description: 'Basic Conflict Analysis' },
    { href: '/enhanced-dashboard', label: 'Enhanced Dashboard', description: 'Market + Economic Signals' }, // NEW
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav>
      <div className="nav-container">
        {/* Logo/Brand */}
        <Link href="/" className="nav-brand">
          <div className="nav-logo">
            <span>TF</span>
          </div>
          <span className="nav-title">Trading Framework</span>
        </Link>

        {/* Navigation Menu */}
        <div className="nav-menu">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
            >
              <div className="nav-item-title">
                {item.href === '/enhanced-dashboard' && '🔥 '}
                {item.label}
              </div>
              <div className="nav-item-desc">{item.description}</div>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}