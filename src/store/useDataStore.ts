import { create } from 'zustand';
import { TrackPoint } from '../types/data';

interface DataState {
  data: TrackPoint[];
  fileName: string | null;
  isProcessing: boolean;
  error: string | null;
  
  setData: (data: TrackPoint[], fileName: string) => void;
  setProcessing: (isProcessing: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  data: [],
  fileName: null,
  isProcessing: false,
  error: null,

  setData: (data, fileName) => set({ data, fileName, error: null }),
  setProcessing: (isProcessing) => set({ isProcessing }),
  setError: (error) => set({ error }),
  reset: () => set({ data: [], fileName: null, error: null, isProcessing: false }),
}));
