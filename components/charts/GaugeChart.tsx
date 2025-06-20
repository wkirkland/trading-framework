// components/charts/GaugeChart.tsx
'use client';

import React from 'react';

interface GaugeChartProps {
  value: number; // Value between -100 and 100
  size?: number; // Diameter in pixels
  title?: string;
  subtitle?: string;
  showValue?: boolean;
  showLabels?: boolean;
  className?: string;
  colorScheme?: 'default' | 'trading' | 'custom';
  customColors?: {
    negative: string;
    neutral: string;
    positive: string;
  };
}

export function GaugeChart({
  value,
  size = 200,
  title,
  subtitle,
  showValue = true,
  showLabels = true,
  className = '',
  colorScheme = 'trading',
  customColors
}: GaugeChartProps) {
  // Clamp value between -100 and 100
  const clampedValue = Math.max(-100, Math.min(100, value));
  
  // Calculate dimensions
  const radius = (size - 40) / 2; // Leave space for labels
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Gauge configuration
  const startAngle = -135; // Start angle in degrees
  const endAngle = 135;    // End angle in degrees
  const totalAngle = endAngle - startAngle; // 270 degrees total
  
  // Colors based on scheme
  const getColors = () => {
    if (customColors) return customColors;
    
    switch (colorScheme) {
      case 'trading':
        return {
          negative: 'var(--status-contradict-solid)', // Red
          neutral: 'var(--status-neutral-solid)',     // Amber
          positive: 'var(--status-confirm-solid)'     // Green
        };
      default:
        return {
          negative: '#ef4444',
          neutral: '#f59e0b', 
          positive: '#10b981'
        };
    }
  };
  
  const colors = getColors();
  
  // Get color based on value
  const getValueColor = (val: number) => {
    if (val < -20) return colors.negative;
    if (val > 20) return colors.positive;
    return colors.neutral;
  };
  
  // Convert angle to radians
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  
  // Calculate needle angle based on value
  const needleAngle = startAngle + (totalAngle * (clampedValue + 100) / 200);
  const needleRadians = toRadians(needleAngle);
  
  // Create gauge arc path
  const createArc = (startAngle: number, endAngle: number, innerRadius: number, outerRadius: number) => {
    const start = toRadians(startAngle);
    const end = toRadians(endAngle);
    
    const x1 = centerX + innerRadius * Math.cos(start);
    const y1 = centerY + innerRadius * Math.sin(start);
    const x2 = centerX + outerRadius * Math.cos(start);
    const y2 = centerY + outerRadius * Math.sin(start);
    
    const x3 = centerX + outerRadius * Math.cos(end);
    const y3 = centerY + outerRadius * Math.sin(end);
    const x4 = centerX + innerRadius * Math.cos(end);
    const y4 = centerY + innerRadius * Math.sin(end);
    
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    
    return `
      M ${x1} ${y1}
      L ${x2} ${y2}
      A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x3} ${y3}
      L ${x4} ${y4}
      A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1} ${y1}
      Z
    `;
  };
  
  // Create segments
  const segmentAngle = totalAngle / 3;
  const innerRadius = radius * 0.7;
  const outerRadius = radius * 0.9;
  
  const segments = [
    {
      path: createArc(startAngle, startAngle + segmentAngle, innerRadius, outerRadius),
      color: colors.negative,
      label: 'Bearish'
    },
    {
      path: createArc(startAngle + segmentAngle, startAngle + segmentAngle * 2, innerRadius, outerRadius),
      color: colors.neutral,
      label: 'Neutral'
    },
    {
      path: createArc(startAngle + segmentAngle * 2, endAngle, innerRadius, outerRadius),
      color: colors.positive,
      label: 'Bullish'
    }
  ];
  
  // Needle coordinates
  const needleLength = radius * 0.8;
  const needleX = centerX + needleLength * Math.cos(needleRadians);
  const needleY = centerY + needleLength * Math.sin(needleRadians);
  
  // Label positions
  const labelRadius = radius * 1.1;
  const getLabelPosition = (angle: number) => ({
    x: centerX + labelRadius * Math.cos(toRadians(angle)),
    y: centerY + labelRadius * Math.sin(toRadians(angle))
  });
  
  const formatValue = (val: number) => {
    if (val > 0) return `+${val.toFixed(1)}`;
    return val.toFixed(1);
  };

  return (
    <div className={`gauge-chart ${className}`}>
      {title && <h3 className="gauge-title">{title}</h3>}
      {subtitle && <p className="gauge-subtitle">{subtitle}</p>}
      
      <div className="gauge-container" style={{ position: 'relative' }}>
        <svg width={size} height={size} className="gauge-svg">
          {/* Background circle */}
          <circle
            cx={centerX}
            cy={centerY}
            r={radius}
            fill="none"
            stroke="var(--color-neutral-200)"
            strokeWidth="1"
            className="gauge-background"
          />
          
          {/* Gauge segments */}
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              className="gauge-segment"
              style={{
                opacity: 0.8,
                transition: 'opacity var(--duration-fast) var(--ease-standard)'
              }}
            />
          ))}
          
          {/* Segment labels */}
          {showLabels && segments.map((segment, index) => {
            const labelAngle = startAngle + segmentAngle * (index + 0.5);
            const labelPos = getLabelPosition(labelAngle);
            return (
              <text
                key={`label-${index}`}
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="gauge-label"
                style={{
                  fontSize: '12px',
                  fontWeight: 'var(--font-weight-medium)',
                  fill: 'var(--color-neutral-600)'
                }}
              >
                {segment.label}
              </text>
            );
          })}
          
          {/* Scale markers */}
          {[-100, -50, 0, 50, 100].map((scaleValue) => {
            const scaleAngle = startAngle + (totalAngle * (scaleValue + 100) / 200);
            const scaleRadians = toRadians(scaleAngle);
            const innerScaleRadius = radius * 0.85;
            const outerScaleRadius = radius * 0.95;
            
            const x1 = centerX + innerScaleRadius * Math.cos(scaleRadians);
            const y1 = centerY + innerScaleRadius * Math.sin(scaleRadians);
            const x2 = centerX + outerScaleRadius * Math.cos(scaleRadians);
            const y2 = centerY + outerScaleRadius * Math.sin(scaleRadians);
            
            return (
              <line
                key={scaleValue}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--color-neutral-400)"
                strokeWidth="2"
                className="gauge-tick"
              />
            );
          })}
          
          {/* Scale numbers */}
          {showLabels && [-100, -50, 0, 50, 100].map((scaleValue) => {
            const scaleAngle = startAngle + (totalAngle * (scaleValue + 100) / 200);
            const numberPos = getLabelPosition(scaleAngle);
            return (
              <text
                key={`scale-${scaleValue}`}
                x={numberPos.x}
                y={numberPos.y + 20}
                textAnchor="middle"
                dominantBaseline="central"
                className="gauge-scale-number"
                style={{
                  fontSize: '10px',
                  fontWeight: 'var(--font-weight-normal)',
                  fill: 'var(--color-neutral-500)'
                }}
              >
                {scaleValue}
              </text>
            );
          })}
          
          {/* Needle */}
          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={getValueColor(clampedValue)}
            strokeWidth="3"
            strokeLinecap="round"
            className="gauge-needle"
            style={{
              transition: 'all var(--duration-normal) var(--ease-standard)'
            }}
          />
          
          {/* Center dot */}
          <circle
            cx={centerX}
            cy={centerY}
            r="6"
            fill={getValueColor(clampedValue)}
            className="gauge-center"
            style={{
              transition: 'fill var(--duration-normal) var(--ease-standard)'
            }}
          />
        </svg>
        
        {/* Value display */}
        {showValue && (
          <div 
            className="gauge-value-display"
            style={{
              position: 'absolute',
              top: '65%',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center'
            }}
          >
            <div 
              className="gauge-value"
              style={{
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: getValueColor(clampedValue),
                transition: 'color var(--duration-normal) var(--ease-standard)'
              }}
            >
              {formatValue(clampedValue)}
            </div>
            <div 
              className="gauge-value-label"
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-neutral-600)',
                fontWeight: 'var(--font-weight-medium)',
                textTransform: 'uppercase',
                letterSpacing: '0.025em'
              }}
            >
              Weight of Evidence
            </div>
          </div>
        )}
      </div>
    </div>
  );
}