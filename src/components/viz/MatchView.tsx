import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePlayback } from '../../hooks/usePlayback';
import { Pitch } from './Pitch';
import { HeatmapLayer } from './HeatmapLayer';
import { Play, Pause, RotateCcw, Flame } from 'lucide-react';
import { TrackPoint } from '../../types/data';

// Binary search to find the index of the first element with timestamp >= target
const binarySearch = (data: TrackPoint[], targetTime: number): number => {
  let left = 0;
  let right = data.length - 1;
  let result = data.length;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (data[mid].timestamp >= targetTime) {
      result = mid;
      right = mid - 1;
    } else {
      left = mid + 1;
    }
  }
  return result;
};

export const MatchView: React.FC = () => {
  const { data } = useDataStore();
  
  // Calculate duration
  const duration = useMemo(() => {
    if (data.length === 0) return 0;
    return data[data.length - 1].timestamp;
  }, [data]);

  const { 
    currentTime, 
    isPlaying, 
    togglePlay, 
    seek, 
    speed, 
    setSpeed 
  } = usePlayback({ duration, initialSpeed: 5 }); // Speed 5x by default for easier viewing

  const [showHeatmap, setShowHeatmap] = useState(false);

  // Get current frame data
  const currentPlayers = useMemo(() => {
    if (data.length === 0) return [];

    // Find the starting index for current time window (e.g. +/- 0.05s)
    // Assuming data is sorted by timestamp.
    // We want the latest position for each player up to currentTime.
    
    // Optimization: Just show the points that are exactly at the current time step (closest).
    // Or simpler: Find the first index >= currentTime.
    const index = binarySearch(data, currentTime);
    
    // Get a window of points around this index to cover all players in this frame
    // This is a naive approximation assuming grouped timestamps.
    // If we want "latest position for each player", we'd need to scan backwards.
    // For this MVP, let's assume one player or synchronized rows.
    
    if (index >= data.length) return [];
    
    const frameTime = data[index].timestamp;
    // Allow a small epsilon for floating point comparison or frame aggregation
    const epsilon = 0.1; 
    
    if (Math.abs(frameTime - currentTime) > epsilon) {
       // If the closest next frame is too far, maybe show the previous one?
       if (index > 0) {
         const prevTime = data[index - 1].timestamp;
         if (Math.abs(prevTime - currentTime) < epsilon) {
           return [data[index - 1]]; // Simplified for single player logic mostly
         }
       }
       return [];
    }

    // Collect all points with this timestamp (handling multiple players)
    const players = [];
    let i = index;
    while (i < data.length && Math.abs(data[i].timestamp - frameTime) < 0.001) {
      players.push({
        id: data[i].player_id,
        x: data[i].x,
        y: data[i].y,
        color: '#ef4444' // red-500
      });
      i++;
    }
    
    return players;

  }, [data, currentTime]);

  const formatTime = (t: number) => {
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Pitch Viz */}
      <div className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl bg-gray-900 relative">
        <Pitch width={800} players={currentPlayers} />
        {showHeatmap && (
          <HeatmapLayer 
            data={data} 
            width={800} 
            height={800 * (68/105)} 
          />
        )}
      </div>

      {/* Controls */}
      <div className="w-full max-w-3xl bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
           <div className="flex items-center gap-4">
             <button 
               onClick={togglePlay}
               className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full text-white transition-colors"
             >
               {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
             </button>
             
             <button 
               onClick={() => { seek(0); }}
               className="p-2 text-gray-400 hover:text-white transition-colors"
               title="Restart"
             >
               <RotateCcw className="w-5 h-5" />
             </button>

             <div className="h-6 w-px bg-gray-700 mx-2" />

             <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  showHeatmap 
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
             >
               <Flame className="w-4 h-4" />
               {showHeatmap ? 'Heatmap On' : 'Heatmap Off'}
             </button>
           </div>
           
           <div className="text-2xl font-mono font-bold text-white">
             {formatTime(currentTime)} <span className="text-sm text-gray-500">/ {formatTime(duration)}</span>
           </div>

           <div className="flex items-center gap-2">
             <span className="text-xs text-gray-400">Speed:</span>
             <select 
               value={speed} 
               onChange={(e) => setSpeed(Number(e.target.value))}
               className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-2 py-1"
             >
               <option value="1">1x</option>
               <option value="2">2x</option>
               <option value="5">5x</option>
               <option value="10">10x</option>
               <option value="20">20x</option>
             </select>
           </div>
        </div>

        {/* Scrubber */}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="0"
            max={duration}
            step="0.1"
            value={currentTime}
            onChange={(e) => seek(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
