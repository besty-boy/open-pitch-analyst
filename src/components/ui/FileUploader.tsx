import React, { useCallback, useState } from 'react';
import { useDataStore } from '../../store/useDataStore';
import { parseCSV } from '../../lib/parser';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

export const FileUploader: React.FC = () => {
  const { setData, setProcessing, setError, isProcessing, error } = useDataStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a valid CSV file.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const data = await parseCSV(file);
      setData(data, file.name);
    } catch (err: unknown) {
      console.error(err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to parse CSV file.');
      }
    } finally {
      setProcessing(false);
    }
  }, [setData, setProcessing, setError]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFile(e.dataTransfer.files[0]);
        e.dataTransfer.clearData();
      }
    },
    [handleFile]
  );

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={clsx(
          'border-2 border-dashed rounded-xl p-10 text-center transition-colors cursor-pointer',
          isDragOver
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
        )}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          id="file-upload"
          onChange={onInputChange}
          disabled={isProcessing}
        />
        <label
          htmlFor="file-upload"
          className="cursor-pointer flex flex-col items-center justify-center gap-4"
        >
          {isProcessing ? (
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-12 h-12 text-gray-400" />
          )}
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-white">
              {isProcessing ? 'Processing...' : 'Upload Tracking Data'}
            </h3>
            <p className="text-gray-400 text-sm">
              Drag & drop your CSV file here, or click to select
            </p>
          </div>
          
          {!isProcessing && (
            <span className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
              Select File
            </span>
          )}
        </label>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-2 text-gray-300">
          <FileText className="w-4 h-4" />
          <h4 className="text-sm font-medium">Expected Format (CSV)</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-400">
            <thead className="text-gray-500 border-b border-gray-700">
              <tr>
                <th className="px-2 py-1">timestamp</th>
                <th className="px-2 py-1">player_id</th>
                <th className="px-2 py-1">x</th>
                <th className="px-2 py-1">y</th>
                <th className="px-2 py-1">speed</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-2 py-1">0.1</td>
                <td className="px-2 py-1">P10</td>
                <td className="px-2 py-1">52.5</td>
                <td className="px-2 py-1">34.0</td>
                <td className="px-2 py-1">12.5</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
