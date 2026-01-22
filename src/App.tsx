import React, { useState } from 'react';
import { useDataStore } from './store/useDataStore';
import { FileUploader } from './components/ui/FileUploader';
import { DataTable } from './components/ui/DataTable';
import { MatchView } from './components/viz/MatchView';
import { StatsBoard } from './components/viz/StatsBoard';
import { clsx } from 'clsx';
import { Database, BarChart3, Map } from 'lucide-react';

function App() {
  const { data, fileName, reset } = useDataStore();
  const [activeTab, setActiveTab] = useState<'viz' | 'stats' | 'data'>('viz');

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex justify-between items-center pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              OpenPitch Analyst
            </h1>
            <p className="text-gray-400 mt-1">
              Client-Side Sports Data Analysis
            </p>
          </div>
          
          {data.length > 0 && (
            <div className="flex items-center gap-4">
               <span className="text-sm text-gray-400">
                File: <span className="text-white font-medium">{fileName}</span>
               </span>
               <button 
                 onClick={reset}
                 className="px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
               >
                 Reset
               </button>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main>
          {data.length === 0 ? (
            <div className="py-12">
              <FileUploader />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-4 border-b border-gray-800">
                <button
                  onClick={() => setActiveTab('viz')}
                  className={clsx(
                    'px-4 py-2 flex items-center gap-2 border-b-2 transition-colors',
                    activeTab === 'viz'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  )}
                >
                  <Map className="w-4 h-4" />
                  Match View
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={clsx(
                    'px-4 py-2 flex items-center gap-2 border-b-2 transition-colors',
                    activeTab === 'stats'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  )}
                >
                  <BarChart3 className="w-4 h-4" />
                  Performance
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={clsx(
                    'px-4 py-2 flex items-center gap-2 border-b-2 transition-colors',
                    activeTab === 'data'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  )}
                >
                  <Database className="w-4 h-4" />
                  Raw Data
                </button>
              </div>

              {/* Views */}
              <div className="py-4">
                {activeTab === 'viz' && <MatchView />}
                {activeTab === 'stats' && <StatsBoard data={data} />}
                {activeTab === 'data' && <DataTable data={data} />}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;