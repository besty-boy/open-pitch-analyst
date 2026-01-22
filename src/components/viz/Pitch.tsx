import React, { useMemo } from 'react';
import { scaleLinear } from 'd3-scale';

interface Player {
  id: string;
  x: number; // meters
  y: number; // meters
  color?: string;
}

interface PitchProps {
  width?: number; // width in pixels
  children?: React.ReactNode;
  players?: Player[];
}

// Standard Pitch Dimensions (Meters)
const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;

// Colors
const PITCH_COLOR = '#2e8b57'; // SeaGreen
const LINE_COLOR = 'white';

export const Pitch: React.FC<PitchProps> = ({ 
  width = 800, 
  children,
  players = []
}) => {
  // Calculate height to maintain aspect ratio if not provided
  const height = useMemo(() => {
    return width * (PITCH_WIDTH / PITCH_LENGTH);
  }, [width]);

  // Scales (Meters -> Pixels)
  const xScale = useMemo(
    () => scaleLinear().domain([0, PITCH_LENGTH]).range([0, width]),
    [width]
  );
  
  const yScale = useMemo(
    () => scaleLinear().domain([0, PITCH_WIDTH]).range([0, height]), // 0 is top
    [height]
  );

  // Helper for scaled dimensions
  const s = (meters: number) => xScale(meters);
  const sx = (meters: number) => xScale(meters);
  const sy = (meters: number) => yScale(meters);

  return (
    <div className="relative" style={{ width, height }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Background (Grass) */}
        <rect width={width} height={height} fill={PITCH_COLOR} />

        {/* Outer Lines */}
        <rect 
          x={0} 
          y={0} 
          width={width} 
          height={height} 
          fill="none" 
          stroke={LINE_COLOR} 
          strokeWidth={2} 
        />

        {/* Center Line */}
        <line 
          x1={width / 2} 
          y1={0} 
          x2={width / 2} 
          y2={height} 
          stroke={LINE_COLOR} 
          strokeWidth={2} 
        />

        {/* Center Circle */}
        <circle 
          cx={width / 2} 
          cy={height / 2} 
          r={s(9.15)} 
          fill="none" 
          stroke={LINE_COLOR} 
          strokeWidth={2} 
        />
        <circle 
          cx={width / 2} 
          cy={height / 2} 
          r={s(0.5)} 
          fill={LINE_COLOR} 
        />

        {/* Penalty Areas */}
        {/* Left */}
        <rect 
          x={0} 
          y={s((68 - 40.32) / 2)} 
          width={s(16.5)} 
          height={s(40.32)} 
          fill="none" 
          stroke={LINE_COLOR} 
          strokeWidth={2} 
        />
        {/* Right */}
        <rect 
          x={width - s(16.5)} 
          y={s((68 - 40.32) / 2)} 
          width={s(16.5)} 
          height={s(40.32)} 
          fill="none" 
          stroke={LINE_COLOR} 
          strokeWidth={2} 
        />

        {/* Goal Areas */}
        {/* Left */}
        <rect 
          x={0} 
          y={s((68 - 18.32) / 2)} 
          width={s(5.5)} 
          height={s(18.32)} 
          fill="none" 
          stroke={LINE_COLOR} 
          strokeWidth={2} 
        />
        {/* Right */}
        <rect 
          x={width - s(5.5)} 
          y={s((68 - 18.32) / 2)} 
          width={s(5.5)} 
          height={s(18.32)} 
          fill="none" 
          stroke={LINE_COLOR} 
          strokeWidth={2} 
        />

        {/* Penalty Spots */}
        <circle cx={s(11)} cy={height / 2} r={s(0.3)} fill={LINE_COLOR} />
        <circle cx={width - s(11)} cy={height / 2} r={s(0.3)} fill={LINE_COLOR} />

        {/* Corner Arcs */}
        <path d={`M ${s(1)} 0 A ${s(1)} ${s(1)} 0 0 1 0 ${s(1)}`} stroke={LINE_COLOR} fill="none" />
        <path d={`M ${width} ${s(1)} A ${s(1)} ${s(1)} 0 0 1 ${width - s(1)} 0`} stroke={LINE_COLOR} fill="none" />
        <path d={`M ${width - s(1)} ${height} A ${s(1)} ${s(1)} 0 0 1 ${width} ${height - s(1)}`} stroke={LINE_COLOR} fill="none" />
        <path d={`M 0 ${height - s(1)} A ${s(1)} ${s(1)} 0 0 1 ${s(1)} ${height}`} stroke={LINE_COLOR} fill="none" />

        {/* Players */}
        {players.map((p) => (
          <g key={p.id} transform={`translate(${sx(p.x)}, ${sy(p.y)})`}>
            <circle r={s(1)} fill={p.color || 'red'} stroke="white" strokeWidth={1} />
            <text 
              y={-s(1.5)} 
              textAnchor="middle" 
              fill="white" 
              fontSize={10} 
              fontWeight="bold"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)' }}
            >
              {p.id}
            </text>
          </g>
        ))}

        {/* Render Children (Players, etc) */}
        {children}
      </svg>
    </div>
  );
};

// Export scaler hook or component to use scales inside children
// For MVP, we can pass scale functions or render children with absolute positioning overlay
// But SVG children are better for scaling.
// Let's create a context or just accept render props if needed, but for now children are SVG elements.
