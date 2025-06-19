// app/module1/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'PoC Macro Dashboard | Trading Framework',
  description: 'Proof of Concept: Macro environment metrics dashboard with thesis analysis.',
};

export default function Module1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}