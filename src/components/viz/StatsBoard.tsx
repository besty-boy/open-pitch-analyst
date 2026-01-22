import React, { useMemo } from 'react';
import { TrackPoint } from '../../types/data';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Gauge, Map } from 'lucide-react';

interface StatsBoardProps {
  data: TrackPoint[];
}

interface PlayerStats {
  id: string;
  totalDistance: number; // meters
  maxSpeed: number; // km/h
  avgSpeed: number; // km/h
}

export const StatsBoard: React.FC<StatsBoardProps> = ({ data }) => {
  const stats = useMemo(() => {
    const playerStats: Record<string, PlayerStats> = {};
    const previousPoints: Record<string, TrackPoint> = {};

    // First pass: Group and Calculate
    data.forEach((point) => {
      if (!playerStats[point.player_id]) {
        playerStats[point.player_id] = {
          id: point.player_id,
          totalDistance: 0,
          maxSpeed: 0,
          avgSpeed: 0,
        };
      }

      const pStats = playerStats[point.player_id];

      // Max Speed
      if (point.speed > pStats.maxSpeed) {
        pStats.maxSpeed = point.speed;
      }

      // Distance
      const prev = previousPoints[point.player_id];
      if (prev) {
        const dist = Math.sqrt(
          Math.pow(point.x - prev.x, 2) + Math.pow(point.y - prev.y, 2)
        );
        // Sanity check for huge jumps (teleportation)
        if (dist < 10) { // < 10 meters between frames (assuming high freq)
            pStats.totalDistance += dist;
        }
      }
      previousPoints[point.player_id] = point;
    });

    return Object.values(playerStats);
  }, [data]);

  // Chart Data: Subsample to ~500 points max for performance
  const chartData = useMemo(() => {
    if (data.length === 0) return [];
    
    // Pick the first player for the chart
    const firstPlayerId = stats[0]?.id;
    if (!firstPlayerId) return [];

    const playerData = data.filter(p => p.player_id === firstPlayerId);
    
    const step = Math.ceil(playerData.length / 500);
    return playerData.filter((_, i) => i % step === 0).map(p => ({
        time: p.timestamp,
        speed: p.speed
    }));
  }, [data, stats]);

  if (stats.length === 0) return null;

  // Render stats for the first player (or all in a grid if robust)
  // For MVP Dashboard, let's show cards for the first player mainly.
  const mainStat = stats[0];

  return (
    <div className="w-full max-w-6xl space-y-6">
      <h2 className="text-xl font-semibold text-white">Performance Metrics</h2>
      
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
              <Map className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Distance</p>
              <h3 className="text-2xl font-bold text-white">
                {(mainStat.totalDistance / 1000).toFixed(2)} <span className="text-sm font-normal text-gray-500">km</span>
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/20 rounded-lg text-emerald-400">
              <Gauge className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Max Speed</p>
              <h3 className="text-2xl font-bold text-white">
                {mainStat.maxSpeed.toFixed(1)} <span className="text-sm font-normal text-gray-500">km/h</span>
              </h3>
            </div>
          </div>
        </div>
        
         <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-500/20 rounded-lg text-purple-400">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Player ID</p>
              <h3 className="text-xl font-bold text-white truncate">
                {mainStat.id}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
        <h3 className="text-lg font-medium text-white mb-4">Speed Profile</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                tickFormatter={(val) => Math.floor(val).toString()}
                label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
              />
              <YAxis 
                stroke="#9ca3af"
                label={{ value: 'Speed (km/h)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff' }}
              />
              <Line 
                type="monotone" 
                dataKey="speed" 
                stroke="#3b82f6" 
                strokeWidth={2} 
                dot={false} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
