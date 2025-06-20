import React from 'react';

import { LazySignalDashboardWrapper } from '@/components/lazy/LazyComponents';

export default function SignalDashboardPage() {
  return (
    <div className="container-fluid">
      <div className="row">
        <div className="col-12">
          <LazySignalDashboardWrapper />
        </div>
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Signal Conflict Dashboard | Trading Framework',
  description: 'Real-time tracking of reinforcing vs contradicting macro signals with thesis alignment analysis',
};