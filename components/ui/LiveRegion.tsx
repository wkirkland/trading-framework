// components/ui/LiveRegion.tsx
'use client';

import React, { useRef, useEffect } from 'react';

export interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'off' | 'polite' | 'assertive';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
  id?: string;
  className?: string;
  role?: 'status' | 'alert' | 'log';
  ariaLabel?: string;
  clearOnUpdate?: boolean;
  debounceMs?: number;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'all',
  id,
  className = '',
  role,
  ariaLabel,
  clearOnUpdate = false,
  debounceMs = 0
}: LiveRegionProps) {
  const regionRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const previousContentRef = useRef<string>('');

  useEffect(() => {
    if (!regionRef.current) return;

    const currentContent = typeof children === 'string' ? children : regionRef.current.textContent || '';
    
    // Only announce if content has actually changed
    if (currentContent === previousContentRef.current) return;

    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const announceUpdate = () => {
      if (!regionRef.current) return;

      if (clearOnUpdate) {
        // Temporarily clear content to ensure screen readers notice the change
        const originalContent = regionRef.current.innerHTML;
        regionRef.current.innerHTML = '';
        
        // Use a microtask to restore content immediately
        requestAnimationFrame(() => {
          if (regionRef.current) {
            regionRef.current.innerHTML = originalContent;
          }
        });
      }

      previousContentRef.current = currentContent;
    };

    if (debounceMs > 0) {
      timeoutRef.current = setTimeout(announceUpdate, debounceMs);
    } else {
      announceUpdate();
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [children, clearOnUpdate, debounceMs]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const liveValue = politeness === 'off' ? undefined : politeness;

  return (
    <div
      ref={regionRef}
      id={id}
      className={`live-region ${className}`}
      aria-live={liveValue}
      aria-atomic={atomic}
      aria-relevant={relevant}
      role={role}
      aria-label={ariaLabel}
    >
      {children}
    </div>
  );
}

// Specialized live regions for common use cases
export interface StatusRegionProps {
  status: string;
  id?: string;
  className?: string;
  debounceMs?: number;
}

export function StatusRegion({ status, id, className = '', debounceMs = 500 }: StatusRegionProps) {
  return (
    <LiveRegion
      politeness="polite"
      atomic={true}
      role="status"
      id={id}
      className={`status-region ${className}`}
      debounceMs={debounceMs}
    >
      {status}
    </LiveRegion>
  );
}

export interface AlertRegionProps {
  alert: string;
  id?: string;
  className?: string;
  clearOnUpdate?: boolean;
}

export function AlertRegion({ alert, id, className = '', clearOnUpdate = true }: AlertRegionProps) {
  return (
    <LiveRegion
      politeness="assertive"
      atomic={true}
      role="alert"
      id={id}
      className={`alert-region ${className}`}
      clearOnUpdate={clearOnUpdate}
    >
      {alert}
    </LiveRegion>
  );
}

export interface CountRegionProps {
  count: number;
  label: string;
  id?: string;
  className?: string;
  debounceMs?: number;
}

export function CountRegion({ count, label, id, className = '', debounceMs = 1000 }: CountRegionProps) {
  const message = `${label}: ${count}`;
  
  return (
    <LiveRegion
      politeness="polite"
      atomic={true}
      role="status"
      id={id}
      className={`count-region ${className}`}
      debounceMs={debounceMs}
      ariaLabel={`Live count updates for ${label}`}
    >
      {message}
    </LiveRegion>
  );
}

export interface ProgressRegionProps {
  progress: number;
  total?: number;
  label: string;
  id?: string;
  className?: string;
  debounceMs?: number;
}

export function ProgressRegion({ 
  progress, 
  total, 
  label, 
  id, 
  className = '', 
  debounceMs = 500 
}: ProgressRegionProps) {
  const percentage = total ? Math.round((progress / total) * 100) : progress;
  const message = total 
    ? `${label}: ${progress} of ${total} (${percentage}%)`
    : `${label}: ${percentage}%`;
  
  return (
    <LiveRegion
      politeness="polite"
      atomic={true}
      role="status"
      id={id}
      className={`progress-region ${className}`}
      debounceMs={debounceMs}
      ariaLabel={`Progress updates for ${label}`}
    >
      {message}
    </LiveRegion>
  );
}

// Hidden live region for screen reader announcements only
export interface AnnouncementRegionProps {
  message: string;
  id?: string;
  politeness?: 'polite' | 'assertive';
  clearAfterMs?: number;
}

export function AnnouncementRegion({ 
  message, 
  id, 
  politeness = 'polite',
  clearAfterMs = 3000
}: AnnouncementRegionProps) {
  const [currentMessage, setCurrentMessage] = React.useState(message);

  useEffect(() => {
    setCurrentMessage(message);
    
    if (clearAfterMs > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfterMs);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearAfterMs]);

  return (
    <LiveRegion
      politeness={politeness}
      atomic={true}
      role="status"
      id={id}
      className="sr-only"
      clearOnUpdate={true}
    >
      {currentMessage}
    </LiveRegion>
  );
}