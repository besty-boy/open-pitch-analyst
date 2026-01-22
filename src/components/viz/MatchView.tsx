import React, { useMemo, useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { usePlayback } from '../../hooks/usePlayback';
import { Pitch } from './Pitch';
import { HeatmapLayer } from './HeatmapLayer';
import { Play, Pause, RotateCcw, Flame, Users } from 'lucide-react';
import { TrackPoint } from '../../types/data';

interface PlayerData {
  [playerId: string]: TrackPoint[];
}

interface PlayerInfo {
  id: string;
  name: string;
  number: number;
  team: string;
}

// Interpolate between two points
const interpolate = (p1: TrackPoint, p2: TrackPoint, time: number): { x: number; y: number; speed: number } => {
  const duration = p2.timestamp - p1.timestamp;
  if (duration <= 0.0001) return { x: p1.x, y: p1.y, speed: p1.speed };

  const ratio = (time - p1.timestamp) / duration;
  
  return {
    x: p1.x + (p2.x - p1.x) * ratio,
    y: p1.y + (p2.y - p1.y) * ratio,
    speed: p1.speed + (p2.speed - p1.speed) * ratio,
  };
};

// Binary search to find the index of the first element with timestamp <= target
const findStartIndex = (arr: TrackPoint[], targetTime: number): number => {
  let left = 0;
  let right = arr.length - 1;
  let result = -1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid].timestamp <= targetTime) {
      result = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return result;
};

// Map team IDs to colors
const TEAM_COLORS: Record<string, string> = {
  'Team_OpenSource': '#3b82f6', // blue-500
  'Team_Proprietary': '#ef4444', // red-500
  'BALL': '#ffffff', // White
};
const DEFAULT_COLOR = '#10b981'; // emerald-500

export const MatchView: React.FC = () => {
  const { data } = useDataStore();
  
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Calculate duration and organize data by player
  const { duration, playersData, teamColors, playersList } = useMemo(() => {
    if (data.length === 0) return { duration: 0, playersData: {}, teamColors: {}, playersList: [] };
    
    const maxTime = data[data.length - 1].timestamp;
    
    // Group by player
    const grouped: PlayerData = {};
    const teams: Record<string, string> = {};
    const infoMap: Record<string, PlayerInfo> = {};

    data.forEach(p => {
      if (!grouped[p.player_id]) {
        grouped[p.player_id] = [];
        // Store static info for the list
        if (p.player_id.toLowerCase() !== 'ball') {
           infoMap[p.player_id] = {
             id: p.player_id,
             name: p.player_name || p.player_id,
             number: p.jersey_number || 0,
             team: p.team_id || 'Unknown'
           };
        }
      }
      grouped[p.player_id].push(p);
      
      // Assign team colors dynamically if not predefined
      if (p.team_id && !teams[p.team_id]) {
        teams[p.team_id] = TEAM_COLORS[p.team_id] || (Object.keys(teams).length % 2 === 0 ? '#3b82f6' : '#ef4444');
      }
    });

    // Sort each player's data by timestamp
    Object.keys(grouped).forEach(key => {
        grouped[key].sort((a, b) => a.timestamp - b.timestamp);
    });

    const list = Object.values(infoMap).sort((a, b) => {
        if (a.team !== b.team) return a.team.localeCompare(b.team);
        return a.number - b.number;
    });

    return { duration: maxTime, playersData: grouped, teamColors: teams, playersList: list };
  }, [data]);

  const { 
    currentTime, 
    isPlaying, 
    togglePlay, 
    seek, 
    speed, 
    setSpeed 
  } = usePlayback({ duration, initialSpeed: 1 });


  // Calculate interpolated positions for all players
  const currentPlayers = useMemo(() => {
    const players = [];

    for (const [playerId, tracks] of Object.entries(playersData)) {
      // Find relevant points
      const idx = findStartIndex(tracks, currentTime);
      
      const isBall = playerId.toLowerCase() === 'ball';
      // Determine Opacity
      let opacity = 1;
      if (selectedPlayerId) {
          // If a player is selected:
          // - Selected Player: 1
          // - Ball: 1 (Always visible context)
          // - Others: 0.2
          if (playerId !== selectedPlayerId && !isBall) {
              opacity = 0.2;
          }
      }

      // If before first point or empty
      if (idx === -1) {
          if (tracks.length > 0 && Math.abs(currentTime - tracks[0].timestamp) < 0.1) {
             const p = tracks[0];
             players.push({
               id: p.player_id,
               label: p.jersey_number?.toString() || p.player_id,
               x: p.x,
               y: p.y,
               color: p.team_id ? teamColors[p.team_id] : DEFAULT_COLOR,
               name: p.player_name,
               opacity
             });
          }
          continue;
      }

      const p1 = tracks[idx];
      
      // Last point check
      if (idx === tracks.length - 1) {
        if (currentTime >= p1.timestamp && (currentTime - p1.timestamp) < 2.0) {
             players.push({
               id: p1.player_id,
               label: p1.jersey_number?.toString() || p1.player_id,
               x: p1.x,
               y: p1.y,
               color: p1.team_id ? teamColors[p1.team_id] : DEFAULT_COLOR,
               name: p1.player_name,
               opacity
             });
        }
        continue;
      }

      const p2 = tracks[idx + 1];

      // Gap check
      if (p2.timestamp - p1.timestamp > 5.0) {
          if (currentTime - p1.timestamp < 1.0) {
             players.push({
               id: p1.player_id,
               label: p1.jersey_number?.toString() || p1.player_id,
               x: p1.x,
               y: p1.y,
               color: p1.team_id ? teamColors[p1.team_id] : DEFAULT_COLOR,
               name: p1.player_name,
               opacity
             });
          }
          continue;
      }

      const { x, y } = interpolate(p1, p2, currentTime);
      
      players.push({
         id: p1.player_id,
         label: p1.jersey_number?.toString() || p1.player_id,
         x,
         y,
         color: p1.team_id ? teamColors[p1.team_id] : DEFAULT_COLOR,
         name: p1.player_name,
         opacity
      });
    }
    
    return players;

  }, [playersData, currentTime, teamColors, selectedPlayerId]);

  // Filter Heatmap Data
  const heatmapData = useMemo(() => {
    if (!selectedPlayerId) return data;
    return data.filter(p => p.player_id === selectedPlayerId);
  }, [data, selectedPlayerId]);

  const formatTime = (t: number) => {
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    const ms = Math.floor((t % 1) * 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms}`;
  };

  // Group players list by team for UI
  const playersByTeam = useMemo(() => {
      const grouped: Record<string, PlayerInfo[]> = {};
      playersList.forEach(p => {
          if (!grouped[p.team]) grouped[p.team] = [];
          grouped[p.team].push(p);
      });
      return grouped;
  }, [playersList]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto px-4">
      
      <div className="flex gap-6 items-start">
        {/* Left: Pitch & Controls */}
        <div className="flex-1 flex flex-col gap-6">
            <div className="border-4 border-gray-800 rounded-lg overflow-hidden shadow-2xl bg-gray-900 relative w-full">
                <Pitch width={800} players={currentPlayers} />
                {showHeatmap && (
                <HeatmapLayer 
                    data={heatmapData} 
                    width={800} 
                    height={800 * (68/105)} 
                />
                )}
                
                {/* Overlay Title if filtered */}
                {selectedPlayerId && showHeatmap && (
                    <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm border border-white/10">
                        Heatmap: {playersList.find(p => p.id === selectedPlayerId)?.name}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="w-full bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-4 shadow-lg">
                <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <button 
                    onClick={togglePlay}
                    className="p-3 bg-blue-600 hover:bg-blue-500 rounded-full text-white transition-colors shadow-lg active:scale-95 transform"
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
                    {showHeatmap ? 'Heatmap' : 'Heatmap'}
                    </button>
                </div>
                
                <div className="flex-1 flex justify-center">
                    <div className="text-3xl font-mono font-bold text-white tracking-wider bg-gray-900 px-4 py-1 rounded border border-gray-700">
                    {formatTime(currentTime)} <span className="text-sm text-gray-500">/ {formatTime(duration)}</span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Speed</span>
                    <select 
                    value={speed} 
                    onChange={(e) => setSpeed(Number(e.target.value))}
                    className="bg-gray-900 border border-gray-700 text-white text-sm rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                    <option value="0.5">0.5x</option>
                    <option value="1">1x</option>
                    <option value="2">2x</option>
                    <option value="5">5x</option>
                    <option value="10">10x</option>
                    </select>
                </div>
                </div>

                {/* Scrubber */}
                <div className="flex items-center gap-4 px-2">
                <input
                    type="range"
                    min="0"
                    max={duration}
                    step="0.01"
                    value={currentTime}
                    onChange={(e) => seek(Number(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                />
                </div>
            </div>
        </div>

        {/* Right: Player List */}
        <div className="w-80 bg-gray-900 border border-gray-800 rounded-lg shadow-xl flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-800 bg-gray-800/50">
                <div className="flex items-center gap-2 text-white font-bold">
                    <Users className="w-5 h-5 text-blue-400" />
                    <span>Squad List</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Select a player to focus analysis</p>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2 space-y-6 custom-scrollbar">
                {Object.entries(playersByTeam).map(([teamId, players]) => (
                    <div key={teamId}>
                        <div className="sticky top-0 bg-gray-900/95 backdrop-blur py-2 px-2 mb-2 flex items-center gap-2 border-b border-gray-800 z-10">
                            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: teamColors[teamId] || DEFAULT_COLOR }} />
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{teamId}</h3>
                        </div>
                        <div className="space-y-1">
                            {players.map(player => (
                                <button
                                    key={player.id}
                                    onClick={() => setSelectedPlayerId(selectedPlayerId === player.id ? null : player.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-all ${
                                        selectedPlayerId === player.id 
                                        ? 'bg-blue-600/20 border border-blue-500/50 text-white' 
                                        : 'hover:bg-gray-800 text-gray-400 hover:text-gray-200 border border-transparent'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold bg-gray-800 ${
                                        selectedPlayerId === player.id ? 'text-blue-400' : 'text-gray-500'
                                    }`}>
                                        {player.number}
                                    </div>
                                    <div className="text-left">
                                        <div className="font-medium text-sm truncate w-40">{player.name}</div>
                                    </div>
                                    {selectedPlayerId === player.id && (
                                        <Flame className="w-4 h-4 text-orange-500 ml-auto animate-pulse" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};