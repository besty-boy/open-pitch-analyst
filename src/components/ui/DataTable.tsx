import React, { useMemo } from 'react';
import { TrackPoint } from '../../types/data';

interface DataTableProps {
  data: TrackPoint[];
}

export const DataTable: React.FC<DataTableProps> = ({ data }) => {
  const previewData = useMemo(() => data.slice(0, 100), [data]);

  if (data.length === 0) return null;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold text-white">Data Preview</h3>
        <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400 border border-gray-700">
          Total Rows: {data.length.toLocaleString()}
        </span>
      </div>
      
      <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 shadow-xl">
        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-xs text-gray-400 uppercase bg-gray-900 sticky top-0">
              <tr>
                <th className="px-6 py-3">Timestamp (s)</th>
                <th className="px-6 py-3">Player ID</th>
                <th className="px-6 py-3">X (m)</th>
                <th className="px-6 py-3">Y (m)</th>
                <th className="px-6 py-3">Speed (km/h)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {previewData.map((row, index) => (
                <tr key={index} className="hover:bg-gray-700/50 transition-colors">
                  <td className="px-6 py-3 font-mono">{row.timestamp.toFixed(2)}</td>
                  <td className="px-6 py-3 font-medium text-white">{row.player_id}</td>
                  <td className="px-6 py-3 font-mono">{row.x.toFixed(2)}</td>
                  <td className="px-6 py-3 font-mono">{row.y.toFixed(2)}</td>
                  <td className="px-6 py-3 font-mono text-blue-400">{row.speed.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 bg-gray-900 text-center text-xs text-gray-500 border-t border-gray-700">
          Showing first 100 rows
        </div>
      </div>
    </div>
  );
};
