// components/ui/Tooltip.tsx
'use client';

import React, { useState, useRef, useEffect, useId } from 'react';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'hover' | 'focus' | 'click' | 'manual';
  delay?: number;
  hideDelay?: number;
  disabled?: boolean;
  className?: string;
  maxWidth?: string;
  arrow?: boolean;
  interactive?: boolean;
  offset?: number;
}

export function Tooltip({
  children,
  content,
  placement = 'auto',
  trigger = 'hover',
  delay = 500,
  hideDelay = 0,
  disabled = false,
  className = '',
  maxWidth = '320px',
  arrow = true,
  interactive = false,
  offset = 8
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [actualPlacement, setActualPlacement] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  
  const tooltipId = useId();

  // Calculate optimal placement
  const calculatePlacement = (): 'top' | 'bottom' | 'left' | 'right' => {
    if (placement !== 'auto') return placement;
    
    if (!triggerRef.current) return 'top';
    
    const rect = triggerRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    // Check available space in each direction
    const spaceTop = rect.top;
    const spaceBottom = viewport.height - rect.bottom;
    const spaceLeft = rect.left;
    const spaceRight = viewport.width - rect.right;
    
    // Find direction with most space
    const spaces = [
      { direction: 'top', space: spaceTop },
      { direction: 'bottom', space: spaceBottom },
      { direction: 'left', space: spaceLeft },
      { direction: 'right', space: spaceRight }
    ];
    
    const optimal = spaces.reduce((max, current) => 
      current.space > max.space ? current : max
    );
    
    return optimal.direction as 'top' | 'bottom' | 'left' | 'right';
  };

  // Calculate tooltip position
  const calculatePosition = (targetPlacement: 'top' | 'bottom' | 'left' | 'right') => {
    if (!triggerRef.current || !tooltipRef.current) return { x: 0, y: 0 };
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let x = 0;
    let y = 0;
    
    switch (targetPlacement) {
      case 'top':
        x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        y = triggerRect.top - tooltipRect.height - offset;
        break;
      case 'bottom':
        x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        y = triggerRect.bottom + offset;
        break;
      case 'left':
        x = triggerRect.left - tooltipRect.width - offset;
        y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;
      case 'right':
        x = triggerRect.right + offset;
        y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;
    }
    
    // Keep tooltip within viewport bounds
    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));
    
    return { x, y };
  };

  // Show tooltip
  const showTooltip = () => {
    if (disabled || !content) return;
    
    clearTimeout(timeoutRef.current);
    clearTimeout(hideTimeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      const targetPlacement = calculatePlacement();
      setActualPlacement(targetPlacement);
      setIsVisible(true);
    }, delay);
  };

  // Hide tooltip
  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    
    if (hideDelay > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, hideDelay);
    } else {
      setIsVisible(false);
    }
  };

  // Update position when visible
  useEffect(() => {
    if (isVisible && tooltipRef.current) {
      const newPosition = calculatePosition(actualPlacement);
      setPosition(newPosition);
    }
  }, [isVisible, actualPlacement]);

  // Event handlers
  const handleMouseEnter = () => {
    if (trigger === 'hover') showTooltip();
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') hideTooltip();
  };

  const handleFocus = () => {
    if (trigger === 'focus' || trigger === 'hover') showTooltip();
  };

  const handleBlur = () => {
    if (trigger === 'focus' || trigger === 'hover') hideTooltip();
  };

  const handleClick = () => {
    if (trigger === 'click') {
      if (isVisible) {
        hideTooltip();
      } else {
        showTooltip();
      }
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        hideTooltip();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible]);

  // Handle scroll and resize
  useEffect(() => {
    const handleUpdate = () => {
      if (isVisible) {
        const newPosition = calculatePosition(actualPlacement);
        setPosition(newPosition);
      }
    };

    if (isVisible) {
      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);
      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [isVisible, actualPlacement]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Clone children to add event handlers and ARIA attributes
  const triggerElement = React.cloneElement(
    children as React.ReactElement,
    {
      ref: triggerRef,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onClick: handleClick,
      'aria-describedby': isVisible ? tooltipId : undefined,
      'aria-expanded': trigger === 'click' ? isVisible : undefined,
    }
  );

  return (
    <>
      {triggerElement}
      
      {/* Tooltip portal */}
      {typeof window !== 'undefined' && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={`tooltip ${actualPlacement} ${isVisible ? 'visible' : 'hidden'} ${className}`}
          style={{
            position: 'fixed',
            left: position.x,
            top: position.y,
            maxWidth,
            zIndex: 'var(--z-tooltip)',
            pointerEvents: interactive ? 'auto' : 'none',
          }}
          onMouseEnter={interactive ? () => clearTimeout(hideTimeoutRef.current) : undefined}
          onMouseLeave={interactive ? hideTooltip : undefined}
        >
          <div className="tooltip-content">
            {content}
          </div>
          {arrow && <div className="tooltip-arrow" />}
        </div>
      )}
    </>
  );
}

// Specialized tooltip for metric formulas
export interface MetricTooltipProps {
  metricName: string;
  formula?: string;
  description?: string;
  source?: string;
  frequency?: string;
  children: React.ReactNode;
}

export function MetricTooltip({
  metricName,
  formula,
  description,
  source,
  frequency,
  children
}: MetricTooltipProps) {
  const content = (
    <div className="metric-tooltip-content">
      <div className="metric-tooltip-header">
        <h4 className="metric-tooltip-title">{metricName}</h4>
        {frequency && (
          <span className="metric-tooltip-frequency">{frequency}</span>
        )}
      </div>
      
      {description && (
        <div className="metric-tooltip-description">
          {description}
        </div>
      )}
      
      {formula && (
        <div className="metric-tooltip-formula">
          <strong>Formula:</strong>
          <code>{formula}</code>
        </div>
      )}
      
      {source && (
        <div className="metric-tooltip-source">
          <strong>Source:</strong> {source}
        </div>
      )}
    </div>
  );

  return (
    <Tooltip
      content={content}
      placement="auto"
      maxWidth="400px"
      delay={300}
      arrow={true}
      className="metric-tooltip"
    >
      {children}
    </Tooltip>
  );
}

// Help tooltip for UI elements
export interface HelpTooltipProps {
  title?: string;
  description: string;
  children: React.ReactNode;
}

export function HelpTooltip({ title, description, children }: HelpTooltipProps) {
  const content = (
    <div className="help-tooltip-content">
      {title && <div className="help-tooltip-title">{title}</div>}
      <div className="help-tooltip-description">{description}</div>
    </div>
  );

  return (
    <Tooltip
      content={content}
      placement="auto"
      maxWidth="280px"
      delay={200}
      arrow={true}
      className="help-tooltip"
    >
      {children}
    </Tooltip>
  );
}