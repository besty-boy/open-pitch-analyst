import React, { useEffect, useRef } from 'react';
import { scaleLinear } from 'd3-scale';
import simpleheat from 'simpleheat';
import { TrackPoint } from '../../types/data';

interface HeatmapLayerProps {
  data: TrackPoint[];
  width: number;
  height: number;
}

// Standard Pitch Dimensions (Meters) - Must match Pitch.tsx
const PITCH_LENGTH = 105;
const PITCH_WIDTH = 68;

export const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ data, width, height }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Scales
    const xScale = scaleLinear().domain([0, PITCH_LENGTH]).range([0, width]);
    const yScale = scaleLinear().domain([0, PITCH_WIDTH]).range([0, height]);

    // Prepare data for simpleheat: [x, y, intensity]
    // Intensity can be static (1) for density
    const heatPoints = data.map(p => [xScale(p.x), yScale(p.y), 1]);

    // Initialize simpleheat
    // @ts-expect-error - simpleheat has no types
    const heat = simpleheat(canvas);

    // Configuration
    heat.data(heatPoints);
    
    // Radius and Blur
    // Radius depends on scale. 1 meter ~ width/105 pixels.
    const meterPixels = width / 105;
    heat.radius(meterPixels * 2, meterPixels * 1.5); // Radius, Blur

    // Draw
    // Max intensity: adjust based on data density? 
    // If too many points, max should be higher.
    // Simple heuristic: data.length / 100 ?
    heat.max(Math.max(1, data.length / 500)); 
    
    heat.draw();

  }, [data, width, height]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className="absolute top-0 left-0 pointer-events-none opacity-60"
    />
  );
};
